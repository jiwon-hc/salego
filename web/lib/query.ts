import type { Cur, Lang } from "./types"

export type Query = { lang: Lang; cur: Cur }

type Raw = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Prices compare in won unless the URL asks otherwise; the default stays out of URLs.
export const DEFAULT_CUR: Cur = "krw"

export function curParam(cur: Cur): string | undefined {
  return cur === DEFAULT_CUR ? undefined : cur
}

export function readQuery(raw: Raw): Query {
  const curRaw = first(raw.cur)
  const cur: Cur = curRaw === "usd" || curRaw === "krw" || curRaw === "local" ? curRaw : DEFAULT_CUR
  return { lang: first(raw.lang) === "en" ? "en" : "ko", cur }
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ""

// Every internal path goes through here: the Pages base path plus the trailing
// slash of the static export, so a link never relies on a redirect.
export function withBase(path: string): string {
  return `${BASE}${path.endsWith("/") ? path : `${path}/`}`
}

export function href(path: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value)
  }
  const text = params.toString()
  const target = path.startsWith("/") ? withBase(path) : path
  return text ? `${target}?${text}` : target
}

export function withView(
  path: string,
  query: Query,
  keep: Record<string, string | undefined> = {},
): string {
  return href(path, {
    ...keep,
    lang: query.lang === "en" ? "en" : undefined,
    cur: curParam(query.cur),
  })
}
