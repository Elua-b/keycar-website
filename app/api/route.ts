import { getDb, getFeaturedCars, getLatestCars, getBrands } from "@/lib/db"
import { langOf, originOf, absImage, apiOk, carOut, brandOut, getDealerRows, dealerOut } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/
 *
 * The app's home screen. Replaces Laravel's HomeController@index — the key
 * names below are what `HomeModel.fromMap` reads, so they are fixed by the
 * shipped app rather than chosen here.
 */
export async function GET(request: Request) {
  const db = getDb()
  const origin = originOf(request)
  const lang = langOf(request)

  const sliders = db
    .prepare("SELECT id, image, status, created_at, updated_at FROM sliders WHERE status = 'active' ORDER BY id")
    .all() as unknown as { id: number; image: string | null; status: string }[]

  const adsBanners = db
    .prepare(
      "SELECT id, image, link, status, created_at, updated_at FROM ads_banners WHERE status = 'enable' ORDER BY id",
    )
    .all() as unknown as { id: number; image: string | null; link: string | null; status: string }[]

  const joinDealer = db
    .prepare(
      `SELECT h.dealer_bg_image AS image, t.dealer_title AS title, t.dealer_short_title AS short_title
       FROM home_pages h
       LEFT JOIN home_page_translations t ON t.home_page_id = h.id AND t.lang_code = ?
       LIMIT 1`,
    )
    .get(lang) as { image: string | null; title: string | null; short_title: string | null } | undefined

  return apiOk({
    sliders: sliders.map((s) => ({ ...s, image: absImage(s.image, origin) })),
    brands: getBrands(true).map((b) => brandOut(b, origin)),
    featured_cars: getFeaturedCars(10).map((c) => carOut(c, origin)),
    latest_cars: getLatestCars(10).map((c) => carOut(c, origin)),
    ads_banners: adsBanners.map((a) => ({ ...a, image: absImage(a.image, origin), link: a.link ?? "" })),
    dealers: getDealerRows({ limit: 10 }).map((d) => dealerOut(d, origin)),
    // Always an object, never null: the home screen dereferences this with a
    // hard `!`, and the app casts each field to a non-nullable String. Laravel
    // returned empty strings for unset copy, so we do the same.
    join_dealer: {
      // absImage falls back to the placeholder, so this is never an empty
      // string — the app concatenates onto rootUrl and an empty path would
      // request the bare origin.
      image: absImage(joinDealer?.image, origin),
      title: joinDealer?.title ?? "",
      short_title: joinDealer?.short_title ?? "",
    },
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
