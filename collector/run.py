"""Collect App Store subscription prices and write the site snapshot.

Usage from the repo root:
  python collector/run.py
  python collector/run.py --countries US,KR,JP,IN,PH,DE,BR,TR
"""

import argparse
import csv
import gzip
import hashlib
import json
import shutil
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

from campaigns import judge, today_iso
from fx import fetch_rates, to_usd_krw
from geo import discover_storefronts, load_iso
from money import tax_treatment
from parse_apple import classify, extract_pairs, page_unavailable
from store import connect, latest_rows, previous_amount, seed_from_snapshot

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
DB_PATH = ROOT / "data" / "prices.sqlite"
STOREFRONTS_PATH = ROOT / "data" / "storefronts.json"
CATALOG_PATH = Path(__file__).resolve().parent / "catalog.yaml"
CAMPAIGNS_PATH = ROOT / "data" / "campaigns.yaml"
RAW_KEEP_DAYS = 7
SNAPSHOT_PATH = ROOT / "web" / "data" / "snapshot.json"
CHANGES_PATH = ROOT / "data" / "changes.csv"
# A price outside this band of the US price for the same tier is held back as suspect.
# Real regional spreads seen so far sit within 0.45x to 1.6x; a month/year mix-up is ~10x.
OUTLIER_LOW, OUTLIER_HIGH = 0.2, 3.0
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# Live pages read on 2026-10-06. A value off by more than half means the parser drifted;
# ordinary price changes stay inside the tolerance.
SPOT_TOLERANCE = 0.5
SPOT = [
    ("US", "chatgpt-plus", "month", 19.99),
    ("KR", "chatgpt-plus", "month", 29000),
    ("JP", "chatgpt-plus", "month", 3000),
    ("DE", "chatgpt-plus", "month", 22.99),
    ("BR", "chatgpt-plus", "month", 99.90),
    ("IN", "chatgpt-plus", "month", 1999),
    ("IN", "chatgpt-plus", "year", 19900),
    ("PH", "chatgpt-plus", "month", 999),
    ("TR", "chatgpt-plus", "month", 999.99),
    ("US", "chatgpt-plus", "year", 200),
    ("US", "claude-pro", "month", 20),
    ("US", "claude-max-5x", "month", 124.99),
    ("US", "grok", "month", 30),
    ("US", "grok", "year", 300),
    ("US", "gemini-plus", "month", 4.99),
    ("US", "gemini-pro", "month", 19.99),
    ("US", "perplexity-pro", "month", 20),
    ("US", "perplexity-pro", "year", 200),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_storefronts(countries: list[dict]) -> tuple[list[str], list[str]]:
    if STOREFRONTS_PATH.exists():
        payload = json.loads(STOREFRONTS_PATH.read_text(encoding="utf-8"))
        return payload["storefronts"], payload.get("unknown") or []
    print("probing Apple storefronts", flush=True)
    found, unknown = discover_storefronts([row["iso2"] for row in countries])
    STOREFRONTS_PATH.write_text(
        json.dumps({"storefronts": found, "unknown": unknown}, indent=2),
        encoding="utf-8",
    )
    print(f"storefronts {len(found)} unknown {len(unknown)}", flush=True)
    return found, unknown


def fetch_page(client: httpx.Client, adam_id: str, cc: str) -> tuple[int, str]:
    url = f"https://apps.apple.com/{cc}/app/id{adam_id}?l=en"
    last = None
    for attempt in range(4):
        try:
            response = client.get(url, timeout=40)
        except httpx.HTTPError as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
            continue
        if response.status_code in {429, 500, 502, 503, 504}:
            last = response.status_code
            time.sleep(2.0 * (attempt + 1))
            continue
        return response.status_code, response.text
    raise RuntimeError(f"{cc} {adam_id} {last}")


def check_campaigns(client: httpx.Client) -> list[dict]:
    raw = yaml.safe_load(CAMPAIGNS_PATH.read_text(encoding="utf-8")) or []
    today = today_iso()
    checked = []
    for campaign in raw:
        status_code = None
        body = None
        try:
            response = client.get(campaign["evidence_url"], timeout=40)
            status_code = response.status_code
            if response.status_code == 200:
                body = response.text
        except httpx.HTTPError:
            status_code = None
        status, check = judge(campaign, today, status_code, body)
        item = dict(campaign)
        item["status"] = status
        item["check"] = check
        item["checked_on"] = today
        checked.append(item)
        print(f"campaign {campaign['id']} {status} {check}", flush=True)
    return checked


def write_snapshot(db, countries, catalog, storefronts, campaigns, fx_date, started_at, run_id):
    rows = latest_rows(db)
    observations = []
    for row in rows:
        observations.append({
            "iso2": row["iso2"],
            "platform": row["platform"],
            "tier_id": row["tier_id"],
            "period": row["period"],
            "currency": row["currency"],
            "amount": row["amount"],
            "usd": row["usd_amount"],
            "krw": row["krw_amount"],
            "tax": row["tax"],
            "availability": row["availability"],
            "store_promo": row["store_promo"],
            "source_url": row["source_url"],
            "raw_label": row["raw_label"],
            "raw_price": row["raw_price"],
            "fetched_at": row["fetched_at"],
            "fx_date": row["fx_date"],
        })
    changes = [
        dict(row)
        for row in db.execute(
            "SELECT iso2, tier_id, period, old_amount, new_amount, currency FROM changes WHERE run_id=? ORDER BY iso2",
            (run_id,),
        )
    ]
    store_set = set(storefronts)
    payload = {
        "generated_at": utc_now(),
        "started_at": started_at,
        "fx_date": fx_date,
        "storefront_count": len(storefronts),
        "platforms": catalog["platforms"],
        "tiers": [
            {key: tier[key] for key in ("id", "platform", "name", "band", "order")}
            for tier in catalog["tiers"]
        ],
        "countries": [
            {
                "iso2": row["iso2"],
                "name_en": row["name_en"],
                "name_ko": row["name_ko"],
                "region": row["region"],
                "apple": row["iso2"].lower() in store_set,
            }
            for row in countries
        ],
        "observations": observations,
        "campaigns": [
            {
                "id": item["id"],
                "platform": item["platform"],
                "tier_id": item["tier_id"],
                "audience": item["audience"],
                "title_ko": item["title_ko"],
                "title_en": item["title_en"],
                "effect_ko": item["effect_ko"],
                "effect_en": item["effect_en"],
                "country_mode": item["country_mode"],
                "countries": item["countries"],
                "ends_on": item.get("ends_on"),
                "evidence_url": item["evidence_url"],
                "note_ko": item.get("note_ko") or "",
                "note_en": item.get("note_en") or "",
                "verified_on": item.get("verified_on") or "",
                "status": item["status"],
                "check": item["check"],
                "checked_on": item["checked_on"],
            }
            for item in campaigns
        ],
        "changes": changes,
    }
    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"snapshot observations {len(observations)}", flush=True)
    if changes:
        new_file = not CHANGES_PATH.exists()
        with CHANGES_PATH.open("a", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            if new_file:
                writer.writerow(["date", "iso2", "tier_id", "period", "old_amount", "new_amount", "currency"])
            for row in changes:
                writer.writerow([started_at[:10], row["iso2"], row["tier_id"], row["period"],
                                 row["old_amount"], row["new_amount"], row["currency"]])


def flag_outliers(db, run_id: int) -> int:
    ref = {}
    for row in db.execute(
        """
        SELECT tier_id, period, usd_amount FROM observations
        WHERE iso2='US' AND availability='on_sale' AND usd_amount IS NOT NULL
        ORDER BY run_id, id
        """
    ):
        ref[(row["tier_id"], row["period"])] = row["usd_amount"]
    flagged = 0
    rows = db.execute(
        """
        SELECT id, iso2, tier_id, period, usd_amount, raw_price FROM observations
        WHERE run_id=? AND availability='on_sale' AND usd_amount IS NOT NULL
        """,
        (run_id,),
    ).fetchall()
    for row in rows:
        base = ref.get((row["tier_id"], row["period"]))
        if not base or OUTLIER_LOW <= row["usd_amount"] / base <= OUTLIER_HIGH:
            continue
        db.execute("UPDATE observations SET availability='suspect' WHERE id=?", (row["id"],))
        db.execute(
            "DELETE FROM changes WHERE run_id=? AND iso2=? AND tier_id=? AND period=?",
            (run_id, row["iso2"], row["tier_id"], row["period"]),
        )
        print(f"SUSPECT {row['iso2']} {row['tier_id']} {row['period']} {row['raw_price']} x{row['usd_amount'] / base:.2f}", flush=True)
        flagged += 1
    db.commit()
    return flagged


def spot_check(db, targets: set[tuple[str, str]], run_id: int) -> int:
    misses = 0
    for iso, tier, period, amount in SPOT:
        platform_id = tier.split("-")[0]
        if tier.startswith("grok"):
            platform_id = "grok"
        if targets and (platform_id, iso) not in targets:
            continue
        row = db.execute(
            """
            SELECT amount FROM observations
            WHERE run_id=? AND iso2=? AND tier_id=? AND period=? AND availability='on_sale'
            """,
            (run_id, iso, tier, period),
        ).fetchone()
        if row is None and db.execute(
            "SELECT 1 FROM observations WHERE run_id=? AND iso2=? AND tier_id=? AND availability='fetch_failed'",
            (run_id, iso, tier),
        ).fetchone():
            print(f"SPOT SKIP {iso} {tier} {period} fetch failed", flush=True)
            continue
        if row is None or abs(row["amount"] - amount) > amount * SPOT_TOLERANCE:
            got = None if row is None else row["amount"]
            print(f"SPOT MISS {iso} {tier} {period} expected {amount} got {got}", flush=True)
            misses += 1
        else:
            print(f"SPOT OK {iso} {tier} {period} {amount}", flush=True)
    return misses


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser()
    parser.add_argument("--countries", default="", help="Comma-separated ISO codes")
    parser.add_argument("--retry-failed", action="store_true", help="Refetch pages that failed in the latest run")
    args = parser.parse_args()
    requested = {part.strip().upper() for part in args.countries.split(",") if part.strip()}

    catalog = yaml.safe_load(CATALOG_PATH.read_text(encoding="utf-8"))
    countries = load_iso()
    all_storefronts, _unknown = load_storefronts(countries)
    by_id = {platform["id"]: platform for platform in catalog["platforms"]}
    if args.retry_failed:
        preview = connect(DB_PATH)
        latest = preview.execute("SELECT MAX(id) FROM runs").fetchone()[0]
        failed_pairs = preview.execute(
            """
            SELECT DISTINCT platform, iso2 FROM observations
            WHERE run_id=? AND availability='fetch_failed'
            """,
            (latest,),
        ).fetchall()
        preview.close()
        targets = [(by_id[row["platform"]], row["iso2"].lower()) for row in failed_pairs if row["platform"] in by_id]
    else:
        storefronts = [
            code for code in all_storefronts
            if not requested or code.upper() in requested
        ]
        targets = [(platform, cc) for platform in catalog["platforms"] for cc in storefronts]
    print(f"fetching {len(targets)} pages", flush=True)

    started = utc_now()
    day = started[:10]
    raw_dir = RAW / day
    raw_dir.mkdir(parents=True, exist_ok=True)
    # Raw pages are ~86 MB a day. Keep a week for debugging the parser.
    for old in RAW.iterdir():
        if old.is_dir() and old.name < (datetime.now(timezone.utc) - timedelta(days=RAW_KEEP_DAYS)).date().isoformat():
            shutil.rmtree(old)
    db = connect(DB_PATH)
    if seed_from_snapshot(db, SNAPSHOT_PATH):
        print("seeded history from the committed snapshot", flush=True)
    run_id = db.execute("INSERT INTO runs (started_at) VALUES (?)", (started,)).lastrowid
    db.commit()

    with httpx.Client(headers=HEADERS, follow_redirects=True) as client:
        fx_date, rates = fetch_rates(client)
        print(f"fx {fx_date}", flush=True)
        campaigns = check_campaigns(client)

        def job(item):
            platform, cc = item
            try:
                with httpx.Client(headers=HEADERS, follow_redirects=True) as local:
                    status, html = fetch_page(local, platform["adam_id"], cc)
            except Exception as exc:
                return platform, cc, "failed", str(exc), []
            digest = hashlib.sha256(html.encode("utf-8", errors="replace")).hexdigest()
            out = raw_dir / f"{platform['id']}-{cc}.html.gz"
            with gzip.open(out, "wt", encoding="utf-8") as handle:
                handle.write(html)
            if page_unavailable(status, html) or platform["adam_id"] not in html:
                kind = "unavailable" if status == 404 or page_unavailable(status, html) else "failed"
                return platform, cc, kind, digest, []
            pairs = extract_pairs(html)
            if not pairs:
                return platform, cc, "failed", digest, []
            priced = classify(pairs, cc, catalog)
            return platform, cc, "ok", digest, priced

        done = 0
        counts = {"ok": 0, "unavailable": 0, "failed": 0}
        workers = 2 if args.retry_failed else 6
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(job, item) for item in targets]
            for future in as_completed(futures):
                platform, cc, kind, digest, priced = future.result()
                done += 1
                counts[kind] = counts.get(kind, 0) + 1
                fetched_at = utc_now()
                source = f"https://apps.apple.com/{cc}/app/id{platform['adam_id']}"
                tiers = [tier for tier in catalog["tiers"] if tier["platform"] == platform["id"]]
                if kind != "ok":
                    availability = "unavailable" if kind == "unavailable" else "fetch_failed"
                    for tier in tiers:
                        db.execute(
                            """
                            INSERT INTO observations (
                              run_id, fetched_at, iso2, platform, tier_id, period, currency, amount,
                              tax, availability, store_promo, source_url, raw_label, raw_price,
                              raw_hash, usd_amount, krw_amount, fx_date
                            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                            """,
                            (
                                run_id, fetched_at, cc.upper(), platform["id"], tier["id"], "month",
                                None, None, tax_treatment(cc), availability, "unknown", source,
                                None, None, digest, None, None, fx_date,
                            ),
                        )
                else:
                    found = {(row.tier_id, row.period) for row in priced}
                    for row in priced:
                        usd, krw = to_usd_krw(row.amount, row.currency, rates)
                        db.execute(
                            """
                            INSERT INTO observations (
                              run_id, fetched_at, iso2, platform, tier_id, period, currency, amount,
                              tax, availability, store_promo, source_url, raw_label, raw_price,
                              raw_hash, usd_amount, krw_amount, fx_date
                            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                            """,
                            (
                                run_id, fetched_at, cc.upper(), platform["id"], row.tier_id, row.period,
                                row.currency, row.amount, tax_treatment(cc), "on_sale", row.store_promo,
                                source, row.raw_label, row.raw_price, digest, usd, krw, fx_date,
                            ),
                        )
                        prev = previous_amount(db, cc.upper(), row.tier_id, row.period, run_id)
                        if prev and abs(prev["amount"] - row.amount) > 0.001:
                            db.execute(
                                "INSERT INTO changes (run_id, iso2, tier_id, period, old_amount, new_amount, currency) VALUES (?,?,?,?,?,?,?)",
                                (run_id, cc.upper(), row.tier_id, row.period, prev["amount"], row.amount, row.currency),
                            )
                    for tier in tiers:
                        if not any(tier_id == tier["id"] for tier_id, _period in found):
                            db.execute(
                                """
                                INSERT INTO observations (
                                  run_id, fetched_at, iso2, platform, tier_id, period, currency, amount,
                                  tax, availability, store_promo, source_url, raw_label, raw_price,
                                  raw_hash, usd_amount, krw_amount, fx_date
                                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                                """,
                                (
                                    run_id, fetched_at, cc.upper(), platform["id"], tier["id"], "month",
                                    None, None, tax_treatment(cc), "not_listed", "unknown", source,
                                    None, None, digest, None, None, fx_date,
                                ),
                            )
                if done % 25 == 0 or done == len(targets):
                    print(f"progress {done}/{len(targets)} {counts}", flush=True)
                    db.commit()
        db.execute("UPDATE runs SET finished_at=? WHERE id=?", (utc_now(), run_id))
        db.commit()
        flag_outliers(db, run_id)
        write_snapshot(
            db, countries, catalog, all_storefronts, campaigns, fx_date, started, run_id,
        )
        covered = {(platform["id"], cc.upper()) for platform, cc in targets}
        misses = spot_check(db, covered, run_id)
    print(f"done ok={counts['ok']} unavailable={counts['unavailable']} failed={counts['failed']}", flush=True)
    return 1 if misses else 0


if __name__ == "__main__":
    raise SystemExit(main())
