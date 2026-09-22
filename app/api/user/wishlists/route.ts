import { getDb, getCarById } from "@/lib/db"
import { originOf, apiOk, apiError, carOut } from "@/lib/mobile"
import { currentUser } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/user/wishlists?token=…
 *
 * Replaces ProfileController@wishlists. Note the app reads `cars` as a plain
 * list here, not a paginator envelope — unlike /api/listings.
 */
export async function GET(request: Request) {
  const user = currentUser(request)
  if (!user) return apiError("Unauthenticated", 401)

  const origin = originOf(request)

  const rows = getDb()
    .prepare("SELECT car_id FROM wishlists WHERE user_id = ? ORDER BY id DESC")
    .all(user.id) as { car_id: number }[]

  // Skip anything since unpublished or deleted rather than 404-ing the list.
  const cars = rows
    .map((r) => getCarById(r.car_id))
    .filter((c) => c && c.status === "enable" && c.approved_by_admin === "approved" && c.is_draft === "disable")
    .map((c) => carOut(c!, origin))

  return apiOk({ cars })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
