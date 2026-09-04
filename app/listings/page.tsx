import Link from "next/link"
import type { Metadata } from "next"
import { getBrands, getCars, getCurrency, getFilterOptions, getSettings, type CarFilters } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CarCard } from "@/components/car-card"
import { ListingFilters, SortSelect } from "@/components/listing-filters"
import { CarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Browse cars",
  description: "Filter every car in stock by brand, body type, fuel, transmission and price.",
}

type SP = Record<string, string | string[] | undefined>

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v)
const num = (v: string | string[] | undefined): number | undefined => {
  const s = one(v)
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams

  const filters: CarFilters = {
    q: one(sp.q),
    brand: one(sp.brand),
    purpose: one(sp.purpose),
    condition: one(sp.condition),
    bodyType: one(sp.bodyType),
    fuelType: one(sp.fuelType),
    transmission: one(sp.transmission),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    sort: one(sp.sort),
    page: num(sp.page) ?? 1,
    perPage: 12,
  }

  const settings = getSettings()
  const currency = getCurrency()
  const brands = getBrands(false)
  const options = getFilterOptions()
  const { cars, total } = getCars(filters)

  const perPage = 12
  const page = filters.page ?? 1
  const pages = Math.max(Math.ceil(total / perPage), 1)

  const pageHref = (p: number) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) {
      const s = one(v)
      if (s && k !== "page") next.set(k, s)
    }
    if (p > 1) next.set("page", String(p))
    return `/listings${next.toString() ? `?${next}` : ""}`
  }

  return (
    <>
      <SiteHeader phone={settings.phone} />

      <section className="border-b border-brand-200 bg-tint">
        <div className="container py-12">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-500">
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-brand-900">Browse cars</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">
            {filters.purpose ? `Cars for ${filters.purpose}` : "Every car in stock"}
          </h1>
          <p className="mt-2 text-slate-600">
            {total} {total === 1 ? "car" : "cars"} match your search.
          </p>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <ListingFilters
            brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
            bodyTypes={options.bodyTypes}
            fuelTypes={options.fuelTypes}
            transmissions={options.transmissions}
            conditions={options.conditions}
            purposes={options.purposes}
            minPrice={options.minPrice}
            maxPrice={options.maxPrice}
          />

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-brand-900">{cars.length}</span> of{" "}
                <span className="font-semibold text-brand-900">{total}</span>
              </p>
              <SortSelect />
            </div>

            {cars.length ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {cars.map((car, i) => (
                    <CarCard key={car.id} car={car} currency={currency} priority={i < 3} />
                  ))}
                </div>

                {pages > 1 ? (
                  <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
                    {page > 1 ? (
                      <Link href={pageHref(page - 1)} className="btn-outline px-4 py-2" aria-label="Previous page">
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Link>
                    ) : null}

                    {Array.from({ length: pages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center gap-2">
                          {idx > 0 && p - arr[idx - 1] > 1 ? <span className="text-slate-400">…</span> : null}
                          <Link
                            href={pageHref(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={`grid h-10 w-10 place-items-center rounded-pill text-sm font-semibold transition-colors ${
                              p === page
                                ? "bg-brand-500 text-white shadow-btn"
                                : "border border-brand-200 text-brand-900 hover:border-brand-500 hover:text-brand-500"
                            }`}
                          >
                            {p}
                          </Link>
                        </span>
                      ))}

                    {page < pages ? (
                      <Link href={pageHref(page + 1)} className="btn-outline px-4 py-2" aria-label="Next page">
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </nav>
                ) : null}
              </>
            ) : (
              <div className="card p-14 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-500">
                  <CarIcon className="h-8 w-8" />
                </span>
                <h2 className="mt-6 text-xl font-bold text-brand-900">No cars match those filters</h2>
                <p className="mx-auto mt-3 max-w-sm text-slate-600">
                  Try widening the price range or clearing a filter or two.
                </p>
                <Link href="/listings" className="btn-primary mt-8">
                  Clear all filters
                </Link>
              </div>
            )}
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
