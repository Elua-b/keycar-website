import "server-only"
import { getDb, LANG } from "./db"

/**
 * Listing reviews, left by a buyer against a car and its agent. Laravel gated
 * them behind an admin approval step — `status` is 'enable' once approved —
 * and only approved reviews reach the front-end.
 */

export interface Review {
  id: number
  user_id: number | null
  agent_id: number | null
  car_id: number | null
  rating: number
  comment: string | null
  status: string
  created_at: string | null
  // joined
  user_name: string | null
  user_email: string | null
  agent_name: string | null
  car_title: string | null
  car_slug: string | null
}

const REVIEW_SELECT = `
  SELECT r.*, u.name AS user_name, u.email AS user_email, a.name AS agent_name,
         ct.title AS car_title, c.slug AS car_slug
  FROM reviews r
  LEFT JOIN users u ON u.id = r.user_id
  LEFT JOIN users a ON a.id = r.agent_id
  LEFT JOIN cars c ON c.id = r.car_id
  LEFT JOIN car_translations ct ON ct.car_id = r.car_id AND ct.lang_code = ?
`

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")

export function getReviews(status?: string): Review[] {
  const where = status ? "WHERE r.status = ?" : ""
  const args: (string | number)[] = status ? [LANG, status] : [LANG]
  return getDb().prepare(`${REVIEW_SELECT} ${where} ORDER BY r.id DESC`).all(...args) as unknown as Review[]
}

export function getApprovedReviews(carId: number): Review[] {
  return getDb()
    .prepare(`${REVIEW_SELECT} WHERE r.car_id = ? AND r.status = 'enable' ORDER BY r.id DESC`)
    .all(LANG, carId) as unknown as Review[]
}

export function getCarRating(carId: number): { average: number; count: number } {
  const row = getDb()
    .prepare("SELECT AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE car_id = ? AND status = 'enable'")
    .get(carId) as { avg: number | null; n: number } | undefined
  return { average: row?.avg ? Math.round(row.avg * 10) / 10 : 0, count: row?.n ?? 0 }
}

export function countPendingReviews(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM reviews WHERE status != 'enable'").get() as
    | { n: number }
    | undefined
  return row?.n ?? 0
}

export function setReviewStatus(id: number, approved: boolean): void {
  getDb()
    .prepare("UPDATE reviews SET status = ?, updated_at = ? WHERE id = ?")
    .run(approved ? "enable" : "disable", now(), id)
}

export function deleteReview(id: number): void {
  getDb().prepare("DELETE FROM reviews WHERE id = ?").run(id)
}
