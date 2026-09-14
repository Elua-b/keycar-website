import "server-only"
import en from "./translations/en.json"
import hi from "./translations/hi.json"

/**
 * UI strings for the Flutter app.
 *
 * The app ships no strings of its own — Laravel's `/api/website-setup`
 * returned the whole of `lang/{code}/translate.php` and the app rendered from
 * that. These JSON files are a straight conversion of those PHP arrays, so the
 * app's existing keys keep resolving.
 *
 * Statically imported rather than read from disk so the strings are bundled
 * with the route and survive any deployment target.
 */

const TABLES: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
}

export const DEFAULT_TRANSLATION_LANG = "en"

export function translationsFor(langCode: string): Record<string, string> {
  return TABLES[langCode] ?? TABLES[DEFAULT_TRANSLATION_LANG]
}

export function hasTranslations(langCode: string): boolean {
  return langCode in TABLES
}
