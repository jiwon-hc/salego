import { Suspense } from "react"
import { Live } from "@/components/Live"
import { ComparePage } from "@/views/pages"

export default function Page() {
  return (
    <Suspense fallback={<ComparePage raw={{}} slug="" />}>
      <Live view="compare" />
    </Suspense>
  )
}
