/**
 * Adds four Kia listings that are still sitting in South Korea.
 *
 *   node scripts/seed-cars-korea-stock.mjs          # dry run
 *   node scripts/seed-cars-korea-stock.mjs --yes    # applies
 *
 * REQUIRES scripts/migrate-car-currency.mjs to have run first — two of these
 * are priced in US dollars and need the `cars.price_currency` column. The
 * script checks and refuses rather than silently listing $29,600 as francs.
 *
 * ADDITIVE and re-runnable: nothing is deleted, and a car whose slug is
 * already there is skipped, so re-running after photos have been uploaded
 * will not reset thumb_image or wipe car_galleries.
 *
 * Location: unlike the rest of the inventory these have not landed in Kigali,
 * so they are filed under a South Korea country row. No city was given, and
 * the card and the listing page both fall back to the country on its own.
 *
 * Prices are as quoted, in the currency quoted — nothing is converted. The two
 * dollar cars carry the USD_MARKUP below; the two franc cars are listed
 * exactly as supplied.
 */

import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8")
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    // .env is optional if the vars are already exported
  }
}

loadEnv()

const CONFIRMED = process.argv.includes("--yes") || process.argv.includes("-y")
const dbPath = resolve(process.env.DATABASE_PATH || "data/keycar.sqlite")

const db = new DatabaseSync(dbPath)
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA busy_timeout = 5000")

const LANG = process.env.DEFAULT_LANG || "en"
const IMG = "/placeholder.svg"
const COUNTRY = "South Korea"
const COUNTRY_CODE = "KR"

/**
 * Margin added to the dollar-quoted cars, on top of the seller's price.
 * The franc-quoted cars are listed as supplied — a dollar markup cannot be
 * applied to them without a conversion rate, and francs were to stay francs.
 */
const USD_MARKUP = 1_000

/* ------------------------------------------------------------------ *
 * The stock. Only the brand was supplied — every one of these is a    *
 * Kia, with no model given, so car_model stays null and the title     *
 * falls back to brand + body + year. Supplying the models later is    *
 * an admin edit, or say the word and this list gets them.             *
 * ------------------------------------------------------------------ */

const INVENTORY = [
  {
    brand: "Kia",
    year: "2019",
    registered: "June 2019",
    mileage: 56877,
    fuel: "Petrol", // quoted as "gasoline"
    seats: "5",
    price: 28_600,
    currency: "USD",
  },
  {
    brand: "Kia",
    year: "2024",
    registered: "October 2023",
    mileage: 49306,
    fuel: "Electric",
    body: "SUV",
    seats: "5",
    price: 3_151,
    currency: "USD",
    note: "2024 model year, first registered October 2023.",
  },
  {
    brand: "Kia",
    year: "2012",
    registered: "June 2012",
    mileage: 200784,
    fuel: "Diesel",
    engine: "2000cc",
    body: "SUV",
    seats: "7",
    drive: "2WD",
    price: 4_700_000,
    currency: "RWF",
  },
  {
    brand: "Kia",
    year: "2012",
    registered: "March 2012",
    mileage: 156430,
    fuel: "Diesel",
    body: "SUV",
    seats: "7",
    drive: "2WD",
    price: 5_500_000,
    currency: "RWF",
  },
]

/* ---- the column these need ----------------------------------------- */

const hasCurrencyColumn = db
  .prepare("PRAGMA table_info(cars)")
  .all()
  .some((c) => c.name === "price_currency")

if (!hasCurrencyColumn) {
  console.error(`Database: ${dbPath}\n`)
  console.error("`cars.price_currency` is missing, and two of these cars are priced in US dollars.")
  console.error("Without it they would be rendered as francs. Run this first:\n")
  console.error("  node scripts/migrate-car-currency.mjs --yes\n")
  db.close()
  process.exit(1)
}

/* ---- helpers ------------------------------------------------------- */

const one = (sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid)
const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** The asking price, markup included where one applies. */
const priceOf = (c) => (c.currency === "USD" ? c.price + USD_MARKUP : c.price)

const money = (c) =>
  c.currency === "USD"
    ? `$${priceOf(c).toLocaleString("en-US")}`
    : `${priceOf(c).toLocaleString("en-US")} RWF`

// With no model supplied, the body type is the only thing separating one Kia
// from the next — and two of these are both 2012 SUVs, so the slug needs a
// suffix the same way lib/db.ts's uniqueSlug does it.
const titleOf = (c) => [c.brand, c.body, c.year].filter(Boolean).join(" ")

const taken = new Set(db.prepare("SELECT slug FROM cars").all().map((r) => r.slug))
function uniqueSlug(base) {
  const root = slugify(base) || "car"
  let slug = root
  let n = 1
  while (taken.has(slug)) slug = `${root}-${++n}`
  taken.add(slug)
  return slug
}

/** A description built only from the facts that were supplied. */
function describe(c, title) {
  const specs = []
  if (c.engine) specs.push(`${c.engine} ${(c.fuel ?? "").toLowerCase()}`.trim())
  else if (c.fuel) specs.push(c.fuel.toLowerCase())
  if (c.drive) specs.push(c.drive)
  if (c.seats) specs.push(`${c.seats} seats`)

  const parts = [`${title}${specs.length ? ` — ${specs.join(", ")}.` : "."}`]
  if (c.note) parts.push(c.note)
  else if (c.registered) parts.push(`First registered ${c.registered}.`)
  if (c.mileage) parts.push(`${c.mileage.toLocaleString("en-US")} km on the clock.`)
  parts.push(`Currently in ${COUNTRY}. Contact us about shipping and clearing into Rwanda.`)
  return parts.join(" ")
}

/* ---- plan ---------------------------------------------------------- */

const existing = new Set(db.prepare("SELECT slug FROM cars").all().map((r) => r.slug))
const planned = INVENTORY.map((c) => {
  const title = titleOf(c)
  return { car: c, title, slug: uniqueSlug(title) }
})
// uniqueSlug already skipped anything taken, so nothing here collides; a
// re-run matches the previously inserted slug and is skipped below instead.
const reRun = planned.filter((p) => existing.has(slugify(p.title)))
const toInsert = planned.filter((p) => !existing.has(slugify(p.title)))

if (!CONFIRMED) {
  console.log(`Database: ${dbPath}`)
  console.log(`Cars already in the table: ${existing.size}\n`)
  console.log(`Would INSERT ${toInsert.length}:`)
  for (const p of toInsert) console.log(`  ${money(p.car).padStart(14)}  ${p.title}  (${p.slug})`)
  if (reRun.length) console.log(`\nWould SKIP ${reRun.length} already present.`)
  console.log(`\nDollar cars include a ${`$${USD_MARKUP.toLocaleString("en-US")}`} markup; franc cars are as quoted.`)
  console.log("\nNothing has changed. Re-run with --yes to apply.")
  db.close()
  process.exit(0)
}

/* ---- supporting rows ----------------------------------------------- */

const ts = new Date().toISOString().slice(0, 19).replace("T", " ")

let countryId = db.prepare("SELECT id FROM countries WHERE code = ?").get(COUNTRY_CODE)?.id
countryId ??= one(
  "INSERT INTO countries (name, code, created_at, updated_at) VALUES (?,?,?,?)",
  COUNTRY,
  COUNTRY_CODE,
  ts,
  ts,
)

/**
 * `cars.city_id` is NOT NULL and no city was given for any of these. A city
 * row named after the country keeps the column satisfied, and both the card
 * and the listing page collapse the duplicate so it reads "South Korea"
 * rather than "South Korea, South Korea".
 */
let cityId = db
  .prepare(
    `SELECT ct.city_id AS id FROM city_translations ct
     JOIN cities ci ON ci.id = ct.city_id
     WHERE ct.name = ? AND ct.lang_code = ? AND ci.country_id = ?`,
  )
  .get(COUNTRY, LANG, countryId)?.id
if (!cityId) {
  cityId = one("INSERT INTO cities (country_id, created_at, updated_at) VALUES (?,?,?)", countryId, ts, ts)
  db.prepare(
    "INSERT INTO city_translations (city_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(cityId, LANG, COUNTRY, ts, ts)
}

/** Finds a brand by name, creating it (enabled) if it isn't there yet. */
function brandId(name) {
  const found = db
    .prepare("SELECT brand_id AS id FROM brand_translations WHERE name = ? AND lang_code = ?")
    .get(name, LANG)?.id
  if (found) {
    db.prepare("UPDATE brands SET status = 'enable' WHERE id = ?").run(found)
    return found
  }
  const id = one(
    "INSERT INTO brands (image, slug, status, created_at, updated_at) VALUES (?,?,'enable',?,?)",
    IMG,
    slugify(name),
    ts,
    ts,
  )
  db.prepare(
    "INSERT INTO brand_translations (brand_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(id, LANG, name, ts, ts)
  return id
}

const agentId = db.prepare("SELECT id FROM users WHERE is_dealer = 1 ORDER BY id LIMIT 1").get()?.id ?? 0

/* ---- insert -------------------------------------------------------- */

const insertCar = db.prepare(
  `INSERT INTO cars (
     agent_id, brand_id, city_id, country_id, thumb_image, slug, features, purpose, "condition",
     total_view, regular_price, offer_price, price_currency, body_type, engine_size, drive,
     interior_color, exterior_color, year, mileage, number_of_owner, seats, fuel_type, transmission,
     seller_type, rent_period, car_model, is_featured, status, approved_by_admin, is_draft,
     created_at, updated_at
   ) VALUES (?,?,?,?,?,?,'[]','sale','used',0,?,NULL,?,?,?,?,NULL,NULL,?,?,NULL,?,?,NULL,
             'dealer',NULL,NULL,'disable','enable','approved','disable',?,?)`,
)

const insertTranslation = db.prepare(
  `INSERT INTO car_translations (car_id, lang_code, title, description, address, seo_title, seo_description, created_at, updated_at)
   VALUES (?,?,?,?,?,?,?,?,?)`,
)

let inserted = 0
toInsert.forEach((p, i) => {
  const c = p.car
  const created = new Date(Date.now() - i * 6e4).toISOString().slice(0, 19).replace("T", " ")

  const carId = Number(
    insertCar.run(
      agentId,
      brandId(c.brand),
      cityId,
      countryId,
      IMG,
      p.slug,
      priceOf(c),
      c.currency,
      c.body ?? null,
      c.engine ?? null,
      c.drive ?? null,
      c.year ?? null,
      String(c.mileage),
      c.seats ?? null,
      c.fuel ?? null,
      created,
      created,
    ).lastInsertRowid,
  )

  const desc = describe(c, p.title)
  insertTranslation.run(carId, LANG, p.title, desc, COUNTRY, p.title, desc, created, created)
  inserted++
})

/* ---- report -------------------------------------------------------- */

console.log(`Database: ${dbPath}`)
console.log(`Inserted ${inserted} cars${reRun.length ? `, skipped ${reRun.length} already present` : ""}:\n`)
for (const p of toInsert) console.log(`  ${money(p.car).padStart(14)}  ${p.title}  (${p.slug})`)
console.log(`\nLocated in ${COUNTRY}. Dollar prices include the $${USD_MARKUP.toLocaleString("en-US")} markup.`)
console.log(`Total cars now: ${db.prepare("SELECT COUNT(*) AS n FROM cars").get().n}`)
console.log("\nAll new listings are published with a placeholder photo.")
console.log("Add the real photos from the admin: /admin/cars -> Edit -> Photos.")

db.close()
