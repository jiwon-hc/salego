import data from "../data/snapshot.json"
import type { Snapshot } from "./types"

// Bundled at build time into the static export.
// The daily workflow commits a new snapshot, then rebuilds and deploys the site.
export function loadSnapshot(): Snapshot | null {
  return data as unknown as Snapshot
}
