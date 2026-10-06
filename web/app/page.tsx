import { Suspense } from "react"
import { Live } from "@/components/Live"
import { HomePage } from "@/views/pages"

export default function Page() {
  return (
    <Suspense fallback={<HomePage raw={{}} slug="" />}>
      <Live view="home" />
    </Suspense>
  )
}
