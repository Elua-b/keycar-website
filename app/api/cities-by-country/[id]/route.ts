import { getDb } from "@/lib/db"
import { langOf, apiOk } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/cities-by-country/{id}
 *
 * Feeds the location dropdown once a country is chosen. Replaces
 * HomeController@cities_by_country.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const lang = langOf(request)

  const cities = getDb()
    .prepare(
      `SELECT ci.id, ci.country_id, t.name, ci.created_at, ci.updated_at,
              (SELECT COUNT(*) FROM cars c
                WHERE c.city_id = ci.id AND c.status = 'enable'
                  AND c.approved_by_admin = 'approved' AND c.is_draft = 'disable') AS total_car
       FROM cities ci
       LEFT JOIN city_translations t ON t.city_id = ci.id AND t.lang_code = ?
       WHERE ci.country_id = ?
       ORDER BY t.name`,
    )
    .all(lang, id)

  return apiOk({ cities })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
