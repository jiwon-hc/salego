import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI 구독 가격 지도",
  description: "국가별 AI 구독 표시 가격과 프로모션 상태",
}

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
