"use client"

import { useSearchParams } from "next/navigation"
import { ComparePage, CountryPage, HomePage, MethodPage, PlatformPage, PromosPage } from "@/views/pages"

// The static HTML is the default view; in the browser the real query string takes over.
const VIEWS = {
  home: HomePage,
  compare: ComparePage,
  method: MethodPage,
  promos: PromosPage,
  country: CountryPage,
  platform: PlatformPage,
}

export function Live({ view, slug = "" }: { view: keyof typeof VIEWS; slug?: string }) {
  const raw = Object.fromEntries(useSearchParams().entries())
  const View = VIEWS[view]
  return <View raw={raw} slug={slug} />
}
