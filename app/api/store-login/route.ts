import { getDb } from "@/lib/db"
import { originOf, absImage, apiOk, apiError } from "@/lib/mobile"
import { readBody, checkPassword, mintToken, userOut, TOKEN_TTL_SECONDS, type MobileUser } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/store-login
 *
 * Replaces Laravel's LoginController@store_login, including its response
 * envelope — the app's UserResponseModel reads access_token, token_type,
 * expires_in, user and user_type, and decides whether to show seller screens
 * from user_type.
 *
 * Laravel's gate order is kept so the messages stay familiar, minus the email
 * verification step: this stack registers accounts pre-verified.
 */
export async function POST(request: Request) {
  const db = getDb()
  const origin = originOf(request)

  const body = await readBody(request)
  const email = (body.email ?? "").trim().toLowerCase()
  const password = body.password ?? ""

  if (!email) return apiError("Email is required", 422)
  if (!password) return apiError("Password is required", 422)

  const row = db
    .prepare(
      `SELECT id, name, username, email, password, image, banner_image, status,
              is_banned, is_dealer, designation, address, phone, kyc_status
       FROM users WHERE lower(email) = ? LIMIT 1`,
    )
    .get(email) as (MobileUser & { password: string | null }) | undefined

  // Same message whether the address is unknown or the password is wrong, so
  // the endpoint cannot be used to enumerate registered emails.
  if (!row) return apiError("Credential does not match", 403)
  if (row.status !== "enable") return apiError("Your account is inactive. Please contact support.", 403)
  if (row.is_banned === "yes") return apiError("This account has been suspended.", 403)

  const ok = await checkPassword(password, row.password)
  if (!ok) return apiError("Credential does not match", 403)

  const { password: _discard, ...user } = row
  void _discard

  return apiOk({
    access_token: mintToken(user.id),
    token_type: "bearer",
    expires_in: TOKEN_TTL_SECONDS,
    user: userOut(user, (p) => absImage(p, origin)),
    user_type: user.is_dealer === 1 ? "dealer" : "user",
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
