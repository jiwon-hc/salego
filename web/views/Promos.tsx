import { Chrome, EmptyState } from "@/components/Chrome"
import { copy } from "@/lib/i18n"
import { loadSnapshot } from "@/lib/load"
import { readQuery } from "@/lib/query"
import {
  activeCampaigns,
  eligibility,
  namedCountries,
  todayUtc,
} from "@/lib/view"

type Raw = Record<string, string | string[] | undefined>

export function PromosView({ raw }: { raw: Raw }) {
  const query = readQuery(raw)
  const snapshot = loadSnapshot()
  if (!snapshot) return <EmptyState query={query} />
  const t = copy[query.lang]
  const today = todayUtc()
  const live = activeCampaigns(snapshot.campaigns, today)
  return (
    <Chrome
      query={query}
      path="/promos"
      active="promos"
      generatedAt={snapshot.generated_at}
      fxDate={snapshot.fx_date}
      storefrontCount={snapshot.storefront_count}
    >
      <h1>{t.navPromos}</h1>
      <p className="lede">
        {t.activeCampaigns} <strong>{live.length}</strong>
      </p>
      <div className="cards">
        {snapshot.campaigns.map((campaign) => {
          const ended = campaign.status === "ended" || (campaign.ends_on != null && campaign.ends_on < today)
          const mismatch = campaign.status === "mismatch"
          const inProgress = !ended && !mismatch && campaign.status === "active"
          const unverified = campaign.status === "unverified"
          const label = ended ? t.campaignEnded : mismatch ? t.campaignMismatch : inProgress ? t.campaignLive : unverified ? t.campaignUnverified : campaign.status
          const badge = inProgress ? "badge live" : mismatch || unverified ? "badge warn" : "badge"
          const confirmed = snapshot.countries.filter((country) => eligibility(campaign, country.iso2) === "eligible")
          const title = query.lang === "ko" ? campaign.title_ko : campaign.title_en
          const effect = query.lang === "ko" ? campaign.effect_ko : campaign.effect_en
          const note = query.lang === "ko" ? campaign.note_ko : campaign.note_en
          return (
            <article key={campaign.id} className="card" data-campaign={campaign.id} data-status={ended ? "ended" : mismatch ? "mismatch" : inProgress ? "active" : campaign.status}>
              <h2>{title}</h2>
              <p>
                <span className={badge}>{label}</span>
                <span className="badge">{t.audience[campaign.audience] ?? campaign.audience}</span>
                {campaign.ends_on ? <span className="badge">{campaign.ends_on} {t.until}</span> : null}
              </p>
              <p>{effect}</p>
              <p>
                {t.eligibleCount}: {confirmed.length}
                {confirmed.length ? ` · ${namedCountries(snapshot, confirmed.map((country) => country.iso2), query.lang)}` : ""}
              </p>
              {campaign.country_mode === "allowlist" ? (
                <p className="muted">{t.allowRest}</p>
              ) : (
                <>
                  <p>{t.excluded}: {namedCountries(snapshot, campaign.countries, query.lang) || "—"}</p>
                  <p className="muted">{t.unlistedRest}</p>
                </>
              )}
              <p>{note}</p>
              <p>
                <a href={campaign.evidence_url} rel="noopener noreferrer">{t.evidence}</a>
                {" · "}
                {campaign.check === "page_ok" ? t.pageCheck : campaign.check.startsWith("fetch_") ? t.recheck(campaign.verified_on || "2026-10-06") : campaign.check}
              </p>
            </article>
          )
        })}
      </div>
    </Chrome>
  )
}
