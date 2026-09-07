import type { MetadataRoute } from "next"
import { getPublicCarSlugs } from "@/lib/db"
import { getPublishedPostSlugs } from "@/lib/blog"
import { absoluteUrl } from "@/lib/site"

// Inventory changes at runtime, so the sitemap is generated per request.
export const dynamic = "force-dynamic"

export default function sitemap(): MetadataRoute.Sitemap {
  const date = (value: string | null) => (value ? new Date(value.replace(" ", "T")) : new Date())

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/listings"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.4 },
  ]

  const cars: MetadataRoute.Sitemap = getPublicCarSlugs().map((c) => ({
    url: absoluteUrl(`/listing/${c.slug}`),
    lastModified: date(c.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const posts: MetadataRoute.Sitemap = getPublishedPostSlugs().map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: date(p.updated_at),
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  return [...pages, ...cars, ...posts]
}
