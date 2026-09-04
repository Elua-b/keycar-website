/** Currency defaults mirror the `multi_currencies` row (USD, symbol before price). */
export interface Currency {
  icon: string
  code: string
  position: string
}

export const DEFAULT_CURRENCY: Currency = { icon: "$", code: "USD", position: "before_price" }

export function formatPrice(value: number | null | undefined, currency: Currency = DEFAULT_CURRENCY): string {
  if (value === null || value === undefined) return "—"
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
  return currency.position === "after_price" ? `${body}${currency.icon}` : `${currency.icon}${body}`
}

/** The price a buyer actually pays: offer price when set, otherwise regular. */
export function effectivePrice(car: { regular_price: number; offer_price: number | null }): number {
  const offer = Number(car.offer_price)
  return offer > 0 ? offer : Number(car.regular_price)
}

export function hasDiscount(car: { regular_price: number; offer_price: number | null }): boolean {
  const offer = Number(car.offer_price)
  return offer > 0 && offer < Number(car.regular_price)
}

export function discountPercent(car: { regular_price: number; offer_price: number | null }): number {
  if (!hasDiscount(car)) return 0
  const reg = Number(car.regular_price)
  return Math.round(((reg - Number(car.offer_price)) / reg) * 100)
}

export function formatMileage(mileage: string | null | undefined): string | null {
  if (!mileage) return null
  const digits = mileage.replace(/[^\d.]/g, "")
  if (!digits) return mileage
  const n = Number(digits)
  if (!Number.isFinite(n)) return mileage
  return `${n.toLocaleString("en-US")} km`
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return ""
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** `features` is stored as a JSON array string by Laravel. */
export function parseFeatures(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
  } catch {
    // Older rows occasionally hold a comma-separated string.
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function relativeDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const then = new Date(iso.replace(" ", "T")).getTime()
  if (!Number.isFinite(then)) return ""
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? "s" : ""} ago`
}
