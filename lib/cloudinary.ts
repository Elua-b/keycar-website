import "server-only"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import path from "node:path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "cars")
const PUBLIC_PREFIX = "/uploads/cars"

// Kept for the dashboard import compatibility; local storage is always available.
export const cloudinaryConfigured = true

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  bytes: number
  format: string
}

/** Uploads a single image buffer to the server and returns its public URL. */
export async function uploadImage(buffer: Buffer, filename?: string): Promise<UploadResult> {
  await mkdir(UPLOAD_DIR, { recursive: true })

  const extension = path.extname(filename || "").toLowerCase() || ".jpg"
  const safeExtension = /^[.][a-z0-9]{2,5}$/.test(extension) ? extension : ".jpg"
  const storedName = `${Date.now()}-${randomUUID()}${safeExtension}`
  const storedPath = path.join(UPLOAD_DIR, storedName)
  await writeFile(storedPath, buffer, { flag: "wx" })

  return {
    url: `${PUBLIC_PREFIX}/${storedName}`,
    publicId: storedName,
    width: 0,
    height: 0,
    bytes: buffer.byteLength,
    format: safeExtension.slice(1),
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!/^[a-zA-Z0-9._-]+$/.test(publicId)) return
  await unlink(path.join(UPLOAD_DIR, publicId)).catch(() => undefined)
}

/** Recovers the stored filename from a local upload URL. */
export function publicIdFromUrl(url: string): string | null {
  const m = url.match(/^\/uploads\/cars\/([^/]+)$/)
  return m ? m[1] : null
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"]
