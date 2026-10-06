import type { Cur, Lang } from "./types"

export type Query = { lang: Lang; cur: Cur }

type Raw = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function readQuery(raw: Raw): Query {
  const curRaw = first(raw.cur)
  const cur: Cur = curRaw === "usd" || curRaw === "krw" ? curRaw : "local"
  return { lang: first(raw.lang) === "en" ? "en" : "ko", cur }
}

export function href(path: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value)
  }
  const text = params.toString()
  return text ? `${path}?${text}` : path
}

export function withView(
  path: string,
  query: Query,
  keep: Record<string, string | undefined> = {},
): string {
  return href(path, {
    ...keep,
    lang: query.lang === "en" ? "en" : undefined,
    cur: query.cur === "local" ? undefined : query.cur,
  })
}
