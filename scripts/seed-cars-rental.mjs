/**
 * Adds the rental fleet (plus one car for sale) to the inventory.
 *
 *   node scripts/seed-cars-rental.mjs          # dry run — reports, changes nothing
 *   node scripts/seed-cars-rental.mjs --yes    # applies
 *
 * ADDITIVE and re-runnable, like seed-cars-korea.mjs: nothing is deleted, and a
 * car whose slug is already there is skipped, so re-running after photos have
 * been uploaded will not reset thumb_image or wipe car_galleries.
 *
 * Prices are Rwandan francs. For a rental, regular_price is the DAILY RATE and
 * rent_period says so — the card and the listing page render "/day" off that
 * field, so a rental without it shows a bare number and reads like a sale price.
 *
 * On the `purpose` column: the admin form submits "Rent" capitalised, and the
 * footer's "Cars for rent" link is hardcoded to ?purpose=Rent, while every car
 * already in the table is lowercase 'sale'. `lib/db.ts` filters with `=` on a
 * plain varchar, so the comparison is case-sensitive and the two cannot be
 * mixed. Rentals therefore go in as 'Rent' (matching the form and that link)
 * and the one sale car as 'sale' (matching the existing rows, so the filter
 * does not sprout a second Sale chip). Worth normalising properly later.
 *
 * Anything the source did not state is left null rather than invented — that is
 * why most of these have no year, mileage, body type or transmission.
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
const CITY = "Kigali"

/* ------------------------------------------------------------------ *
 * The fleet. body/fuel/transmission/drive use the admin form's        *
 * vocabulary (components/admin/car-form.tsx) so these group with the  *
 * rest of the inventory in the listing filters.                       *
 * ------------------------------------------------------------------ */

const INVENTORY = [
  /* --- for rent, all quoted per day -------------------------------- */

  {
    brand: "Neta",
    model: "X",
    rent: 170_000,
    fuel: "Electric",
    note:
      "Fully electric. Neta (sold as Nezha in some markets) is the EV brand of " +
      "Chinese manufacturer Hozon Auto. Quoted as a full-day hire.",
  },
  {
    brand: "Toyota",
    model: "Land Cruiser 200 Series",
    rent: 250_000,
    note: "Facelifted 200 Series, the 2015–2021 build.",
  },
  {
    brand: "Hyundai",
    model: "Grand Starex Limousine",
    rent: 200_000,
    note:
      "Limousine trim with the high-roof extension. Sold as the H1 or iMax in " +
      "other markets.",
  },
  {
    brand: "Toyota",
    model: "Land Cruiser Prado 150 Series",
    rent: 250_000,
    note: "Facelifted 150 Series Prado, the 2017–2023 build.",
  },
  {
    brand: "Toyota",
    model: "Land Cruiser Prado 250 Series",
    rent: 300_000,
    note:
      "The 250 Series, sold simply as the Land Cruiser 250 in some markets, with " +
      "the retro rectangular headlights. A popular choice for weddings.",
  },
  {
    brand: "Ford",
    model: "Explorer",
    rent: 100_000,
    seats: "5",
    fuel: "Petrol",
    note: "Sixth-generation Explorer, 2020 onwards.",
  },

  /* --- for sale ----------------------------------------------------- */

  {
    brand: "Hyundai",
    model: "Palisade",
    trim: "Le Blanc",
    year: "2024",
    price: 40_846_200, // 38,000,000 KRW at the 1.0749 rate used for the Korea stock
    krw: 38_000_000,
    fuel: "Petrol",
    engine: "3800cc",
    drive: "4WD",
    mileage: 28506,
    // No note: engine_size and drive already say everything that was supplied.
  },
]

/* ---- helpers ------------------------------------------------------- */

const one = (sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid)
const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const titleOf = (c) => [c.brand, c.model, c.trim, c.year].filter(Boolean).join(" ")
const isRental = (c) => c.rent != null
const priceOf = (c) => (isRental(c) ? c.rent : c.price)
const money = (n) => `${n.toLocaleString("en-US")} RWF`

/** A description built only from the facts that were supplied. */
function describe(c, title) {
  const specs = []
  if (c.engine) specs.push(`${c.engine} ${(c.fuel ?? "").toLowerCase()}`.trim())
  else if (c.fuel) specs.push(c.fuel.toLowerCase())
  if (c.transmission) specs.push(c.transmission.toLowerCase())
  if (c.drive) specs.push(c.drive)
  if (c.seats) specs.push(`${c.seats} seats`)
  if (c.colour) specs.push(`${c.colour.toLowerCase()} exterior`)

  const parts = [`${title}${specs.length ? ` — ${specs.join(", ")}.` : "."}`]
  if (c.note) parts.push(c.note)
  if (c.mileage) parts.push(`${c.mileage.toLocaleString("en-US")} km on the clock.`)

  if (isRental(c)) {
    parts.push(`Available to rent in ${CITY} at ${money(c.rent)} per day.`)
    parts.push("Contact us to check availability and book.")
  } else {
    parts.push(`Available in ${CITY} — contact us to arrange a viewing.`)
  }
  return parts.join(" ")
}

/* ---- dry run ------------------------------------------------------- */

const existingSlugs = new Set(db.prepare("SELECT slug FROM cars").all().map((r) => r.slug))
const planned = INVENTORY.map((c) => {
  const title = titleOf(c)
  return { car: c, title, slug: slugify(title) }
})

const toInsert = planned.filter((p) => !existingSlugs.has(p.slug))
const skipped = planned.filter((p) => existingSlugs.has(p.slug))

const line = (p) =>
  `  ${money(priceOf(p.car)).padStart(18)}${isRental(p.car) ? " /day  " : "       "}${p.title}`

if (!CONFIRMED) {
  console.log(`Database: ${dbPath}`)
  console.log(`Cars already in the table: ${existingSlugs.size}\n`)
  console.log(`Would INSERT ${toInsert.length}:`)
  for (const p of toInsert) console.log(line(p))
  if (skipped.length) {
    console.log(`\nWould SKIP ${skipped.length} (slug already present):`)
    for (const p of skipped) console.log(`  ${p.slug}`)
  }
  console.log("\nNothing has changed. Re-run with --yes to apply.")
  db.close()
  process.exit(0)
}

/* ---- supporting rows ----------------------------------------------- */

const ts = new Date().toISOString().slice(0, 19).replace("T", " ")

let countryId = db.prepare("SELECT id FROM countries WHERE code = 'RW'").get()?.id
countryId ??= one("INSERT INTO countries (name, code, created_at, updated_at) VALUES (?,?,?,?)", "Rwanda", "RW", ts, ts)

let cityId = db
  .prepare("SELECT city_id AS id FROM city_translations WHERE name = ? AND lang_code = ?")
  .get(CITY, LANG)?.id
if (!cityId) {
  cityId = one("INSERT INTO cities (country_id, created_at, updated_at) VALUES (?,?,?)", countryId, ts, ts)
  db.prepare(
    "INSERT INTO city_translations (city_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(cityId, LANG, CITY, ts, ts)
}

const newBrands = []

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
  newBrands.push(name)
  return id
}

// Attach the fleet to the dealer account, matching the rest of the inventory.
const agentId = db.prepare("SELECT id FROM users WHERE is_dealer = 1 ORDER BY id LIMIT 1").get()?.id ?? 0

/* ---- insert -------------------------------------------------------- */

const insertCar = db.prepare(
  `INSERT INTO cars (
     agent_id, brand_id, city_id, country_id, thumb_image, slug, features, purpose, "condition",
     total_view, regular_price, offer_price, body_type, engine_size, drive,
     interior_color, exterior_color, year, mileage, number_of_owner, seats, fuel_type, transmission,
     seller_type, rent_period, car_model, is_featured, status, approved_by_admin, is_draft,
     created_at, updated_at
   ) VALUES (?,?,?,?,?,?,?,?,'used',0,?,NULL,?,?,?,NULL,?,?,?,NULL,?,?,?,
             'dealer',?,?,'disable','enable','approved','disable',?,?)`,
)

const insertTranslation = db.prepare(
  `INSERT INTO car_translations (car_id, lang_code, title, description, address, seo_title, seo_description, created_at, updated_at)
   VALUES (?,?,?,?,?,?,?,?,?)`,
)

let inserted = 0
toInsert.forEach((p, i) => {
  const c = p.car
  const rental = isRental(c)

  // Stagger created_at so "newest first" keeps the order of this list, and so
  // these land above the existing stock.
  const created = new Date(Date.now() - i * 6e4).toISOString().slice(0, 19).replace("T", " ")

  const carId = Number(
    insertCar.run(
      agentId,
      brandId(c.brand),
      cityId,
      countryId,
      IMG,
      p.slug,
      JSON.stringify(c.features ?? []),
      rental ? "Rent" : "sale",
      priceOf(c),
      c.body ?? null,
      c.engine ?? null,
      c.drive ?? null,
      c.colour ?? null,
      c.year ?? null,
      c.mileage != null ? String(c.mileage) : null,
      c.seats ?? null,
      c.fuel ?? null,
      c.transmission ?? null,
      rental ? "day" : null,
      [c.model, c.trim].filter(Boolean).join(" "),
      created,
      created,
    ).lastInsertRowid,
  )

  const desc = describe(c, p.title)
  insertTranslation.run(carId, LANG, p.title, desc, `${CITY}, Rwanda`, p.title, desc, created, created)
  inserted++
})

/* ---- report -------------------------------------------------------- */

console.log(`Database: ${dbPath}`)
console.log(`Inserted ${inserted} cars${skipped.length ? `, skipped ${skipped.length} already present` : ""}:\n`)
for (const p of toInsert) console.log(line(p))
if (skipped.length) {
  console.log("\nSkipped (slug already in the table):")
  for (const p of skipped) console.log(`  ${p.slug}`)
}
if (newBrands.length) console.log(`\nNew brands created: ${[...new Set(newBrands)].join(", ")}`)

const counts = db.prepare("SELECT purpose, COUNT(*) AS n FROM cars GROUP BY purpose ORDER BY purpose").all()
console.log(`\nTotal cars now: ${db.prepare("SELECT COUNT(*) AS n FROM cars").get().n}`)
for (const r of counts) console.log(`  ${String(r.n).padStart(3)}  purpose = '${r.purpose}'`)

console.log("\nAll new listings are published with a placeholder photo.")
console.log("Add the real photos from the admin: /admin/cars -> Edit -> Photos.")

db.close()
