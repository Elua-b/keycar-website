import "server-only"
import { getDb, LANG } from "./db"

/**
 * Countries and cities — the Laravel Country and City modules. A country is a
 * plain row; a city carries its name in `city_translations`, one row per
 * language, which is why creating one always writes two rows.
 *
 * Both deletes are guarded exactly the way Laravel guarded them: you cannot
 * remove a place that listings still point at.
 */

export interface Country {
  id: number
  name: string | null
  code: string | null
  created_at: string | null
  // joined
  city_count?: number
  car_count?: number
}

export interface City {
  id: number
  country_id: number
  created_at: string | null
  // joined
  name: string | null
  country_name: string | null
  car_count?: number
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")

/* ---- countries -------------------------------------------------------- */

export function getCountries(): Country[] {
  return getDb()
    .prepare(
      `SELECT co.*,
              (SELECT COUNT(*) FROM cities ci WHERE ci.country_id = co.id) AS city_count,
              (SELECT COUNT(*) FROM cars c WHERE c.country_id = co.id) AS car_count
       FROM countries co ORDER BY co.name`,
    )
    .all() as unknown as Country[]
}

export function getCountry(id: number): Country | null {
  return (getDb().prepare("SELECT * FROM countries WHERE id = ?").get(id) as unknown as Country) ?? null
}

export function createCountry(name: string, code: string | null): number {
  const ts = now()
  const info = getDb()
    .prepare("INSERT INTO countries (name, code, created_at, updated_at) VALUES (?,?,?,?)")
    .run(name, code, ts, ts)
  return Number(info.lastInsertRowid)
}

export function updateCountry(id: number, name: string, code: string | null): void {
  getDb()
    .prepare("UPDATE countries SET name = ?, code = ?, updated_at = ? WHERE id = ?")
    .run(name, code, now(), id)
}

export function deleteCountry(id: number): { ok: boolean; error?: string } {
  const db = getDb()
  const cities = (db.prepare("SELECT COUNT(*) AS n FROM cities WHERE country_id = ?").get(id) as { n: number }).n
  const cars = (db.prepare("SELECT COUNT(*) AS n FROM cars WHERE country_id = ?").get(id) as { n: number }).n

  if (cities > 0 || cars > 0) {
    const parts = [cities ? `${cities} city${cities === 1 ? "" : "s"}` : "", cars ? `${cars} listing${cars === 1 ? "" : "s"}` : ""]
      .filter(Boolean)
      .join(" and ")
    return { ok: false, error: `${parts} still belong to this country. Remove those first.` }
  }

  db.prepare("DELETE FROM countries WHERE id = ?").run(id)
  return { ok: true }
}

/* ---- cities ----------------------------------------------------------- */

const CITY_SELECT = `
  SELECT ci.*, t.name, co.name AS country_name,
         (SELECT COUNT(*) FROM cars c WHERE c.city_id = ci.id) AS car_count
  FROM cities ci
  LEFT JOIN city_translations t ON t.city_id = ci.id AND t.lang_code = ?
  LEFT JOIN countries co ON co.id = ci.country_id
`

export function getCitiesForAdmin(): City[] {
  return getDb().prepare(`${CITY_SELECT} ORDER BY co.name, t.name`).all(LANG) as unknown as City[]
}

export function getCity(id: number): City | null {
  const row = getDb().prepare(`${CITY_SELECT} WHERE ci.id = ? LIMIT 1`).get(LANG, id) as unknown as City | undefined
  return row ?? null
}

export function createCity(name: string, countryId: number): number {
  const db = getDb()
  const ts = now()
  const id = Number(
    db.prepare("INSERT INTO cities (country_id, created_at, updated_at) VALUES (?,?,?)").run(countryId, ts, ts)
      .lastInsertRowid,
  )
  db.prepare(
    "INSERT INTO city_translations (city_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
  ).run(id, LANG, name, ts, ts)
  return id
}

export function updateCity(id: number, name: string, countryId: number): void {
  const db = getDb()
  const ts = now()
  db.prepare("UPDATE cities SET country_id = ?, updated_at = ? WHERE id = ?").run(countryId, ts, id)

  const existing = db.prepare("SELECT id FROM city_translations WHERE city_id = ? AND lang_code = ?").get(id, LANG) as
    | { id: number }
    | undefined

  if (existing) {
    db.prepare("UPDATE city_translations SET name = ?, updated_at = ? WHERE id = ?").run(name, ts, existing.id)
  } else {
    db.prepare(
      "INSERT INTO city_translations (city_id, lang_code, name, created_at, updated_at) VALUES (?,?,?,?,?)",
    ).run(id, LANG, name, ts, ts)
  }
}

export function deleteCity(id: number): { ok: boolean; error?: string } {
  const db = getDb()
  const cars = (db.prepare("SELECT COUNT(*) AS n FROM cars WHERE city_id = ?").get(id) as { n: number }).n
  if (cars > 0) {
    return { ok: false, error: `${cars} listing${cars === 1 ? "" : "s"} are in this city. Move them first.` }
  }

  db.prepare("DELETE FROM city_translations WHERE city_id = ?").run(id)
  db.prepare("DELETE FROM cities WHERE id = ?").run(id)
  return { ok: true }
}
