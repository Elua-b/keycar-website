/**
 * Creates (or resets the password of) an admin in the shared Laravel database.
 *
 *   node scripts/create-admin.mjs <email> <password> [name]
 *
 * The hash is bcrypt with a $2y$ prefix, which is exactly what Laravel writes,
 * so the same account works in both the Next.js admin and the Laravel panel.
 */

import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"
import bcrypt from "bcryptjs"

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

const [email, password, ...nameParts] = process.argv.slice(2)
const name = nameParts.join(" ") || "Administrator"

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [name]")
  process.exit(1)
}
if (password.length < 8) {
  console.error("Choose a password of at least 8 characters.")
  process.exit(1)
}

const dbPath = process.env.DATABASE_PATH
if (!dbPath) {
  console.error("DATABASE_PATH is not set (check your .env).")
  process.exit(1)
}

const db = new DatabaseSync(dbPath)
const now = new Date().toISOString().slice(0, 19).replace("T", " ")

// bcryptjs emits $2b$; Laravel writes $2y$. They are the same algorithm, and
// lib/auth.ts normalises the prefix when comparing, but store $2y$ so the
// Laravel side accepts it too.
const hash = bcrypt.hashSync(password, 12).replace(/^\$2[ab]\$/, "$2y$")
const normalisedEmail = email.trim().toLowerCase()

const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(normalisedEmail)

if (existing) {
  db.prepare("UPDATE admins SET password = ?, name = ?, status = 'active', updated_at = ? WHERE id = ?").run(
    hash,
    name,
    now,
    existing.id,
  )
  console.log(`Password reset for existing admin (id ${existing.id}).`)
} else {
  const info = db
    .prepare(
      `INSERT INTO admins (name, email, password, admin_type, status, email_verified_at, created_at, updated_at)
       VALUES (?, ?, ?, 1, 'active', ?, ?, ?)`,
    )
    .run(name, normalisedEmail, hash, now, now, now)
  console.log(`Admin created (id ${info.lastInsertRowid}).`)
}

console.log(`Sign in at /admin with: ${normalisedEmail}`)
db.close()
