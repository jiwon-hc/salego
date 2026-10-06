import { Chrome, EmptyState } from "@/components/Chrome"
import { PriceMark } from "@/components/Prices"
import { copy } from "@/lib/i18n"
import { loadSnapshot } from "@/lib/load"
import { readQuery, withView } from "@/lib/query"
import { buildIndex, countryName, tiersFor, todayUtc } from "@/lib/view"

type Raw = Record<string, string | string[] | undefined>

export function PlatformView({ id, raw }: { id: string; raw: Raw }) {
  const query = readQuery(raw)
  const snapshot = loadSnapshot()
  if (!snapshot) return <EmptyState query={query} />
  const platform = snapshot.platforms.find((item) => item.id === id)
  const t = copy[query.lang]
  if (!platform) {
    return (
      <Chrome query={query} path={`/platform/${id}`} active="platform" generatedAt={snapshot.generated_at} fxDate={snapshot.fx_date} storefrontCount={snapshot.storefront_count}>
        <h1>{id}</h1>
        <p>{t.missingPlatform}</p>
      </Chrome>
    )
  }
  const tiers = tiersFor(snapshot, platform.id)
  const index = buildIndex(snapshot.observations)
  const today = todayUtc()
  const countries = [...snapshot.countries].sort((a, b) =>
    countryName(a, query.lang).localeCompare(countryName(b, query.lang), query.lang === "ko" ? "ko" : "en"),
  )
  return (
    <Chrome
      query={query}
      path={`/platform/${platform.id}`}
      active="platform"
      generatedAt={snapshot.generated_at}
      fxDate={snapshot.fx_date}
      storefrontCount={snapshot.storefront_count}
    >
      <h1>{platform.name}</h1>
      <p className="lede">{platform.vendor}</p>
      <p>
        <a href={`https://apps.apple.com/us/app/id${platform.adam_id}`} rel="noopener noreferrer">{t.usStore}</a>
      </p>
      <div className="scroll">
        <table>
          <caption>{platform.name}</caption>
          <thead>
            <tr>
              <th scope="col">{t.country}</th>
              {tiers.map((tier) => (
                <th key={tier.id} scope="col">{tier.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tr key={country.iso2}>
                <th scope="row">
                  <a href={withView(`/country/${country.iso2}`, query)}>{countryName(country, query.lang)}</a>
                  <div className="muted">{country.iso2}</div>
                </th>
                {tiers.map((tier) => (
                  <td key={tier.id}>
                    <PriceMark
                      snapshot={snapshot}
                      index={index}
                      country={country}
                      tier={tier}
                      cur={query.cur}
                      lang={query.lang}
                      today={today}
                      full={false}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Chrome>
  )
}
