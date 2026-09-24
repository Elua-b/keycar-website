import "server-only"
import { getDb } from "./db"

/**
 * Exchange rates used to express a foreign-priced car in the site's base
 * currency.
 *
 * The website shows an imported car at the price it was quoted at — see
 * `price_currency` on `cars` and `priceCurrency()` in lib/format.ts. The
 * mobile app cannot: `Utils.convertCurrency` in the Flutter code multiplies
 * every price by one global rate and appends one global symbol, so a car
 * priced at $29,600 would render as "29,600RWF". The app is not being
 * changed, so the mobile API converts before it answers.
 *
 * This deliberately does NOT reuse `multi_currencies`. That table is served
 * to the app as `currency_list` (filtered to `status = 'active'`), so adding
 * a USD row there would put a new currency in the app's own switcher — a
 * visible change to the app. It also numbers rates the other way round:
 * there, `currency_rate` converts *from* the base, and a stale second
 * meaning in the same column is a trap for whoever reads this next.
 *
 * Here one thing is stored, named for exactly what it is: how many francs
 * one unit of the foreign currency is worth.
 */

export const BASE_CURRENCY = "RWF"

let ensured = false

function ensureTable(): void {
  if (ensured) return
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS fx_rates (
      code         TEXT PRIMARY KEY,
      rwf_per_unit REAL NOT NULL,
      updated_at   TEXT NOT NULL
    )
  `)
  ensured = true
}

/** Every configured rate, keyed by upper-case ISO code. Never includes the base. */
export function getFxRates(): Record<string, number> {
  ensureTable()
  const rows = getDb().prepare("SELECT code, rwf_per_unit FROM fx_rates").all() as unknown as {
    code: string
    rwf_per_unit: number
  }[]
  const out: Record<string, number> = {}
  for (const r of rows) {
    const code = r.code?.trim().toUpperCase()
    // A missing or zero rate is worse than no rate at all: it would silently
    // price the car at nothing. Treat it as unconfigured.
    if (code && code !== BASE_CURRENCY && Number(r.rwf_per_unit) > 0) out[code] = Number(r.rwf_per_unit)
  }
  return out
}

/**
 * The amount restated in francs, or null when it cannot be: an unknown
 * currency, or one with no rate on file. Callers hide the car rather than
 * publish a number they cannot stand behind.
 */
export function toBaseAmount(
  amount: number | null | undefined,
  code: string | null | undefined,
  rates: Record<string, number> = getFxRates(),
): number | null {
  if (amount === null || amount === undefined) return null
  const n = Number(amount)
  if (!Number.isFinite(n)) return null

  const from = code?.trim().toUpperCase()
  if (!from || from === BASE_CURRENCY) return n

  const rate = rates[from]
  if (!rate) return null
  // Francs have no minor unit, so a converted price is rounded to whole francs.
  return Math.round(n * rate)
}

/**
 * Currency codes the mobile API can price correctly: the base, plus whatever
 * has a rate. Used to keep anything else out of the app's responses.
 */
export function convertibleCurrencies(rates: Record<string, number> = getFxRates()): string[] {
  // Codes are embedded in SQL, so anything not a plain ISO-style code is dropped.
  return [BASE_CURRENCY, ...Object.keys(rates)].filter((c) => /^[A-Z]{3}$/.test(c))
}
