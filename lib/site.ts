/**
 * The site's own public origin. Everything that has to emit an absolute URL —
 * canonical tags, Open Graph, the sitemap, robots.txt — goes through here so
 * there is one place to get it right per environment.
 */
export function siteUrl(): string {
  const raw = process.env.APP_URL || "http://localhost:3000"
  return raw.replace(/\/+$/, "")
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`
}
