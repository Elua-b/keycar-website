import { originOf, absImage, apiOk, apiError } from "@/lib/mobile"
import { currentUser, userOut } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/user/edit-profile?token=…
 *
 * Replaces ProfileController@edit. The app reads `user` from the response and
 * feeds it to the same User.fromMap that parses the login payload.
 */
export async function GET(request: Request) {
  const user = currentUser(request)
  if (!user) return apiError("Unauthenticated", 401)

  const origin = originOf(request)
  return apiOk({ user: userOut(user, (p) => absImage(p, origin)) })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
