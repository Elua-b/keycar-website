/** Currency defaults mirror the default `multi_currencies` row (RWF, code after price). */
export interface Currency {
  icon: string
  code: string
  position: string
}

export const DEFAULT_CURRENCY: Currency = { icon: "RWF", code: "RWF", position: "after_price" }

/**
 * Currencies a single car may be priced in, overriding the site default.
 *
 * Imported stock is quoted to us in the seller's currency, and converting it
 * at a rate that moves weekly would misstate the asking price. So `cars`
 * carries an optional `price_currency` and the amount is shown as quoted.
 */
const PER_CAR_CURRENCIES: Record<string, Currency> = {
  USD: { icon: "$", code: "USD", position: "before_price" },
  RWF: { icon: "RWF", code: "RWF", position: "after_price" },
}

/**
 * The currency one car's price is quoted in — its own if it has one, else
 * whatever the site is configured for. An unrecognised code falls back to the
 * site currency rather than rendering a price with no unit at all.
 */
export function priceCurrency(
  car: { price_currency?: string | null },
  siteCurrency: Currency = DEFAULT_CURRENCY,
): Currency {
  const code = car.price_currency?.trim().toUpperCase()
  if (!code) return siteCurrency
  return PER_CAR_CURRENCIES[code] ?? siteCurrency
}

/** Non-breaking, so an amount and its currency code never wrap onto two lines. */
const NBSP = "\u00a0"

export function formatPrice(value: number | null | undefined, currency: Currency = DEFAULT_CURRENCY): string {
  if (value === null || value === undefined) return "—"
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  // RWF has no minor unit, so whole amounts stay whole; a currency that does
  // use cents still shows them.
  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
  // A trailing code ("99,000,000 RWF") needs the space; a leading symbol ("$99") does not.
  return currency.position === "after_price" ? `${body}${NBSP}${currency.icon}` : `${currency.icon}${body}`
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
