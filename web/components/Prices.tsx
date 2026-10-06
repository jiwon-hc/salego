import { copy, type Copy } from "@/lib/i18n"
import {
  availabilityCode,
  availabilityLabel,
  displayAmount,
  localAmount,
  monthlyEquivalent,
  storeLabel,
  taxLabel,
} from "@/lib/format"
import { withView } from "@/lib/query"
import type { Country, Cur, Lang, Observation, Snapshot, Tier } from "@/lib/types"
import {
  buildIndex,
  campaignVerdict,
  isStale,
  observation,
  tiersFor,
  type PriceIndex,
  type Verdict,
} from "@/lib/view"

function Money({
  obs,
  cur,
  lang,
  t,
}: {
  obs: Observation
  cur: Cur
  lang: Lang
  t: Copy
}) {
  const shown = displayAmount(obs, cur, lang)
  const local = localAmount(obs, lang)
  if (shown) {
    return (
      <a className="price" href={obs.source_url} title={obs.raw_price ?? undefined} rel="noopener noreferrer">
        {shown}
      </a>
    )
  }
  return (
    <>
      {local ? (
        <a className="price" href={obs.source_url} title={obs.raw_price ?? undefined} rel="noopener noreferrer">
          {local}
        </a>
      ) : null}
      <div className="muted">{cur === "krw" ? t.noKrw : t.noUsd}</div>
    </>
  )
}

function PromoMarks({
  verdict,
  storePromo,
  lang,
  t,
  full,
}: {
  verdict: Verdict
  storePromo: string | undefined
  lang: Lang
  t: Copy
  full: boolean
}) {
  return (
    <div>
      {storePromo === "active" ? <div className="badge live">{storeLabel(storePromo, t)}</div> : null}
      {verdict.kind === "eligible"
        ? verdict.items.map((campaign) => (
            <a key={campaign.id} className="badge live" href={campaign.evidence_url} rel="noopener noreferrer">
              {lang === "ko" ? campaign.title_ko : campaign.title_en}
              {" · "}
              {t.audience[campaign.audience] ?? campaign.audience}
              {campaign.ends_on ? ` · ${campaign.ends_on} ${t.until}` : ""}
              {" · "}
              {t.campaignLive}
            </a>
          ))
        : null}
      {verdict.kind === "unlisted" ? <span className="badge warn">{t.campaignUnlisted}</span> : null}
      {verdict.kind === "ineligible" ? <span className={full ? "badge" : "muted"}>{t.campaignIneligible}</span> : null}
      {verdict.kind === "none" && full ? <span className="muted">{t.campaignNone}</span> : null}
      {verdict.kind === "ended" ? <span className="badge">{t.campaignEnded}</span> : null}
      {verdict.kind === "mismatch" ? <span className="badge warn">{t.campaignMismatch}</span> : null}
      {verdict.kind === "unverified" ? <span className="badge warn">{t.campaignUnverified}</span> : null}
      {verdict.kind === "eligible"
        ? verdict.items
            .filter((campaign) => campaign.check.startsWith("fetch_"))
            .map((campaign) => (
              <div key={`${campaign.id}-recheck`} className="muted">
                {t.recheck(campaign.verified_on || "2026-10-06")}
              </div>
            ))
        : null}
    </div>
  )
}

function AnnualLine({
  year,
  cur,
  lang,
  t,
}: {
  year: Observation | undefined
  cur: Cur
  lang: Lang
  t: Copy
}) {
  if (!year || year.availability !== "on_sale") return null
  const total = displayAmount(year, cur, lang) || localAmount(year, lang)
  const month = monthlyEquivalent(year, cur, lang) || monthlyEquivalent(year, "local", lang)
  if (!total) return null
  return (
    <p className="annual muted">
      {t.annual}{" "}
      <a href={year.source_url} rel="noopener noreferrer">{total}</a>
      {month ? ` · ${t.perMonth} ${month}` : ""}
    </p>
  )
}

export function CountryTables({
  snapshot,
  country,
  lang,
  cur,
  today,
  detailed,
}: {
  snapshot: Snapshot
  country: Country
  lang: Lang
  cur: Cur
  today: string
  detailed: boolean
}) {
  const t = copy[lang]
  const index = buildIndex(snapshot.observations)
  return (
    <>
      {snapshot.platforms.map((platform) => {
        const tiers = tiersFor(snapshot, platform.id)
        return (
          <section key={platform.id}>
            <h2>
              <a href={withView(`/platform/${platform.id}`, { lang, cur })}>
                {platform.name}
              </a>{" "}
              <span className="muted">{platform.vendor}</span>
            </h2>
            <div className="scroll">
              <table>
                <caption>{platform.name}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t.tier}</th>
                    <th scope="col">{t.month}</th>
                    <th scope="col">{t.annual}</th>
                    <th scope="col">{t.promo}</th>
                    <th scope="col">{t.tax}</th>
                    {detailed ? <th scope="col">{t.fetched}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <TierRow
                      key={tier.id}
                      snapshot={snapshot}
                      country={country}
                      tier={tier}
                      index={index}
                      lang={lang}
                      cur={cur}
                      today={today}
                      detailed={detailed}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </>
  )
}

function TierRow({
  snapshot,
  country,
  tier,
  index,
  lang,
  cur,
  today,
  detailed,
  t,
}: {
  snapshot: Snapshot
  country: Country
  tier: Tier
  index: ReturnType<typeof buildIndex>
  lang: Lang
  cur: Cur
  today: string
  detailed: boolean
  t: Copy
}) {
  const month = observation(index, country.iso2, tier.id, "month")
  const year = observation(index, country.iso2, tier.id, "year")
  const state = availabilityLabel(month, country.apple, t)
  const verdict = campaignVerdict(snapshot.campaigns, country.iso2, tier.id, today)
  const stale = month ? isStale(month.fetched_at, snapshot.generated_at) : false
  return (
    <tr>
      <th scope="row">
        {tier.name}
        {month?.raw_label && month.raw_label !== tier.name ? <div className="muted">{month.raw_label}</div> : null}
      </th>
      <td
        data-iso={country.iso2}
        data-tier={tier.id}
        data-availability={availabilityCode(month, country.apple)}
        data-amount={month?.availability === "on_sale" ? String(month.amount) : ""}
      >
        {state || !month ? <span className="muted">{state}</span> : <Money obs={month} cur={cur} lang={lang} t={t} />}
        {stale ? <div className="badge stale">{t.stale}</div> : null}
      </td>
      <td>{year?.availability === "on_sale" ? <AnnualLine year={year} cur={cur} lang={lang} t={t} /> : <span className="muted">—</span>}</td>
      <td>
        <PromoMarks verdict={verdict} storePromo={month?.store_promo} lang={lang} t={t} full />
      </td>
      <td>{month ? <span className="badge">{taxLabel(month.tax, t)}</span> : "—"}</td>
      {detailed ? (
        <td>
          {month?.fetched_at ? <div>{month.fetched_at.slice(0, 16).replace("T", " ")} UTC</div> : null}
          {month?.source_url ? (
            <a href={month.source_url} rel="noopener noreferrer">{t.openStore}</a>
          ) : null}
        </td>
      ) : null}
    </tr>
  )
}

export function PriceMark({
  snapshot,
  index,
  country,
  tier,
  cur,
  lang,
  today,
  full,
}: {
  snapshot: Snapshot
  index: PriceIndex
  country: Country
  tier: Tier
  cur: Cur
  lang: Lang
  today: string
  full: boolean
}) {
  const t = copy[lang]
  const month = observation(index, country.iso2, tier.id, "month")
  const year = observation(index, country.iso2, tier.id, "year")
  const state = availabilityLabel(month, country.apple, t)
  const verdict = campaignVerdict(snapshot.campaigns, country.iso2, tier.id, today)
  const stale = month ? isStale(month.fetched_at, snapshot.generated_at) : false
  return (
    <div
      data-iso={country.iso2}
      data-tier={tier.id}
      data-availability={availabilityCode(month, country.apple)}
      data-amount={month?.availability === "on_sale" ? String(month.amount) : ""}
    >
      {state || !month ? <span className="muted">{state}</span> : <Money obs={month} cur={cur} lang={lang} t={t} />}
      <AnnualLine year={year} cur={cur} lang={lang} t={t} />
      {stale ? <div className="badge stale">{t.stale}</div> : null}
      <PromoMarks verdict={verdict} storePromo={month?.store_promo} lang={lang} t={t} full={full} />
    </div>
  )
}