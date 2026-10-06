"""Official promotion registry. Network checks stay separate from eligibility."""

from datetime import date

# A manual read stands in for a blocked recheck only this long.
MANUAL_VALID_DAYS = 14


def eligibility(campaign: dict, iso2: str) -> str:
    codes = {code.upper() for code in campaign.get("countries") or []}
    iso = iso2.upper()
    mode = campaign.get("country_mode")
    if mode == "allowlist":
        return "eligible" if iso in codes else "ineligible"
    if mode == "excluded_rest_unlisted":
        return "ineligible" if iso in codes else "unlisted"
    return "unlisted"


def judge(campaign: dict, today: str, status_code: int | None, body: str | None) -> tuple[str, str]:
    ends = campaign.get("ends_on")
    if ends and ends < today:
        return "ended", "past_end"
    phrases = campaign.get("must_contain") or []
    if status_code == 200 and body is not None:
        if all(phrase in body for phrase in phrases):
            return "active", "page_ok"
        return "mismatch", "phrase_missing"
    verified = campaign.get("verified_on")
    if verified and (date.fromisoformat(today) - date.fromisoformat(verified)).days <= MANUAL_VALID_DAYS:
        return "active", f"fetch_{status_code or 'error'}"
    return "unverified", f"fetch_{status_code or 'error'}"


def today_iso() -> str:
    return date.today().isoformat()
