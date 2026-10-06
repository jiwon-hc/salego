import { Suspense } from "react"
import { Live } from "@/components/Live"
import { loadSnapshot } from "@/lib/load"
import { PlatformPage } from "@/views/pages"

export function generateStaticParams() {
  return loadSnapshot()?.platforms.map((platform) => ({ id: platform.id })) ?? []
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<PlatformPage raw={{}} slug={id} />}>
      <Live view="platform" slug={id} />
    </Suspense>
  )
}
