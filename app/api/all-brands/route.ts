import { getBrands } from "@/lib/db"
import { originOf, apiOk, brandOut } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/all-brands — replaces HomeController@all_brands. */
export async function GET(request: Request) {
  const origin = originOf(request)
  return apiOk({ brands: getBrands().map((b) => brandOut(b, origin)) })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
