import "server-only"
import { v2 as cloudinary } from "cloudinary"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

export const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret)

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

export const CLOUDINARY_FOLDER = "keycar/cars"

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  bytes: number
  format: string
}

/** Uploads a single image buffer and returns the secure URL to store in the DB. */
export async function uploadImage(buffer: Buffer, filename?: string): Promise<UploadResult> {
  if (!cloudinaryConfigured) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env",
    )
  }

  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
        // Strip metadata and cap the stored size; delivery-time transforms
        // in lib/images.ts handle the responsive variants.
        transformation: [{ width: 2000, height: 2000, crop: "limit" }, { quality: "auto:good" }],
        public_id: filename ? filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-") : undefined,
        unique_filename: true,
        overwrite: false,
      },
      (error, uploaded) => {
        if (error) reject(new Error(error.message))
        else if (!uploaded) reject(new Error("Cloudinary returned no result"))
        else resolve(uploaded as unknown as Record<string, unknown>)
      },
    )
    stream.end(buffer)
  })

  return {
    url: String(result.secure_url),
    publicId: String(result.public_id),
    width: Number(result.width) || 0,
    height: Number(result.height) || 0,
    bytes: Number(result.bytes) || 0,
    format: String(result.format ?? ""),
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!cloudinaryConfigured) return
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
}

/** Recovers the public id from a stored Cloudinary URL, so deletes can find it. */
export function publicIdFromUrl(url: string): string | null {
  const m = url.match(/\/upload\/(?:[^/]+\/)*?v\d+\/(.+)\.[a-zA-Z0-9]+$/)
  return m ? m[1] : null
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"]
