/**
 * Image paths in this database come from two eras:
 *   - Laravel uploads, stored as relative paths like "uploads/custom-images/x.jpg"
 *   - Cloudinary uploads from the new admin, stored as absolute https URLs
 * Everything renders through here so both keep working.
 */

const LARAVEL_BASE = (process.env.LARAVEL_PUBLIC_URL || "").replace(/\/+$/, "")

export const FALLBACK_IMAGE = "/placeholder.svg"

export function imageUrl(path: string | null | undefined): string {
  if (!path) return FALLBACK_IMAGE
  const p = path.trim()
  if (!p) return FALLBACK_IMAGE
  if (p.startsWith("http://") || p.startsWith("https://")) return p
  if (p.startsWith("/")) return p
  if (!LARAVEL_BASE) return FALLBACK_IMAGE
  return `${LARAVEL_BASE}/${p.replace(/^\/+/, "")}`
}

/** Cloudinary can resize on delivery; leave non-Cloudinary URLs untouched. */
export function optimized(path: string | null | undefined, width: number, height?: number): string {
  const url = imageUrl(path)
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url
  const t = ["f_auto", "q_auto", `w_${width}`, height ? `h_${height}` : "", height ? "c_fill" : "c_limit"]
    .filter(Boolean)
    .join(",")
  return url.replace("/upload/", `/upload/${t}/`)
}

export function isCloudinary(path: string | null | undefined): boolean {
  return !!path && path.includes("res.cloudinary.com")
}
