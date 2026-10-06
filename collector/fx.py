"""Daily rates from open.er-api.com (166 currencies, no key). Units of currency per 1 USD."""

from datetime import datetime, timezone

import httpx

FX_URL = "https://open.er-api.com/v6/latest/USD"


def fetch_rates(client: httpx.Client) -> tuple[str, dict]:
    response = client.get(FX_URL, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if payload.get("result") != "success":
        raise RuntimeError(f"fx {payload.get('error-type')}")
    rates = {code: float(value) for code, value in payload["rates"].items()}
    rates["USD"] = 1.0
    day = datetime.fromtimestamp(payload["time_last_update_unix"], timezone.utc).date().isoformat()
    return day, rates


def to_usd_krw(amount: float, currency: str, rates: dict) -> tuple[float | None, float | None]:
    rate = rates.get(currency)
    krw_rate = rates.get("KRW")
    if rate is None or rate == 0:
        return None, None
    usd = amount / rate
    krw = usd * krw_rate if krw_rate else None
    return usd, krw
