/**
 * Creates the local SQLite database this app reads, and fills it with a small
 * sample inventory so every page has something to render.
 *
 *   node scripts/init-sqlite.mjs [path/to/database.sqlite]
 *
 * The tables and columns below are the ones the Laravel `keycar` MySQL schema
 * defines — only the tables lib/db.ts actually queries, with MySQL types mapped
 * onto SQLite ones. Running it twice is safe: tables are created IF NOT EXISTS
 * and the sample rows are only inserted while `cars` is still empty.
 */

import { DatabaseSync } from "node:sqlite"
import { mkdirSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

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

const dbPath = resolve(process.argv[2] || process.env.DATABASE_PATH || "data/keycar.sqlite")
mkdirSync(dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec("PRAGMA journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, code TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT, country_id INTEGER,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS city_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, city_id INTEGER, lang_code TEXT, name TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT, image TEXT, slug TEXT, status TEXT DEFAULT 'enable',
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS brand_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, lang_code TEXT, brand_id INTEGER, name TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER DEFAULT 0, brand_id INTEGER, city_id INTEGER, country_id INTEGER,
    thumb_image TEXT, slug TEXT, features TEXT, purpose TEXT, "condition" TEXT,
    total_view INTEGER DEFAULT 0, regular_price REAL, offer_price REAL,
    video_id TEXT, video_image TEXT, google_map TEXT,
    body_type TEXT, engine_size TEXT, drive TEXT, interior_color TEXT, exterior_color TEXT,
    year TEXT, mileage TEXT, number_of_owner TEXT, seats TEXT, fuel_type TEXT, transmission TEXT,
    seller_type TEXT, expired_date TEXT, rent_period TEXT, car_model TEXT,
    is_featured TEXT DEFAULT 'disable', status TEXT DEFAULT 'enable',
    approved_by_admin TEXT DEFAULT 'approved', is_draft TEXT DEFAULT 'disable',
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS car_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, car_id INTEGER, lang_code TEXT,
    title TEXT, description TEXT, video_description TEXT, address TEXT,
    seo_title TEXT, seo_description TEXT, created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS car_galleries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, car_id INTEGER, image TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, app_name TEXT, logo TEXT, favicon TEXT,
    email TEXT, phone TEXT, about_us TEXT, address TEXT,
    open_day TEXT, closed_day TEXT, copyright TEXT,
    twitter TEXT, instagram TEXT, linkedin TEXT, facebook TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS multi_currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, currency_name TEXT, country_code TEXT,
    currency_code TEXT, currency_icon TEXT, is_default TEXT, currency_rate REAL,
    currency_position TEXT, status TEXT, created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS contact_us (
    id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT, email TEXT, map_code TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT,
    phone TEXT, country TEXT, address TEXT, designation TEXT, image TEXT,
    status TEXT DEFAULT 'active', is_banned TEXT DEFAULT 'no',
    is_influencer INTEGER DEFAULT 0, is_dealer INTEGER DEFAULT 0,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, image TEXT,
    email_verified_at TEXT, password TEXT, admin_type INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active', forget_password_token TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS car_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, car_id INTEGER, car_slug TEXT,
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kyc_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, status INTEGER DEFAULT 1,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS kyc_information (
    id INTEGER PRIMARY KEY AUTOINCREMENT, kyc_id INTEGER, user_id INTEGER, file TEXT,
    message TEXT, status INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS blog_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT, status INTEGER DEFAULT 1,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS blog_category_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, lang_code TEXT, blog_category_id INTEGER, name TEXT,
    created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER, slug TEXT, blog_category_id INTEGER,
    image TEXT, views INTEGER DEFAULT 0, status INTEGER DEFAULT 1, show_homepage TEXT,
    is_popular TEXT DEFAULT 'no', tags TEXT, created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS blog_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, blog_id INTEGER, lang_code TEXT, title TEXT,
    description TEXT, seo_title TEXT, seo_description TEXT, created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS blog_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, blog_id INTEGER, name TEXT, email TEXT, phone TEXT,
    comment TEXT, status INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, agent_id INTEGER, car_id INTEGER,
    rating INTEGER, comment TEXT, status TEXT DEFAULT 'disable', created_at TEXT, updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, car_id INTEGER,
    created_at TEXT, updated_at TEXT
  );
`)

/**
 * Columns added after a database was first created. SQLite has no
 * "ADD COLUMN IF NOT EXISTS", so check the table info first.
 */
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (cols.some((c) => c.name === column)) return false
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  return true
}

const added = [
  ensureColumn("cars", "seats", "TEXT") && "cars.seats",
  ensureColumn("users", "kyc_status", "TEXT DEFAULT 'pending'") && "users.kyc_status",
  ensureColumn("car_inquiries", "subject", "TEXT") && "car_inquiries.subject",
  ensureColumn("settings", "contact_message_mail", "TEXT") && "settings.contact_message_mail",
  ensureColumn("settings", "send_contact_message", "TEXT DEFAULT 'disable'") && "settings.send_contact_message",
  ensureColumn("settings", "save_contact_message", "TEXT DEFAULT 'enable'") && "settings.save_contact_message",
].filter(Boolean)

if (added.length) console.log(`Added columns: ${added.join(", ")}`)

// Earlier seeds wrote 'active'; the Laravel admin uses enable/disable everywhere.
db.prepare("UPDATE users SET status = 'enable' WHERE status = 'active'").run()

// The site prices in Rwandan francs. Only the row this script originally wrote
// is rewritten, so a currency configured by hand is left alone. Prices already
// in the database are NOT rescaled — money is not something to convert behind
// your back; restate them from the admin if they are still in another currency.
const staleCurrency = db
  .prepare("UPDATE multi_currencies SET currency_name = 'FRw-RWF', country_code = 'RW', currency_code = 'RWF', currency_icon = 'RWF', currency_position = 'after_price' WHERE currency_name = '$-USD'")
  .run()
if (staleCurrency.changes) console.log("Default currency switched to RWF.")

const LANG = process.env.DEFAULT_LANG || "en"
const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
const IMG = "/placeholder.svg"

const one = (sql, ...args) => Number(db.prepare(sql).run(...args).lastInsertRowid)
const isEmpty = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n === 0

/* ---- KYC document types ---------------------------------------------- */

if (isEmpty("kyc_types")) {
  for (const name of ["National ID", "Passport", "Driving Licence", "Business Registration"]) {
    db.prepare("INSERT INTO kyc_types (name, status, created_at, updated_at) VALUES (?,1,?,?)").run(name, ts, ts)
  }
  console.log("Seeded 4 KYC types.")
}

/* ---- blog ------------------------------------------------------------- */

if (isEmpty("blogs")) {
  const catIds = {}
  for (const name of ["Buying guides", "Ownership", "News"]) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const id = one("INSERT INTO blog_categories (slug, status, created_at, updated_at) VALUES (?,1,?,?)", slug, ts, ts)
    db.prepare(
      "INSERT INTO blog_category_translations (blog_category_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
    ).run(id, LANG, name, ts, ts)
    catIds[name] = id
  }

  const posts = [
    {
      cat: "Buying guides",
      title: "How to inspect a used car before you pay",
      tags: "used cars,inspection,buying",
      body: "<p>A careful inspection takes twenty minutes and saves you thousands. Start cold: an engine that has already been warmed up hides a lot.</p><h3>Body and panels</h3><p>Look down the length of each panel in daylight. Ripples, mismatched paint and uneven gaps are the clearest sign of accident repair.</p><h3>Under the bonnet</h3><p>Check the oil when the engine is cold, look for milky residue on the filler cap, and follow every hose for cracks.</p><h3>On the road</h3><p>Drive at least fifteen minutes, including one stretch above 80 km/h. Listen for whines that change with speed rather than engine revs.</p>",
    },
    {
      cat: "Ownership",
      title: "Service intervals that actually matter in Rwanda",
      tags: "servicing,maintenance",
      body: "<p>Manufacturer schedules assume smooth tarmac and clean fuel. Local conditions ask for a little more.</p><h3>Oil and filters</h3><p>Dust is the main enemy. Air filters clog faster on murram roads, so inspect at every oil change rather than every second one.</p><h3>Suspension</h3><p>Bushes and shock absorbers wear early. A knock over speed bumps is the first symptom worth chasing.</p>",
    },
    {
      cat: "News",
      title: "What the new import rules mean for buyers",
      tags: "regulation,imports",
      body: "<p>Duty bands changed this year, and the effect on the second-hand market is already visible in listing prices.</p><p>Older, larger-engined imports carry the biggest increase, which is pushing demand towards low-mileage hybrids.</p>",
    },
  ]

  posts.forEach((p, i) => {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const created = new Date(Date.now() - i * 4 * 864e5).toISOString().slice(0, 19).replace("T", " ")
    const blogId = one(
      `INSERT INTO blogs (admin_id, slug, blog_category_id, image, views, status, is_popular, tags, created_at, updated_at)
       VALUES (1,?,?,?,?,1,?,?,?,?)`,
      slug,
      catIds[p.cat],
      IMG,
      40 + i * 17,
      i === 0 ? "yes" : "no",
      p.tags,
      created,
      created,
    )
    db.prepare(
      `INSERT INTO blog_translations (blog_id, lang_code, title, description, seo_title, seo_description, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run(blogId, LANG, p.title, p.body, p.title, p.title, created, created)
  })

  console.log(`Seeded ${posts.length} blog posts in 3 categories.`)
}

const carCount = db.prepare("SELECT COUNT(*) AS n FROM cars").get().n
if (carCount > 0) {
  console.log(`${dbPath}\nSchema is up to date; ${carCount} car(s) already present — inventory not re-seeded.`)
  db.close()
  process.exit(0)
}

/* ---- reference data -------------------------------------------------- */

const countryId = one(
  "INSERT INTO countries (name, code, created_at, updated_at) VALUES (?,?,?,?)",
  "Rwanda",
  "RW",
  ts,
  ts,
)

const cityIds = {}
for (const name of ["Kigali", "Musanze", "Rubavu"]) {
  const id = one("INSERT INTO cities (country_id, created_at, updated_at) VALUES (?,?,?)", countryId, ts, ts)
  db.prepare(
    "INSERT INTO city_translations (city_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(id, LANG, name, ts, ts)
  cityIds[name] = id
}

const brandIds = {}
for (const name of ["Toyota", "Mercedes-Benz", "BMW", "Land Rover", "Hyundai", "Nissan"]) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
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
  brandIds[name] = id
}

db.prepare(
  `INSERT INTO settings (app_name, logo, email, phone, address, about_us, copyright,
                         open_day, closed_day, facebook, instagram, linkedin, twitter,
                         created_at, updated_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
).run(
  "Keycar",
  "",
  "hello@keycar.rw",
  "+250 788 000 000",
  "KN 5 Rd, Kigali, Rwanda",
  "Keycar is a Rwandan car marketplace connecting buyers with trusted dealers.",
  `Copyright ${new Date().getFullYear()} Keycar. All rights reserved.`,
  "Mon - Sat, 08:00 - 18:00",
  "Sunday",
  "https://facebook.com/",
  "https://instagram.com/",
  "https://linkedin.com/",
  "https://x.com/",
  ts,
  ts,
)

db.prepare(
  `INSERT INTO multi_currencies (currency_name, country_code, currency_code, currency_icon,
                                 is_default, currency_rate, currency_position, status, created_at, updated_at)
   VALUES (?,?,?,?,?,?,?,?,?,?)`,
).run("FRw-RWF", "RW", "RWF", "RWF", "Yes", 1, "after_price", "active", ts, ts)

db.prepare("INSERT INTO contact_us (phone, email, map_code, created_at, updated_at) VALUES (?,?,?,?,?)").run(
  "+250 788 000 000",
  "hello@keycar.rw",
  null,
  ts,
  ts,
)

const dealers = [
  ["Kigali Auto Hub", "sales@kigaliautohub.rw", "Dealer", 1, "enable", "approved"],
  ["Virunga Motors", "info@virungamotors.rw", "Dealer", 1, "enable", "approved"],
  ["Alice Uwase", "alice.uwase@example.rw", "Private seller", 0, "enable", "pending"],
  ["Eric Habimana", "eric.habimana@example.rw", "Private seller", 0, "disable", "pending"],
]
const userIds = {}
for (const [name, email, designation, isDealer, status, kyc] of dealers) {
  userIds[name] = one(
    `INSERT INTO users (name, email, phone, country, address, designation, status, is_dealer, kyc_status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    name,
    email,
    "+250 788 000 000",
    "Rwanda",
    "Kigali, Rwanda",
    designation,
    status,
    isDealer,
    kyc,
    ts,
    ts,
  )
}

// One pending KYC submission so the review queue isn't empty on a fresh install.
db.prepare(
  `INSERT INTO kyc_information (kyc_id, user_id, file, message, status, created_at, updated_at)
   VALUES (?,?,?,?,0,?,?)`,
).run(1, userIds["Alice Uwase"], IMG, "Front and back of my national ID card.", ts, ts)

/* ---- sample inventory ------------------------------------------------ */

const FEATURES = [
  "Air Conditioning",
  "Bluetooth",
  "Reverse Camera",
  "Cruise Control",
  "Leather Seats",
  "Alloy Wheels",
  "Parking Sensors",
  "Sunroof",
]

const cars = [
  {
    brand: "Toyota", model: "Land Cruiser V8", city: "Kigali", year: "2019",
    price: 99_000_000, offer: 93_500_000, body: "SUV", fuel: "Diesel", trans: "Automatic",
    mileage: "84000", engine: "4.5L", drive: "4WD", cond: "used", purpose: "sale",
    featured: "enable", views: 412,
    desc: "A well-maintained V8 Land Cruiser with full service history, ideal for long upcountry trips.",
  },
  {
    brand: "Mercedes-Benz", model: "C 200 AMG Line", city: "Kigali", year: "2021",
    price: 61_000_000, offer: null, body: "Sedan", fuel: "Petrol", trans: "Automatic",
    mileage: "31500", engine: "2.0L", drive: "RWD", cond: "used", purpose: "sale",
    featured: "enable", views: 288,
    desc: "Low-mileage C-Class in AMG Line trim, with a panoramic roof, ambient lighting and full leather.",
  },
  {
    brand: "BMW", model: "X5 xDrive40i", city: "Kigali", year: "2020",
    price: 84_000_000, offer: 79_000_000, body: "SUV", fuel: "Petrol", trans: "Automatic",
    mileage: "46200", engine: "3.0L", drive: "AWD", cond: "used", purpose: "sale",
    featured: "enable", views: 356,
    desc: "Seven-seat X5 with adaptive suspension, head-up display and a fresh major service.",
  },
  {
    brand: "Toyota", model: "RAV4 Hybrid", city: "Musanze", year: "2022",
    price: 56_500_000, offer: null, body: "SUV", fuel: "Hybrid", trans: "Automatic",
    mileage: "22800", engine: "2.5L", drive: "AWD", cond: "used", purpose: "sale",
    featured: "disable", views: 197,
    desc: "Hybrid RAV4 returning excellent fuel economy around town and on the Musanze run.",
  },
  {
    brand: "Hyundai", model: "Tucson", city: "Kigali", year: "2023",
    price: 50_000_000, offer: 47_500_000, body: "SUV", fuel: "Petrol", trans: "Automatic",
    mileage: "12400", engine: "1.6L", drive: "FWD", cond: "new", purpose: "sale",
    featured: "disable", views: 143,
    desc: "Nearly new Tucson, still under manufacturer warranty, one owner from new.",
  },
  {
    brand: "Land Rover", model: "Defender 110", city: "Rubavu", year: "2021",
    price: 115_000_000, offer: null, body: "SUV", fuel: "Diesel", trans: "Automatic",
    mileage: "38900", engine: "3.0L", drive: "4WD", cond: "used", purpose: "sale",
    featured: "enable", views: 501,
    desc: "Defender 110 with the off-road pack: air suspension, tow bar and all-terrain tyres.",
  },
  {
    brand: "Nissan", model: "X-Trail", city: "Kigali", year: "2018",
    price: 36_000_000, offer: 32_500_000, body: "SUV", fuel: "Petrol", trans: "Automatic",
    mileage: "96500", engine: "2.0L", drive: "FWD", cond: "used", purpose: "sale",
    featured: "disable", views: 178,
    desc: "Practical family X-Trail, recently serviced with four new tyres fitted.",
  },
  {
    brand: "Toyota", model: "Hiace Commuter", city: "Kigali", year: "2020",
    price: 175_000, offer: null, body: "Van", fuel: "Diesel", trans: "Manual",
    mileage: "142000", engine: "2.8L", drive: "RWD", cond: "used", purpose: "rent",
    featured: "disable", views: 96, rent: "daily",
    desc: "14-seater Hiace available for daily hire, driver optional. Rates include insurance.",
    // Rent listings carry a per-period rate, not a sale price.
  },
]

const insertCar = db.prepare(
  `INSERT INTO cars (
     agent_id, brand_id, city_id, country_id, thumb_image, slug, features, purpose, "condition",
     total_view, regular_price, offer_price, body_type, engine_size, drive,
     interior_color, exterior_color, year, mileage, number_of_owner, fuel_type, transmission,
     seller_type, rent_period, car_model, is_featured, status, approved_by_admin, is_draft,
     created_at, updated_at
   ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'enable',?,'disable',?,?)`,
)

const AGENTS = [userIds["Kigali Auto Hub"], userIds["Virunga Motors"]]

const insertTranslation = db.prepare(
  `INSERT INTO car_translations (car_id, lang_code, title, description, address, seo_title, seo_description, created_at, updated_at)
   VALUES (?,?,?,?,?,?,?,?,?)`,
)

const insertGallery = db.prepare(
  "INSERT INTO car_galleries (car_id, image, created_at, updated_at) VALUES (?,?,?,?)",
)

cars.forEach((c, i) => {
  const title = `${c.brand} ${c.model}`
  const slug = `${title} ${c.year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  // Stagger created_at so "latest" ordering has something to sort on.
  const created = new Date(Date.now() - i * 30 * 36e5).toISOString().slice(0, 19).replace("T", " ")

  const carId = Number(
    insertCar.run(
      AGENTS[i % AGENTS.length],
      brandIds[c.brand],
      cityIds[c.city],
      countryId,
      IMG,
      slug,
      JSON.stringify(FEATURES.slice(0, 4 + (i % 4))),
      c.purpose,
      c.cond,
      c.views,
      c.price,
      c.offer,
      c.body,
      c.engine,
      c.drive,
      "Black",
      ["White", "Silver", "Black", "Blue"][i % 4],
      c.year,
      c.mileage,
      String(1 + (i % 2)),
      c.fuel,
      c.trans,
      "dealer",
      c.rent ?? null,
      c.model,
      c.featured,
      // The last car arrives unapproved so the admin approval queue has work in it.
      i === cars.length - 1 ? "pending" : "approved",
      created,
      created,
    ).lastInsertRowid,
  )

  insertTranslation.run(carId, LANG, title, c.desc, `${c.city}, Rwanda`, title, c.desc, created, created)
  for (let g = 0; g < 3; g++) insertGallery.run(carId, IMG, created, created)

  if (i < 3) {
    db.prepare(
      `INSERT INTO reviews (user_id, agent_id, car_id, rating, comment, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run(
      userIds["Alice Uwase"],
      AGENTS[i % AGENTS.length],
      carId,
      5 - (i % 2),
      ["Straightforward dealer, the car was exactly as described.", "Good condition, paperwork took a while.", "Very happy with the purchase."][i],
      i === 0 ? "enable" : "disable",
      created,
      created,
    )
  }
})

console.log(
  `${dbPath}\nSeeded ${cars.length} cars, ${Object.keys(brandIds).length} brands, ${Object.keys(cityIds).length} cities.`,
)
db.close()
