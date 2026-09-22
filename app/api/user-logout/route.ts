import { apiOk } from "@/lib/mobile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/user-logout
 *
 * Replaces LoginController@userLogout. Tokens here are stateless HMACs with
 * no server-side record, so there is nothing to revoke — the app discards its
 * copy on success and that is what ends the session. Kept as an endpoint
 * because the shipped app calls it and treats a failure as a failed logout.
 *
 * If tokens ever need real revocation, add a `mobile_token_blocklist` table
 * and check it in currentUser().
 */
export async function GET() {
  return apiOk({ message: "Logout Successfully" })
}

export { corsPreflight as OPTIONS } from "@/lib/mobile"
