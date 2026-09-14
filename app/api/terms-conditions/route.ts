import { getDb, LANG } from "@/lib/db"
import { langOf, apiOk } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/terms-conditions — replaces HomeController@terms_conditions. */
export async function GET(request: Request) {
  const lang = langOf(request)
  const db = getDb()

  const row =
    (db
      .prepare("SELECT id, lang_code, description, created_at, updated_at FROM term_and_conditions WHERE lang_code = ? LIMIT 1")
      .get(lang) as Record<string, unknown> | undefined) ??
    (db
      .prepare("SELECT id, lang_code, description, created_at, updated_at FROM term_and_conditions WHERE lang_code = ? LIMIT 1")
      .get(LANG) as Record<string, unknown> | undefined)

  return apiOk({
    terms_condition: row ?? { id: 0, lang_code: lang, description: "", created_at: null, updated_at: null },
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
