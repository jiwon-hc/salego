import type { Campaign, Country, Lang, Observation, Snapshot, Tier } from "./types"

export type VerdictKind = "none" | "eligible" | "unlisted" | "ineligible" | "ended" | "mismatch" | "unverified"

export type Verdict = { kind: VerdictKind; items: Campaign[] }

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function countryName(country: Country, lang: Lang): string {
  const name = lang === "ko" ? country.name_ko : country.name_en
  return name || country.iso2
}

export function tiersFor(snapshot: Snapshot, platformId: string): Tier[] {
  return snapshot.tiers
    .filter((tier) => tier.platform === platformId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

export function tiersInBand(snapshot: Snapshot, band: string): Tier[] {
  return snapshot.tiers
    .filter((tier) => tier.band === band)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

export type PriceIndex = {
  byKey: Map<string, Observation>
  byCountryPlatform: Map<string, Observation[]>
}

export function buildIndex(rows: Observation[]): PriceIndex {
  const byKey = new Map<string, Observation>()
  const byCountryPlatform = new Map<string, Observation[]>()
  for (const row of rows) {
    byKey.set(`${row.iso2}|${row.tier_id}|${row.period}`, row)
    const key = `${row.iso2}|${row.platform}`
    const list = byCountryPlatform.get(key)
    if (list) list.push(row)
    else byCountryPlatform.set(key, [row])
  }
  return { byKey, byCountryPlatform }
}

export function observation(
  index: PriceIndex,
  iso2: string,
  tierId: string,
  period: string,
): Observation | undefined {
  return index.byKey.get(`${iso2}|${tierId}|${period}`)
}

export function isStale(fetchedAt: string | null | undefined, generatedAt: string): boolean {
  if (!fetchedAt) return false
  const delta = Date.parse(generatedAt) - Date.parse(fetchedAt)
  return Number.isFinite(delta) && delta > 48 * 60 * 60 * 1000
}

export function eligibility(campaign: Campaign, iso2: string): "eligible" | "ineligible" | "unlisted" {
  const codes = new Set((campaign.countries || []).map((code) => code.toUpperCase()))
  const iso = iso2.toUpperCase()
  if (campaign.country_mode === "allowlist") return codes.has(iso) ? "eligible" : "ineligible"
  if (campaign.country_mode === "excluded_rest_unlisted") return codes.has(iso) ? "ineligible" : "unlisted"
  return "unlisted"
}

function campaignOpen(campaign: Campaign, today: string): boolean {
  if (campaign.status !== "active") return false
  if (campaign.ends_on && campaign.ends_on < today) return false
  return true
}

export function campaignVerdict(
  campaigns: Campaign[],
  iso2: string,
  tierId: string,
  today: string,
): Verdict {
  const relevant = campaigns.filter((campaign) => campaign.tier_id === tierId)
  if (!relevant.length) return { kind: "none", items: [] }
  const active = relevant.filter((campaign) => campaignOpen(campaign, today))
  const eligible = active.filter((campaign) => eligibility(campaign, iso2) === "eligible")
  if (eligible.length) return { kind: "eligible", items: eligible }
  const unlisted = active.filter((campaign) => eligibility(campaign, iso2) === "unlisted")
  if (unlisted.length) return { kind: "unlisted", items: unlisted }
  const mismatch = relevant.filter(
    (campaign) => campaign.status === "mismatch" && eligibility(campaign, iso2) !== "ineligible",
  )
  if (mismatch.length) return { kind: "mismatch", items: mismatch }
  const unverified = relevant.filter(
    (campaign) => campaign.status === "unverified" && eligibility(campaign, iso2) !== "ineligible",
  )
  if (unverified.length) return { kind: "unverified", items: unverified }
  const ended = relevant.filter(
    (campaign) =>
      (campaign.status === "ended" || (campaign.ends_on != null && campaign.ends_on < today)) &&
      eligibility(campaign, iso2) === "eligible",
  )
  if (ended.length) return { kind: "ended", items: ended }
  return { kind: "ineligible", items: relevant }
}

export function activeCampaigns(campaigns: Campaign[], today: string): Campaign[] {
  return campaigns.filter((campaign) => campaignOpen(campaign, today))
}

export type CollectionStats = {
  apple: number
  iso: number
  pages: number
  ok: number
  unavailable: number
  failed: number
  unfetched: number
}

export function collectionStats(snapshot: Snapshot): CollectionStats {
  const index = buildIndex(snapshot.observations)
  let ok = 0
  let unavailable = 0
  let failed = 0
  let unfetched = 0
  const appleCountries = snapshot.countries.filter((country) => country.apple)
  for (const country of appleCountries) {
    for (const platform of snapshot.platforms) {
      const rows = index.byCountryPlatform.get(`${country.iso2}|${platform.id}`) ?? []
      if (!rows.length) {
        unfetched += 1
        continue
      }
      if (rows.some((row) => row.availability === "fetch_failed")) {
        failed += 1
        continue
      }
      if (rows.some((row) => ["on_sale", "not_listed", "suspect"].includes(row.availability))) {
        ok += 1
        continue
      }
      if (rows.some((row) => row.availability === "unavailable")) {
        unavailable += 1
        continue
      }
      failed += 1
    }
  }
  return {
    apple: appleCountries.length,
    iso: snapshot.countries.length,
    pages: appleCountries.length * snapshot.platforms.length,
    ok,
    unavailable,
    failed,
    unfetched,
  }
}

export function versusUs(usd: number | null, usUsd: number | null): number | null {
  if (usd == null || usUsd == null || usUsd === 0) return null
  return ((usd - usUsd) / usUsd) * 100
}

export function lookupCountry(snapshot: Snapshot, iso2: string): Country | undefined {
  const code = iso2.toUpperCase()
  return snapshot.countries.find((country) => country.iso2 === code)
}

export function namedCountries(snapshot: Snapshot, codes: string[], lang: Lang): string {
  return codes
    .map((code) => {
      const country = lookupCountry(snapshot, code)
      const upper = code.toUpperCase()
      return country ? `${countryName(country, lang)} (${upper})` : upper
    })
    .join(", ")
}
