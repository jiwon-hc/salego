"""ISO countries joined to Apple storefronts that answer the public lookup."""

import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx

HERE = Path(__file__).resolve().parent
LOOKUP = "https://itunes.apple.com/lookup?id=389801252&country={cc}"


def load_iso() -> list[dict]:
    iso = json.loads((HERE / "iso.json").read_text(encoding="utf-8"))
    ko = json.loads((HERE / "names_ko.json").read_text(encoding="utf-8"))
    en = json.loads((HERE / "names_en.json").read_text(encoding="utf-8"))
    rows = []
    for item in iso:
        code = item["alpha-2"].upper()
        rows.append({
            "iso2": code,
            "name_en": en.get(code) or en.get(code.lower()) or item["name"],
            "name_ko": ko.get(code) or ko.get(code.lower()) or item["name"],
            "region": item.get("region") or "",
        })
    rows.sort(key=lambda row: row["iso2"])
    return rows


def _probe(code: str) -> tuple[str, bool | None]:
    url = LOOKUP.format(cc=code.lower())
    for _ in range(2):
        try:
            response = httpx.get(url, timeout=25, headers={"User-Agent": "ai-price-map/1.0"})
        except httpx.HTTPError:
            continue
        if response.status_code == 400:
            return code.lower(), False
        if response.status_code == 200:
            return code.lower(), True
    return code.lower(), None


def discover_storefronts(codes: list[str]) -> tuple[list[str], list[str]]:
    found = []
    unknown = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        for code, ok in pool.map(_probe, codes):
            if ok is True:
                found.append(code)
            elif ok is None:
                unknown.append(code)
    return sorted(found), sorted(unknown)
