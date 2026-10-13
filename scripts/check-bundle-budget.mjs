// Checks the JavaScript budgets in docs/discovery/non-functional-requirements.md
// against a production build (#25). Run with `npm run check:bundle`, which
// builds with a manifest into build/budget first, so the manifest never ships.
//
//   P4: the app shell, everything loaded before any page or chart code
//   P5: the dashboard route in full, with its page and chart code
//
// Sizes are gzipped, as the browser downloads them from nginx.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const OUT_DIR = process.argv[2] ?? 'build/budget'
const DASHBOARD_PAGE = 'src/app/pages/OverviewPage.tsx'
const BUDGETS = { shell: 120, dashboard: 250 }

const manifest = JSON.parse(readFileSync(join(OUT_DIR, '.vite/manifest.json'), 'utf8'))
const gzippedKb = (file) => gzipSync(readFileSync(join(OUT_DIR, file)), { level: 9 }).length / 1024

/** A chunk and everything it imports statically. */
function staticClosure(key, files = new Set()) {
  const chunk = manifest[key]
  if (!chunk || files.has(chunk.file)) return files
  files.add(chunk.file)
  for (const imported of chunk.imports ?? []) staticClosure(imported, files)
  return files
}

/** A chunk with everything it loads, statically or on demand (lazy charts). */
function fullClosure(key, files = new Set(), seen = new Set()) {
  if (seen.has(key) || !manifest[key]) return files
  seen.add(key)
  staticClosure(key, files)
  for (const imported of manifest[key].imports ?? []) fullClosure(imported, files, seen)
  for (const lazy of manifest[key].dynamicImports ?? []) fullClosure(lazy, files, seen)
  return files
}

const total = (files) =>
  [...files].filter((f) => f.endsWith('.js')).reduce((kb, f) => kb + gzippedKb(f), 0)

const entry = Object.keys(manifest).find((key) => manifest[key].isEntry)
if (!entry || !manifest[DASHBOARD_PAGE]) {
  console.error(`Could not find the entry or ${DASHBOARD_PAGE} in the manifest`)
  process.exit(1)
}
const shell = staticClosure(entry)
const dashboard = fullClosure(DASHBOARD_PAGE, new Set(shell))

const results = [
  ['P4 app shell', total(shell), BUDGETS.shell],
  ['P5 dashboard with charts', total(dashboard), BUDGETS.dashboard],
]
let over = false
for (const [name, kb, budget] of results) {
  const ok = kb <= budget
  over ||= !ok
  console.log(`${ok ? 'ok  ' : 'OVER'}  ${name}: ${kb.toFixed(1)} KB of ${budget} KB gzipped`)
}
process.exit(over ? 1 : 0)
