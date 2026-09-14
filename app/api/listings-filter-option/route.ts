import { getDb, getBrands, getFilterOptions } from "@/lib/db"
import { langOf, originOf, apiOk, brandOut } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/listings-filter-option
 *
 * Populates the search filters. Replaces HomeController@listings_filter_option.
 * Values come from what is actually present in the data, so the app never
 * offers a filter that would return nothing.
 */
export async function GET(request: Request) {
  const db = getDb()
  const origin = originOf(request)
  const lang = langOf(request)
  const options = getFilterOptions()

  const countries = db
    .prepare("SELECT id, name, code, created_at, updated_at FROM countries ORDER BY name")
    .all()

  const features = db
    .prepare(
      `SELECT f.id, t.name, f.created_at AS createdAt, f.updated_at AS updatedAt
       FROM features f
       LEFT JOIN feature_translations t ON t.feature_id = f.id AND t.lang_code = ?
       ORDER BY t.name`,
    )
    .all(lang)

  return apiOk({
    brands: getBrands(true).map((b) => brandOut(b, origin)),
    conditions: options.conditions,
    purposes: options.purposes,
    countries,
    features,
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
