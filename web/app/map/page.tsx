import { Suspense } from "react"
import { Live } from "@/components/Live"
import { MapPage } from "@/views/pages"

export default function Page() {
  return (
    <Suspense fallback={<MapPage raw={{}} slug="" />}>
      <Live view="map" />
    </Suspense>
  )
}
