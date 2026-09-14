import { originOf, apiOk, dealerOut, getDealerRows, countDealers, paginate, pageParams } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/dealers
 *
 * Replaces HomeController@dealers. The app reads `['dealers']['data']`, so the
 * paginator envelope is required even though the list is small.
 */
export async function GET(request: Request) {
  const origin = originOf(request)
  const { page, perPage } = pageParams(request)

  const rows = getDealerRows({ limit: perPage, offset: (page - 1) * perPage })

  return apiOk({
    dealers: paginate(
      rows.map((d) => dealerOut(d, origin)),
      countDealers(),
      page,
      perPage,
      `${origin}/api/dealers`,
    ),
  })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
