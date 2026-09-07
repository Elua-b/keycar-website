import "server-only"
import { getDb } from "./db"

/**
 * KYC is two tables, exactly as the Laravel Kyc module had them:
 *   kyc_types       — the documents you accept (National ID, Passport, …)
 *   kyc_information — one submission: a user, a type, a file and a status
 *
 * Status is an integer there and stays one here so both apps agree:
 *   0 pending · 1 approved · 2 rejected
 */

export const KYC_PENDING = 0
export const KYC_APPROVED = 1
export const KYC_REJECTED = 2

export const KYC_STATUS_LABEL: Record<number, string> = {
  [KYC_PENDING]: "Pending",
  [KYC_APPROVED]: "Approved",
  [KYC_REJECTED]: "Rejected",
}

export interface KycType {
  id: number
  name: string | null
  status: number
  created_at: string | null
  submission_count?: number
}

export interface KycSubmission {
  id: number
  kyc_id: number | null
  user_id: number | null
  file: string | null
  message: string | null
  status: number
  created_at: string | null
  // joined
  type_name: string | null
  user_name: string | null
  user_email: string | null
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")

/* ---- types ----------------------------------------------------------- */

export function getKycTypes(onlyActive = false): KycType[] {
  return getDb()
    .prepare(
      `SELECT t.*, (SELECT COUNT(*) FROM kyc_information k WHERE k.kyc_id = t.id) AS submission_count
       FROM kyc_types t ${onlyActive ? "WHERE t.status = 1" : ""} ORDER BY t.id DESC`,
    )
    .all() as unknown as KycType[]
}

export function getKycType(id: number): KycType | null {
  return (getDb().prepare("SELECT * FROM kyc_types WHERE id = ?").get(id) as unknown as KycType) ?? null
}

export function createKycType(name: string, status: boolean): number {
  const ts = now()
  const info = getDb()
    .prepare("INSERT INTO kyc_types (name, status, created_at, updated_at) VALUES (?,?,?,?)")
    .run(name, status ? 1 : 0, ts, ts)
  return Number(info.lastInsertRowid)
}

export function updateKycType(id: number, name: string, status: boolean): void {
  getDb()
    .prepare("UPDATE kyc_types SET name = ?, status = ?, updated_at = ? WHERE id = ?")
    .run(name, status ? 1 : 0, now(), id)
}

/** Laravel deletes the submissions filed under a type along with the type. */
export function deleteKycType(id: number): void {
  const db = getDb()
  db.prepare("DELETE FROM kyc_information WHERE kyc_id = ?").run(id)
  db.prepare("DELETE FROM kyc_types WHERE id = ?").run(id)
}

/* ---- submissions ------------------------------------------------------ */

export function getKycSubmissions(status?: number): KycSubmission[] {
  const where = typeof status === "number" ? "WHERE k.status = ?" : ""
  const args = typeof status === "number" ? [status] : []
  return getDb()
    .prepare(
      `SELECT k.*, t.name AS type_name, u.name AS user_name, u.email AS user_email
       FROM kyc_information k
       LEFT JOIN kyc_types t ON t.id = k.kyc_id
       LEFT JOIN users u ON u.id = k.user_id
       ${where}
       ORDER BY k.id DESC`,
    )
    .all(...args) as unknown as KycSubmission[]
}

export function getKycSubmission(id: number): KycSubmission | null {
  const row = getDb()
    .prepare(
      `SELECT k.*, t.name AS type_name, u.name AS user_name, u.email AS user_email
       FROM kyc_information k
       LEFT JOIN kyc_types t ON t.id = k.kyc_id
       LEFT JOIN users u ON u.id = k.user_id
       WHERE k.id = ? LIMIT 1`,
    )
    .get(id) as unknown as KycSubmission | undefined
  return row ?? null
}

export function countPendingKyc(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM kyc_information WHERE status = 0").get() as
    | { n: number }
    | undefined
  return row?.n ?? 0
}

export function createKycSubmission(input: {
  kyc_id: number
  user_id: number
  file: string
  message: string | null
}): number {
  const ts = now()
  const info = getDb()
    .prepare(
      `INSERT INTO kyc_information (kyc_id, user_id, file, message, status, created_at, updated_at)
       VALUES (?,?,?,?,0,?,?)`,
    )
    .run(input.kyc_id, input.user_id, input.file, input.message, ts, ts)
  return Number(info.lastInsertRowid)
}

/**
 * Approving a submission also stamps the user's own `kyc_status`, which is what
 * the front-end reads to show a "verified" badge.
 */
export function setKycStatus(id: number, status: number): void {
  const db = getDb()
  const clean = [KYC_PENDING, KYC_APPROVED, KYC_REJECTED].includes(status) ? status : KYC_PENDING

  db.prepare("UPDATE kyc_information SET status = ?, updated_at = ? WHERE id = ?").run(clean, now(), id)

  const row = db.prepare("SELECT user_id FROM kyc_information WHERE id = ?").get(id) as
    | { user_id: number | null }
    | undefined

  if (row?.user_id) {
    const label = clean === KYC_APPROVED ? "approved" : clean === KYC_REJECTED ? "rejected" : "pending"
    db.prepare("UPDATE users SET kyc_status = ?, updated_at = ? WHERE id = ?").run(label, now(), row.user_id)
  }
}

export function deleteKycSubmission(id: number): void {
  getDb().prepare("DELETE FROM kyc_information WHERE id = ?").run(id)
}
