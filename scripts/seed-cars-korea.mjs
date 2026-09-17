/**
 * Adds the Korea-sourced import stock to the car inventory.
 *
 *   node scripts/seed-cars-korea.mjs          # dry run — reports, changes nothing
 *   node scripts/seed-cars-korea.mjs --yes    # applies
 *
 * ADDITIVE and re-runnable. Nothing is deleted: a car whose slug is already in
 * the table is skipped, so running this again after photos have been uploaded
 * will not reset thumb_image or wipe car_galleries.
 *
 * Every listing goes in with the placeholder photo. Add the real ones after:
 * /admin/cars -> Edit -> Photos.
 *
 * Prices are Rwandan francs. The KRW listings were converted at the rate the
 * source feed used, 1 KRW = 1.0749 RWF; the KRW figure is kept beside each car
 * so the conversion can be re-checked.
 *
 * Anything the source did not state is left null rather than invented — that is
 * why several cars have no year, mileage or transmission.
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
 * The stock.                                                          *
 *                                                                     *
 * body/fuel/transmission/drive use the same vocabulary as the admin   *
 * form (components/admin/car-form.tsx) so the listing filters group    *
 * these cars with the rest of the inventory:                          *
 *   body        SUV | Sedan | Hatchback | Pickup | Coupe | ...        *
 *   fuel        Petrol | Diesel | Hybrid | Electric | CNG | LPG       *
 *   drive       2WD | 4WD | AWD | FWD | RWD                           *
 * The source's own wording ("Compact Sedan", "Gasoline", "Large       *
 * Sedan") is preserved in `note` where it adds something.             *
 * ------------------------------------------------------------------ */

const INVENTORY = [
  {
    brand: "Hyundai",
    model: "Santa Fe",
    trim: "TM 2.0 Diesel 2WD Prestige",
    year: "2019",
    price: 19_885_650, // 18,500,000 KRW
    krw: 18_500_000,
    body: "SUV",
    fuel: "Diesel",
    engine: "2000cc",
    drive: "2WD",
    mileage: 55205,
    registered: "November 2018",
    note: "2019 model year. Low mileage for its age.",
  },
  {
    brand: "Mercedes-Benz",
    model: "GLC 300",
    trim: "4MATIC Coupé AVANTGARDE",
    price: 90_000_000,
    body: "Coupe",
    // 2.0L turbo petrol with 48V mild-hybrid assistance — listed as Hybrid so it
    // sits with the other mild-hybrids in the fuel filter.
    fuel: "Hybrid",
    engine: "2000cc",
    drive: "AWD",
    transmission: "Automatic",
    note:
      "2.0L turbocharged petrol with mild-hybrid assistance: 255 hp and 295 lb-ft, " +
      "0–60 mph in 6.1–6.2 seconds, through a 9G-TRONIC nine-speed automatic and " +
      "4MATIC all-wheel drive. Sporty coupé-SUV bodywork in AVANTGARDE trim.",
    features: [
      "4MATIC All-Wheel Drive",
      "9G-TRONIC 9-Speed Automatic",
      "Mild-Hybrid System",
      "AVANTGARDE Styling",
      "Multi-Spoke Alloy Wheels",
      "Digital Cockpit",
      "Large Central Touchscreen",
      "Apple CarPlay",
      "Android Auto",
    ],
  },

  /* --- kbchachacha.com feed ---------------------------------------- */

  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28609461
    brand: "Hyundai",
    model: "The New Avante",
    trim: "1.6 GDi Modern",
    year: "2016",
    price: 6_728_874, // 6,260,000 KRW
    krw: 6_260_000,
    body: "Sedan",
    fuel: "Petrol",
    engine: "1591cc",
    transmission: "Automatic",
    colour: "White",
    mileage: 76568,
    registered: "June 2015",
    owners: "1",
    accident: true,
    flood: false,
    note: "Compact sedan.",
    features: [
      "Navigation",
      "Sunroof",
      "Cruise Control",
      "LED Headlights",
      "Heated Steering Wheel",
      "Ventilated Seats",
      "Heated Seats",
      "Front and Rear Parking Sensors",
      "Head-Up Display",
      "Around View Camera",
      "Lane Departure Warning",
    ],
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28512764
    brand: "Hyundai",
    model: "Avante AD",
    trim: "1.6 GDi Value Plus",
    year: "2017",
    price: 9_663_351, // 8,990,000 KRW
    krw: 8_990_000,
    body: "Sedan",
    fuel: "Petrol",
    engine: "1591cc",
    transmission: "Automatic",
    colour: "Gray",
    mileage: 82037,
    registered: "October 2016",
    note: "Compact sedan.",
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28413626
    brand: "Hyundai",
    model: "The New Avante AD",
    trim: "Smartstream G1.6 Smart Choice",
    price: 12_791_310, // 11,900,000 KRW
    krw: 11_900_000,
    body: "Sedan",
    fuel: "Petrol",
    note: "Compact sedan. Low mileage — exact reading confirmed on request.",
    badges: ["KB home delivery"],
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=27878008
    brand: "Hyundai",
    model: "All New Avante CN7",
    trim: "1.6 Gasoline Modern",
    price: 19_874_901, // 18,490,000 KRW
    krw: 18_490_000,
    body: "Sedan",
    fuel: "Petrol",
    note: "Compact sedan. Low mileage — exact reading confirmed on request.",
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28203305
    brand: "Hyundai",
    model: "The New Grandeur",
    trim: "3.3 Exclusive",
    price: 18_262_551, // 16,990,000 KRW
    krw: 16_990_000,
    body: "Sedan",
    fuel: "Petrol",
    note: "Full-size sedan.",
    badges: ["KB diagnosis report", "KB home delivery"],
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28716354
    brand: "Kia",
    model: "The New Sorento",
    trim: "2.0 Diesel 2WD Master",
    price: 19_240_710, // 17,900,000 KRW
    krw: 17_900_000,
    body: "SUV",
    fuel: "Diesel",
    engine: "2000cc",
    drive: "2WD",
    note: "Low mileage — exact reading confirmed on request.",
    badges: ["KB certified", "KB home delivery"],
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28578808
    brand: "Genesis",
    model: "G80",
    trim: "3.3 GDI AWD Premium Luxury",
    year: "2018",
    price: 19_778_160, // 18,400,000 KRW
    krw: 18_400_000,
    body: "Sedan",
    fuel: "Petrol",
    engine: "3342cc",
    drive: "AWD",
    transmission: "Automatic",
    colour: "Black",
    mileage: 47891,
    registered: "December 2017",
    owners: "2",
    accident: true,
    flood: false,
    note: "Full-size luxury sedan.",
    features: [
      "Navigation",
      "Sunroof",
      "Cruise Control",
      "HID Headlights",
      "Heated Steering Wheel",
      "Ventilated Seats",
      "Heated Seats",
      "Front and Rear Parking Sensors",
      "Head-Up Display",
      "Around View Camera",
      "Lane Departure Warning",
    ],
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28729999
    brand: "BMW",
    model: "5 Series G30",
    trim: "M550i xDrive",
    price: 54_712_410, // 50,900,000 KRW
    krw: 50_900_000,
    body: "Sedan",
    fuel: "Petrol",
    drive: "AWD",
    note: "Low mileage — exact reading confirmed on request.",
    badges: ["KB certified", "KB home delivery"],
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28707272
    brand: "BMW",
    model: "5 Series G60",
    trim: "520i SE",
    price: 60_086_910, // 55,900,000 KRW
    krw: 55_900_000,
    body: "Sedan",
    fuel: "Hybrid", // source: "Gasoline Hybrid"
    note: "Petrol mild-hybrid.",
    badges: ["KB certified", "KB home delivery"],
  },
  {
    // https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28220670
    brand: "BMW",
    model: "5 Series G30",
    trim: "530i xDrive M Sport",
    price: 44_070_900, // 41,000,000 KRW
    krw: 41_000_000,
    body: "Sedan",
    fuel: "Petrol",
    drive: "AWD",
    badges: ["KB certified"],
  },
]

/* ---- helpers ------------------------------------------------------- */

const one = (sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid)
const slugify = (s) =>
  s
    // Strip accents first, so "Coupé" slugs as "coupe" and not "coup".
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const titleOf = (c) => [c.brand, c.model, c.trim, c.year].filter(Boolean).join(" ")

/** A description built only from the facts the source gave. */
function describe(c, title) {
  const specs = []
  if (c.engine) specs.push(`${c.engine} ${(c.fuel ?? "").toLowerCase()}`.trim())
  else if (c.fuel) specs.push(c.fuel.toLowerCase())
  if (c.transmission) specs.push(c.transmission.toLowerCase())
  if (c.drive) specs.push(c.drive)
  if (c.colour) specs.push(`${c.colour.toLowerCase()} exterior`)

  const parts = [`${title}${specs.length ? ` — ${specs.join(", ")}.` : "."}`]
  if (c.note) parts.push(c.note)
  if (c.mileage) parts.push(`${c.mileage.toLocaleString("en-US")} km on the clock.`)
  if (c.registered) parts.push(`First registered ${c.registered}.`)
  if (c.owners) parts.push(`${c.owners} previous ${c.owners === "1" ? "owner" : "owners"}.`)

  // Disclosed up front rather than buried — these came with the history report.
  if (c.accident === true) parts.push("History report shows recorded accident repair.")
  if (c.flood === false) parts.push("No flood damage recorded.")

  if (c.badges?.length) parts.push(`Source inspection: ${c.badges.join(", ")}.`)

  parts.push(`Imported from South Korea. Available in ${CITY} — contact us to arrange a viewing.`)
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

if (!CONFIRMED) {
  console.log(`Database: ${dbPath}`)
  console.log(`Cars already in the table: ${existingSlugs.size}\n`)
  console.log(`Would INSERT ${toInsert.length}:`)
  for (const p of toInsert) console.log(`  ${p.car.price.toLocaleString("en-US").padStart(12)} RWF  ${p.title}`)
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

// Attach the stock to the dealer account, matching the rest of the inventory.
const agentId = db.prepare("SELECT id FROM users WHERE is_dealer = 1 ORDER BY id LIMIT 1").get()?.id ?? 0

/* ---- insert -------------------------------------------------------- */

const insertCar = db.prepare(
  `INSERT INTO cars (
     agent_id, brand_id, city_id, country_id, thumb_image, slug, features, purpose, "condition",
     total_view, regular_price, offer_price, body_type, engine_size, drive,
     interior_color, exterior_color, year, mileage, number_of_owner, seats, fuel_type, transmission,
     seller_type, rent_period, car_model, is_featured, status, approved_by_admin, is_draft,
     created_at, updated_at
   ) VALUES (?,?,?,?,?,?,?,'sale','used',0,?,NULL,?,?,?,NULL,?,?,?,?,NULL,?,?,
             'dealer',NULL,?,'disable','enable','approved','disable',?,?)`,
)

const insertTranslation = db.prepare(
  `INSERT INTO car_translations (car_id, lang_code, title, description, address, seo_title, seo_description, created_at, updated_at)
   VALUES (?,?,?,?,?,?,?,?,?)`,
)

let inserted = 0
toInsert.forEach((p, i) => {
  const c = p.car

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
      c.price,
      c.body ?? null,
      c.engine ?? null,
      c.drive ?? null,
      c.colour ?? null,
      c.year ?? null,
      c.mileage != null ? String(c.mileage) : null,
      c.owners ?? null,
      c.fuel ?? null,
      c.transmission ?? null,
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
for (const p of toInsert) {
  console.log(`  ${p.car.price.toLocaleString("en-US").padStart(12)} RWF  ${p.title}`)
}
if (skipped.length) {
  console.log("\nSkipped (slug already in the table):")
  for (const p of skipped) console.log(`  ${p.slug}`)
}
if (newBrands.length) console.log(`\nNew brands created: ${[...new Set(newBrands)].join(", ")}`)

console.log(`\nTotal cars now: ${db.prepare("SELECT COUNT(*) AS n FROM cars").get().n}`)
console.log("All new listings are published with a placeholder photo.")
console.log("Add the real photos from the admin: /admin/cars -> Edit -> Photos.")

db.close()
