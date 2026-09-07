import Link from "next/link"
import Image from "next/image"
import { getPublishedPosts, getBlogCategories, getPopularPosts } from "@/lib/blog"
import { getBrands, getSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { optimized } from "@/lib/images"
import { relativeDate } from "@/lib/format"
import { NewspaperIcon, ArrowRightIcon, SearchIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Blog",
  description: "Buying guides, ownership advice and market news from the Keycar team.",
}

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const PER_PAGE = 9

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const category = one(sp.category)
  const q = one(sp.q)
  const page = Math.max(Number(one(sp.page) ?? 1) || 1, 1)

  const { posts, total } = getPublishedPosts({
    category,
    q,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  })

  const categories = getBlogCategories(true).filter((c) => (c.post_count ?? 0) > 0)
  const popular = getPopularPosts(4)
  const pages = Math.max(Math.ceil(total / PER_PAGE), 1)

  const settings = getSettings()
  const brands = getBrands(false)

  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams()
    if (category) p.set("category", category)
    if (q) p.set("q", q)
    for (const [k, v] of Object.entries(over)) {
      if (v === undefined || v === "") p.delete(k)
      else p.set(k, String(v))
    }
    const s = p.toString()
    return s ? `/blog?${s}` : "/blog"
  }

  return (
    <>
      <SiteHeader phone={settings.phone} />

      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
            <NewspaperIcon className="h-3.5 w-3.5" />
            Keycar journal
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Advice worth reading before you buy.
          </h1>
          <p className="mt-4 max-w-xl text-white/80">
            Inspection checklists, ownership costs and what is actually moving in the Rwandan market.
          </p>

          <form action="/blog" className="mt-8 flex max-w-md gap-2">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <span className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search articles…"
                className="w-full rounded-pill border-0 bg-white py-3 pl-11 pr-4 text-sm text-brand-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </span>
            <button type="submit" className="rounded-pill bg-white px-6 py-3 text-sm font-bold text-brand-900">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div>
            {categories.length ? (
              <div className="mb-8 flex flex-wrap gap-2">
                <Link href={qs({ category: undefined, page: undefined })} className={`chip ${!category ? "chip-active" : ""}`}>
                  All topics
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={qs({ category: c.slug, page: undefined })}
                    className={`chip ${category === c.slug ? "chip-active" : ""}`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : null}

            {posts.length ? (
              <>
                <ul className="grid gap-7 sm:grid-cols-2">
                  {posts.map((p) => (
                    <li key={p.id} className="card group flex flex-col overflow-hidden">
                      <Link href={`/blog/${p.slug}`} className="relative block h-48 bg-brand-100">
                        <Image
                          src={optimized(p.image, 640, 400)}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 320px, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col p-5">
                        {p.category_name ? (
                          <span className="text-xs font-bold uppercase tracking-wide text-brand-500">
                            {p.category_name}
                          </span>
                        ) : null}
                        <h2 className="mt-2 text-lg font-bold leading-snug text-brand-900">
                          <Link href={`/blog/${p.slug}`} className="hover:text-brand-500">
                            {p.title}
                          </Link>
                        </h2>
                        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{excerpt(p.description)}</p>
                        <p className="mt-auto pt-4 text-xs text-slate-400">
                          {relativeDate(p.created_at)} · {p.views} view{p.views === 1 ? "" : "s"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {pages > 1 ? (
                  <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                      <Link key={n} href={qs({ page: n })} className={`chip ${n === page ? "chip-active" : ""}`}>
                        {n}
                      </Link>
                    ))}
                  </nav>
                ) : null}
              </>
            ) : (
              <div className="card p-14 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-500">
                  <NewspaperIcon className="h-8 w-8" />
                </span>
                <h2 className="mt-6 text-xl font-bold text-brand-900">Nothing here yet</h2>
                <p className="mx-auto mt-3 max-w-sm text-slate-600">
                  {q || category ? "No article matches that search." : "The first article is on its way."}
                </p>
                {q || category ? (
                  <Link href="/blog" className="btn-primary mt-8">
                    Show all articles
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <aside className="space-y-8">
            {popular.length ? (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Most read</h2>
                <ul className="mt-4 space-y-4">
                  {popular.map((p) => (
                    <li key={p.id} className="flex gap-3">
                      <Link href={`/blog/${p.slug}`} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-100">
                        <Image src={optimized(p.image, 160, 112)} alt="" fill sizes="80px" className="object-cover" />
                      </Link>
                      <Link href={`/blog/${p.slug}`} className="text-sm font-semibold leading-snug text-brand-900 hover:text-brand-500">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-2xl bg-brand-100 p-6">
              <h2 className="font-bold text-brand-900">Looking for a car?</h2>
              <p className="mt-2 text-sm text-slate-600">Every listing is checked before it goes live.</p>
              <Link href="/listings" className="btn-primary mt-5 w-full text-xs">
                Browse cars
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </section>
          </aside>
          </div>
        </div>
      </div>

      <SiteFooter
        appName={settings.app_name}
        email={settings.email}
        phone={settings.phone}
        address={settings.address}
        copyright={settings.copyright}
        brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
      />
    </>
  )
}

/** Strip the stored HTML down to a plain-text teaser. */
function excerpt(html: string | null, length = 160): string {
  if (!html) return ""
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return text.length > length ? `${text.slice(0, length)}…` : text
}
