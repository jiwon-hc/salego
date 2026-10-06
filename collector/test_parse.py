import json
import unittest
from pathlib import Path

import yaml

from campaigns import eligibility, judge
from money import parse_price
from parse_apple import classify, extract_pairs

CATALOG = yaml.safe_load((Path(__file__).parent / "catalog.yaml").read_text(encoding="utf-8"))


def page(rows):
    items = [{"leadingText": label, "trailingText": price} for label, price in rows]
    payload = {
        "data": [{
            "data": {
                "shelfMapping": {
                    "information": {
                        "items": [{"title": "In-App Purchases", "items": items}],
                    },
                },
            },
        }],
    }
    return (
        '<script type="application/json" id="serialized-server-data">'
        + json.dumps(payload)
        + "</script>"
    )


class MoneyTest(unittest.TestCase):
    def test_samples_from_live_pages(self):
        cases = [
            ("₹ 1,999", "in", 1999, "INR"),
            ("₹ 19,900", "in", 19900, "INR"),
            ("$19.99", "us", 19.99, "USD"),
            ("$200.00", "us", 200.0, "USD"),
            ("￦29,000", "kr", 29000, "KRW"),
            ("22,99\u00a0€", "de", 22.99, "EUR"),
            ("229,00\u00a0€", "de", 229.0, "EUR"),
            ("¥3,000", "jp", 3000, "JPY"),
            ("R$\u00a099,90", "br", 99.90, "BRL"),
            ("R$\u00a02.599,90", "br", 2599.90, "BRL"),
            ("Rp\u00a075ribu", "id", 75000, "IDR"),
            ("Rp\u00a0349ribu", "id", 349000, "IDR"),
            ("Rp\u00a03,499juta", "id", 3499000, "IDR"),
            ("Rp\u00a01,889juta", "id", 1889000, "IDR"),
        ]
        for raw, cc, amount, currency in cases:
            got_amount, got_currency = parse_price(raw, cc)
            self.assertEqual(got_currency, currency, raw)
            self.assertAlmostEqual(got_amount, amount, places=2, msg=raw)


class ClassifyTest(unittest.TestCase):
    def test_chatgpt_splits_annual_and_drops_credits(self):
        html = page([
            ("ChatGPT Plus", "$19.99"),
            ("ChatGPT Go", "$8.00"),
            ("ChatGPT Pro 100", "$100.00"),
            ("100 Credits", "$4.00"),
            ("ChatGPT Pro 200", "$200.00"),
            ("ChatGPT Plus", "$200.00"),
            ("ChatGPT Pro 500", "$500.00"),
        ])
        rows = {(row.tier_id, row.period): row.amount for row in classify(extract_pairs(html), "us", CATALOG)}
        self.assertEqual(rows[("chatgpt-plus", "month")], 19.99)
        self.assertEqual(rows[("chatgpt-plus", "year")], 200)
        self.assertEqual(rows[("chatgpt-go", "month")], 8)
        self.assertEqual(rows[("chatgpt-pro-100", "month")], 100)
        self.assertEqual(rows[("chatgpt-pro-200", "month")], 200)
        self.assertEqual(rows[("chatgpt-pro-500", "month")], 500)
        self.assertNotIn(("credits", "month"), rows)

    def test_labeled_periods_and_duplicates(self):
        html = page([
            ("Claude Pro - Monthly", "$20.00"),
            ("Claude Max 5x - Monthly", "$124.99"),
            ("Claude Pro - Annual", "$214.99"),
            ("Usage Credits (20)", "$20.00"),
            ("Google AI Pro (5 TB)", "$19.99"),
            ("Google AI Pro (5 TB)", "$19.99"),
            ("Google AI Plus (400 GB)", "$4.99"),
            ("Google AI Ultra (30 TB)", "$199.99"),
            ("100 GB", "$1.99"),
            ("SuperGrok", "$30.00"),
            ("SuperGrok", "$300.00"),
            ("SuperGrok Lite", "$10.00"),
            ("SuperGrok Heavy", "$300.00"),
            ("SuperGrok Plus", "$100.00"),
        ])
        rows = {(row.tier_id, row.period): row.amount for row in classify(extract_pairs(html), "us", CATALOG)}
        self.assertEqual(rows[("claude-pro", "month")], 20)
        self.assertEqual(rows[("claude-pro", "year")], 214.99)
        self.assertEqual(rows[("claude-max-5x", "month")], 124.99)
        self.assertEqual(rows[("gemini-pro", "month")], 19.99)
        self.assertEqual(rows[("gemini-plus", "month")], 4.99)
        self.assertEqual(rows[("gemini-ultra", "month")], 199.99)
        self.assertEqual(rows[("grok", "month")], 30)
        self.assertEqual(rows[("grok", "year")], 300)
        self.assertEqual(rows[("grok-lite", "month")], 10)
        self.assertEqual(rows[("grok-heavy", "month")], 300)
        self.assertEqual(rows[("grok-plus", "month")], 100)
        self.assertFalse(any(tier == "gemini-plus" and amount == 1.99 for (tier, _), amount in rows.items()))


class CampaignTest(unittest.TestCase):
    def test_allowlist_and_unlisted(self):
        us = {"country_mode": "allowlist", "countries": ["US"]}
        plus = {"country_mode": "excluded_rest_unlisted", "countries": ["US", "CA", "BO"]}
        self.assertEqual(eligibility(us, "US"), "eligible")
        self.assertEqual(eligibility(us, "KR"), "ineligible")
        self.assertEqual(eligibility(plus, "CA"), "ineligible")
        self.assertEqual(eligibility(plus, "KR"), "unlisted")

    def test_end_date_beats_a_live_page(self):
        campaign = {"ends_on": "2026-10-01", "must_contain": ["still here"], "verified_on": "2026-10-06"}
        status, check = judge(campaign, "2026-10-06", 200, "still here")
        self.assertEqual(status, "ended")
        self.assertEqual(check, "past_end")

    def test_blocked_fetch_keeps_a_manual_read(self):
        campaign = {"ends_on": "2026-10-31", "must_contain": ["four"], "verified_on": "2026-10-06"}
        status, check = judge(campaign, "2026-10-06", 403, None)
        self.assertEqual(status, "active")
        self.assertEqual(check, "fetch_403")

    def test_missing_phrase_is_a_mismatch(self):
        campaign = {"ends_on": "2026-12-31", "must_contain": ["over 140 markets"]}
        status, _check = judge(campaign, "2026-10-06", 200, "the offer ended")
        self.assertEqual(status, "mismatch")

    def test_old_manual_read_expires(self):
        campaign = {"ends_on": "2026-12-31", "must_contain": ["four"], "verified_on": "2026-10-06"}
        status, _check = judge(campaign, "2026-10-21", 403, None)
        self.assertEqual(status, "unverified")


class OutlierTest(unittest.TestCase):
    def test_tenfold_price_is_held_back(self):
        from run import flag_outliers
        from store import connect
        db = connect(Path(":memory:"))
        db.execute("INSERT INTO runs (id) VALUES (1)")
        rows = [
            ("US", "gemini-plus", 4.99),
            ("GW", "gemini-plus", 49.99),  # annual price read as monthly
            ("ID", "gemini-plus", 0.004),  # "Rp 75ribu" read as 75
            ("IN", "gemini-plus", 2.40),   # a real cheap market stays
        ]
        db.executemany(
            "INSERT INTO observations (run_id, iso2, tier_id, period, usd_amount, availability) VALUES (1,?,?,'month',?,'on_sale')",
            rows,
        )
        self.assertEqual(flag_outliers(db, 1), 2)
        held = {row[0] for row in db.execute("SELECT iso2 FROM observations WHERE availability='suspect'")}
        self.assertEqual(held, {"GW", "ID"})


if __name__ == "__main__":
    unittest.main()
