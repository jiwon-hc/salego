import { Chrome, EmptyState } from "@/components/Chrome"
import { CountryTables } from "@/components/Prices"
import { copy } from "@/lib/i18n"
import { loadSnapshot } from "@/lib/load"
import { readQuery } from "@/lib/query"
import { countryName, lookupCountry, todayUtc } from "@/lib/view"

type Raw = Record<string, string | string[] | undefined>

export function CountryView({ iso, raw }: { iso: string; raw: Raw }) {
  const query = readQuery(raw)
  const snapshot = loadSnapshot()
  if (!snapshot) return <EmptyState query={query} />
  const country = lookupCountry(snapshot, iso)
  const t = copy[query.lang]
  const path = `/country/${iso}`
  if (!country) {
    return (
      <Chrome query={query} path={path} active="home" generatedAt={snapshot.generated_at} fxDate={snapshot.fx_date} storefrontCount={snapshot.storefront_count}>
        <h1>{iso.toUpperCase()}</h1>
        <p>{t.missingCountry}</p>
      </Chrome>
    )
  }
  return (
    <Chrome query={query} path={`/country/${country.iso2}`} active="home" generatedAt={snapshot.generated_at} fxDate={snapshot.fx_date} storefrontCount={snapshot.storefront_count}>
      <h1>{countryName(country, query.lang)}</h1>
      <p className="lede">{country.iso2} · {country.region}</p>
      <p>{country.apple ? t.storefrontYes : t.storefrontNo}</p>
      <CountryTables
        snapshot={snapshot}
        country={country}
        lang={query.lang}
        cur={query.cur}
        today={todayUtc()}
        detailed
      />
    </Chrome>
  )
}
