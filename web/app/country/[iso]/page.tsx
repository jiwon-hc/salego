import { Suspense } from "react"
import { Live } from "@/components/Live"
import { loadSnapshot } from "@/lib/load"
import { CountryPage } from "@/views/pages"

export function generateStaticParams() {
  return loadSnapshot()?.countries.map((country) => ({ iso: country.iso2 })) ?? []
}

export default async function Page({ params }: { params: Promise<{ iso: string }> }) {
  const { iso } = await params
  return (
    <Suspense fallback={<CountryPage raw={{}} slug={iso} />}>
      <Live view="country" slug={iso} />
    </Suspense>
  )
}
