import type { Copy } from "./i18n"
import type { Cur, Lang, Observation } from "./types"

const ZERO = new Set(["KRW", "JPY", "VND", "CLP", "ISK", "PYG", "UGX", "RWF", "XAF", "XOF", "BIF", "DJF", "GNF", "KMF", "VUV", "XPF"])

export function formatMoney(amount: number, currency: string, lang: Lang): string {
  const whole = ZERO.has(currency) || Math.abs(amount - Math.round(amount)) < 0.001
  try {
    return new Intl.NumberFormat(lang === "ko" ? "ko-KR" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function formatWhen(iso: string, lang: Lang): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 0) return "0%"
  return `${rounded > 0 ? "+" : ""}${rounded}%`
}

function amountFor(obs: Observation, cur: Cur): { amount: number; currency: string } | null {
  if (obs.availability !== "on_sale" || obs.amount == null) return null
  if (cur === "usd") return obs.usd == null ? null : { amount: obs.usd, currency: "USD" }
  if (cur === "krw") return obs.krw == null ? null : { amount: obs.krw, currency: "KRW" }
  if (obs.currency == null) return null
  return { amount: obs.amount, currency: obs.currency }
}

export function displayAmount(obs: Observation, cur: Cur, lang: Lang): string | null {
  const picked = amountFor(obs, cur)
  return picked ? formatMoney(picked.amount, picked.currency, lang) : null
}

export function localAmount(obs: Observation, lang: Lang): string | null {
  if (obs.availability !== "on_sale" || obs.amount == null || obs.currency == null) return null
  return formatMoney(obs.amount, obs.currency, lang)
}

export function monthlyEquivalent(obs: Observation, cur: Cur, lang: Lang): string | null {
  const picked = amountFor(obs, cur)
  return picked ? formatMoney(picked.amount / 12, picked.currency, lang) : null
}

export function taxLabel(tax: string, t: Copy): string {
  if (tax === "included") return t.taxIncluded
  if (tax === "excluded") return t.taxExcluded
  if (tax === "varies") return t.taxVaries
  return t.taxUnknown
}

export function storeLabel(storePromo: string, t: Copy): string {
  if (storePromo === "active") return t.storeActive
  if (storePromo === "none_on_storefront") return t.storeNone
  return t.storeUnknown
}

export function availabilityLabel(
  obs: Observation | undefined,
  apple: boolean,
  t: Copy,
): string | null {
  if (!apple) return t.noStorefront
  if (!obs) return t.unfetched
  if (obs.availability === "on_sale") return null
  if (obs.availability === "unavailable") return t.unavailable
  if (obs.availability === "not_listed") return t.notListed
  if (obs.availability === "fetch_failed") return t.fetchFailed
  if (obs.availability === "suspect") return t.suspect
  return t.unfetched
}

export function availabilityCode(obs: Observation | undefined, apple: boolean): string {
  if (!apple) return "no_storefront"
  if (!obs) return "unfetched"
  return obs.availability
}
