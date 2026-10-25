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
# N.B. : les paramètres de l'API sont en snake_case (spec OpenAPI) :
# code_commune, activite_principale, etat_administratif=A, est_association.
ACTIVITES = ["68.31Z", "69.10Z"]
# Comptage commerces/services (NAF 47.x, 55.x, 56.x complets) pour la
# facette « vie locale » de la page territoire.
NAF_COMMERCES = [
    "47.11A", "47.11B", "47.11C", "47.11D", "47.11E", "47.11F",
    "47.19A", "47.19B", "47.21Z", "47.22Z", "47.23Z", "47.24Z",
    "47.25Z", "47.26Z", "47.29Z", "47.30Z", "47.41Z", "47.42Z",
    "47.43Z", "47.51Z", "47.52A", "47.52B", "47.53Z", "47.54Z",
    "47.59A", "47.59B", "47.61Z", "47.62Z", "47.63Z", "47.64Z",
    "47.65Z", "47.71Z", "47.72A", "47.72B", "47.73Z", "47.74Z",
    "47.75Z", "47.76Z", "47.77Z", "47.78A", "47.78B", "47.78C",
    "47.79Z", "47.81Z", "47.82Z", "47.89Z", "47.91A", "47.91B",
    "47.99A", "47.99B", "55.10Z", "55.20Z", "55.30Z", "55.90Z",
    "56.10A", "56.10B", "56.10C", "56.21Z", "56.29A", "56.29B", "56.30Z",
]
EPCI_CROZON = ["29001", "29022", "29042", "29053", "29104", "29120",
               "29238", "29240", "29280", "29302"]
DATABASE_URL = os.environ.get("DATABASE_URL")


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "manahome-moisson/0.1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def recherche(commune: str, page: int = 1, **filtres) -> dict:
    params = urllib.parse.urlencode({
        "code_commune": commune,
        "page": page,
        "per_page": 25,
        **filtres,
    })
    return fetch_json(f"{RECHERCHE_API}?{params}")


def compte(commune: str, **filtres) -> int:
    # total_results suffit — une seule requête par facette, pas de pagination
    data = recherche(commune, per_page=1, minimal=True, **filtres)
    return data.get("total_results", 0)


def moisson_comptages(cur, communes: list[str]):
    """Compteurs agrégés (jamais de fiches individuelles) pour la facette
    vie locale : commerces/services et associations actifs."""
    for code in communes:
        naf = ",".join(NAF_COMMERCES)
        commerces = compte(code, activite_principale=naf, etat_administratif="A")
        associations = compte(code, est_association="true", etat_administratif="A")
        cur.execute(
            "INSERT INTO import_comptages (code_insee, commerces, associations, fetched_at) "
            "VALUES (%s, %s, %s, %s) "
            "ON CONFLICT (code_insee) DO UPDATE SET "
            "commerces = EXCLUDED.commerces, associations = EXCLUDED.associations, "
            "fetched_at = EXCLUDED.fetched_at",
            (code, commerces, associations,
             datetime.datetime.now(datetime.timezone.utc)),
        )
        print(f"  {code} : {commerces} commerces, {associations} associations")


def moisson_pros(cur, communes: list[str]):
    for code in communes:
        for activite in ACTIVITES:
            page = 1
            while True:
                data = recherche(code, page, activite_principale=activite,
                                 etat_administratif="A")
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
        moisson_comptages(cur, communes)
    print(f"moisson pros OK : {', '.join(communes)}")


if __name__ == "__main__":
    main()
