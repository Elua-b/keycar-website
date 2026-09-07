import "server-only"
import { DatabaseSync } from "node:sqlite"

/**
 * Every car, brand and settings query. Table and column names mirror the
 * schema the Laravel app used, so production data imports without conversion.
 */

const DB_PATH = process.env.DATABASE_PATH

if (!DB_PATH) {
  throw new Error("DATABASE_PATH is not set. Run `npm run init-db`, or point it at your SQLite file.")
}

// Next.js hot-reloads modules in dev; keep one handle on globalThis so we
// don't leak file descriptors across reloads.
const globalForDb = globalThis as unknown as { __keycarDb?: DatabaseSync }

function connect(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH!, { readOnly: false })
  // WAL keeps readers from blocking the writer, which matters under concurrent requests.
  db.exec("PRAGMA journal_mode = WAL")
  db.exec("PRAGMA busy_timeout = 5000")
  return db
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__keycarDb) {
    globalForDb.__keycarDb = connect()
  }
  return globalForDb.__keycarDb
}

export const LANG = process.env.DEFAULT_LANG || "en"

/* ------------------------------------------------------------------ */
/* Types — one field per Laravel column                                */
/* ------------------------------------------------------------------ */

export interface Car {
  id: number
  agent_id: number
  brand_id: number
  city_id: number
  country_id: number
  thumb_image: string
  slug: string
  features: string | null
  purpose: string | null
  condition: string
  total_view: number
  regular_price: number
  offer_price: number | null
  video_id: string | null
  video_image: string | null
  google_map: string | null
  body_type: string | null
  engine_size: string | null
  drive: string | null
  interior_color: string | null
  exterior_color: string | null
  year: string | null
  mileage: string | null
  number_of_owner: string | null
  fuel_type: string | null
  transmission: string | null
  seller_type: string | null
  expired_date: string | null
  rent_period: string | null
  car_model: string | null
  is_featured: string
  status: string
  approved_by_admin: string
  is_draft: string
  created_at: string | null
  updated_at: string | null
  // joined
  title: string
  description: string | null
  address: string | null
  seo_title: string | null
  seo_description: string | null
  brand_name: string | null
  brand_slug: string | null
  city_name: string | null
  country_name: string | null
}

export interface Brand {
  id: number
  image: string
  slug: string
  status: string
  name: string | null
  car_count?: number
}

export interface CityRow {
  id: number
  country_id: number
  name: string | null
}

export interface GalleryImage {
  id: number
  car_id: number
  image: string | null
}

/* ------------------------------------------------------------------ */
/* Shared SQL fragments                                                */
/* ------------------------------------------------------------------ */

const CAR_SELECT = `
  SELECT c.*,
         ct.title, ct.description, ct.address, ct.seo_title, ct.seo_description,
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

/** Only cars the public should see — same conditions the Laravel front-end used. */
const PUBLIC_WHERE = `
  c.status = 'enable'
  AND c.approved_by_admin = 'approved'
  AND c.is_draft = 'disable'
`

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export interface CarFilters {
  q?: string
  brand?: string
  purpose?: string
  condition?: string
  bodyType?: string
  fuelType?: string
  transmission?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  sort?: string
  page?: number
  perPage?: number
}

export function getCars(filters: CarFilters = {}): { cars: Car[]; total: number } {
  const db = getDb()
  const where: string[] = [PUBLIC_WHERE]
  const params: (string | number)[] = [LANG, LANG, LANG]

  if (filters.q) {
    where.push("(ct.title LIKE ? OR c.car_model LIKE ? OR bt.name LIKE ?)")
    const like = `%${filters.q}%`
    params.push(like, like, like)
  }
  if (filters.brand) {
    where.push("b.slug = ?")
    params.push(filters.brand)
  }
  if (filters.purpose) {
    where.push("c.purpose = ?")
    params.push(filters.purpose)
  }
  if (filters.condition) {
    where.push("c.condition = ?")
    params.push(filters.condition)
  }
  if (filters.bodyType) {
    where.push("c.body_type = ?")
    params.push(filters.bodyType)
  }
  if (filters.fuelType) {
    where.push("c.fuel_type = ?")
    params.push(filters.fuelType)
  }
  if (filters.transmission) {
    where.push("c.transmission = ?")
    params.push(filters.transmission)
  }
  if (filters.city) {
    where.push("cityt.name = ?")
    params.push(filters.city)
  }
  if (typeof filters.minPrice === "number") {
    where.push("COALESCE(NULLIF(c.offer_price, 0), c.regular_price) >= ?")
    params.push(filters.minPrice)
  }
  if (typeof filters.maxPrice === "number") {
    where.push("COALESCE(NULLIF(c.offer_price, 0), c.regular_price) <= ?")
    params.push(filters.maxPrice)
  }
  if (typeof filters.minYear === "number") {
    where.push("CAST(c.year AS INTEGER) >= ?")
    params.push(filters.minYear)
  }
  if (typeof filters.maxYear === "number") {
    where.push("CAST(c.year AS INTEGER) <= ?")
    params.push(filters.maxYear)
  }

  const whereSql = `WHERE ${where.join(" AND ")}`

  const orderBy =
    {
      price_asc: "COALESCE(NULLIF(c.offer_price, 0), c.regular_price) ASC",
      price_desc: "COALESCE(NULLIF(c.offer_price, 0), c.regular_price) DESC",
      year_desc: "CAST(c.year AS INTEGER) DESC",
      year_asc: "CAST(c.year AS INTEGER) ASC",
      popular: "c.total_view DESC",
      oldest: "c.created_at ASC",
    }[filters.sort ?? "latest"] ?? "c.created_at DESC"

  const perPage = Math.min(Math.max(filters.perPage ?? 12, 1), 60)
  const page = Math.max(filters.page ?? 1, 1)
  const offset = (page - 1) * perPage

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
    .prepare(`${CAR_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, perPage, offset) as unknown as Car[]

  return { cars, total: countRow?.n ?? 0 }
}

export function getCarBySlug(slug: string): Car | null {
  const db = getDb()
  const row = db
    .prepare(`${CAR_SELECT} WHERE c.slug = ? AND ${PUBLIC_WHERE} LIMIT 1`)
    .get(LANG, LANG, LANG, slug) as unknown as Car | undefined
  return row ?? null
}

export function getCarById(id: number): Car | null {
  const db = getDb()
  const row = db.prepare(`${CAR_SELECT} WHERE c.id = ? LIMIT 1`).get(LANG, LANG, LANG, id) as unknown as
    | Car
    | undefined
  return row ?? null
}

export function getFeaturedCars(limit = 6): Car[] {
  const db = getDb()
  return db
    .prepare(
      `${CAR_SELECT} WHERE ${PUBLIC_WHERE} AND c.is_featured = 'enable'
       ORDER BY c.created_at DESC LIMIT ?`,
    )
    .all(LANG, LANG, LANG, limit) as unknown as Car[]
}

export function getLatestCars(limit = 6): Car[] {
  const db = getDb()
  return db
    .prepare(`${CAR_SELECT} WHERE ${PUBLIC_WHERE} ORDER BY c.created_at DESC LIMIT ?`)
    .all(LANG, LANG, LANG, limit) as unknown as Car[]
}

export function getRelatedCars(car: Car, limit = 3): Car[] {
  const db = getDb()
  return db
    .prepare(
      `${CAR_SELECT} WHERE ${PUBLIC_WHERE} AND c.id != ?
       ORDER BY (c.brand_id = ?) DESC, (c.body_type = ?) DESC, c.created_at DESC LIMIT ?`,
    )
    .all(LANG, LANG, LANG, car.id, car.brand_id, car.body_type ?? "", limit) as unknown as Car[]
}

export function getGallery(carId: number): GalleryImage[] {
  const db = getDb()
  return db
    .prepare("SELECT id, car_id, image FROM car_galleries WHERE car_id = ? ORDER BY id")
    .all(carId) as unknown as GalleryImage[]
}

export function getBrands(onlyWithCars = false): Brand[] {
  const db = getDb()
  const having = onlyWithCars ? "HAVING car_count > 0" : ""
  return db
    .prepare(
      `SELECT b.id, b.image, b.slug, b.status, bt.name,
              (SELECT COUNT(*) FROM cars c WHERE c.brand_id = b.id AND ${PUBLIC_WHERE}) AS car_count
       FROM brands b
       LEFT JOIN brand_translations bt ON bt.brand_id = b.id AND bt.lang_code = ?
       WHERE b.status = 'enable'
       GROUP BY b.id
       ${having}
       ORDER BY bt.name`,
    )
    .all(LANG) as unknown as Brand[]
}

export function getCities(): CityRow[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT ci.id, ci.country_id, t.name
       FROM cities ci
       LEFT JOIN city_translations t ON t.city_id = ci.id AND t.lang_code = ?
       ORDER BY t.name`,
    )
    .all(LANG) as unknown as CityRow[]
}

/** Distinct values actually present in the data, for building filter dropdowns. */
export function getFilterOptions() {
  const db = getDb()
  const distinct = (col: string): string[] =>
    (
      db
        .prepare(
          `SELECT DISTINCT ${col} AS v FROM cars c
           WHERE ${PUBLIC_WHERE} AND ${col} IS NOT NULL AND ${col} != ''
           ORDER BY v`,
        )
        .all() as unknown as { v: string }[]
    ).map((r) => r.v)

  const range = db
    .prepare(
      `SELECT MIN(COALESCE(NULLIF(offer_price, 0), regular_price)) AS minPrice,
              MAX(COALESCE(NULLIF(offer_price, 0), regular_price)) AS maxPrice
       FROM cars c WHERE ${PUBLIC_WHERE}`,
    )
    .get() as { minPrice: number | null; maxPrice: number | null } | undefined

  return {
    bodyTypes: distinct("c.body_type"),
    fuelTypes: distinct("c.fuel_type"),
    transmissions: distinct("c.transmission"),
    conditions: distinct("c.condition"),
    purposes: distinct("c.purpose"),
    years: distinct("c.year"),
    minPrice: range?.minPrice ?? 0,
    maxPrice: range?.maxPrice ?? 0,
  }
}

export function getSettings() {
  const db = getDb()
  const row = db.prepare("SELECT * FROM settings LIMIT 1").get() as Record<string, unknown> | undefined
  return {
    app_name: (row?.app_name as string) || process.env.APP_NAME || "Keycar",
    logo: (row?.logo as string) || null,
    email: (row?.email as string) || null,
    phone: (row?.phone as string) || null,
    address: (row?.address as string) || null,
    about_us: (row?.about_us as string) || null,
    copyright: (row?.copyright as string) || null,
    facebook: (row?.facebook as string) || null,
    instagram: (row?.instagram as string) || null,
    linkedin: (row?.linkedin as string) || null,
    twitter: (row?.twitter as string) || null,
    open_day: (row?.open_day as string) || null,
    closed_day: (row?.closed_day as string) || null,
    contact_message_mail: (row?.contact_message_mail as string) || (row?.email as string) || null,
    send_contact_message: (row?.send_contact_message as string) || "disable",
    save_contact_message: (row?.save_contact_message as string) || "enable",
  }
}

export interface ContactSettingsInput {
  contact_message_mail: string
  send_contact_message: boolean
  save_contact_message: boolean
}

/** The three toggles the Laravel ContactMessage settings form wrote. */
export function updateContactSettings(input: ContactSettingsInput): void {
  const db = getDb()
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
  const row = db.prepare("SELECT id FROM settings LIMIT 1").get() as { id: number } | undefined

  if (row) {
    db.prepare(
      "UPDATE settings SET contact_message_mail = ?, send_contact_message = ?, save_contact_message = ?, updated_at = ? WHERE id = ?",
    ).run(
      input.contact_message_mail,
      input.send_contact_message ? "enable" : "disable",
      input.save_contact_message ? "enable" : "disable",
      ts,
      row.id,
    )
  } else {
    db.prepare(
      `INSERT INTO settings (contact_message_mail, send_contact_message, save_contact_message, created_at, updated_at)
       VALUES (?,?,?,?,?)`,
    ).run(
      input.contact_message_mail,
      input.send_contact_message ? "enable" : "disable",
      input.save_contact_message ? "enable" : "disable",
      ts,
      ts,
    )
  }
}

export function getCurrency() {
  const db = getDb()
  const row = db
    .prepare("SELECT currency_icon, currency_code, currency_position FROM multi_currencies WHERE is_default = 'Yes' LIMIT 1")
    .get() as { currency_icon: string; currency_code: string; currency_position: string } | undefined
  return {
    icon: row?.currency_icon ?? "RWF",
    code: row?.currency_code ?? "RWF",
    position: row?.currency_position ?? "after_price",
  }
}

export function getStats() {
  const db = getDb()
  const one = (sql: string) => ((db.prepare(sql).get() as { n: number } | undefined)?.n ?? 0)
  return {
    cars: one(`SELECT COUNT(*) AS n FROM cars c WHERE ${PUBLIC_WHERE}`),
    brands: one("SELECT COUNT(*) AS n FROM brands WHERE status = 'enable'"),
    cities: one("SELECT COUNT(*) AS n FROM cities"),
    dealers: one("SELECT COUNT(*) AS n FROM users WHERE is_dealer = 1"),
  }
}

export function incrementCarView(id: number): void {
  try {
    getDb().prepare("UPDATE cars SET total_view = total_view + 1 WHERE id = ?").run(id)
  } catch {
    // A view counter is never worth failing a page render over.
  }
}

/* ------------------------------------------------------------------ */
/* Admin-side reads and writes                                         */
/* ------------------------------------------------------------------ */

export function getAllCarsForAdmin(): Car[] {
  return getCarsForAdmin("all")
}

/**
 * The admin car list, sliced the way the Laravel module sliced it: everything,
 * the approval queue, the featured set, or drafts.
 */
export type CarScope = "all" | "awaiting" | "featured" | "draft" | "enable" | "disable"

export function getCarsForAdmin(scope: CarScope = "all"): (Car & { agent_name: string | null })[] {
  const where =
    {
      awaiting: "WHERE c.approved_by_admin = 'pending' AND c.is_draft = 'disable'",
      featured: "WHERE c.is_featured = 'enable' AND c.is_draft = 'disable'",
      draft: "WHERE c.is_draft = 'enable'",
      enable: "WHERE c.status = 'enable' AND c.is_draft = 'disable'",
      disable: "WHERE c.status = 'disable' AND c.is_draft = 'disable'",
    }[scope as Exclude<CarScope, "all">] ?? ""

  return getDb()
    .prepare(
      `SELECT c.*, ct.title, ct.description, ct.address, ct.seo_title, ct.seo_description,
              bt.name AS brand_name, b.slug AS brand_slug,
              cityt.name AS city_name, co.name AS country_name,
              ag.name AS agent_name
       FROM cars c
       LEFT JOIN car_translations  ct    ON ct.car_id = c.id    AND ct.lang_code = ?
       LEFT JOIN brands            b     ON b.id = c.brand_id
       LEFT JOIN brand_translations bt   ON bt.brand_id = c.brand_id AND bt.lang_code = ?
       LEFT JOIN cities            city  ON city.id = c.city_id
       LEFT JOIN city_translations cityt ON cityt.city_id = c.city_id AND cityt.lang_code = ?
       LEFT JOIN countries         co    ON co.id = c.country_id
       LEFT JOIN users             ag    ON ag.id = c.agent_id
       ${where}
       ORDER BY c.created_at DESC`,
    )
    .all(LANG, LANG, LANG) as unknown as (Car & { agent_name: string | null })[]
}

export function countAwaitingCars(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM cars WHERE approved_by_admin = 'pending' AND is_draft = 'disable'")
    .get() as { n: number } | undefined
  return row?.n ?? 0
}

/** Approving also publishes, which is what the Laravel `car_approval` action did. */
export function setCarApproval(id: number, approved: boolean): void {
  const db = getDb()
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ")
  if (approved) {
    db.prepare("UPDATE cars SET approved_by_admin = 'approved', status = 'enable', updated_at = ? WHERE id = ?").run(
      ts,
      id,
    )
  } else {
    db.prepare("UPDATE cars SET approved_by_admin = 'pending', status = 'disable', updated_at = ? WHERE id = ?").run(
      ts,
      id,
    )
  }
}

export function setCarAgent(id: number, agentId: number): void {
  getDb()
    .prepare("UPDATE cars SET agent_id = ?, updated_at = ? WHERE id = ?")
    .run(agentId, new Date().toISOString().slice(0, 19).replace("T", " "), id)
}

export function getAdminByEmail(email: string) {
  const db = getDb()
  return db.prepare("SELECT * FROM admins WHERE email = ? LIMIT 1").get(email) as
    | { id: number; name: string; email: string; password: string; status: string; image: string | null }
    | undefined
}

export function getAdminById(id: number) {
  const db = getDb()
  return db.prepare("SELECT id, name, email, image, status FROM admins WHERE id = ? LIMIT 1").get(id) as
    | { id: number; name: string; email: string; image: string | null; status: string }
    | undefined
}

export interface CarInput {
  agent_id: number
  title: string
  description: string
  address: string
  brand_id: number
  city_id: number
  country_id: number
  car_model: string | null
  purpose: string
  condition: string
  regular_price: number
  offer_price: number | null
  body_type: string | null
  engine_size: string | null
  drive: string | null
  interior_color: string | null
  exterior_color: string | null
  year: string | null
  mileage: string | null
  number_of_owner: string | null
  fuel_type: string | null
  transmission: string | null
  seller_type: string | null
  rent_period: string | null
  thumb_image: string
  features: string[]
  gallery: string[]
  is_featured: string
  status: string
}

function uniqueSlug(base: string, ignoreId?: number): string {
  const db = getDb()
  const root =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "car"
  let slug = root
  let n = 1
  for (;;) {
    const clash = db.prepare("SELECT id FROM cars WHERE slug = ? AND id != ? LIMIT 1").get(slug, ignoreId ?? 0) as
      | { id: number }
      | undefined
    if (!clash) return slug
    slug = `${root}-${++n}`
  }
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")

export function createCar(input: CarInput): number {
  const db = getDb()
  const slug = uniqueSlug(input.title)
  const ts = now()

  const info = db
    .prepare(
      `INSERT INTO cars (
        agent_id, brand_id, city_id, country_id, thumb_image, slug, features, purpose,
        condition, total_view, regular_price, offer_price, body_type, engine_size, drive,
        interior_color, exterior_color, year, mileage, number_of_owner, fuel_type,
        transmission, seller_type, rent_period, car_model, is_featured, status,
        approved_by_admin, is_draft, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'approved','disable',?,?)`,
    )
    .run(
      input.agent_id,
      input.brand_id,
      input.city_id,
      input.country_id,
      input.thumb_image,
      slug,
      JSON.stringify(input.features ?? []),
      input.purpose,
      input.condition,
      input.regular_price,
      input.offer_price,
      input.body_type,
      input.engine_size,
      input.drive,
      input.interior_color,
      input.exterior_color,
      input.year,
      input.mileage,
      input.number_of_owner,
      input.fuel_type,
      input.transmission,
      input.seller_type,
      input.rent_period,
      input.car_model,
      input.is_featured,
      input.status,
      ts,
      ts,
    )

  const carId = Number(info.lastInsertRowid)

  db.prepare(
    `INSERT INTO car_translations (car_id, lang_code, title, description, address, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?)`,
  ).run(carId, LANG, input.title, input.description, input.address, ts, ts)

  const insertImg = db.prepare(
    "INSERT INTO car_galleries (car_id, image, created_at, updated_at) VALUES (?,?,?,?)",
  )
  for (const url of input.gallery ?? []) insertImg.run(carId, url, ts, ts)

  return carId
}

export function updateCar(id: number, input: CarInput): void {
  const db = getDb()
  const ts = now()
  const slug = uniqueSlug(input.title, id)

  db.prepare(
    `UPDATE cars SET
      agent_id=?, brand_id=?, city_id=?, country_id=?, thumb_image=?, slug=?, features=?, purpose=?,
      condition=?, regular_price=?, offer_price=?, body_type=?, engine_size=?, drive=?,
      interior_color=?, exterior_color=?, year=?, mileage=?, number_of_owner=?, fuel_type=?,
      transmission=?, seller_type=?, rent_period=?, car_model=?, is_featured=?, status=?, updated_at=?
     WHERE id=?`,
  ).run(
    input.agent_id,
    input.brand_id,
    input.city_id,
    input.country_id,
    input.thumb_image,
    slug,
    JSON.stringify(input.features ?? []),
    input.purpose,
    input.condition,
    input.regular_price,
    input.offer_price,
    input.body_type,
    input.engine_size,
    input.drive,
    input.interior_color,
    input.exterior_color,
    input.year,
    input.mileage,
    input.number_of_owner,
    input.fuel_type,
    input.transmission,
    input.seller_type,
    input.rent_period,
    input.car_model,
    input.is_featured,
    input.status,
    ts,
    id,
  )

  const existing = db.prepare("SELECT id FROM car_translations WHERE car_id = ? AND lang_code = ?").get(id, LANG) as
    | { id: number }
    | undefined

  if (existing) {
    db.prepare(
      "UPDATE car_translations SET title=?, description=?, address=?, updated_at=? WHERE id=?",
    ).run(input.title, input.description, input.address, ts, existing.id)
  } else {
    db.prepare(
      `INSERT INTO car_translations (car_id, lang_code, title, description, address, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(id, LANG, input.title, input.description, input.address, ts, ts)
  }

  // Gallery is replaced wholesale — the form always submits the full list.
  db.prepare("DELETE FROM car_galleries WHERE car_id = ?").run(id)
  const insertImg = db.prepare(
    "INSERT INTO car_galleries (car_id, image, created_at, updated_at) VALUES (?,?,?,?)",
  )
  for (const url of input.gallery ?? []) insertImg.run(id, url, ts, ts)
}

export function deleteCar(id: number): void {
  const db = getDb()
  db.prepare("DELETE FROM car_galleries WHERE car_id = ?").run(id)
  db.prepare("DELETE FROM car_translations WHERE car_id = ?").run(id)
  db.prepare("DELETE FROM cars WHERE id = ?").run(id)
}

export function setCarStatus(id: number, status: string): void {
  getDb().prepare("UPDATE cars SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), id)
}

export function setCarFeatured(id: number, featured: string): void {
  getDb().prepare("UPDATE cars SET is_featured = ?, updated_at = ? WHERE id = ?").run(featured, now(), id)
}

export function getAdminStats() {
  const db = getDb()
  const one = (sql: string) => ((db.prepare(sql).get() as { n: number } | undefined)?.n ?? 0)
  return {
    totalCars: one("SELECT COUNT(*) AS n FROM cars"),
    published: one("SELECT COUNT(*) AS n FROM cars WHERE status = 'enable'"),
    featured: one("SELECT COUNT(*) AS n FROM cars WHERE is_featured = 'enable'"),
    drafts: one("SELECT COUNT(*) AS n FROM cars WHERE is_draft = 'enable'"),
    brands: one("SELECT COUNT(*) AS n FROM brands"),
    views: one("SELECT COALESCE(SUM(total_view), 0) AS n FROM cars"),
  }
}

/** Contact form target — the Laravel app kept one row in contact_us. */
export function getContactInfo() {
  const db = getDb()
  const row = db.prepare("SELECT phone, email, map_code FROM contact_us LIMIT 1").get() as
    | { phone: string | null; email: string | null; map_code: string | null }
    | undefined
  return row ?? { phone: null, email: null, map_code: null }
}

/** Slugs and change dates for every publicly visible car — used by the sitemap. */
export function getPublicCarSlugs(): { slug: string; updated_at: string | null }[] {
  return getDb()
    .prepare(`SELECT c.slug, c.updated_at FROM cars c WHERE ${PUBLIC_WHERE} ORDER BY c.created_at DESC`)
    .all() as unknown as { slug: string; updated_at: string | null }[]
}
