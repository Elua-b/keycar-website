import "server-only"
import { getDb, LANG } from "./db"

/**
 * Brand management. Like cars, a brand has an uploaded image (its logo) and a
 * translated name, so the name lives in `brand_translations` and everything
 * else in `brands` — the same split the Laravel schema uses.
 */

export interface AdminBrand {
  id: number
  image: string | null
  slug: string
  status: string
  name: string | null
  car_count: number
  created_at: string | null
  updated_at: string | null
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")

const BRAND_SELECT = `
  SELECT b.*, t.name,
         (SELECT COUNT(*) FROM cars c WHERE c.brand_id = b.id) AS car_count
  FROM brands b
  LEFT JOIN brand_translations t ON t.brand_id = b.id AND t.lang_code = ?
`

export function getBrandsForAdmin(): AdminBrand[] {
  return getDb()
    .prepare(`${BRAND_SELECT} ORDER BY t.name`)
    .all(LANG) as unknown as AdminBrand[]
}

export function getBrand(id: number): AdminBrand | null {
  const row = getDb().prepare(`${BRAND_SELECT} WHERE b.id = ? LIMIT 1`).get(LANG, id) as unknown as
    | AdminBrand
    | undefined
  return row ?? null
}

/** Slugs appear in listing URLs (`/listings?brand=kia`), so they must be unique. */
function uniqueSlug(name: string, ignoreId = 0): string {
  const db = getDb()
  const root =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "brand"
  let slug = root
  let n = 1
  for (;;) {
    const clash = db.prepare("SELECT id FROM brands WHERE slug = ? AND id != ? LIMIT 1").get(slug, ignoreId) as
      | { id: number }
      | undefined
    if (!clash) return slug
    slug = `${root}-${++n}`
  }
}

export interface BrandInput {
  name: string
  image: string | null
  status: string
}

export function createBrand(input: BrandInput): { ok: boolean; id?: number; error?: string } {
  const db = getDb()
  const name = input.name.trim()
  if (name.length < 1) return { ok: false, error: "Enter a brand name." }

  const duplicate = db
    .prepare("SELECT brand_id FROM brand_translations WHERE lower(name) = lower(?) AND lang_code = ? LIMIT 1")
    .get(name, LANG) as { brand_id: number } | undefined
  if (duplicate) return { ok: false, error: `“${name}” already exists.` }

  const ts = now()
  const info = db
    .prepare("INSERT INTO brands (image, slug, status, created_at, updated_at) VALUES (?,?,?,?,?)")
    .run(input.image, uniqueSlug(name), input.status === "disable" ? "disable" : "enable", ts, ts)
  const id = Number(info.lastInsertRowid)

  db.prepare(
    "INSERT INTO brand_translations (brand_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(id, LANG, name, ts, ts)

  return { ok: true, id }
}

export function updateBrand(id: number, input: BrandInput): { ok: boolean; error?: string } {
  const db = getDb()
  const name = input.name.trim()
  if (name.length < 1) return { ok: false, error: "Enter a brand name." }

  const duplicate = db
    .prepare(
      `SELECT brand_id FROM brand_translations
       WHERE lower(name) = lower(?) AND lang_code = ? AND brand_id != ? LIMIT 1`,
    )
    .get(name, LANG, id) as { brand_id: number } | undefined
  if (duplicate) return { ok: false, error: `“${name}” already exists.` }

  const ts = now()
  db.prepare("UPDATE brands SET image = ?, slug = ?, status = ?, updated_at = ? WHERE id = ?").run(
    input.image,
    uniqueSlug(name, id),
    input.status === "disable" ? "disable" : "enable",
    ts,
    id,
  )

  const existing = db
    .prepare("SELECT id FROM brand_translations WHERE brand_id = ? AND lang_code = ?")
    .get(id, LANG) as { id: number } | undefined

  if (existing) {
    db.prepare("UPDATE brand_translations SET name = ?, updated_at = ? WHERE id = ?").run(name, ts, existing.id)
  } else {
    db.prepare(
      "INSERT INTO brand_translations (brand_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
    ).run(id, LANG, name, ts, ts)
  }

  return { ok: true }
}

/** Refused while listings still point at the brand, so nothing is orphaned. */
export function deleteBrand(id: number): { ok: boolean; error?: string } {
  const db = getDb()
  const cars = (db.prepare("SELECT COUNT(*) AS n FROM cars WHERE brand_id = ?").get(id) as { n: number }).n
  if (cars > 0) {
    return {
      ok: false,
      error: `${cars} listing${cars === 1 ? "" : "s"} still use this brand. Reassign or delete those first.`,
    }
  }

  db.prepare("DELETE FROM brand_translations WHERE brand_id = ?").run(id)
  db.prepare("DELETE FROM brands WHERE id = ?").run(id)
  return { ok: true }
}

export function setBrandStatus(id: number, status: string): void {
  getDb()
    .prepare("UPDATE brands SET status = ?, updated_at = ? WHERE id = ?")
    .run(status === "enable" ? "enable" : "disable", now(), id)
}

export function countBrands() {
  const db = getDb()
  const n = (sql: string) => (db.prepare(sql).get() as { n: number }).n
  return {
    total: n("SELECT COUNT(*) AS n FROM brands"),
    enabled: n("SELECT COUNT(*) AS n FROM brands WHERE status = 'enable'"),
    withoutImage: n("SELECT COUNT(*) AS n FROM brands WHERE image IS NULL OR image = ''"),
  }
}
