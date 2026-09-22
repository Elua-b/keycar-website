import { getDb, getCarById } from "@/lib/db"
import { apiOk, apiError } from "@/lib/mobile"
import { currentUser } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/user/add-to-wishlist/{carId}?token=…
 *
 * A GET that writes, because that is what the shipped app sends — Laravel
 * declared it the same way. Idempotent: saving an already-saved car is a
 * no-op rather than a duplicate row, since the table has no unique index.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = currentUser(request)
  if (!user) return apiError("Unauthenticated", 401)

  const { id } = await context.params
  const carId = Number(id)
  if (!Number.isFinite(carId) || !getCarById(carId)) return apiError("Listing not found", 404)

  const db = getDb()
  const existing = db
    .prepare("SELECT id FROM wishlists WHERE user_id = ? AND car_id = ? LIMIT 1")
    .get(user.id, carId)

  if (existing) return apiOk({ message: "Already in your saved cars" })

  const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
  db.prepare("INSERT INTO wishlists (user_id, car_id, created_at, updated_at) VALUES (?,?,?,?)").run(
    user.id,
    carId,
    ts,
    ts,
  )

  return apiOk({ message: "Added to your saved cars" })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
