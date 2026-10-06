import { Suspense } from "react"
import { Live } from "@/components/Live"
import { PromosPage } from "@/views/pages"

export default function Page() {
  return (
    <Suspense fallback={<PromosPage raw={{}} slug="" />}>
      <Live view="promos" />
    </Suspense>
  )
}
