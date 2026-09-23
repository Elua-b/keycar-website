/**
 * Sets the public contact phone number shown across the site.
 *
 *   node scripts/set-contact-phone.mjs                        # dry run
 *   node scripts/set-contact-phone.mjs --yes                  # applies the default below
 *   node scripts/set-contact-phone.mjs "+250 788 123 456" --yes   # applies another number
 *
 * No phone number is hardcoded in any page or component. The header, the
 * footer, the contact page and the "Or call …" line under the inquiry form all
 * read `settings.phone`, and hide themselves when it is empty — which is why
 * the live site currently shows no number anywhere. So this is a data change,
 * not a find-and-replace.
 *
 * `contact_us.phone` is written too. The contact page reads
 * `settings.phone ?? contact.phone`, so settings alone would be enough, but
 * init-sqlite.mjs seeds both and keeping them in step avoids a stale fallback
 * surfacing later.
 *
 * Re-runnable: it just overwrites, and reports what the value was before.
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

/**
 * International form, so the `tel:` links work for someone calling from
 * outside Rwanda. 0799521540 and +250 799 521 540 are the same line.
 */
const DEFAULT_PHONE = "+250 799 521 540"

const args = process.argv.slice(2)
const CONFIRMED = args.includes("--yes") || args.includes("-y")
const PHONE = args.find((a) => !a.startsWith("-")) ?? DEFAULT_PHONE

const dbPath = resolve(process.env.DATABASE_PATH || "data/keycar.sqlite")
const db = new DatabaseSync(dbPath)
db.exec("PRAGMA journal_mode = WAL")
db.exec("PRAGMA busy_timeout = 5000")

const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
const show = (v) => (v === null || v === undefined ? "(not set)" : v === "" ? "(empty)" : v)

const settingsRow = db.prepare("SELECT id, phone FROM settings LIMIT 1").get()
const contactRow = db.prepare("SELECT id, phone FROM contact_us LIMIT 1").get()

console.log(`Database: ${dbPath}\n`)
console.log(`  settings.phone     ${show(settingsRow?.phone)}  ->  ${PHONE}`)
console.log(
  `  contact_us.phone   ${contactRow ? show(contactRow.phone) : "(no row)"}  ->  ${PHONE}`,
)

if (!settingsRow) {
  console.error("\nNo row in `settings`. Run `npm run init-db` first.")
  db.close()
  process.exit(1)
}

if (!CONFIRMED) {
  console.log("\nNothing has changed. Re-run with --yes to apply.")
  db.close()
  process.exit(0)
}

db.prepare("UPDATE settings SET phone = ?, updated_at = ? WHERE id = ?").run(PHONE, ts, settingsRow.id)

if (contactRow) {
  db.prepare("UPDATE contact_us SET phone = ?, updated_at = ? WHERE id = ?").run(PHONE, ts, contactRow.id)
} else {
  db.prepare(
    "INSERT INTO contact_us (phone, email, map_code, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(PHONE, db.prepare("SELECT email FROM settings LIMIT 1").get()?.email ?? null, null, ts, ts)
}

console.log("\nDone. The number now shows in the header, the footer, the contact page")
console.log("and under the inquiry form on every listing.")

db.close()
