/**
 * September 2026 batch: three rentals in Kigali and ten cars for sale in Korea.
 *
 *   node scripts/seed-cars-2026-09.mjs          # dry run
 *   node scripts/seed-cars-2026-09.mjs --yes    # applies
 *
 * REQUIRES scripts/migrate-car-currency.mjs to have run — the ten sale cars
 * are priced in US dollars and need `cars.price_currency`. The script checks
 * and refuses rather than listing $24,077 as francs.
 *
 * ADDITIVE and re-runnable: nothing is deleted, and a car whose slug is
 * already there is skipped, so re-running after photos have been uploaded
 * will not reset thumb_image or wipe car_galleries.
 *
 * Two things to know about the prices:
 *
 *   - The rentals are francs per day. The rates were given as "50", "60" and
 *     "100", meaning thousands.
 *   - The sale prices carry USD_MARKUP on top of the quoted figure, the same
 *     rule as the previous dollar batch.
 *
 * And one about the dollar cars: until a USD rate is set with
 * scripts/set-fx-rate.mjs they are withheld from the MOBILE app, because the
 * Flutter client appends the franc symbol to whatever number it is handed.
 * They show on the website from the moment this runs.
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

/** Margin added to every dollar-quoted car, on top of the seller's price. */
const USD_MARKUP = 1_000

/** Where a car physically is. Rentals are here; the sale stock has not shipped yet. */
const KIGALI = { city: "Kigali", country: "Rwanda", code: "RW" }
const KOREA = { city: "South Korea", country: "South Korea", code: "KR" }

/* ------------------------------------------------------------------ *
 * body/fuel/transmission/drive use the admin form's vocabulary        *
 * (components/admin/car-form.tsx) so these group with the rest of the *
 * inventory in the listing filters. "Gasoline" becomes Petrol.        *
 * ------------------------------------------------------------------ */

const INVENTORY = [
  /* ---- for rent, in Kigali, francs per day ------------------------- */

  {
    brand: "Kia",
    model: "Sorento",
    trim: "Limited",
    rent: 50_000,
    where: KIGALI,
    note:
      "First-generation Sorento, facelifted — the 2007–2009 build. " +
      "60,000 RWF per day for trips outside Kigali.",
  },
  {
    brand: "Neta",
    model: "X",
    // A second Neta X listing: the one already live is the chauffeured rate.
    // The titles have to differ or buyers cannot tell them apart in a list.
    titleSuffix: "Self-Drive",
    rent: 100_000,
    fuel: "Electric",
    where: KIGALI,
    note: "Fully electric, handed over with a full battery. Self-drive rate.",
  },
  {
    brand: "Kia",
    model: "Optima Hybrid",
    year: "2014",
    rent: 50_000,
    fuel: "Hybrid",
    where: KIGALI,
    note: "TF-generation Optima Hybrid, sold in Korea as the K5.",
  },

  /* ---- for sale, in South Korea, US dollars ------------------------ */

  {
    brand: "BMW",
    model: "5 Series G30",
    trim: "520i M Sport",
    year: "2022",
    mileage: 129146,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "1998cc",
    price: 23_077,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "BMW",
    model: "5 Series G30",
    trim: "520i M Sport",
    year: "2020",
    mileage: 56144,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "1998cc",
    price: 24_322,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "BMW",
    model: "5 Series G30",
    trim: "M550i xDrive",
    year: "2021",
    mileage: 76235,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "4395cc",
    drive: "AWD",
    price: 37_289,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "Hyundai",
    model: "Santa Fe TM",
    trim: "2.0 Diesel 2WD Premium",
    year: "2020",
    mileage: 87291,
    fuel: "Diesel",
    transmission: "Automatic",
    engine: "1995cc",
    drive: "2WD",
    price: 11_209,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "Hyundai",
    model: "Santa Fe TM",
    trim: "2.0T 2WD Premium",
    year: "2019",
    mileage: 63045,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "1998cc",
    drive: "2WD",
    price: 13_773,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "Renault Korea",
    model: "New QM6",
    trim: "2.0 GDe 2WD LE",
    year: "2022",
    mileage: 127314,
    fuel: "LPG",
    transmission: "Automatic",
    engine: "1998cc",
    drive: "2WD",
    price: 9_150,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "Audi",
    model: "New A4",
    trim: "2.0 TDI Dynamic",
    year: "2014",
    mileage: 114296,
    fuel: "Diesel",
    transmission: "CVT",
    engine: "1968cc",
    price: 344,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "Genesis",
    model: "G80",
    trim: "3.3 GDI Prestige",
    year: "2018",
    mileage: 146015,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "3342cc",
    price: 17_070,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "Genesis",
    model: "G80 RG3",
    trim: "3.5 T-GDi AWD",
    year: "2025",
    mileage: 30445,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "3470cc",
    drive: "AWD",
    price: 39_194,
    currency: "USD",
    where: KOREA,
  },
  {
    brand: "Genesis",
    model: "G80 RG3",
    trim: "2.5 T-GDi AWD",
    year: "2022",
    mileage: 37853,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "2497cc",
    drive: "AWD",
    price: 32_454,
    currency: "USD",
    where: KOREA,
  },
]

/* ---- the column the dollar cars need -------------------------------- */

const hasCurrencyColumn = db
  .prepare("PRAGMA table_info(cars)")
  .all()
  .some((c) => c.name === "price_currency")

if (!hasCurrencyColumn) {
  console.error(`Database: ${dbPath}\n`)
  console.error("`cars.price_currency` is missing, and ten of these cars are priced in US dollars.")
  console.error("Without it they would be rendered as francs. Run this first:\n")
  console.error("  node scripts/migrate-car-currency.mjs --yes\n")
  db.close()
  process.exit(1)
}

/* ---- helpers -------------------------------------------------------- */

const one = (sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid)
const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const isRental = (c) => c.rent != null
const currencyOf = (c) => (isRental(c) ? "RWF" : c.currency)
/** The asking price: the daily rate for a rental, the quoted price plus margin for a sale. */
const priceOf = (c) => (isRental(c) ? c.rent : c.price + USD_MARKUP)

const money = (c) =>
  currencyOf(c) === "USD"
    ? `$${priceOf(c).toLocaleString("en-US")}`
    : `${priceOf(c).toLocaleString("en-US")} RWF`

const titleOf = (c) => [c.brand, c.model, c.trim, c.year, c.titleSuffix].filter(Boolean).join(" ")

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
  // LPG and CNG are acronyms; lowercasing them reads as a typo.
  const fuelWord = (f) => (f && f === f.toUpperCase() ? f : (f ?? "").toLowerCase())

  const specs = []
  if (c.engine) specs.push(`${c.engine} ${fuelWord(c.fuel)}`.trim())
  else if (c.fuel) specs.push(fuelWord(c.fuel))
  if (c.transmission) specs.push(c.transmission.toLowerCase())
  if (c.drive) specs.push(c.drive)
  if (c.seats) specs.push(`${c.seats} seats`)

  const parts = [`${title}${specs.length ? ` — ${specs.join(", ")}.` : "."}`]
  if (c.note) parts.push(c.note)
  if (c.mileage) parts.push(`${c.mileage.toLocaleString("en-US")} km on the clock.`)

  if (isRental(c)) {
    parts.push(`Available to rent in ${c.where.city} at ${money(c)} per day.`)
    parts.push("Contact us to check availability and book.")
  } else if (c.where.code === "KR") {
    parts.push(`Currently in ${c.where.country}. Contact us about shipping and clearing into Rwanda.`)
  } else {
    parts.push(`Available in ${c.where.city} — contact us to arrange a viewing.`)
  }
  return parts.join(" ")
}

/* ---- plan ----------------------------------------------------------- */

const existing = new Set(db.prepare("SELECT slug FROM cars").all().map((r) => r.slug))
const planned = INVENTORY.map((c) => {
  const title = titleOf(c)
  return { car: c, title, slug: uniqueSlug(title), base: slugify(title) }
})
const toInsert = planned.filter((p) => !existing.has(p.base))
const skipped = planned.filter((p) => existing.has(p.base))

const line = (p) =>
  `  ${money(p.car).padStart(14)}${isRental(p.car) ? " /day  " : "       "}${p.title}`

if (!CONFIRMED) {
  console.log(`Database: ${dbPath}`)
  console.log(`Cars already in the table: ${existing.size}\n`)
  console.log(`Would INSERT ${toInsert.length}:`)
  for (const p of toInsert) console.log(line(p))
  if (skipped.length) {
    console.log(`\nWould SKIP ${skipped.length} (slug already present):`)
    for (const p of skipped) console.log(`  ${p.base}`)
  }
  console.log(`\nSale prices include the $${USD_MARKUP.toLocaleString("en-US")} markup; rental rates are as given.`)
  console.log("\nNothing has changed. Re-run with --yes to apply.")
  db.close()
  process.exit(0)
}

/* ---- supporting rows ------------------------------------------------ */

const ts = new Date().toISOString().slice(0, 19).replace("T", " ")

/** Country + city for a location, created on first use. */
const placeCache = new Map()
function placeIds(where) {
  const hit = placeCache.get(where.code)
  if (hit) return hit

  let countryId = db.prepare("SELECT id FROM countries WHERE code = ?").get(where.code)?.id
  countryId ??= one(
    "INSERT INTO countries (name, code, created_at, updated_at) VALUES (?,?,?,?)",
    where.country,
    where.code,
    ts,
    ts,
  )

  let cityId = db
    .prepare(
      `SELECT ct.city_id AS id FROM city_translations ct
       JOIN cities ci ON ci.id = ct.city_id
       WHERE ct.name = ? AND ct.lang_code = ? AND ci.country_id = ?`,
    )
    .get(where.city, LANG, countryId)?.id
  if (!cityId) {
    cityId = one("INSERT INTO cities (country_id, created_at, updated_at) VALUES (?,?,?)", countryId, ts, ts)
    db.prepare(
      "INSERT INTO city_translations (city_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
    ).run(cityId, LANG, where.city, ts, ts)
  }

  const ids = { countryId, cityId }
  placeCache.set(where.code, ids)
  return ids
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

const agentId = db.prepare("SELECT id FROM users WHERE is_dealer = 1 ORDER BY id LIMIT 1").get()?.id ?? 0

/* ---- insert --------------------------------------------------------- */

const insertCar = db.prepare(
  `INSERT INTO cars (
     agent_id, brand_id, city_id, country_id, thumb_image, slug, features, purpose, "condition",
     total_view, regular_price, offer_price, price_currency, body_type, engine_size, drive,
     interior_color, exterior_color, year, mileage, number_of_owner, seats, fuel_type, transmission,
     seller_type, rent_period, car_model, is_featured, status, approved_by_admin, is_draft,
     created_at, updated_at
   ) VALUES (?,?,?,?,?,?,'[]',?,'used',0,?,NULL,?,?,?,?,NULL,NULL,?,?,NULL,?,?,?,
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
  const { countryId, cityId } = placeIds(c.where)
  const created = new Date(Date.now() - i * 6e4).toISOString().slice(0, 19).replace("T", " ")

  const carId = Number(
    insertCar.run(
      agentId,
      brandId(c.brand),
      cityId,
      countryId,
      IMG,
      p.slug,
      // 'Rent' matches the admin form and the footer's "Cars for rent" link;
      // 'sale' matches every sale row already in the table. See seed-cars-rental.mjs.
      rental ? "Rent" : "sale",
      priceOf(c),
      currencyOf(c),
      c.body ?? null,
      c.engine ?? null,
      c.drive ?? null,
      c.year ?? null,
      c.mileage != null ? String(c.mileage) : null,
      c.seats ?? null,
      c.fuel ?? null,
      c.transmission ?? null,
      rental ? "day" : null,
      [c.model, c.trim].filter(Boolean).join(" ") || null,
      created,
      created,
    ).lastInsertRowid,
  )

  const desc = describe(c, p.title)
  const address = c.where.code === "KR" ? c.where.country : `${c.where.city}, ${c.where.country}`
  insertTranslation.run(carId, LANG, p.title, desc, address, p.title, desc, created, created)
  inserted++
})

/* ---- report --------------------------------------------------------- */

console.log(`Database: ${dbPath}`)
console.log(`Inserted ${inserted} cars${skipped.length ? `, skipped ${skipped.length} already present` : ""}:\n`)
for (const p of toInsert) console.log(line(p))
if (skipped.length) {
  console.log("\nSkipped (slug already in the table):")
  for (const p of skipped) console.log(`  ${p.base}`)
}
if (newBrands.length) console.log(`\nNew brands created: ${[...new Set(newBrands)].join(", ")}`)

const counts = db
  .prepare(
    `SELECT purpose, COALESCE(NULLIF(price_currency,''),'(site default)') AS cur, COUNT(*) AS n
     FROM cars GROUP BY purpose, cur ORDER BY purpose, cur`,
  )
  .all()
console.log(`\nTotal cars now: ${db.prepare("SELECT COUNT(*) AS n FROM cars").get().n}`)
for (const r of counts) console.log(`  ${String(r.n).padStart(3)}  purpose='${r.purpose}'  currency=${r.cur}`)

// lib/fx.ts creates this lazily on first use, which may not have happened yet.
db.exec(`
  CREATE TABLE IF NOT EXISTS fx_rates (
    code         TEXT PRIMARY KEY,
    rwf_per_unit REAL NOT NULL,
    updated_at   TEXT NOT NULL
  )
`)

const noRate = db
  .prepare(
    `SELECT COUNT(*) AS n FROM cars
     WHERE UPPER(TRIM(COALESCE(price_currency,''))) NOT IN ('', 'RWF')
       AND UPPER(TRIM(price_currency)) NOT IN (
         SELECT UPPER(code) FROM fx_rates WHERE rwf_per_unit > 0
       )`,
  )
  .get()?.n
if (noRate) {
  console.log(`\n${noRate} car(s) are withheld from the MOBILE app until a rate is set:`)
  console.log("  node scripts/set-fx-rate.mjs USD <francs per dollar> --yes")
  console.log("They are live on the website either way.")
}

console.log("\nAll new listings are published with a placeholder photo.")
console.log("Add the real photos from the admin: /admin/cars -> Edit -> Photos.")

db.close()
