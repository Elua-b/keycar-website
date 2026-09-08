/**
 * Replaces the entire car inventory with the real Keycar stock list.
 *
 *   node scripts/seed-cars.mjs --yes
 *
 * DESTRUCTIVE: every row in cars, car_translations, car_galleries, reviews and
 * wishlists is deleted first, then the list below is inserted. Without --yes it
 * only reports what it would remove.
 *
 * Customer messages in car_inquiries are deliberately NOT touched — those are
 * real leads. Several slugs are recreated identically, so their links still work.
 *
 * Prices are Rwandan francs, matching the RWF default in multi_currencies.
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
const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
const IMG = "/placeholder.svg"
const CITY = "Kigali"

/* ------------------------------------------------------------------ *
 * The inventory. Every value here came from the supplied stock list; *
 * anything that was not stated is left null rather than invented.    *
 * ------------------------------------------------------------------ */

const INVENTORY = [
  {
    brand: "Kia", model: "Sorento", year: "2013", price: 18_500_000,
    seats: "7", body: "SUV", fuel: null, engine: null, colour: null,
    negotiable: true,
  },
  {
    brand: "Kia", model: "Sorento", year: "2015", price: 25_000_000,
    seats: "7", body: "SUV", fuel: null, engine: null, colour: null,
    negotiable: true,
  },
  {
    brand: "Kia", model: "Morning", year: "2013", price: 11_000_000,
    seats: null, body: "Hatchback", fuel: "Petrol", engine: "1000cc", colour: "Black",
    note: "In fully working condition.",
  },
  {
    brand: "Chevrolet", model: "Captiva", year: "2014", price: 17_000_000,
    seats: "7", body: "SUV", fuel: "Diesel", engine: null, colour: null,
  },
  {
    brand: "Kia", model: "Sorento", year: "2010", price: 13_500_000,
    seats: "7", body: "SUV", fuel: "Diesel", engine: null, colour: null,
  },
  {
    brand: "Kia", model: "Niro", year: "2017", price: 20_000_000,
    seats: "5", body: "SUV", fuel: null, engine: null, colour: "Blue",
  },
  {
    brand: "Kia", model: "Sorento", year: "2011", price: 14_800_000,
    seats: null, body: "SUV", fuel: null, engine: null, colour: null,
  },
  {
    // The list gave the make and year only — no model was specified.
    brand: "Jeep", model: null, year: "2012", price: 50_000_000,
    seats: "5", body: "SUV", fuel: null, engine: null, colour: null,
  },
  {
    // "Ionic" in the list — read as the Hyundai Ioniq.
    brand: "Hyundai", model: "Ioniq", year: "2021", price: 23_000_000,
    seats: "5", body: "Hatchback", fuel: "Electric", engine: null, colour: null,
    note: "Fully electric.",
  },
  {
    // "Benz" in the list — no model was specified.
    brand: "Mercedes-Benz", model: null, year: "2020", price: 45_000_000,
    seats: "5", body: "Sedan", fuel: "Electric", engine: null, colour: null,
    note: "Fully electric.",
  },
]

/* ---- what is about to go ------------------------------------------- */

const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n
const before = {
  cars: count("cars"),
  car_translations: count("car_translations"),
  car_galleries: count("car_galleries"),
  reviews: count("reviews"),
  wishlists: count("wishlists"),
}

if (!CONFIRMED) {
  console.log(`Database: ${dbPath}\n`)
  console.log("This would DELETE:")
  for (const [t, n] of Object.entries(before)) console.log(`  ${n.toString().padStart(4)}  ${t}`)
  console.log(`\nand insert ${INVENTORY.length} cars.`)
  console.log("\nNothing has changed. Re-run with --yes to apply.")
  db.close()
  process.exit(0)
}

/* ---- wipe ---------------------------------------------------------- */

db.exec(`
  DELETE FROM wishlists;
  DELETE FROM reviews;
  DELETE FROM car_galleries;
  DELETE FROM car_translations;
  DELETE FROM cars;
  DELETE FROM sqlite_sequence
    WHERE name IN ('cars','car_translations','car_galleries','reviews','wishlists');
`)

/* ---- supporting rows ----------------------------------------------- */

const one = (sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid)

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

/** Finds a brand by name, creating it (enabled) if it isn't there yet. */
function brandId(name) {
  const found = db
    .prepare("SELECT brand_id AS id FROM brand_translations WHERE name = ? AND lang_code = ?")
    .get(name, LANG)?.id
  if (found) {
    db.prepare("UPDATE brands SET status = 'enable' WHERE id = ?").run(found)
    return found
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  const id = one(
    "INSERT INTO brands (image, slug, status, created_at, updated_at) VALUES (?,?,'enable',?,?)",
    IMG,
    slug,
    ts,
    ts,
  )
  db.prepare(
    "INSERT INTO brand_translations (brand_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(id, LANG, name, ts, ts)
  return id
}

// Attach the stock to an existing dealer account if one exists.
const agentId = db.prepare("SELECT id FROM users WHERE is_dealer = 1 ORDER BY id LIMIT 1").get()?.id ?? 0

/* ---- insert -------------------------------------------------------- */

const insertCar = db.prepare(
  `INSERT INTO cars (
     agent_id, brand_id, city_id, country_id, thumb_image, slug, features, purpose, "condition",
     total_view, regular_price, offer_price, body_type, engine_size, drive,
     interior_color, exterior_color, year, mileage, number_of_owner, seats, fuel_type, transmission,
     seller_type, rent_period, car_model, is_featured, status, approved_by_admin, is_draft,
     created_at, updated_at
   ) VALUES (?,?,?,?,?,?,'[]','sale','used',0,?,NULL,?,?,NULL,NULL,?,?,NULL,NULL,?,?,NULL,
             'dealer',NULL,?,'disable','enable','approved','disable',?,?)`,
)

const insertTranslation = db.prepare(
  `INSERT INTO car_translations (car_id, lang_code, title, description, address, seo_title, seo_description, created_at, updated_at)
   VALUES (?,?,?,?,?,?,?,?,?)`,
)

/** A description built only from the facts that were supplied. */
function describe(c, title) {
  const facts = []
  if (c.seats) facts.push(`${c.seats} seats`)
  if (c.fuel) facts.push(`${c.fuel.toLowerCase()} engine`)
  if (c.engine) facts.push(`${c.engine} capacity`)
  if (c.colour) facts.push(`${c.colour.toLowerCase()} exterior`)

  const parts = [`${title}${facts.length ? ` — ${facts.join(", ")}.` : "."}`]
  if (c.note) parts.push(c.note)
  if (c.negotiable) parts.push("Price is negotiable.")
  parts.push(`Available in ${CITY}. Contact us to arrange a viewing.`)
  return parts.join(" ")
}

let inserted = 0
INVENTORY.forEach((c, i) => {
  const title = [c.brand, c.model, c.year].filter(Boolean).join(" ")
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

  // Stagger created_at so "newest first" has a stable order (list order kept).
  const created = new Date(Date.now() - i * 36e5).toISOString().slice(0, 19).replace("T", " ")

  const carId = Number(
    insertCar.run(
      agentId,
      brandId(c.brand),
      cityId,
      countryId,
      IMG,
      slug,
      c.price,
      c.body,
      c.engine,
      c.colour,
      c.year,
      c.seats,
      c.fuel,
      c.model,
      created,
      created,
    ).lastInsertRowid,
  )

  const desc = describe(c, title)
  insertTranslation.run(carId, LANG, title, desc, `${CITY}, Rwanda`, title, desc, created, created)
  inserted++
})

/* ---- report -------------------------------------------------------- */

const price = (n) => `${n.toLocaleString("en-US")} RWF`

console.log(`Database: ${dbPath}`)
console.log(`Removed ${before.cars} old cars (and their translations, galleries, reviews, wishlists).`)
console.log(`Inserted ${inserted} cars:\n`)
for (const row of db
  .prepare(
    `SELECT t.title, c.year, c.seats, c.fuel_type, c.regular_price
     FROM cars c JOIN car_translations t ON t.car_id = c.id
     ORDER BY c.regular_price DESC`,
  )
  .all()) {
  const extras = [row.seats && `${row.seats} seats`, row.fuel_type].filter(Boolean).join(", ")
  console.log(`  ${price(row.regular_price).padStart(18)}  ${row.title}${extras ? `  (${extras})` : ""}`)
}
console.log("\nAll listings are published with a placeholder photo.")
console.log("Add real photos from the admin: /admin/cars -> Edit -> Photos.")

db.close()
