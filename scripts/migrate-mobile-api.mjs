/**
 * Brings a database up to what the mobile API (`app/api/*`) needs.
 *
 *   node scripts/migrate-mobile-api.mjs [path/to/database.sqlite] [--dry-run]
 *
 * The Flutter app reads tables the website never touched — languages, sliders,
 * ads banners, the home-page copy block, features, and the terms/privacy pages
 * — plus a handful of columns on `users` and `settings`. A database restored
 * from the Laravel dump already has all of it and this script will report no
 * changes. A database created by `npm run init-db` has none of it, and the
 * mobile endpoints fail with "no such table" until this runs.
 *
 * Safe to run repeatedly: every table is IF NOT EXISTS, every column is added
 * only when absent, and seed rows are inserted only into empty tables.
 */

import { DatabaseSync } from "node:sqlite"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Reads one env file, without overwriting anything already in the environment.
 * Files are loaded in Next's precedence order, so whichever is read first wins.
 */
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

/**
 * Same order Next.js uses: `.env.local` overrides `.env`. A deploy that keeps
 * DATABASE_PATH in `.env.local` would otherwise migrate the wrong database —
 * or none at all — while reporting success.
 */
function loadEnv() {
  loadEnvFile(".env.local")
  loadEnvFile(".env")
}

loadEnv()

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const allowCreate = args.includes("--create")
const pathArg = args.find((a) => !a.startsWith("--"))
const dbPath = resolve(pathArg || process.env.DATABASE_PATH || "data/keycar.sqlite")

/**
 * Refuse to migrate a database that isn't there.
 *
 * node:sqlite creates the file on open, so a stale or misspelled
 * DATABASE_PATH would otherwise produce an empty database, migrate it
 * happily, and report success — while the real one stayed untouched and the
 * site served nothing. Pass --create only when a new file is genuinely wanted.
 */
if (!existsSync(dbPath) && !allowCreate) {
  console.error(`No database at ${dbPath}`)
  console.error(
    "\nCheck DATABASE_PATH in .env.local / .env, or pass the path as an argument.\n" +
      "If you really do want to create a new empty database here, re-run with --create.",
  )
  process.exit(1)
}

const db = new DatabaseSync(dbPath)
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA busy_timeout = 5000")

const applied = []
const skipped = []

function tableExists(name) {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)
}

function columnExists(table, column) {
  if (!tableExists(table)) return false
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((c) => c.name === column)
}

/** Create a table only when it is absent. */
function createTable(name, ddl) {
  if (tableExists(name)) {
    skipped.push(`table ${name}`)
    return
  }
  if (!dryRun) db.exec(ddl)
  applied.push(`CREATE TABLE ${name}`)
}

/**
 * Add a column only when it is absent.
 *
 * SQLite's ALTER TABLE ADD COLUMN rejects a non-constant DEFAULT, so every
 * definition here uses a literal or no default at all.
 */
function addColumn(table, column, definition) {
  if (!tableExists(table)) {
    skipped.push(`column ${table}.${column} (table absent)`)
    return
  }
  if (columnExists(table, column)) {
    skipped.push(`column ${table}.${column}`)
    return
  }
  if (!dryRun) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  applied.push(`ALTER TABLE ${table} ADD COLUMN ${column}`)
}

/** Insert seed rows only while the table is still empty. */
function seedIfEmpty(table, label, insert) {
  if (!tableExists(table)) return
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()
  if (row.n > 0) {
    skipped.push(`seed ${table} (${row.n} rows present)`)
    return
  }
  if (!dryRun) insert()
  applied.push(`SEED ${table} — ${label}`)
}

const now = new Date().toISOString().slice(0, 19).replace("T", " ")

/* ------------------------------------------------------------------ */
/* Tables the mobile API reads but the website never did               */
/* ------------------------------------------------------------------ */

// GET /api/website-setup — the app's language switcher, and lang_code
// validation on every other endpoint.
createTable(
  "languages",
  `CREATE TABLE IF NOT EXISTS languages (
     id INTEGER PRIMARY KEY AUTOINCREMENT, lang_name TEXT, lang_code TEXT,
     is_default TEXT DEFAULT 'No', status INTEGER DEFAULT 1,
     lang_direction TEXT DEFAULT 'left_to_right',
     created_at TEXT, updated_at TEXT
   )`,
)

// GET /api — home carousel.
createTable(
  "sliders",
  `CREATE TABLE IF NOT EXISTS sliders (
     id INTEGER PRIMARY KEY AUTOINCREMENT, image TEXT,
     status TEXT DEFAULT 'active', created_at TEXT, updated_at TEXT
   )`,
)

// GET /api — promo banners between home sections.
createTable(
  "ads_banners",
  `CREATE TABLE IF NOT EXISTS ads_banners (
     id INTEGER PRIMARY KEY AUTOINCREMENT, position TEXT, position_key TEXT,
     image TEXT, link TEXT, status TEXT DEFAULT 'disable',
     created_at TEXT, updated_at TEXT
   )`,
)

// GET /api — the "Become a Dealer" block. The app dereferences join_dealer
// with a hard `!`, so the endpoint always returns the object; these tables
// only supply the copy.
createTable(
  "home_pages",
  `CREATE TABLE IF NOT EXISTS home_pages (
     id INTEGER PRIMARY KEY AUTOINCREMENT, dealer_bg_image TEXT,
     dealer_foreground_image TEXT, created_at TEXT, updated_at TEXT
   )`,
)

createTable(
  "home_page_translations",
  `CREATE TABLE IF NOT EXISTS home_page_translations (
     id INTEGER PRIMARY KEY AUTOINCREMENT, home_page_id INTEGER, lang_code TEXT,
     dealer_short_title TEXT, dealer_title TEXT,
     created_at TEXT, updated_at TEXT
   )`,
)

// GET /api/listing/{id} and /api/listings-filter-option — car feature chips.
createTable(
  "features",
  `CREATE TABLE IF NOT EXISTS features (
     id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT, updated_at TEXT
   )`,
)

createTable(
  "feature_translations",
  `CREATE TABLE IF NOT EXISTS feature_translations (
     id INTEGER PRIMARY KEY AUTOINCREMENT, feature_id INTEGER, lang_code TEXT,
     name TEXT, created_at TEXT, updated_at TEXT
   )`,
)

// GET /api/terms-conditions and /api/privacy-policy — reachable from the
// app's More tab.
createTable(
  "term_and_conditions",
  `CREATE TABLE IF NOT EXISTS term_and_conditions (
     id INTEGER PRIMARY KEY AUTOINCREMENT, lang_code TEXT, description TEXT,
     created_at TEXT, updated_at TEXT
   )`,
)

createTable(
  "privacy_policies",
  `CREATE TABLE IF NOT EXISTS privacy_policies (
     id INTEGER PRIMARY KEY AUTOINCREMENT, lang_code TEXT, description TEXT,
     created_at TEXT, updated_at TEXT
   )`,
)

/* ------------------------------------------------------------------ */
/* Columns the mobile API selects                                      */
/* ------------------------------------------------------------------ */

// GET /api/website-setup selects both of these by name; without them the
// splash screen never resolves.
addColumn("settings", "timezone", "TEXT")
addColumn("settings", "default_avatar", "TEXT")

// Dealer endpoints. `username` is the path segment in /api/dealer/{username},
// and `email_verified_at` is part of the public-dealer condition Laravel used,
// so a missing column makes every dealer list empty rather than erroring.
addColumn("users", "username", "TEXT")
addColumn("users", "email_verified_at", "TEXT")
addColumn("users", "banner_image", "TEXT")

/* ------------------------------------------------------------------ */
/* Minimum rows the endpoints need to return something useful          */
/* ------------------------------------------------------------------ */

// With no enabled language, `language_list` is empty and lang_code validation
// always falls back to DEFAULT_LANG.
seedIfEmpty("languages", "English (en)", () => {
  db.prepare(
    `INSERT INTO languages (lang_name, lang_code, is_default, status, lang_direction, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?)`,
  ).run("English", process.env.DEFAULT_LANG || "en", "Yes", 1, "left_to_right", now, now)
})

// With no active currency, the app renders prices without a symbol.
seedIfEmpty("multi_currencies", "RWF (default)", () => {
  db.prepare(
    `INSERT INTO multi_currencies (currency_name, country_code, currency_code, currency_icon,
                                   is_default, currency_rate, currency_position, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run("FRw-RWF", "RW", "RWF", "RWF", "Yes", 1, "after_price", "active", now, now)
})

// One row so the home endpoint has a copy block to join against.
seedIfEmpty("home_pages", "empty home page row", () => {
  db.prepare("INSERT INTO home_pages (dealer_bg_image, created_at, updated_at) VALUES (?,?,?)").run("", now, now)
  db.prepare(
    `INSERT INTO home_page_translations (home_page_id, lang_code, dealer_short_title, dealer_title, created_at, updated_at)
     VALUES (?,?,?,?,?,?)`,
  ).run(1, process.env.DEFAULT_LANG || "en", "", "", now, now)
})

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

console.log(dbPath)
console.log(dryRun ? "\nDRY RUN — nothing was written.\n" : "")

if (applied.length === 0) {
  console.log("Already up to date — no changes needed.")
} else {
  console.log(`${dryRun ? "Would apply" : "Applied"} ${applied.length} change(s):`)
  for (const line of applied) console.log(`  + ${line}`)
}

if (skipped.length) {
  console.log(`\n${skipped.length} already present (skipped).`)
}

db.close()
