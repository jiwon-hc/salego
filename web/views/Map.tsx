import { Chrome, EmptyState } from "@/components/Chrome"
import world from "@/data/world.json"
import { copy, type Copy } from "@/lib/i18n"
import { displayAmount, formatPercent, localAmount } from "@/lib/format"
import { loadSnapshot } from "@/lib/load"
import { readQuery, withView } from "@/lib/query"
import type { Country, Lang } from "@/lib/types"
import {
  buildIndex,
  campaignVerdict,
  countryName,
  observation,
  tiersFor,
  todayUtc,
  versusUs,
} from "@/lib/view"

type Raw = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string {
  const picked = Array.isArray(value) ? value[0] : value
  return picked || ""
}

// Diverging around the US price: blue cheaper, red dearer, warm gray within ±2%.
// Arms are lightness-matched step for step (OKLab L .43/.62/.81 vs .47/.62/.81).
const BINS = [
  { max: -25, fill: "#184f95" },
  { max: -10, fill: "#3987e5" },
  { max: -2, fill: "#9ec5f4" },
  { max: 2, fill: "#d6d0c4" },
  { max: 10, fill: "#f2aaa3" },
  { max: 25, fill: "#e34948" },
  { max: Infinity, fill: "#9e2b2a" },
]

function binFor(percent: number): number {
  return BINS.findIndex((bin) => percent <= bin.max)
}

function binLabel(index: number, t: Copy): string {
  const edges = [-25, -10, -2, 2, 10, 25]
  if (index === 0) return `${t.mapCheaper} ${Math.abs(edges[0])}%+`
  if (index === BINS.length - 1) return `${t.mapDearer} ${edges[edges.length - 1]}%+`
  if (index === 3) return t.mapEven
  const [lo, hi] = [Math.abs(edges[index - 1]), Math.abs(edges[index])].sort((a, b) => a - b)
  return `${index < 3 ? t.mapCheaper : t.mapDearer} ${lo}–${hi}%`
}

type Cell = {
  country: Country
  percent: number | null
  shown: string | null
  local: string | null
  promo: boolean
}

export function MapView({ raw }: { raw: Raw }) {
  const query = readQuery(raw)
  const snapshot = loadSnapshot()
  if (!snapshot) return <EmptyState query={query} />
  const t = copy[query.lang]
  const lang: Lang = query.lang
  const platform = snapshot.platforms.find((item) => item.id === first(raw.p)) ?? snapshot.platforms[0]
  const tiers = tiersFor(snapshot, platform.id)
  const tier = tiers.find((item) => item.id === first(raw.t)) ?? tiers.find((item) => item.band === "plus") ?? tiers[0]
  const index = buildIndex(snapshot.observations)
  const today = todayUtc()
  const us = observation(index, "US", tier.id, "month")
  const usUsd = us?.availability === "on_sale" ? us.usd : null

  const cells = new Map<string, Cell>()
  for (const country of snapshot.countries) {
    const month = observation(index, country.iso2, tier.id, "month")
    const onSale = month?.availability === "on_sale"
    cells.set(country.iso2, {
      country,
      percent: onSale ? versusUs(month.usd, usUsd) : null,
      shown: onSale ? displayAmount(month, query.cur, lang) : null,
      local: onSale ? localAmount(month, lang) : null,
      promo: campaignVerdict(snapshot.campaigns, country.iso2, tier.id, today).kind === "eligible",
    })
  }

  const ranked = [...cells.values()]
    .filter((cell) => cell.percent != null)
    .sort((a, b) => (a.percent as number) - (b.percent as number))
  const cheapest = ranked.slice(0, 5)
  const dearest = ranked.slice(-5).reverse()
  const keep = { p: platform.id, t: tier.id }

  const tooltip = (cell: Cell | undefined, fallback: string): string => {
    if (!cell) return fallback
    const name = countryName(cell.country, lang)
    if (!cell.country.apple) return `${name} · ${t.noStorefront}`
    if (cell.percent == null && !cell.local) return `${name} · ${t.mapNoPrice}`
    const price = cell.shown && cell.shown !== cell.local ? `${cell.local} (${cell.shown})` : cell.local
    const delta = cell.percent == null ? "" : ` · ${t.vsUs} ${formatPercent(cell.percent)}`
    return `${name} · ${price}${delta}${cell.promo ? ` · ${t.mapPromo}` : ""}`
  }

  return (
    <Chrome
      query={query}
      path="/map"
      keep={keep}
      active="map"
      generatedAt={snapshot.generated_at}
      fxDate={snapshot.fx_date}
      storefrontCount={snapshot.storefront_count}
    >
      <h1>{t.mapTitle}</h1>
      <p className="lede">{t.mapLede}</p>
      <div className="tabs" aria-label={t.mapPlatform}>
        {snapshot.platforms.map((item) => (
          <a key={item.id} href={withView("/map", query, { p: item.id })} aria-current={item.id === platform.id ? "page" : undefined}>
            {item.name}
          </a>
        ))}
      </div>
      <div className="tabs tiers" aria-label={t.tier}>
        {tiers.map((item) => {
          const usRow = observation(index, "US", item.id, "month")
          const usPrice = usRow?.availability === "on_sale" ? displayAmount(usRow, query.cur, lang) ?? localAmount(usRow, lang) : null
          return (
            <a key={item.id} href={withView("/map", query, { p: platform.id, t: item.id })} aria-current={item.id === tier.id ? "page" : undefined}>
              {item.name}
              {usPrice ? <span className="tier-us">US {usPrice}</span> : null}
            </a>
          )
        })}
      </div>
      {usUsd == null ? <p>{t.usMissing}</p> : null}

      <figure className="map">
        <svg viewBox={world.viewBox} role="img" aria-label={`${platform.name} ${tier.name} · ${t.mapTitle}`}>
          <defs>
            <pattern id="nodata" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#ebe6dc" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#c9c1b2" strokeWidth="1.5" />
            </pattern>
          </defs>
          {world.shapes.map((shape, at) => {
            const cell = shape.iso ? cells.get(shape.iso) : undefined
            const fill =
              cell?.percent != null ? BINS[binFor(cell.percent)].fill : cell?.country.apple ? "url(#nodata)" : "#ebe6dc"
            const label = tooltip(cell, t.noStorefront)
            const path = (
              <path d={shape.d} fill={fill} data-iso={shape.iso || undefined} data-pct={cell?.percent == null ? undefined : Math.round(cell.percent)}>
                <title>{label}</title>
              </path>
            )
            return cell ? (
              <a key={at} href={withView(`/country/${shape.iso}`, query)} aria-label={label}>
                {path}
              </a>
            ) : (
              <g key={at}>{path}</g>
            )
          })}
          <g className="promo-ring" aria-hidden="true">
            {world.shapes
              .filter((shape) => shape.iso && cells.get(shape.iso)?.promo)
              .map((shape, at) => (
                <path key={at} d={shape.d} />
              ))}
          </g>
        </svg>
        <figcaption className="legend">
          {BINS.map((bin, at) => (
            <span key={bin.fill}>
              <i style={{ background: bin.fill }} />
              {binLabel(at, t)}
            </span>
          ))}
          <span><i className="swatch-nodata" />{t.mapNoPrice}</span>
          <span><i style={{ background: "#ebe6dc" }} />{t.noStorefront}</span>
          <span><i className="swatch-promo" />{t.mapPromo}</span>
        </figcaption>
      </figure>

      <div className="extremes">
        <Extremes title={t.mapCheapest} cells={cheapest} lang={lang} query={query} />
        <Extremes title={t.mapDearest} cells={dearest} lang={lang} query={query} />
      </div>
      <p>
        <a href={withView("/compare", query, { band: tier.band, tier: tier.id })}>{t.mapTable}</a>
      </p>
    </Chrome>
  )
}

function Extremes({
  title,
  cells,
  lang,
  query,
}: {
  title: string
  cells: Cell[]
  lang: Lang
  query: ReturnType<typeof readQuery>
}) {
  return (
    <section>
      <h2>{title}</h2>
      <ol>
        {cells.map((cell) => (
          <li key={cell.country.iso2}>
            <a href={withView(`/country/${cell.country.iso2}`, query)}>{countryName(cell.country, lang)}</a>{" "}
            <span className="price">{cell.shown ?? cell.local}</span>{" "}
            <span className="muted">{formatPercent(cell.percent as number)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
