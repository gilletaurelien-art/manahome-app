#!/usr/bin/env python3
"""Moisson territoriale : geo.api.gouv.fr + Géorisques + DVF.

Idempotent : chaque table d'import se met à jour par clé primaire, rejouable
sans doublon. Zéro scraping — uniquement des API publiques officielles.
Clés API (Sirene) dans l'environnement, jamais dans le repo.

Usage : python3 territoires.py <code_insee>   (ex: 29042 = Crozon)
Périodicité : geo/georisk mensuel, DVF trimestriel (cron docker-compose).
"""

import datetime
import json
import os
import sys
import urllib.request

GEO_API = "https://geo.api.gouv.fr"
GEORISK_API = "https://georisques.gouv.fr/api/v1"
# API officielle DVF+ opendata (Cerema/DGALN) — sans clé, sans inscription.
# N.B. : Géorisques et apidf restreignent les IP hors de France — exécuter
# depuis le VPS ; depuis l'étranger, restaurer un dump DVF+ PostgreSQL.
DVF_API = "https://apidf-preprod.cerema.fr/dvf_opendata"
DATABASE_URL = os.environ.get("DATABASE_URL")


def fetch_json(url: str) -> dict:
    # Timeout strict : une moisson ne doit jamais bloquer le cron suivant
    req = urllib.request.Request(url, headers={"User-Agent": "manahome-moisson/0.1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def upsert(cur, table: str, pk, row: dict):
    pks = pk if isinstance(pk, (list, tuple)) else [pk]
    cols = ", ".join(row.keys())
    updates = ", ".join(f"{c}=EXCLUDED.{c}" for c in row if c not in pks)
    cur.execute(
        f"INSERT INTO {table} ({cols}) VALUES ({', '.join(['%s'] * len(row))}) "
        f"ON CONFLICT ({', '.join(pks)}) DO UPDATE SET {updates}",
        tuple(row.values()),
    )


def moisson_geo(cur, code: str):
    communes = fetch_json(f"{GEO_API}/communes?code={code}&fields=nom,population,codeEpci,contour")
    if not communes:
        raise SystemExit(f"commune inconnue : {code}")
    c = communes[0]
    epci = None
    if c.get("codeEpci"):
        epcis = fetch_json(f"{GEO_API}/epcis?code={c['codeEpci']}&fields=nom")
        epci = epcis[0]["nom"] if epcis else None
    upsert(cur, "import_geo_communes", "code_insee", {
        "code_insee": code,
        "nom": c["nom"],
        "code_epci": c.get("codeEpci"),
        "nom_epci": epci,
        "population": c.get("population"),
        "contour_geojson": json.dumps(c.get("contour") or {}),
        "fetched_at": datetime.datetime.now(datetime.timezone.utc),
    })


def moisson_georisk(cur, code: str):
    rapport = fetch_json(f"{GEORISK_API}/resultats_rapport_risque?code_insee={code}")
    upsert(cur, "import_georisk", "code_insee", {
        "code_insee": code,
        "rapport": json.dumps(rapport),
        "fetched_at": datetime.datetime.now(datetime.timezone.utc),
    })


def moisson_dvf(cur, code: str):
    """Agrégat DVF uniquement : médiane €/m² par (commune, année, type_local).

    Les mutations brutes sont nominatives (DGFiP) — elles sont agrégées
    en mémoire ici, JAMAIS stockées : seul l'agrégat entre en base.
    """
    mutations = fetch_json(f"{DVF_API}/mutations/?code_insee={code}")
    par_cle: dict[tuple, list] = {}
    for m in mutations:
        if m.get("nature_mutation") != "Vente":
            continue
        type_local = m.get("type_local")
        if type_local not in ("Maison", "Appartement"):
            continue
        surface = m.get("surface_reelle_bati") or 0
        prix = m.get("valeur_fonciere") or 0
        if surface <= 0 or prix <= 0:
            continue
        par_cle.setdefault((m["annee"], type_local), []).append(prix / surface)
    for (annee, type_local), prix_m2 in sorted(par_cle.items()):
        prix_m2.sort()
        n = len(prix_m2)
        mediane = prix_m2[n // 2] if n % 2 else (prix_m2[n // 2 - 1] + prix_m2[n // 2]) / 2
        upsert(cur, "import_dvf", ["code_insee", "annee", "type_local"], {
            "code_insee": code,
            "annee": annee,
            "type_local": type_local,
            "prix_m2_median": round(mediane, 2),
            "nb_mutations": n,
            "fetched_at": datetime.datetime.now(datetime.timezone.utc),
        })


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: territoires.py <code_insee>")
    code = sys.argv[1]
    # fetch puis upsert via DATABASE_URL (psycopg) — exécution sur le serveur
    import psycopg
    with psycopg.connect(DATABASE_URL) as conn, conn.cursor() as cur:
        moisson_geo(cur, code)
        moisson_georisk(cur, code)
        moisson_dvf(cur, code)
    print(f"moisson OK : {code}")


if __name__ == "__main__":
    main()
