import { Chrome, EmptyState } from "@/components/Chrome"
import { copy, methodParagraphs } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import { loadSnapshot } from "@/lib/load"
import { readQuery } from "@/lib/query"
import { collectionStats, countryName, lookupCountry } from "@/lib/view"

type Raw = Record<string, string | string[] | undefined>

export default async function MethodPage({ searchParams }: { searchParams: Promise<Raw> }) {
  const query = readQuery(await searchParams)
  const snapshot = loadSnapshot()
  if (!snapshot) return <EmptyState query={query} />
  const t = copy[query.lang]
  const stats = collectionStats(snapshot)
  const paragraphs = methodParagraphs(query.lang, {
    storefronts: snapshot.storefront_count,
    countries: snapshot.countries.length,
    fx: snapshot.fx_date || "—",
  })
  const tiers = new Map(snapshot.tiers.map((tier) => [tier.id, tier.name]))
  return (
    <Chrome
      query={query}
      path="/method"
      active="method"
      generatedAt={snapshot.generated_at}
      fxDate={snapshot.fx_date}
      storefrontCount={snapshot.storefront_count}
    >
      <h1>{t.navMethod}</h1>
      <dl className="meta">
        <dt>{t.pagesOk}</dt>
        <dd data-stat="ok">{stats.ok}</dd>
        <dt>{t.pagesUnavailable}</dt>
        <dd data-stat="unavailable">{stats.unavailable}</dd>
        <dt>{t.pagesFailed}</dt>
        <dd data-stat="failed">{stats.failed}</dd>
        <dt>{t.pagesUnfetched}</dt>
        <dd data-stat="unfetched">{stats.unfetched}</dd>
      </dl>
      <div className="prose">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {snapshot.changes.length ? (
        <>
          <h2>{t.changes}</h2>
          <div className="scroll">
            <table>
              <caption>{t.changes}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.country}</th>
                  <th scope="col">{t.tier}</th>
                  <th scope="col">{t.periodMonth}</th>
                  <th scope="col">{t.from}</th>
                  <th scope="col">{t.to}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.changes.map((change) => {
                  const country = lookupCountry(snapshot, change.iso2)
                  return (
                    <tr key={`${change.iso2}-${change.tier_id}-${change.period}`}>
                      <th scope="row">{country ? countryName(country, query.lang) : change.iso2}</th>
                      <td>{tiers.get(change.tier_id) || change.tier_id}</td>
                      <td>{change.period === "year" ? t.periodYear : t.periodMonth}</td>
                      <td>{formatMoney(change.old_amount, change.currency, query.lang)}</td>
                      <td>{formatMoney(change.new_amount, change.currency, query.lang)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </Chrome>
  )
}
