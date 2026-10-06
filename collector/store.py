"""SQLite snapshot of price observations."""

import json
import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY,
  started_at TEXT,
  finished_at TEXT
);
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY,
  run_id INTEGER,
  fetched_at TEXT,
  iso2 TEXT,
  platform TEXT,
  tier_id TEXT,
  period TEXT,
  currency TEXT,
  amount REAL,
  tax TEXT,
  availability TEXT,
  store_promo TEXT,
  source_url TEXT,
  raw_label TEXT,
  raw_price TEXT,
  raw_hash TEXT,
  usd_amount REAL,
  krw_amount REAL,
  fx_date TEXT
);
CREATE TABLE IF NOT EXISTS changes (
  id INTEGER PRIMARY KEY,
  run_id INTEGER,
  iso2 TEXT,
  tier_id TEXT,
  period TEXT,
  old_amount REAL,
  new_amount REAL,
  currency TEXT
);
"""


def connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    db.executescript(SCHEMA)
    return db


def previous_amount(db, iso2, tier_id, period, run_id):
    row = db.execute(
        """
        SELECT amount, currency FROM observations
        WHERE iso2=? AND tier_id=? AND period=? AND run_id<? AND availability='on_sale'
        ORDER BY run_id DESC, id DESC LIMIT 1
        """,
        (iso2, tier_id, period, run_id),
    ).fetchone()
    return row


def latest_rows(db):
    """Newest usable run for each country and platform.

    A failed fetch does not replace an older successful page.
    """
    rows = db.execute("SELECT * FROM observations ORDER BY run_id, id").fetchall()
    grouped = {}
    for row in rows:
        grouped.setdefault((row["iso2"], row["platform"]), []).append(row)
    kept = []
    for group in grouped.values():
        usable = [row for row in group if row["availability"] != "fetch_failed"]
        chosen = (usable or group)[-1]["run_id"]
        source = usable or group
        kept.extend(row for row in source if row["run_id"] == chosen)
    return kept


def seed_from_snapshot(db, path: Path) -> bool:
    """Start an empty database from the last committed snapshot.

    CI begins with no database, so this restores the previous prices
    that change detection and the failed-fetch fallback compare against.
    """
    if db.execute("SELECT 1 FROM runs LIMIT 1").fetchone() or not path.exists():
        return False
    snapshot = json.loads(path.read_text(encoding="utf-8"))
    run_id = db.execute(
        "INSERT INTO runs (started_at, finished_at) VALUES (?, ?)",
        (snapshot["started_at"], snapshot["generated_at"]),
    ).lastrowid
    db.executemany(
        """
        INSERT INTO observations (
          run_id, fetched_at, iso2, platform, tier_id, period, currency, amount,
          tax, availability, store_promo, source_url, raw_label, raw_price,
          raw_hash, usd_amount, krw_amount, fx_date
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        [
            (
                run_id, row["fetched_at"], row["iso2"], row["platform"], row["tier_id"], row["period"],
                row["currency"], row["amount"], row["tax"], row["availability"], row["store_promo"],
                row["source_url"], row["raw_label"], row["raw_price"], None, row["usd"], row["krw"],
                row["fx_date"],
            )
            for row in snapshot["observations"]
        ],
    )
    db.commit()
    return True
