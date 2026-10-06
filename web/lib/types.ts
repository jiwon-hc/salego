export type Lang = "ko" | "en"
export type Cur = "local" | "usd" | "krw"
export type Band = "entry" | "plus" | "pro" | "ultra"

export type Platform = {
  id: string
  name: string
  vendor: string
  adam_id: string
}

export type Tier = {
  id: string
  platform: string
  name: string
  band: string
  order: number
}

export type Country = {
  iso2: string
  name_en: string
  name_ko: string
  region: string
  apple: boolean
}

export type Observation = {
  iso2: string
  platform: string
  tier_id: string
  period: string
  currency: string | null
  amount: number | null
  usd: number | null
  krw: number | null
  tax: string
  availability: string
  store_promo: string
  source_url: string
  raw_label: string | null
  raw_price: string | null
  fetched_at: string
  fx_date: string | null
}

export type Campaign = {
  id: string
  platform: string
  tier_id: string
  audience: string
  title_ko: string
  title_en: string
  effect_ko: string
  effect_en: string
  country_mode: string
  countries: string[]
  ends_on: string | null
  evidence_url: string
  note_ko: string
  note_en: string
  verified_on?: string
  status: string
  check: string
  checked_on: string
}

export type PriceChange = {
  iso2: string
  tier_id: string
  period: string
  old_amount: number
  new_amount: number
  currency: string
}

export type Snapshot = {
  generated_at: string
  started_at: string
  fx_date: string | null
  storefront_count: number
  platforms: Platform[]
  tiers: Tier[]
  countries: Country[]
  observations: Observation[]
  campaigns: Campaign[]
  changes: PriceChange[]
}
