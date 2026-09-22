import "server-only"
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
import { getDb } from "./db"

/**
 * Authentication for the Flutter app.
 *
 * Deliberately not the admin session in lib/auth.ts: that is an httpOnly
 * cookie for the browser panel, while the app has no cookie jar and sends its
 * credential as `?token=` on every request — the shape Laravel's jwt-auth
 * accepted, and what the shipped binary already does.
 *
 * The token is an HMAC of `userId.issuedAt.nonce` rather than a real JWT. The
 * app never inspects it, only echoes it back, so a signed opaque string is
 * enough and avoids pulling in a JWT dependency.
 */

const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days; re-login on a phone is painful
export const TOKEN_TTL_SECONDS = TTL_MS / 1000

/**
 * Derived from the admin secret with a label so the two token systems cannot
 * be confused for one another even though they share a root secret.
 */
function key(): Buffer {
  const root = process.env.ADMIN_SESSION_SECRET
  if (!root || root === "change-me-to-a-long-random-string") {
    throw new Error("ADMIN_SESSION_SECRET is not set to a real value in .env")
  }
  return createHmac("sha256", root).update("keycar-mobile-api-v1").digest()
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("base64url")
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function mintToken(userId: number): string {
  const body = `${userId}.${Date.now()}.${randomBytes(8).toString("hex")}`
  return `${body}.${sign(body)}`
}

/** Returns the user id, or null when the token is absent, forged or expired. */
export function userIdFromToken(token: string | null): number | null {
  if (!token) return null
  const idx = token.lastIndexOf(".")
  if (idx < 0) return null

  const body = token.slice(0, idx)
  const mac = token.slice(idx + 1)

  let expected: string
  try {
    expected = sign(body)
  } catch {
    return null
  }
  if (!safeEqual(mac, expected)) return null

  const [rawId, rawIssued] = body.split(".")
  const id = Number(rawId)
  const issued = Number(rawIssued)
  if (!Number.isFinite(id) || !Number.isFinite(issued)) return null
  if (Date.now() - issued > TTL_MS) return null

  return id
}

export interface MobileUser {
  id: number
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  banner_image: string | null
  status: string | null
  is_banned: string | null
  is_dealer: number
  designation: string | null
  address: string | null
  phone: string | null
  kyc_status: string | null
}

const USER_COLUMNS = `
  id, name, username, email, image, banner_image, status, is_banned,
  is_dealer, designation, address, phone, kyc_status
`

export function getUserById(id: number): MobileUser | null {
  const row = getDb()
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`)
    .get(id) as MobileUser | undefined
  return row ? { ...row } : null
}

/**
 * Resolves the caller from `?token=`. Returns null for anonymous, forged or
 * expired requests, and for accounts disabled or banned since the token was
 * issued — the check has to happen per request, not just at login.
 */
export function currentUser(request: Request): MobileUser | null {
  const token = new URL(request.url).searchParams.get("token")
  const id = userIdFromToken(token)
  if (id === null) return null

  const user = getUserById(id)
  if (!user) return null
  if (user.status !== "enable" || user.is_banned === "yes") return null
  return user
}

/* ------------------------------------------------------------------ */
/* Passwords                                                           */
/* ------------------------------------------------------------------ */

/** Laravel wrote `$2y$` hashes; bcryptjs wants `$2a$`/`$2b$`. Same algorithm. */
export async function checkPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return false
  const normalised = hash.startsWith("$2y$") ? `$2b$${hash.slice(4)}` : hash
  try {
    return await bcrypt.compare(plain, normalised)
  } catch {
    return false
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

/* ------------------------------------------------------------------ */
/* Request bodies                                                      */
/* ------------------------------------------------------------------ */

/**
 * The app posts `body: <Map>` through Dart's http package with no explicit
 * Content-Type, which sends `application/x-www-form-urlencoded` — not JSON.
 * Accept both so the endpoints also work from curl and the web build.
 */
export async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? ""

  if (type.includes("application/json")) {
    try {
      const json = (await request.json()) as Record<string, unknown>
      return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, v == null ? "" : String(v)]))
    } catch {
      return {}
    }
  }

  try {
    const form = await request.formData()
    const out: Record<string, string> = {}
    for (const [k, v] of form.entries()) out[k] = typeof v === "string" ? v : ""
    return out
  } catch {
    return {}
  }
}

/** Shapes a user the way the app's `User.fromMap` reads it. */
export function userOut(user: MobileUser, absolute: (path: string | null) => string) {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM cars
       WHERE agent_id = ? AND status = 'enable' AND approved_by_admin = 'approved' AND is_draft = 'disable'`,
    )
    .get(user.id) as { n: number } | undefined

  return {
    id: user.id,
    name: user.name ?? "",
    username: user.username || String(user.id),
    email: user.email ?? "",
    image: absolute(user.image),
    banner_image: absolute(user.banner_image),
    status: user.status ?? "",
    is_banned: user.is_banned ?? "no",
    is_dealer: user.is_dealer ?? 0,
    designation: user.designation ?? "",
    address: user.address ?? "",
    phone: user.phone ?? "",
    kyc_status: user.kyc_status ?? "",
    total_car: row?.n ?? 0,
  }
}
