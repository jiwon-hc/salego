import { Suspense } from "react"
import { Live } from "@/components/Live"
import { MethodPage } from "@/views/pages"

export default function Page() {
  return (
    <Suspense fallback={<MethodPage raw={{}} slug="" />}>
      <Live view="method" />
    </Suspense>
  )
}
