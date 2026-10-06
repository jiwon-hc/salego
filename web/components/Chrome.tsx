import { copy, type Copy } from "@/lib/i18n"
import { href, withView, type Query } from "@/lib/query"
import { formatWhen } from "@/lib/format"
import type { Lang } from "@/lib/types"

const NAV = [
  ["/map", "map", "navMap"],
  ["/", "home", "navHome"],
  ["/compare", "compare", "navCompare"],
  ["/promos", "promos", "navPromos"],
  ["/method", "method", "navMethod"],
] as const

export function Chrome({
  query,
  path,
  keep,
  active,
  generatedAt,
  fxDate,
  storefrontCount,
  children,
}: {
  query: Query
  path: string
  keep?: Record<string, string | undefined>
  active: (typeof NAV)[number][1] | "platform"
  generatedAt?: string
  fxDate?: string | null
  storefrontCount?: number
  children: React.ReactNode
}) {
  const t = copy[query.lang]
  const preserved = keep ?? {}
  return (
    <div className="wrap">
      <header className="site">
        <div>
          <p className="kicker">{t.kicker}</p>
          <a className="brand" href={withView("/", query)}>{t.title}</a>
        </div>
        <nav className="nav" aria-label={t.title}>
          {NAV.map(([hrefPath, id, key]) => (
            <a
              key={id}
              href={withView(hrefPath, query, id === "compare" ? { band: preserved.band } : id === "map" ? { p: preserved.p, t: preserved.t } : undefined)}
              aria-current={active === id ? "page" : undefined}
            >
              {t[key]}
            </a>
          ))}
        </nav>
        <div className="controls">
          <a href={href(path, { ...preserved, cur: query.cur === "local" ? undefined : query.cur })} aria-current={query.lang === "ko" ? "true" : undefined}>{t.langKo}</a>
          <a href={href(path, { ...preserved, lang: "en", cur: query.cur === "local" ? undefined : query.cur })} aria-current={query.lang === "en" ? "true" : undefined}>{t.langEn}</a>
          <a href={href(path, { ...preserved, lang: query.lang === "en" ? "en" : undefined })} aria-current={query.cur === "local" ? "true" : undefined}>{t.curLocal}</a>
          <a href={href(path, { ...preserved, lang: query.lang === "en" ? "en" : undefined, cur: "usd" })} aria-current={query.cur === "usd" ? "true" : undefined}>{t.curUsd}</a>
          <a href={href(path, { ...preserved, lang: query.lang === "en" ? "en" : undefined, cur: "krw" })} aria-current={query.cur === "krw" ? "true" : undefined}>{t.curKrw}</a>
        </div>
      </header>
      <main lang={query.lang}>{children}</main>
      <footer className="site">
        <p>{t.footer}</p>
        {generatedAt ? (
          <p>
            {t.generated} {formatWhen(generatedAt, query.lang)}
            {" · "}
            {t.fx} {fxDate || "—"}
            {storefrontCount != null ? ` · ${storefrontCount}` : ""}
          </p>
        ) : null}
      </footer>
    </div>
  )
}

export function EmptyState({ query }: { query: Query }) {
  const t = copy[query.lang]
  return (
    <Chrome query={query} path="/" active="home">
      <div className="empty">
        <h1>{t.emptyTitle}</h1>
        <p>{t.emptyBody}</p>
      </div>
    </Chrome>
  )
}

export function hiddenView(query: Query) {
  return (
    <>
      {query.lang === "en" ? <input type="hidden" name="lang" value="en" /> : null}
      {query.cur !== "local" ? <input type="hidden" name="cur" value={query.cur} /> : null}
    </>
  )
}

export function bandName(band: string, t: Copy, lang: Lang): string {
  if (band === "entry") return t.bandEntry
  if (band === "plus") return t.bandPlus
  if (band === "pro") return t.bandPro
  if (band === "ultra") return t.bandUltra
  return lang === "ko" ? band : band
}
