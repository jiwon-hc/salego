// One-off: world shapefile -> projected SVG paths in data/world.json.
// Run when the boundaries or the projection change:
//   node scripts/build-map.mjs path/to/ne_50m_admin_0_countries.shp
// Source: Natural Earth 1:50m Admin 0 Countries (public domain),
// https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip
import { execSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const shp = process.argv[2]
if (!shp) throw new Error("usage: node scripts/build-map.mjs <countries.shp>")

const dir = mkdtempSync(join(tmpdir(), "world-"))
const svgPath = join(dir, "world.svg")
// Antarctica has no storefront and eats a fifth of the frame.
// Equal Earth keeps areas honest; 6% simplification keeps the file small while
// small states (Singapore, Bahrain, Malta) stay visible.
execSync(
  [
    "npx -y mapshaper@0.6",
    `"${shp}"`,
    `-filter "ISO_A2_EH != 'AQ'"`,
    "-proj +proj=eqearth",
    "-simplify 6% keep-shapes",
    `-o "${svgPath}" format=svg id-field=ISO_A2_EH width=1000 precision=0.1`,
  ].join(" "),
  { stdio: "inherit" },
)

const svg = readFileSync(svgPath, "utf8")
const viewBox = svg.match(/viewBox="([^"]+)"/)[1]
const shapes = [...svg.matchAll(/<path d="([^"]+)"[^>]*? id="([^"]*)"/g)].map(([, d, id]) => ({
  // Natural Earth marks disputed areas with -99; they draw as land with no country.
  iso: /^[A-Z]{2}$/.test(id) ? id : "",
  d,
}))
writeFileSync(new URL("../data/world.json", import.meta.url), JSON.stringify({ viewBox, shapes }))
console.log(`${shapes.length} shapes, viewBox ${viewBox}`)
