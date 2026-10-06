"""Parse an App Store price string into a number and an ISO currency."""

import re

THREE_DECIMAL = {"BHD", "JOD", "KWD", "OMR", "TND"}

# Used when the page shows a bare "$" or no symbol.
STOREFRONT_CURRENCY = {
    "ae": "AED", "ag": "USD", "ai": "USD", "al": "USD", "am": "USD", "ao": "USD",
    "ar": "USD", "at": "EUR", "au": "AUD", "az": "USD", "ba": "EUR", "bb": "USD",
    "be": "EUR", "bg": "EUR", "bh": "USD", "bm": "USD", "bn": "USD", "bo": "USD",
    "br": "BRL", "bs": "USD", "bw": "USD", "by": "USD", "bz": "USD", "ca": "CAD",
    "ch": "CHF", "ci": "USD", "cl": "CLP", "cm": "USD", "cn": "CNY", "co": "COP",
    "cr": "USD", "cv": "USD", "cy": "EUR", "cz": "CZK", "de": "EUR", "dk": "DKK",
    "dm": "USD", "do": "USD", "dz": "USD", "ec": "USD", "ee": "EUR", "eg": "EGP",
    "es": "EUR", "fi": "EUR", "fj": "USD", "fm": "USD", "fr": "EUR", "gb": "GBP",
    "gd": "USD", "gh": "USD", "gm": "USD", "gr": "EUR", "gt": "USD", "gw": "USD",
    "gy": "USD", "hk": "HKD", "hn": "USD", "hr": "EUR", "hu": "HUF", "id": "IDR",
    "ie": "EUR", "il": "ILS", "in": "INR", "is": "ISK", "it": "EUR", "jm": "USD",
    "jo": "USD", "jp": "JPY", "ke": "USD", "kg": "USD", "kh": "USD", "kn": "USD",
    "kr": "KRW", "kw": "USD", "ky": "USD", "kz": "KZT", "la": "USD", "lb": "USD",
    "lc": "USD", "lk": "USD", "lr": "USD", "lt": "EUR", "lu": "EUR", "lv": "EUR",
    "md": "USD", "mg": "USD", "mk": "USD", "ml": "USD", "mn": "USD", "mo": "MOP",
    "mr": "USD", "ms": "USD", "mt": "EUR", "mu": "USD", "mw": "USD", "mx": "MXN",
    "my": "MYR", "mz": "USD", "na": "USD", "ne": "USD", "ng": "NGN", "ni": "USD",
    "nl": "EUR", "no": "NOK", "np": "USD", "nz": "NZD", "om": "USD", "pa": "USD",
    "pe": "PEN", "pg": "USD", "ph": "PHP", "pk": "PKR", "pl": "PLN", "pt": "EUR",
    "pw": "USD", "py": "PYG", "qa": "QAR", "ro": "RON", "rs": "EUR", "ru": "RUB",
    "rw": "USD", "sa": "SAR", "sb": "USD", "sc": "USD", "se": "SEK", "sg": "SGD",
    "si": "EUR", "sk": "EUR", "sl": "USD", "sn": "USD", "sr": "USD", "st": "USD",
    "sv": "USD", "sz": "USD", "tc": "USD", "td": "USD", "th": "THB", "tj": "USD",
    "tm": "USD", "tn": "USD", "tr": "TRY", "tt": "USD", "tw": "TWD", "tz": "TZS",
    "ua": "UAH", "ug": "USD", "us": "USD", "uy": "USD", "uz": "USD", "vc": "USD",
    "ve": "USD", "vg": "USD", "vn": "VND", "vu": "USD", "ws": "USD", "xk": "EUR",
    "ye": "USD", "za": "ZAR", "zm": "USD", "zw": "USD",
}

# App Store prices include tax everywhere except the US and Canada, where it is added at checkout.
TAX_VARIES = {"us", "ca"}

_RULES = [
    ("BRL", re.compile(r"R\$")),
    ("CAD", re.compile(r"(?:CA|C)\$")),
    ("AUD", re.compile(r"(?:AU|A)\$")),
    ("NZD", re.compile(r"NZ\$")),
    ("HKD", re.compile(r"HK\$|HKD")),
    ("TWD", re.compile(r"NT\$|TWD")),
    ("SGD", re.compile(r"S\$")),
    ("MXN", re.compile(r"MXN|MX\$")),
    ("KRW", re.compile(r"[₩￦]|KRW")),
    ("EUR", re.compile(r"€|EUR")),
    ("GBP", re.compile(r"£|GBP")),
    ("INR", re.compile(r"₹|INR")),
    ("TRY", re.compile(r"₺|TRY")),
    ("VND", re.compile(r"₫|VND")),
    ("PHP", re.compile(r"₱|PHP")),
    ("THB", re.compile(r"฿|THB")),
    ("MYR", re.compile(r"\bRM\b|MYR")),
    ("IDR", re.compile(r"\bRp\b|IDR")),
    ("RUB", re.compile(r"₽|RUB")),
    ("PLN", re.compile(r"zł|PLN")),
    ("CZK", re.compile(r"Kč|CZK")),
    ("HUF", re.compile(r"\bFt\b|HUF")),
    ("RON", re.compile(r"\blei\b|RON")),
    ("CHF", re.compile(r"\bCHF\b")),
    ("ILS", re.compile(r"₪|ILS")),
    ("PEN", re.compile(r"S/\.|PEN")),
    ("AED", re.compile(r"\bAED\b")),
    ("SAR", re.compile(r"\bSAR\b")),
    ("ZAR", re.compile(r"\bZAR\b|\bR\s")),
    ("USD", re.compile(r"US\$|USD")),
]


def tax_treatment(storefront: str) -> str:
    return "varies" if storefront.lower() in TAX_VARIES else "included"


def detect_currency(raw: str, storefront: str) -> str | None:
    compact = raw.replace("\u00a0", " ").replace("￦", "₩")
    for code, pattern in _RULES:
        if pattern.search(compact):
            return code
    if "¥" in compact or "￥" in compact:
        if storefront.lower() == "cn":
            return "CNY"
        return "JPY"
    if re.search(r"\bkr\b", compact, re.I):
        return {"se": "SEK", "no": "NOK", "dk": "DKK", "is": "ISK"}.get(storefront.lower())
    if "$" in compact or re.search(r"\d", compact):
        return STOREFRONT_CURRENCY.get(storefront.lower())
    return None


def parse_amount(raw: str, currency: str | None) -> float | None:
    text = raw.replace("\u00a0", "").replace(" ", "")
    digits = re.sub(r"[^\d.,]", "", text)
    if not digits or not re.search(r"\d", digits):
        return None
    if "," in digits and "." in digits:
        if digits.rfind(",") > digits.rfind("."):
            digits = digits.replace(".", "").replace(",", ".")
        else:
            digits = digits.replace(",", "")
    elif "," in digits or "." in digits:
        sep = "," if "," in digits else "."
        parts = digits.split(sep)
        tail = parts[-1]
        # A group of exactly three digits is a thousands separator (₹1,999).
        # One or two trailing digits are the decimal part (22,99 or 19.99).
        # Three-decimal currencies are the exception when there is a single group.
        thousands = len(tail) == 3 and not (currency in THREE_DECIMAL and len(parts) == 2)
        if thousands:
            digits = "".join(parts)
        else:
            digits = "".join(parts[:-1]) + "." + tail
    try:
        return float(digits)
    except ValueError:
        return None


# Indonesian short forms: "Rp 75ribu" is 75,000 and "Rp 3,499juta" is 3,499,000.
# The separator before the suffix is always a decimal mark.
_SCALE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(ribu|rb|juta|jt)\b", re.I)
_SCALE_FACTOR = {"ribu": 1e3, "rb": 1e3, "juta": 1e6, "jt": 1e6}


def parse_price(raw: str, storefront: str) -> tuple[float | None, str | None]:
    currency = detect_currency(raw, storefront)
    scaled = _SCALE.search(raw.replace(" ", " "))
    if scaled:
        number = float(scaled.group(1).replace(",", "."))
        return round(number * _SCALE_FACTOR[scaled.group(2).lower()], 2), currency
    amount = parse_amount(raw, currency)
    return amount, currency
