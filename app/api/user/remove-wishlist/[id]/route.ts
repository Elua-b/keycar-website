import { getDb } from "@/lib/db"
import { apiOk, apiError } from "@/lib/mobile"
import { currentUser } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * DELETE /api/user/remove-wishlist/{carId}?token=…
 *
 * Replaces ProfileController@remove_wishlist. Scoped to the caller's own rows
 * so one user cannot clear another's saved cars by guessing ids.
 */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = currentUser(request)
  if (!user) return apiError("Unauthenticated", 401)

  const { id } = await context.params
  const carId = Number(id)
  if (!Number.isFinite(carId)) return apiError("Listing not found", 404)

  getDb().prepare("DELETE FROM wishlists WHERE user_id = ? AND car_id = ?").run(user.id, carId)

  return apiOk({ message: "Removed from your saved cars" })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
