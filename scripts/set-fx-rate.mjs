/**
 * Sets the exchange rate the MOBILE API uses to restate a foreign-priced car
 * in Rwandan francs.
 *
 *   node scripts/set-fx-rate.mjs                     # show the rates on file
 *   node scripts/set-fx-rate.mjs USD 1450 --yes      # 1 USD = 1,450 RWF
 *   node scripts/set-fx-rate.mjs USD --delete --yes  # remove it
 *
 * Why this exists: the website shows an imported car at the price it was
 * quoted at, dollars included. The Flutter app cannot — it multiplies every
 * price by one global rate and appends one global symbol — and the app is not
 * being changed. So the mobile API converts, using the rate set here.
 *
 * Until a rate exists, cars priced in that currency are WITHHELD from the app
 * rather than advertised at the wrong number. They stay visible on the
 * website throughout. Run this and they appear in the app on the next
 * request; no rebuild, no restart.
 *
 * The rate is how many francs one unit is worth, so USD 1450 means
 * $1 = 1,450 RWF. Re-run whenever it moves — a stale rate misprices stock.
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

loadEnvFile(".env.local")
loadEnvFile(".env")

const argv = process.argv.slice(2)
const CONFIRMED = argv.includes("--yes") || argv.includes("-y")
const DELETE = argv.includes("--delete")
const positional = argv.filter((a) => !a.startsWith("-"))
const code = positional[0]?.trim().toUpperCase()
const rate = positional[1] === undefined ? undefined : Number(positional[1])

const dbPath = resolve(process.env.DATABASE_PATH || "data/keycar.sqlite")
const db = new DatabaseSync(dbPath)
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA busy_timeout = 5000")

db.exec(`
  CREATE TABLE IF NOT EXISTS fx_rates (
    code         TEXT PRIMARY KEY,
    rwf_per_unit REAL NOT NULL,
    updated_at   TEXT NOT NULL
  )
`)

const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
const hasCurrencyColumn = db
  .prepare("PRAGMA table_info(cars)")
  .all()
  .some((c) => c.name === "price_currency")

/** How many cars each currency affects, so the report says what is at stake. */
function affected(cur) {
  if (!hasCurrencyColumn) return 0
  return db.prepare("SELECT COUNT(*) AS n FROM cars WHERE UPPER(TRIM(price_currency)) = ?").get(cur)?.n ?? 0
}

function report() {
  const rows = db.prepare("SELECT code, rwf_per_unit, updated_at FROM fx_rates ORDER BY code").all()
  console.log(`Database: ${dbPath}\n`)
  if (!rows.length) {
    console.log("  No rates on file.")
  } else {
    console.log("  Rates on file (francs per unit):")
    for (const r of rows) {
      console.log(`    ${r.code}  ${r.rwf_per_unit.toLocaleString("en-US")}   set ${r.updated_at}`)
    }
  }

  if (!hasCurrencyColumn) return
  const pending = db
    .prepare(
      `SELECT UPPER(TRIM(price_currency)) AS cur, COUNT(*) AS n
       FROM cars
       WHERE price_currency IS NOT NULL AND TRIM(price_currency) <> '' AND UPPER(TRIM(price_currency)) <> 'RWF'
         AND UPPER(TRIM(price_currency)) NOT IN (SELECT UPPER(code) FROM fx_rates WHERE rwf_per_unit > 0)
       GROUP BY cur`,
    )
    .all()
  if (pending.length) {
    console.log("\n  Withheld from the mobile app until a rate is set:")
    for (const p of pending) console.log(`    ${p.n} car(s) priced in ${p.cur}`)
  }
}

if (!code) {
  report()
  console.log("\nUsage: node scripts/set-fx-rate.mjs USD 1450 --yes")
  db.close()
  process.exit(0)
}

if (!/^[A-Z]{3}$/.test(code)) {
  console.error(`"${code}" is not a three-letter currency code.`)
  db.close()
  process.exit(1)
}

if (DELETE) {
  console.log(`Database: ${dbPath}\n`)
  console.log(`  Remove the ${code} rate — ${affected(code)} car(s) would then be withheld from the app.`)
  if (!CONFIRMED) {
    console.log("\nNothing has changed. Re-run with --yes to apply.")
  } else {
    db.prepare("DELETE FROM fx_rates WHERE UPPER(code) = ?").run(code)
    console.log("\nRemoved.")
  }
  db.close()
  process.exit(0)
}

if (rate === undefined || !Number.isFinite(rate) || rate <= 0) {
  console.error(`Give a positive rate, e.g. "node scripts/set-fx-rate.mjs ${code} 1450 --yes".`)
  db.close()
  process.exit(1)
}

const before = db.prepare("SELECT rwf_per_unit FROM fx_rates WHERE UPPER(code) = ?").get(code)?.rwf_per_unit
const n = affected(code)

console.log(`Database: ${dbPath}\n`)
console.log(`  1 ${code} = ${rate.toLocaleString("en-US")} RWF`)
console.log(`  was: ${before === undefined ? "(not set)" : `${before.toLocaleString("en-US")} RWF`}`)
console.log(`  affects ${n} car(s) in the mobile app; the website is unchanged.`)
if (n) {
  for (const c of db
    .prepare(
      `SELECT c.slug, c.regular_price FROM cars c WHERE UPPER(TRIM(c.price_currency)) = ? ORDER BY c.id`,
    )
    .all(code)) {
    const converted = Math.round(Number(c.regular_price) * rate)
    console.log(
      `    ${c.slug}: ${Number(c.regular_price).toLocaleString("en-US")} ${code}  ->  ${converted.toLocaleString("en-US")} RWF`,
    )
  }
}

if (!CONFIRMED) {
  console.log("\nNothing has changed. Re-run with --yes to apply.")
  db.close()
  process.exit(0)
}

db.prepare(
  `INSERT INTO fx_rates (code, rwf_per_unit, updated_at) VALUES (?,?,?)
   ON CONFLICT(code) DO UPDATE SET rwf_per_unit = excluded.rwf_per_unit, updated_at = excluded.updated_at`,
).run(code, rate, ts)

console.log("\nSaved. The app picks it up on the next request — no rebuild needed.")
db.close()
