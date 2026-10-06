"""Pull subscription rows out of an apps.apple.com product page."""

import json
import re
from dataclasses import dataclass

from money import parse_price

_SCRIPT = re.compile(
    r'<script type="application/json" id="serialized-server-data">(.*?)</script>',
    re.S,
)
_YEAR = re.compile(r"\b(annual|yearly|per year|year)\b", re.I)
_MONTH = re.compile(r"\b(monthly|per month|month)\b", re.I)
_UNAVAILABLE = re.compile(
    r"not currently available|this app is currently unavailable|앱을 사용할 수 없습니다",
    re.I,
)


@dataclass
class Priced:
    tier_id: str
    period: str
    amount: float
    currency: str
    raw_label: str
    raw_price: str
    store_promo: str


def extract_pairs(html: str) -> list[tuple[str, str, str]]:
    """Return (label, price, promo) from every leading/trailing price row."""
    match = _SCRIPT.search(html)
    if not match:
        return []
    try:
        payload = json.loads(match.group(1))
    except json.JSONDecodeError:
        return []
    found: list[tuple[str, str, str]] = []

    def walk(node):
        if isinstance(node, dict):
            label = node.get("leadingText")
            price = node.get("trailingText")
            if isinstance(label, str) and isinstance(price, str):
                blob = json.dumps(node, ensure_ascii=False).lower()
                promo = "active" if ("trial" in blob or "introductory" in blob) else "none_on_storefront"
                found.append((label, price, promo))
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(payload)
    return found


def page_unavailable(status: int, html: str) -> bool:
    if status == 404:
        return True
    return bool(_UNAVAILABLE.search(html or ""))


def _base_name(label: str) -> tuple[str | None, str]:
    period = None
    if _YEAR.search(label):
        period = "year"
    elif _MONTH.search(label):
        period = "month"
    base = _YEAR.sub(" ", label)
    base = _MONTH.sub(" ", base)
    base = re.sub(r"[-–—/]+", " ", base)
    base = re.sub(r"\s+", " ", base).strip(" -").lower()
    return period, base


def classify(pairs, storefront: str, catalog: dict) -> list[Priced]:
    exclude = re.compile(catalog.get("exclude") or r"$^")
    tiers = []
    for tier in catalog["tiers"]:
        tiers.append((re.compile(tier["match"]), tier["id"]))

    draft = []
    for label, price, promo in pairs:
        if exclude.search(label):
            continue
        period, base = _base_name(label)
        tier_id = None
        for pattern, candidate in tiers:
            if pattern.search(base):
                tier_id = candidate
                break
        if tier_id is None:
            continue
        amount, currency = parse_price(price, storefront)
        if amount is None or currency is None:
            continue
        draft.append({
            "tier_id": tier_id,
            "period": period,
            "amount": amount,
            "currency": currency,
            "raw_label": label,
            "raw_price": price,
            "store_promo": promo,
        })

    by_name: dict[tuple, list] = {}
    for row in draft:
        _, base = _base_name(row["raw_label"])
        by_name.setdefault((row["tier_id"], base), []).append(row)

    chosen: list[dict] = []
    for rows in by_name.values():
        labeled = [row for row in rows if row["period"]]
        unlabeled = [row for row in rows if not row["period"]]
        chosen.extend(_dedupe(labeled))
        if unlabeled:
            chosen.extend(_infer_periods(unlabeled))

    priced = [
        Priced(
            tier_id=row["tier_id"],
            period=row["period"],
            amount=row["amount"],
            currency=row["currency"],
            raw_label=row["raw_label"],
            raw_price=row["raw_price"],
            store_promo=row["store_promo"],
        )
        for row in chosen
        if row["period"] in {"month", "year"}
    ]
    # One row per tier and period. Keep the first, which is the shelf order.
    unique = {}
    for row in priced:
        unique.setdefault((row.tier_id, row.period), row)
    return list(unique.values())


def _dedupe(rows: list[dict]) -> list[dict]:
    seen = {}
    for row in rows:
        seen.setdefault((row["period"], round(row["amount"], 4)), row)
    return list(seen.values())


def _infer_periods(rows: list[dict]) -> list[dict]:
    by_amount = {}
    for row in rows:
        by_amount.setdefault(round(row["amount"], 4), row)
    amounts = sorted(by_amount)
    if len(amounts) == 1:
        by_amount[amounts[0]]["period"] = "month"
        return [by_amount[amounts[0]]]
    small = amounts[0]
    year_amount = None
    for amount in amounts[1:]:
        ratio = amount / small if small else 0
        if 8 <= ratio <= 13:
            year_amount = amount
            break
    by_amount[small]["period"] = "month"
    kept = [by_amount[small]]
    if year_amount is not None:
        by_amount[year_amount]["period"] = "year"
        kept.append(by_amount[year_amount])
    return kept
