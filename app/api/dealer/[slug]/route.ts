import { getDb } from "@/lib/db"
import {
  langOf,
  originOf,
  apiOk,
  apiError,
  carOut,
  dealerOut,
  getDealerRows,
  searchCars,
  paginate,
  pageParams,
} from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/dealer/{username}
 *
 * A dealer's public profile and their listings. Replaces HomeController@dealer
 * — the path segment is the username, not a slug, despite the route name.
 */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const origin = originOf(request)
  const lang = langOf(request)
  const { page, perPage } = pageParams(request)

  const dealer = getDealerRows({ username: slug, limit: 1 })[0]
  if (!dealer) return apiError("Dealer not found", 404)

  const { cars, total } = searchCars({ lang, agentId: dealer.id, page, perPage })

  const rating = getDb()
    .prepare("SELECT COUNT(*) AS n FROM reviews WHERE agent_id = ? AND status = 'active'")
    .get(dealer.id) as { n: number } | undefined

  return apiOk({
    dealer: dealerOut(dealer, origin),
    cars: paginate(
      cars.map((c) => carOut(c, origin)),
      total,
      page,
      perPage,
      `${origin}/api/dealer/${slug}`,
    ),
    total_dealer_rating: rating?.n ?? 0,
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
