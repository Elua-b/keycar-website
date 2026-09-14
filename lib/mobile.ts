import "server-only"
import { getDb, LANG, type Car, type Brand, type CityRow } from "./db"
import { imageUrl } from "./images"

/**
 * Response shaping for the Flutter app (Key-Car / `carsbnb`).
 *
 * The app was written against the Laravel API and parses snake_case keys
 * straight off the old Eloquent models. Rather than change 57 endpoints in a
 * shipped binary, these helpers reproduce the shapes Laravel emitted so the
 * app keeps working unchanged. Anything here that looks redundant with the
 * website's own helpers is deliberate: the website renders, the app parses.
 */

/* ------------------------------------------------------------------ */
/* Request helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * The app sends `?lang_code=` on nearly every request, the way Laravel's
 * CurrencyLangaugeForAPI middleware expected. Only codes that exist and are
 * enabled are honoured; anything else falls back to the default.
 */
export function langOf(request: Request): string {
  const requested = new URL(request.url).searchParams.get("lang_code")
  if (!requested) return LANG
  const row = getDb()
    .prepare("SELECT lang_code FROM languages WHERE lang_code = ? AND status = 1 LIMIT 1")
    .get(requested) as { lang_code: string } | undefined
  return row?.lang_code ?? LANG
}

/** Origin of the incoming request, honouring the proxy headers a deploy sets. */
export function originOf(request: Request): string {
  const url = new URL(request.url)
  const host = request.headers.get("x-forwarded-host") ?? url.host
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")
  return `${proto}://${host}`
}

/**
 * Absolute image URL.
 *
 * Laravel returned relative paths and the app did `rootUrl + path`. That
 * concatenation breaks on Cloudinary URLs, so we hand the app absolute URLs
 * and let its helper pass them through untouched.
 */
export function absImage(path: string | null | undefined, origin: string): string {
  const resolved = imageUrl(path)
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) return resolved
  return `${origin}${resolved.startsWith("/") ? "" : "/"}${resolved}`
}

/* ------------------------------------------------------------------ */
/* Entity shaping                                                      */
/* ------------------------------------------------------------------ */

/**
 * Fields the app declares as `String` on its car model.
 *
 * Eloquent serialised decimal and numeric columns as JSON strings, so the app
 * was written expecting `"18500000"`. SQLite hands back a real number, and
 * assigning that to a `String` field throws inside `FeaturedCars.fromMap` —
 * which surfaces as a home screen stuck on its spinner, with a successful
 * 200 in the network log. Coerce them back to strings here.
 *
 * Nulls are left alone: the app already maps them through `?? ''`, whereas
 * stringifying would produce the literal `"null"`.
 */
const STRING_FIELDS = [
  "regular_price",
  "offer_price",
  "year",
  "mileage",
  "engine_size",
  "number_of_owner",
  "seats",
  "video_id",
  "google_map",
  "rent_period",
  "expired_date",
  "car_model",
  "drive",
  "interior_color",
  "exterior_color",
] as const

function stringifyNumerics(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row }
  for (const field of STRING_FIELDS) {
    const value = out[field]
    if (value !== null && value !== undefined && typeof value !== "string") {
      out[field] = String(value)
    }
  }
  return out
}

/**
 * One car as the app's `FeaturedCars.fromMap` expects it.
 *
 * Three deliberate departures from the raw row: images become absolute,
 * numeric columns the app types as `String` are coerced, and `seats` is also
 * emitted as `number_of_seat` — the key the app actually reads. The column was
 * renamed on the Laravel side and the app was never updated.
 */
export function carOut(car: Car, origin: string): Record<string, unknown> {
  const row = stringifyNumerics(car as unknown as Record<string, unknown>)
  return {
    ...row,
    thumb_image: absImage(car.thumb_image, origin),
    video_image: car.video_image ? absImage(car.video_image, origin) : "",
    number_of_seat: car.seats == null ? "" : String(car.seats),
    brand: car.brand_name ? { id: car.brand_id, name: car.brand_name, slug: car.brand_slug } : null,
    city: car.city_name ? { id: car.city_id, name: car.city_name } : null,
    country: car.country_name ? { id: car.country_id, name: car.country_name } : null,
  }
}

export function brandOut(brand: Brand, origin: string): Record<string, unknown> {
  return {
    id: brand.id,
    name: brand.name ?? "",
    slug: brand.slug,
    image: absImage(brand.image, origin),
    status: brand.status,
    total_car: brand.car_count ?? 0,
    created_at: null,
    updated_at: null,
  }
}

export function cityOut(city: CityRow): Record<string, unknown> {
  return { id: city.id, country_id: city.country_id, name: city.name ?? "" }
}

/* ------------------------------------------------------------------ */
/* Dealers                                                             */
/* ------------------------------------------------------------------ */

export interface DealerRow {
  id: number
  name: string | null
  username: string | null
  designation: string | null
  image: string | null
  status: string | null
  is_banned: string | null
  is_dealer: number
  address: string | null
  email: string | null
  phone: string | null
  kyc_status: string | null
  total_car?: number
}

const PUBLIC_CARS = `c.status = 'enable' AND c.approved_by_admin = 'approved' AND c.is_draft = 'disable'`

/**
 * Which sellers are publicly visible.
 *
 * Laravel also required `email_verified_at IS NOT NULL`, but that condition
 * cannot be met here: this stack has no email-verification flow, so nothing
 * ever populates the column, and on a database created by `init-db` it was
 * added empty. Keeping it hid every dealer. The remaining three checks are
 * the ones the admin panel actually maintains, and they match what the
 * website's own getDealers() treats as visible.
 */
const PUBLIC_DEALER = `
  u.is_dealer = 1
  AND u.status = 'enable'
  AND u.is_banned = 'no'
`

export function getDealerRows(opts: { username?: string; limit?: number; offset?: number } = {}): DealerRow[] {
  const where = opts.username ? "AND u.username = ?" : ""
  const params: (string | number)[] = opts.username ? [opts.username] : []
  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0

  return getDb()
    .prepare(
      `SELECT u.id, u.name, u.username, u.designation, u.image, u.status,
              u.is_banned, u.is_dealer, u.address, u.email, u.phone, u.kyc_status,
              (SELECT COUNT(*) FROM cars c WHERE c.agent_id = u.id AND ${PUBLIC_CARS}) AS total_car
       FROM users u
       WHERE ${PUBLIC_DEALER} ${where}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as unknown as DealerRow[]
}

export function countDealers(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM users u WHERE ${PUBLIC_DEALER}`)
    .get() as { n: number } | undefined
  return row?.n ?? 0
}

export function dealerOut(dealer: DealerRow, origin: string): Record<string, unknown> {
  return {
    id: dealer.id,
    name: dealer.name ?? "",
    username: dealer.username ?? "",
    designation: dealer.designation ?? "",
    image: absImage(dealer.image, origin),
    status: dealer.status ?? "",
    is_banned: dealer.is_banned ?? "no",
    is_dealer: dealer.is_dealer,
    address: dealer.address ?? "",
    email: dealer.email ?? "",
    phone: dealer.phone ?? "",
    kyc_status: dealer.kyc_status ?? "",
    total_car: dealer.total_car ?? 0,
  }
}

/* ------------------------------------------------------------------ */
/* Listing search                                                      */
/* ------------------------------------------------------------------ */

/**
 * Collects PHP-style repeated params (`purpose[0]`, `purpose[1]`, …).
 *
 * The app builds these by hand to imitate how Laravel received arrays, so a
 * plain `getAll()` misses them entirely. Bare `purpose` is accepted too.
 */
export function arrayParam(params: URLSearchParams, name: string): string[] {
  const out: string[] = []
  for (const [key, value] of params.entries()) {
    if ((key === name || key.startsWith(`${name}[`)) && value.trim()) out.push(value.trim())
  }
  return out
}

/**
 * Some values arrive as a stringified Dart list — `"[1, 2]"` — because the app
 * calls `.toString()` on a List. Unwrap those into real values.
 */
export function looseList(raw: string | null): string[] {
  if (!raw) return []
  const trimmed = raw.trim().replace(/^\[|\]$/g, "")
  if (!trimmed || trimmed === "null") return []
  return trimmed
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v && v !== "null")
}

const CAR_COLUMNS = `
  SELECT c.*,
         ct.title, ct.description, ct.address,
         bt.name  AS brand_name,
         b.slug   AS brand_slug,
         cityt.name AS city_name,
         co.name  AS country_name
  FROM cars c
  LEFT JOIN car_translations  ct    ON ct.car_id = c.id    AND ct.lang_code = ?
  LEFT JOIN brands            b     ON b.id = c.brand_id
  LEFT JOIN brand_translations bt   ON bt.brand_id = c.brand_id AND bt.lang_code = ?
  LEFT JOIN cities            city  ON city.id = c.city_id
  LEFT JOIN city_translations cityt ON cityt.city_id = c.city_id AND cityt.lang_code = ?
  LEFT JOIN countries         co    ON co.id = c.country_id
`

export interface MobileCarFilters {
  lang: string
  search?: string
  brands?: string[]
  purposes?: string[]
  conditions?: string[]
  location?: string
  countryId?: string
  agentId?: number
  page: number
  perPage: number
}

/** Listing search shaped to the query params the app actually sends. */
export function searchCars(f: MobileCarFilters): { cars: Car[]; total: number } {
  const db = getDb()
  const where: string[] = [PUBLIC_CARS]
  const params: (string | number)[] = [f.lang, f.lang, f.lang]

  if (f.search) {
    where.push("(ct.title LIKE ? OR c.car_model LIKE ? OR bt.name LIKE ?)")
    const like = `%${f.search}%`
    params.push(like, like, like)
  }
  if (f.brands?.length) {
    // The app sends brand ids in some flows and slugs in others.
    where.push(`(c.brand_id IN (${f.brands.map(() => "?").join(",")}) OR b.slug IN (${f.brands.map(() => "?").join(",")}))`)
    params.push(...f.brands, ...f.brands)
  }
  if (f.purposes?.length) {
    where.push(`c.purpose IN (${f.purposes.map(() => "?").join(",")})`)
    params.push(...f.purposes)
  }
  if (f.conditions?.length) {
    where.push(`c.condition IN (${f.conditions.map(() => "?").join(",")})`)
    params.push(...f.conditions)
  }
  if (f.location) {
    where.push("(cityt.name = ? OR c.city_id = ?)")
    params.push(f.location, f.location)
  }
  if (f.countryId) {
    where.push("c.country_id = ?")
    params.push(f.countryId)
  }
  if (typeof f.agentId === "number") {
    where.push("c.agent_id = ?")
    params.push(f.agentId)
  }

  const whereSql = `WHERE ${where.join(" AND ")}`
  const offset = (f.page - 1) * f.perPage

  const countRow = db
    .prepare(
      `SELECT COUNT(*) AS n FROM cars c
       LEFT JOIN car_translations ct ON ct.car_id = c.id AND ct.lang_code = ?
       LEFT JOIN brands b ON b.id = c.brand_id
       LEFT JOIN brand_translations bt ON bt.brand_id = c.brand_id AND bt.lang_code = ?
       LEFT JOIN city_translations cityt ON cityt.city_id = c.city_id AND cityt.lang_code = ?
       ${whereSql}`,
    )
    .get(...params) as { n: number } | undefined

  const cars = db
    .prepare(`${CAR_COLUMNS} ${whereSql} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, f.perPage, offset) as unknown as Car[]

  return { cars, total: countRow?.n ?? 0 }
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

/**
 * Laravel's paginator envelope. The app reads `['cars']['data']` and friends,
 * so the `data` key is load-bearing; the rest is what Laravel sent alongside
 * and is kept so nothing downstream trips on a missing field.
 */
export function paginate<T>(items: T[], total: number, page: number, perPage: number, path: string) {
  const lastPage = Math.max(Math.ceil(total / perPage), 1)
  const from = total === 0 ? null : (page - 1) * perPage + 1
  const to = total === 0 ? null : Math.min(page * perPage, total)

  return {
    current_page: page,
    data: items,
    first_page_url: `${path}?page=1`,
    from,
    last_page: lastPage,
    last_page_url: `${path}?page=${lastPage}`,
    next_page_url: page < lastPage ? `${path}?page=${page + 1}` : null,
    path,
    per_page: perPage,
    prev_page_url: page > 1 ? `${path}?page=${page - 1}` : null,
    to,
    total,
  }
}

export function pageParams(request: Request, defaultPerPage = 12) {
  const params = new URL(request.url).searchParams
  const page = Math.max(Number(params.get("page") ?? 1) || 1, 1)
  const perPage = Math.min(Math.max(Number(params.get("per_page") ?? defaultPerPage) || defaultPerPage, 1), 60)
  return { page, perPage }
}

/* ------------------------------------------------------------------ */
/* Responses                                                           */
/* ------------------------------------------------------------------ */

/**
 * Cross-origin access, off unless `MOBILE_API_CORS_ORIGIN` is set.
 *
 * Native iOS and Android builds are not subject to CORS and need none of this.
 * It exists for Flutter *web* builds, which are — and which trigger a preflight
 * because the app sends `X-Requested-With`. Set it to a specific origin for a
 * staging web build; `*` is fine only while these endpoints stay public and
 * read-only, and must be revisited before any authenticated route is added.
 */
function corsHeaders(): Record<string, string> {
  const origin = process.env.MOBILE_API_CORS_ORIGIN
  if (!origin) return {}
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type, X-Requested-With, Authorization",
    "Access-Control-Max-Age": "86400",
    ...(origin === "*" ? {} : { Vary: "Origin" }),
  }
}

/** Preflight responder — re-export as `OPTIONS` from any route that needs it. */
export function corsPreflight() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

/**
 * The app's NetworkParser treats any non-2xx as a failure and surfaces
 * `message`, matching how Laravel reported errors.
 */
export function apiError(message: string, status = 400) {
  return Response.json({ message }, { status, headers: corsHeaders() })
}

export function apiOk(body: unknown) {
  return Response.json(body, {
    headers: { "Cache-Control": "no-store", ...corsHeaders() },
  })
}
