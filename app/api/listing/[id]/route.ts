import { getDb, getCarById, getGallery, getRelatedCars, incrementCarView } from "@/lib/db"
import { langOf, originOf, absImage, apiOk, apiError, carOut } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Feature ids are stored on the car as a JSON array string, e.g. `"[1,3]"`. */
function featureIds(raw: string | null): number[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : []
  } catch {
    return raw
      .split(",")
      .map((v) => Number(v.trim()))
      .filter(Number.isFinite)
  }
}

/**
 * GET /api/listing/{id}
 *
 * Car detail. Replaces Laravel's HomeController@listing. The app passes the
 * numeric id; the website routes by slug, so this looks up by id and falls
 * back to slug for anything that links in with one.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const db = getDb()
  const origin = originOf(request)
  const lang = langOf(request)

  const numeric = Number(id)
  let car = Number.isFinite(numeric) ? getCarById(numeric) : null
  if (!car) {
    const bySlug = db
      .prepare("SELECT id FROM cars WHERE slug = ? LIMIT 1")
      .get(id) as { id: number } | undefined
    car = bySlug ? getCarById(bySlug.id) : null
  }

  if (!car || car.status !== "enable" || car.approved_by_admin !== "approved" || car.is_draft !== "disable") {
    return apiError("Listing not found", 404)
  }

  incrementCarView(car.id)

  const ids = featureIds(car.features)
  const carFeatures = ids.length
    ? (db
        .prepare(
          `SELECT f.id, t.name, f.created_at AS createdAt, f.updated_at AS updatedAt
           FROM features f
           LEFT JOIN feature_translations t ON t.feature_id = f.id AND t.lang_code = ?
           WHERE f.id IN (${ids.map(() => "?").join(",")})`,
        )
        .all(lang, ...ids) as unknown as Record<string, unknown>[])
    : []

  // Laravel resolved the dealer through the same public-dealer conditions, so
  // an unverified or disabled seller yields no dealer block rather than a
  // half-populated one.
  const owner = db
    .prepare(
      `SELECT u.id, u.name, u.username, u.designation, u.image, u.banner_image, u.status,
              u.is_banned, u.is_dealer, u.address, u.email, u.phone, u.kyc_status, u.created_at
       FROM users u
       WHERE u.id = ? AND u.is_dealer = 1 AND u.status = 'enable'
         AND u.is_banned = 'no' AND u.email_verified_at IS NOT NULL
       LIMIT 1`,
    )
    .get(car.agent_id) as Record<string, unknown> | undefined

  const dealerRow = owner
    ? {
        ...owner,
        image: absImage(owner.image as string | null, origin),
        banner_image: absImage(owner.banner_image as string | null, origin),
      }
    : null

  // Reviews shown on the page are this car's; the rating total is the dealer's
  // across every car. Laravel drew that distinction and the app relies on it.
  const reviews = db
    .prepare(
      `SELECT r.id, r.user_id, r.agent_id, r.car_id, r.rating, r.comment, r.status,
              r.created_at, r.updated_at
       FROM reviews r WHERE r.car_id = ? AND r.status = 'enable' ORDER BY r.id DESC`,
    )
    .all(car.id) as unknown as { rating: number }[]

  const dealerRating = db
    .prepare("SELECT COUNT(*) AS n FROM reviews WHERE agent_id = ? AND status = 'enable'")
    .get(car.agent_id) as { n: number } | undefined

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
    : 0

  // Same brand, excluding this car — matching Laravel's related query.
  const related = getRelatedCars(car, 6).filter((c) => c.brand_id === car.brand_id)

  return apiOk({
    car: carOut(car, origin),
    car_features: carFeatures,
    galleries: getGallery(car.id).map((g) => ({
      id: g.id,
      car_id: g.car_id,
      image: absImage(g.image, origin),
      created_at: null,
      updated_at: null,
    })),
    related_listings: related.map((c) => carOut(c, origin)),
    dealer: dealerRow,
    reviews,
    total_dealer_rating: dealerRating?.n ?? 0,
    average_rating: Number(averageRating.toFixed(2)),
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
