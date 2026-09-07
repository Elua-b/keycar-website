import "server-only"
import { getDb } from "./db"

/**
 * The Laravel ContactMessage module was only ever a stub — it emailed and
 * never persisted, so there is no table to reuse. This adds one alongside the
 * existing schema; Laravel is unaffected because nothing else touches it.
 */

let ensured = false

function ensureTable(): void {
  if (ensured) return
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS car_inquiries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id     INTEGER,
      car_slug   TEXT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      phone      TEXT,
      subject    TEXT,
      message    TEXT NOT NULL,
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `)
  ensured = true
}

export interface Inquiry {
  id: number
  car_id: number | null
  car_slug: string | null
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  is_read: number
  created_at: string
}

export interface NewInquiry {
  car_id?: number | null
  car_slug?: string | null
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
}

export function addInquiry(input: NewInquiry): number {
  ensureTable()
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
  const info = getDb()
    .prepare(
      `INSERT INTO car_inquiries (car_id, car_slug, name, email, phone, subject, message, is_read, created_at)
       VALUES (?,?,?,?,?,?,?,0,?)`,
    )
    .run(
      input.car_id ?? null,
      input.car_slug ?? null,
      input.name,
      input.email,
      input.phone ?? null,
      input.subject ?? null,
      input.message,
      ts,
    )
  return Number(info.lastInsertRowid)
}

export function getInquiries(limit = 200): Inquiry[] {
  ensureTable()
  return getDb()
    .prepare("SELECT * FROM car_inquiries ORDER BY created_at DESC LIMIT ?")
    .all(limit) as unknown as Inquiry[]
}

export function getInquiry(id: number): Inquiry | null {
  ensureTable()
  const row = getDb().prepare("SELECT * FROM car_inquiries WHERE id = ?").get(id) as unknown as Inquiry | undefined
  return row ?? null
}

export function countInquiries() {
  ensureTable()
  const db = getDb()
  const one = (sql: string) => ((db.prepare(sql).get() as { n: number } | undefined)?.n ?? 0)
  return {
    total: one("SELECT COUNT(*) AS n FROM car_inquiries"),
    unread: one("SELECT COUNT(*) AS n FROM car_inquiries WHERE is_read = 0"),
    aboutCars: one("SELECT COUNT(*) AS n FROM car_inquiries WHERE car_slug IS NOT NULL"),
  }
}

export function countUnreadInquiries(): number {
  ensureTable()
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM car_inquiries WHERE is_read = 0").get() as
    | { n: number }
    | undefined
  return row?.n ?? 0
}

export function markInquiryRead(id: number, read = true): void {
  ensureTable()
  getDb().prepare("UPDATE car_inquiries SET is_read = ? WHERE id = ?").run(read ? 1 : 0, id)
}

export function deleteInquiry(id: number): void {
  ensureTable()
  getDb().prepare("DELETE FROM car_inquiries WHERE id = ?").run(id)
}
