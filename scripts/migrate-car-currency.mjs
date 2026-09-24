/**
 * Adds `cars.price_currency`, so one car can be priced in a currency other
 * than the site default.
 *
 *   node scripts/migrate-car-currency.mjs            # dry run
 *   node scripts/migrate-car-currency.mjs --yes      # applies
 *
 * Until now every price on the site was rendered in the single default row of
 * `multi_currencies` (RWF). Stock imported from Korea is quoted to us in US
 * dollars, and converting it at a rate that moves weekly would misstate the
 * asking price — so the currency is recorded per car instead.
 *
 * NULL means "use the site currency", which is what every existing row gets.
 * Nothing visible changes until a car is given a currency of its own.
 *
 * Safe to run repeatedly: the column is only added when it is absent.
 */

import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function loadEnvFile(name) {
  try {
    const raw = readFileSync(new URL(`../${name}`, import.meta.url), "utf8")
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    // Each file is optional; the vars may already be exported.
  }
}

// Same order Next.js uses: `.env.local` overrides `.env`.
loadEnvFile(".env.local")
loadEnvFile(".env")

const CONFIRMED = process.argv.includes("--yes") || process.argv.includes("-y")
const dbPath = resolve(process.argv.find((a) => a.endsWith(".sqlite")) || process.env.DATABASE_PATH || "data/keycar.sqlite")

const db = new DatabaseSync(dbPath)
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA busy_timeout = 5000")

const columns = db.prepare("PRAGMA table_info(cars)").all().map((c) => c.name)
const present = columns.includes("price_currency")

console.log(`Database: ${dbPath}\n`)
console.log(`  cars.price_currency   ${present ? "already present — nothing to do" : "missing -> will be added"}`)

if (present) {
  const counts = db
    .prepare(
      `SELECT COALESCE(NULLIF(price_currency, ''), '(site default)') AS cur, COUNT(*) AS n
       FROM cars GROUP BY cur ORDER BY n DESC`,
    )
    .all()
  for (const r of counts) console.log(`    ${String(r.n).padStart(3)}  ${r.cur}`)
  db.close()
  process.exit(0)
}

if (!CONFIRMED) {
  console.log("\nNothing has changed. Re-run with --yes to apply.")
  db.close()
  process.exit(0)
}

db.exec("ALTER TABLE cars ADD COLUMN price_currency TEXT")

console.log("\nAdded. Every existing car keeps NULL, so it still shows in the site currency.")
db.close()
