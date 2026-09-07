import "server-only"
import { getDb } from "./db"

/**
 * The `users` table is the Laravel front-end account table — dealers and
 * private sellers who own listings. Admins live in `admins` (see lib/auth.ts)
 * and are a different thing entirely.
 *
 * Laravel's Admin/UserController splits the list on `status`: 'enable' is the
 * active list, 'disable' is the "pending" list awaiting approval.
 */

export interface AppUser {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  country: string | null
  address: string | null
  designation: string | null
  image: string | null
  status: string
  is_banned: string | null
  is_dealer: number
  kyc_status: string | null
  created_at: string | null
  updated_at: string | null
  // joined
  car_count?: number
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")

export type UserScope = "all" | "enable" | "disable" | "dealer"

export function getUsers(scope: UserScope = "all"): AppUser[] {
  const where =
    { enable: "WHERE u.status = 'enable'", disable: "WHERE u.status = 'disable'", dealer: "WHERE u.is_dealer = 1" }[
      scope as "enable" | "disable" | "dealer"
    ] ?? ""

  return getDb()
    .prepare(
      `SELECT u.*, (SELECT COUNT(*) FROM cars c WHERE c.agent_id = u.id) AS car_count
       FROM users u ${where} ORDER BY u.id DESC`,
    )
    .all() as unknown as AppUser[]
}

export function getUser(id: number): AppUser | null {
  const row = getDb()
    .prepare(
      `SELECT u.*, (SELECT COUNT(*) FROM cars c WHERE c.agent_id = u.id) AS car_count
       FROM users u WHERE u.id = ? LIMIT 1`,
    )
    .get(id) as unknown as AppUser | undefined
  return row ?? null
}

/** Everyone who can be set as a listing's agent. */
export function getDealers(): { id: number; name: string | null; email: string | null }[] {
  return getDb()
    .prepare("SELECT id, name, email FROM users WHERE status = 'enable' ORDER BY name")
    .all() as unknown as { id: number; name: string | null; email: string | null }[]
}

export function countUsers() {
  const db = getDb()
  const one = (sql: string) => ((db.prepare(sql).get() as { n: number } | undefined)?.n ?? 0)
  return {
    total: one("SELECT COUNT(*) AS n FROM users"),
    active: one("SELECT COUNT(*) AS n FROM users WHERE status = 'enable'"),
    pending: one("SELECT COUNT(*) AS n FROM users WHERE status = 'disable'"),
    dealers: one("SELECT COUNT(*) AS n FROM users WHERE is_dealer = 1"),
  }
}

/** The same counters Laravel's user_show page put above the listing table. */
export function getUserStats(id: number) {
  const db = getDb()
  const one = (sql: string, ...args: unknown[]) =>
    ((db.prepare(sql).get(...(args as never[])) as { n: number } | undefined)?.n ?? 0)

  return {
    totalListings: one("SELECT COUNT(*) AS n FROM cars WHERE agent_id = ?", id),
    activeListings: one(
      `SELECT COUNT(*) AS n FROM cars
       WHERE agent_id = ? AND status = 'enable' AND approved_by_admin = 'approved'
         AND (expired_date IS NULL OR expired_date >= date('now'))`,
      id,
    ),
    reviews: one("SELECT COUNT(*) AS n FROM reviews WHERE agent_id = ?", id),
    wishlisted: one("SELECT COUNT(*) AS n FROM wishlists w JOIN cars c ON c.id = w.car_id WHERE c.agent_id = ?", id),
  }
}

export interface UserInput {
  name: string
  phone: string
  address: string
  designation: string | null
  country: string | null
  is_dealer: boolean
  status: string
}

export function updateUser(id: number, input: UserInput): void {
  getDb()
    .prepare(
      `UPDATE users SET name = ?, phone = ?, address = ?, designation = ?, country = ?,
              is_dealer = ?, status = ?, updated_at = ? WHERE id = ?`,
    )
    .run(
      input.name,
      input.phone,
      input.address,
      input.designation,
      input.country,
      input.is_dealer ? 1 : 0,
      input.status === "enable" ? "enable" : "disable",
      now(),
      id,
    )
}

export function setUserStatus(id: number, status: string): void {
  getDb()
    .prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?")
    .run(status === "enable" ? "enable" : "disable", now(), id)
}

/**
 * Laravel refuses to delete a user who still owns listings, to avoid orphaning
 * them. Same rule here — the caller shows the message.
 */
export function deleteUser(id: number): { ok: boolean; error?: string } {
  const db = getDb()
  const cars = (db.prepare("SELECT COUNT(*) AS n FROM cars WHERE agent_id = ?").get(id) as { n: number }).n
  if (cars > 0) {
    return { ok: false, error: `This user still owns ${cars} listing${cars === 1 ? "" : "s"}. Reassign or delete those first.` }
  }

  db.prepare("DELETE FROM reviews WHERE user_id = ? OR agent_id = ?").run(id, id)
  db.prepare("DELETE FROM wishlists WHERE user_id = ?").run(id)
  db.prepare("DELETE FROM kyc_information WHERE user_id = ?").run(id)
  db.prepare("DELETE FROM users WHERE id = ?").run(id)
  return { ok: true }
}
