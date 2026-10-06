import { Chrome, EmptyState, bandName, hiddenView } from "@/components/Chrome"
import { PriceMark } from "@/components/Prices"
import { copy } from "@/lib/i18n"
import { formatPercent, taxLabel } from "@/lib/format"
import { loadSnapshot } from "@/lib/load"
import { readQuery, withView } from "@/lib/query"
import type { Band, Country, Snapshot } from "@/lib/types"
import {
  buildIndex,
  countryName,
  observation,
  tiersInBand,
  todayUtc,
  versusUs,
  type PriceIndex,
} from "@/lib/view"

type Raw = Record<string, string | string[] | undefined>

const BANDS: Band[] = ["entry", "plus", "pro", "ultra"]
const DEFAULT_PICK = ["KR", "US", "JP"]
const PICK_LIMIT = 8

function first(value: string | string[] | undefined): string {
  const picked = Array.isArray(value) ? value[0] : value
  return picked || ""
}

function parsePick(raw: string, add: string): string[] {
  const source = raw.trim() ? raw : DEFAULT_PICK.join(",")
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of `${source},${add}`.split(/[^A-Za-z]+/)) {
    const code = part.toUpperCase()
    if (code.length !== 2 || seen.has(code)) continue
    seen.add(code)
    out.push(code)
    if (out.length >= PICK_LIMIT) break
  }
  return out
}

function tone(percent: number | null, priced: boolean): string {
  if (!priced || percent == null) return ""
  if (percent <= -1) return "cheap"
  if (percent >= 1) return "dear"
  return "even"
}

function isLowest(usd: number | null, best: number | null): boolean {
  if (usd == null || best == null) return false
  return Math.abs(usd - best) < 0.005
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Raw> }) {
  const raw = await searchParams
  const query = readQuery(raw)
  const snapshot = loadSnapshot()
  if (!snapshot) return <EmptyState query={query} />
  const band = BANDS.includes(first(raw.band) as Band) ? (first(raw.band) as Band) : "plus"
  const tiers = tiersInBand(snapshot, band)
  const requested = first(raw.tier)
  const focus = tiers.find((tier) => tier.id === requested) ?? tiers[0]
  const byIso = new Map(snapshot.countries.map((country) => [country.iso2, country]))
  const picked = parsePick(first(raw.cc), first(raw.add))
    .map((code) => byIso.get(code))
    .filter((country): country is Country => country != null)
  const shown = picked.length ? picked : DEFAULT_PICK.map((code) => byIso.get(code)).filter((country): country is Country => country != null)
  const ccJoined = shown.map((country) => country.iso2).join(",")
  const t = copy[query.lang]
  const today = todayUtc()
  const index = buildIndex(snapshot.observations)
  const us = focus ? observation(index, "US", focus.id, "month") : undefined
  const usUsd = us?.availability === "on_sale" ? us.usd : null
  const rows = snapshot.countries.map((country) => {
    const month = focus ? observation(index, country.iso2, focus.id, "month") : undefined
    const usd = month?.availability === "on_sale" ? month.usd : null
    const percent = versusUs(usd, usUsd)
    return { country, usd, percent, tax: month?.tax }
  })
  rows.sort((a, b) => {
    const bucket = (row: { usd: number | null; country: Country }) => (row.usd != null ? 0 : row.country.apple ? 1 : 2)
    const byBucket = bucket(a) - bucket(b)
    if (byBucket !== 0) return byBucket
    if (a.usd != null && b.usd != null && a.usd !== b.usd) return a.usd - b.usd
    return countryName(a.country, query.lang).localeCompare(countryName(b.country, query.lang), query.lang === "ko" ? "ko" : "en")
  })
  const keep = { band, tier: focus?.id, cc: ccJoined }
  const choices = [...snapshot.countries]
    .filter((country) => !shown.some((pickedCountry) => pickedCountry.iso2 === country.iso2))
    .sort((a, b) => countryName(a, query.lang).localeCompare(countryName(b, query.lang), query.lang === "ko" ? "ko" : "en"))
  return (
    <Chrome
      query={query}
      path="/compare"
      keep={keep}
      active="compare"
      generatedAt={snapshot.generated_at}
      fxDate={snapshot.fx_date}
      storefrontCount={snapshot.storefront_count}
    >
      <h1>{bandName(band, t, query.lang)}</h1>
      <p className="lede">{t.sideLede}</p>
      <div className="tabs">
        {BANDS.map((item) => (
          <a key={item} href={withView("/compare", query, { ...keep, band: item })} aria-current={item === band ? "page" : undefined}>
            {bandName(item, t, query.lang)}
          </a>
        ))}
      </div>
      <form className="picker" action="/compare" method="get">
        {hiddenView(query)}
        <input type="hidden" name="band" value={band} />
        {focus ? <input type="hidden" name="tier" value={focus.id} /> : null}
        <input type="hidden" name="cc" value={ccJoined} />
        <label>
          <span className="muted">{t.addCountry} </span>
          <select name="add" defaultValue={choices[0]?.iso2}>
            {choices.map((country) => (
              <option key={country.iso2} value={country.iso2}>
                {countryName(country, query.lang)} {country.iso2}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t.addCountry}</button>
      </form>
      {shown.length >= PICK_LIMIT ? <p className="muted">{t.sideLimit}</p> : null}
      <ul className="picks">
        {shown.map((country) => {
          const rest = shown.filter((item) => item.iso2 !== country.iso2).map((item) => item.iso2).join(",")
          return (
            <li key={country.iso2}>
              <a href={withView(`/country/${country.iso2}`, query)}>{countryName(country, query.lang)}</a>
              <a className="remove" href={withView("/compare", query, { ...keep, cc: rest || undefined })} aria-label={`${countryName(country, query.lang)} ${t.removeCountry}`}>
                {t.removeCountry}
              </a>
            </li>
          )
        })}
      </ul>
      <SideTable snapshot={snapshot} index={index} shown={shown} tiers={tiers} today={today} queryLang={query.lang} queryCur={query.cur} />
      <h2>{t.rankTitle}</h2>
      <p className="lede">{t.sortHint}</p>
      {focus ? (
        <div className="tabs">
          {tiers.map((tier) => (
            <a key={tier.id} href={withView("/compare", query, { ...keep, tier: tier.id })} aria-current={tier.id === focus.id ? "page" : undefined}>
              {tier.name}
            </a>
          ))}
        </div>
      ) : null}
      {usUsd == null ? <p>{t.usMissing}</p> : null}
      <p className="muted">{t.gridCaption} {t.noPriceGrey}</p>
      <div className="grid">
        {rows.filter((row) => row.country.apple).map((row) => (
          <a
            key={row.country.iso2}
            className={`chip ${tone(row.percent, row.usd != null)}`}
            href={withView(`/country/${row.country.iso2}`, query)}
            title={`${countryName(row.country, query.lang)}${row.percent == null ? "" : ` ${formatPercent(row.percent)}`}`}
          >
            {row.country.iso2}
          </a>
        ))}
      </div>
      <div className="scroll">
        <table>
          <caption>{focus ? `${focus.name} · ${t.sortBasis}` : band}</caption>
          <thead>
            <tr>
              <th scope="col">{t.country}</th>
              {tiers.map((tier) => (
                <th key={tier.id} scope="col" className={tier.id === focus?.id ? "focus" : undefined}>{tier.name}</th>
              ))}
              <th scope="col">{t.tax}</th>
              <th scope="col">{t.vsUs}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.country.iso2}>
                <th scope="row">
                  <a href={withView(`/country/${row.country.iso2}`, query)}>{countryName(row.country, query.lang)}</a>
                  <div className="muted">{row.country.iso2}</div>
                </th>
                {tiers.map((tier) => (
                  <td key={tier.id} className={tier.id === focus?.id ? "focus" : undefined}>
                    <PriceMark
                      snapshot={snapshot}
                      index={index}
                      country={row.country}
                      tier={tier}
                      cur={query.cur}
                      lang={query.lang}
                      today={today}
                      full={false}
                    />
                  </td>
                ))}
                <td>{row.tax ? <span className="badge">{taxLabel(row.tax, t)}</span> : "—"}</td>
                <td>{row.percent == null ? "—" : formatPercent(row.percent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Chrome>
  )
}

function SideTable({
  snapshot,
  index,
  shown,
  tiers,
  today,
  queryLang,
  queryCur,
}: {
  snapshot: Snapshot
  index: PriceIndex
  shown: Country[]
  tiers: ReturnType<typeof tiersInBand>
  today: string
  queryLang: "ko" | "en"
  queryCur: "local" | "usd" | "krw"
}) {
  const t = copy[queryLang]
  return (
    <div className="scroll">
      <table className="side" data-pick={shown.map((country) => country.iso2).join(",")}>
        <caption>{t.sideLink}</caption>
        <thead>
          <tr>
            <th scope="col">{t.tier}</th>
            {shown.map((country) => (
              <th key={country.iso2} scope="col">
                {countryName(country, queryLang)}
                <div className="muted">{country.iso2}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const amounts = shown.map((country) => {
              const month = observation(index, country.iso2, tier.id, "month")
              return month?.availability === "on_sale" ? month.usd : null
            })
            const priced = amounts.filter((amount): amount is number => amount != null)
            const best = priced.length >= 2 ? Math.min(...priced) : null
            return (
              <tr key={tier.id}>
                <th scope="row">{tier.name}</th>
                {shown.map((country, column) => {
                  const lowest = isLowest(amounts[column], best)
                  return (
                    <td key={country.iso2} className={lowest ? "best" : undefined} data-best={lowest ? "true" : undefined}>
                      <PriceMark
                        snapshot={snapshot}
                        index={index}
                        country={country}
                        tier={tier}
                        cur={queryCur}
                        lang={queryLang}
                        today={today}
                        full={false}
                      />
                      {lowest ? <div className="badge live">{t.cheapest}</div> : null}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
