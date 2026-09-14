import { getDb } from "@/lib/db"
import { langOf, originOf, absImage, apiOk } from "@/lib/mobile"
import { translationsFor } from "@/lib/translations"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/website-setup
 *
 * The Flutter app's first call, made from the splash screen before anything
 * renders. It blocks on this response — the app bundles no UI strings, so
 * without `localizations` there is literally nothing to draw. Replaces
 * Laravel's HomeController@website_setup.
 */
export async function GET(request: Request) {
  const db = getDb()
  const origin = originOf(request)
  const lang = langOf(request)

  const setting = db
    .prepare("SELECT id, logo, app_name, timezone, default_avatar FROM settings LIMIT 1")
    .get() as
    | { id: number; logo: string | null; app_name: string | null; timezone: string | null; default_avatar: string | null }
    | undefined

  const languageList = db
    .prepare(
      `SELECT id, lang_name, lang_code, is_default, status, lang_direction, created_at, updated_at
       FROM languages WHERE status = 1 ORDER BY id`,
    )
    .all()

  const currencyList = db
    .prepare(
      `SELECT id, currency_name, country_code, currency_code, currency_icon, is_default,
              currency_rate, currency_position, status, created_at, updated_at
       FROM multi_currencies WHERE status = 'active' ORDER BY id`,
    )
    .all()

  return apiOk({
    setting: {
      id: setting?.id ?? 0,
      logo: absImage(setting?.logo, origin),
      app_name: setting?.app_name ?? "Keycar",
      timezone: setting?.timezone ?? "UTC",
      default_avatar: absImage(setting?.default_avatar, origin),
    },
    language_list: languageList,
    currency_list: currencyList,
    localizations: translationsFor(lang),
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
