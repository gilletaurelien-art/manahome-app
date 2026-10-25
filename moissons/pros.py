#!/usr/bin/env python3
"""Moisson des pros de l'immobilier : agences (68.31Z) et notaires (69.10Z).

Source : recherche-entreprises.api.gouv.fr (annuaire officiel du ministère
de l'Économie, API publique, sans clé) — aucun scraping.
Idempotent : upsert par siren dans import_sirene (payload complet conservé,
la vue publique n'expose que raison sociale + adresse professionnelle).
Garde anti-domicile : les personnes physiques (mandataires EI) n'ont pas
d'adresse publique — l'agrégation distingue et ne publie que les personnes
morales ou adresses d'établissement professionnelles.

Usage : python3 pros.py            (EPCI de Crozon par défaut)
        python3 pros.py 29042 ...  (liste de codes INSEE)
Périodicitée : mensuelle (cron docker-compose).
"""

import datetime
import json
import os
import sys
import urllib.parse
import urllib.request

RECHERCHE_API = "https://recherche-entreprises.api.gouv.fr/search"
# Agences immobilières + notaires. 68.20B (location) volontairement exclu :
# le référentiel couvre la vente.
ACTIVITES = ["68.31Z", "69.10Z"]
EPCI_CROZON = ["29001", "29022", "29042", "29053", "29104", "29120",
               "29238", "29240", "29280", "29302"]
DATABASE_URL = os.environ.get("DATABASE_URL")


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "manahome-moisson/0.1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def recherche(commune: str, activite: str, page: int = 1) -> dict:
    params = urllib.parse.urlencode({
        "codeCommune": commune,
        "activitePrincipale": activite,
        "etatAdministratif": "actif",
        "page": page,
        "perPage": 25,
    })
    return fetch_json(f"{RECHERCHE_API}?{params}")


def moisson_pros(cur, communes: list[str]):
    for code in communes:
        for activite in ACTIVITES:
            page = 1
            while True:
                data = recherche(code, activite, page)
                for r in data.get("results", []):
                    payload = {
                        "siren": r["siren"],
                        "nom": r.get("nom_complet") or r.get("nom_raison_sociale"),
                        "activite": r.get("activite_principale"),
                        "nature_juridique": r.get("nature_juridique"),
                        "etablissements": [
                            {
                                "siret": e.get("siret"),
                                "enseigne": (e.get("liste_enseignes") or [None])[0],
                                "adresse": e.get("adresse"),
                                "commune": e.get("commune"),
                                "code_postal": e.get("code_postal"),
                                "etat": e.get("etat_administratif"),
                            }
                            for e in (r.get("all_matching_etablissements")
                                      or r.get("matching_etablissements") or [])
                            if e.get("commune") == code
                            and e.get("etat_administratif") == "A"
                        ],
                    }
                    cur.execute(
                        "INSERT INTO import_sirene (siren, payload, imported_at) "
                        "VALUES (%s, %s, %s) "
                        "ON CONFLICT (siren) DO UPDATE SET "
                        "payload = EXCLUDED.payload, imported_at = EXCLUDED.imported_at",
                        (r["siren"], json.dumps(payload),
                         datetime.datetime.now(datetime.timezone.utc)),
                    )
                total_pages = data.get("total_pages", 1)
                if page >= total_pages:
                    break
                page += 1
        print(f"  commune {code} : OK")


def main():
    communes = sys.argv[1:] or EPCI_CROZON
    import psycopg
    with psycopg.connect(DATABASE_URL) as conn, conn.cursor() as cur:
        moisson_pros(cur, communes)
    print(f"moisson pros OK : {', '.join(communes)}")


if __name__ == "__main__":
    main()
