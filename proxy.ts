import { NextResponse, type NextRequest } from "next/server"

/**
 * Optimistic guard only: it checks that a session cookie is present so
 * unauthenticated visitors get bounced without rendering a page. The cookie's
 * signature is verified for real in app/admin/(panel)/layout.tsx, which is
 * what actually protects the data.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin itself is the login page.
  if (pathname === "/admin") return NextResponse.next()

  if (!request.cookies.has("keycar_admin")) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
