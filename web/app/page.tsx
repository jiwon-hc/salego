import { Chrome, EmptyState, hiddenView } from "@/components/Chrome"
import { CountryTables } from "@/components/Prices"
import { copy } from "@/lib/i18n"
import { loadSnapshot } from "@/lib/load"
import { readQuery, withView } from "@/lib/query"
import { activeCampaigns, countryName, todayUtc } from "@/lib/view"

type Raw = Record<string, string | string[] | undefined>

function sideCodes(iso2: string): string {
  return [iso2, "US", "JP", "KR"].filter((code, index, all) => all.indexOf(code) === index).slice(0, 4).join(",")
}

function first(value: string | string[] | undefined): string {
  const picked = Array.isArray(value) ? value[0] : value
  return picked || ""
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Raw> }) {
  const raw = await searchParams
  const query = readQuery(raw)
  const snapshot = loadSnapshot()
  if (!snapshot) return <EmptyState query={query} />
  const requested = first(raw.cc).toUpperCase() || "KR"
  const country = snapshot.countries.find((row) => row.iso2 === requested) ?? snapshot.countries.find((row) => row.iso2 === "KR") ?? snapshot.countries[0]
  const t = copy[query.lang]
  const today = todayUtc()
  const live = activeCampaigns(snapshot.campaigns, today).length
  const countries = [...snapshot.countries].sort((a, b) =>
    countryName(a, query.lang).localeCompare(countryName(b, query.lang), query.lang === "ko" ? "ko" : "en"),
  )
  return (
    <Chrome
      query={query}
      path="/"
      keep={{ cc: country.iso2 }}
      active="home"
      generatedAt={snapshot.generated_at}
      fxDate={snapshot.fx_date}
      storefrontCount={snapshot.storefront_count}
    >
      <h1>{countryName(country, query.lang)}</h1>
      <p className="lede">{t.homeLede}</p>
      <p>
        {t.activeCampaigns} <strong>{live}</strong>
        {" · "}
        {country.apple ? t.storefrontYes : t.storefrontNo}
      </p>
      <form className="picker" action="/" method="get">
        {hiddenView(query)}
        <label>
          <span className="muted">{t.country} </span>
          <select name="cc" defaultValue={country.iso2}>
            {countries.map((row) => (
              <option key={row.iso2} value={row.iso2}>
                {countryName(row, query.lang)} {row.iso2}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t.show}</button>
      </form>
      <p className="stack">
        <a href={withView(`/country/${country.iso2}`, query)}>{t.countryLink}</a>
        <a href={withView("/compare", query, { band: "plus", cc: sideCodes(country.iso2) })}>{t.sideLink}</a>
        <a href={withView("/compare", query, { band: "plus" })}>{t.compareLink}</a>
      </p>
      <CountryTables
        snapshot={snapshot}
        country={country}
        lang={query.lang}
        cur={query.cur}
        today={today}
        detailed={false}
      />
    </Chrome>
  )
}
