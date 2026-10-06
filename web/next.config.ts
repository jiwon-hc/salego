import type { NextConfig } from "next"

// Static export for GitHub Pages. The project site lives under /<repo>, set in CI.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
}

export default nextConfig
