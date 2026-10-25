#!/usr/bin/env python3
"""Moisson territoriale : geo.api.gouv.fr + Géorisques + DVF.

Idempotent : chaque table d'import se met à jour par clé primaire, rejouable
sans doublon. Zéro scraping — uniquement des API publiques officielles.
Clés API (Sirene) dans l'environnement, jamais dans le repo.

Usage : python3 territoires.py <code_insee>   (ex: 29042 = Crozon)
Périodicité : geo/georisk mensuel, DVF trimestriel (cron docker-compose).
"""

import json
import os
import sys
import urllib.request

GEO_API = "https://geo.api.gouv.fr"
GEORISK_API = "https://georisques.gouv.fr/api/v1"
# Agrégat DVF : à l'activation, flux data.gouv — la clé est idempotente par
# (commune, année, type), on ne stocke JAMAIS les lignes brutes nominatives.
DATABASE_URL = os.environ.get("DATABASE_URL")


def fetch_json(url: str) -> dict:
    # Timeout strict : une moisson ne doit jamais bloquer le cron suivant
    req = urllib.request.Request(url, headers={"User-Agent": "manahome-moisson/0.1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def upsert(cur, table: str, pk: str, row: dict):
    cols = ", ".join(row.keys())
    pks = ", ".join(f"{c}=EXCLUDED.{c}" for c in row if c != pk)
    cur.execute(
        f"INSERT INTO {table} ({cols}) VALUES ({', '.join(['%s'] * len(row))}) "
        f"ON CONFLICT ({pk}) DO UPDATE SET {pks}",
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
        "fetched_at": "now()",
    })


def moisson_georisk(cur, code: str):
    rapport = fetch_json(f"{GEORISK_API}/georisques/report?code_insee={code}")
    upsert(cur, "import_georisk", "code_insee", {
        "code_insee": code,
        "rapport": json.dumps(rapport),
        "fetched_at": "now()",
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
    print(f"moisson OK : {code}")


if __name__ == "__main__":
    main()
