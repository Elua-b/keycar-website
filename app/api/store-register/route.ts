import { getDb } from "@/lib/db"
import { apiOk, apiError } from "@/lib/mobile"
import { readBody, hashPassword } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** `Verygood Muhirwa` -> `verygood-muhirwa`, uniquified against existing rows. */
function uniqueUsername(name: string, email: string): string {
  const db = getDb()
  const root =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase()

  let candidate = root
  let n = 1
  while (db.prepare("SELECT 1 FROM users WHERE username = ? LIMIT 1").get(candidate)) {
    candidate = `${root}-${++n}`
  }
  return candidate
}

/**
 * POST /api/store-register
 *
 * Replaces Laravel's RegisterController@store_register. Laravel emailed a
 * verification code and left the account unverified; this stack has no mail
 * provider, so accounts are created already verified and the app sends the
 * user straight to sign-in. Swap this for a real OTP once email exists —
 * `users.verification_otp` is still there for it.
 */
export async function POST(request: Request) {
  const db = getDb()
  const body = await readBody(request)
  const name = (body.name ?? "").trim()
  const email = (body.email ?? "").trim().toLowerCase()
  const password = body.password ?? ""
  const confirm = body.password_confirmation ?? ""

  if (name.length < 2 || name.length > 120) return apiError("Please enter your name.", 422)
  if (!EMAIL.test(email) || email.length > 180) return apiError("Please enter a valid email address.", 422)
  if (password.length < 6) return apiError("Password must be at least 6 characters.", 422)
  if (password !== confirm) return apiError("Passwords do not match.", 422)

  const taken = db.prepare("SELECT 1 FROM users WHERE lower(email) = ? LIMIT 1").get(email)
  if (taken) return apiError("That email is already registered. Please sign in.", 422)

  const ts = new Date().toISOString().slice(0, 19).replace("T", " ")

  db.prepare(
    `INSERT INTO users (name, email, username, password, email_verified_at,
                        status, is_banned, is_dealer, kyc_status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    name,
    email,
    uniqueUsername(name, email),
    await hashPassword(password),
    ts, // verified on creation — see the note above
    "enable",
    "no",
    0,
    "disable",
    ts,
    ts,
  )

  // The app shows this and then sends the user to sign in.
  return apiOk({ message: "Account created. Please sign in." })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
