import { getBrands } from "@/lib/db"
import {
  langOf,
  originOf,
  apiOk,
  carOut,
  brandOut,
  searchCars,
  paginate,
  pageParams,
  arrayParam,
  looseList,
} from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/listings
 *
 * Browse and search. Replaces Laravel's HomeController@listings. The app sends
 * `brand`, `location`, `country_id`, `search` plus PHP-style repeated params
 * (`purpose[0]`, `condition[0]`, `features[0]`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = url.searchParams
  const origin = originOf(request)
  const lang = langOf(request)
  const { page, perPage } = pageParams(request)

  const { cars, total } = searchCars({
    lang,
    search: params.get("search")?.trim() || undefined,
    brands: looseList(params.get("brand")),
    purposes: arrayParam(params, "purpose"),
    conditions: arrayParam(params, "condition"),
    location: params.get("location")?.trim() || undefined,
    countryId: params.get("country_id")?.trim() || undefined,
    page,
    perPage,
  })

  return apiOk({
    cars: paginate(
      cars.map((c) => carOut(c, origin)),
      total,
      page,
      perPage,
      `${origin}/api/listings`,
    ),
    brands: getBrands(true).map((b) => brandOut(b, origin)),
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
