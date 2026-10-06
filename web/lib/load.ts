import data from "../data/snapshot.json"
import type { Snapshot } from "./types"

// Bundled at build time so the deployment always carries the data.
// The daily collector commits a new snapshot, and that commit triggers a redeploy.
export function loadSnapshot(): Snapshot | null {
  return data as unknown as Snapshot
}
