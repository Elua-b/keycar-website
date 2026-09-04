import "server-only"
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { getAdminByEmail, getAdminById } from "./db"

/**
 * Signs in against the existing Laravel `admins` table. Laravel stores bcrypt
 * hashes with a `$2y$` prefix; bcryptjs expects `$2a$`/`$2b$`, so we normalise
 * the prefix — the algorithm and the hash bytes are identical.
 */

const COOKIE = "keycar_admin"
const MAX_AGE = 60 * 60 * 8 // 8 hours

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s || s === "change-me-to-a-long-random-string") {
    throw new Error("ADMIN_SESSION_SECRET is not set to a real value in .env")
  }
  return s
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const normalised = hash.startsWith("$2y$") ? `$2b$${hash.slice(4)}` : hash
  try {
    return await bcrypt.compare(plain, normalised)
  } catch {
    return false
  }
}

export interface AdminSession {
  id: number
  name: string
  email: string
}

export async function signIn(email: string, password: string): Promise<AdminSession | null> {
  const admin = getAdminByEmail(email.trim().toLowerCase())
  if (!admin) return null
  if (admin.status && admin.status !== "active") return null
  const ok = await verifyPassword(password, admin.password)
  if (!ok) return null

  const issued = Date.now()
  const body = `${admin.id}.${issued}.${randomBytes(8).toString("hex")}`
  const token = `${body}.${sign(body)}`

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  })

  return { id: admin.id, name: admin.name, email: admin.email }
}

export async function signOut(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function currentAdmin(): Promise<AdminSession | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
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
  if (Date.now() - issued > MAX_AGE * 1000) return null

  const admin = getAdminById(id)
  if (!admin || (admin.status && admin.status !== "active")) return null
  return { id: admin.id, name: admin.name, email: admin.email }
}

/** For route handlers and server actions that must not run unauthenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await currentAdmin()
  if (!admin) throw new Error("UNAUTHORIZED")
  return admin
}
