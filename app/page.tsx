import Link from "next/link"
import Image from "next/image"
import { getBrands, getCurrency, getFeaturedCars, getFilterOptions, getLatestCars, getSettings, getStats } from "@/lib/db"
import { optimized } from "@/lib/images"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CarCard } from "@/components/car-card"
import { HeroSearch } from "@/components/hero-search"
import { HeroVideo } from "@/components/hero-video"
import { ArrowRightIcon, CarIcon, CheckIcon, PaletteIcon, ShieldIcon, TagIcon, UsersIcon } from "@/components/icons"

// Inventory changes from the admin dashboard, so render per request.
export const dynamic = "force-dynamic"

export default function HomePage() {
  const settings = getSettings()
  const currency = getCurrency()
  const brands = getBrands(false)
  const options = getFilterOptions()
  const stats = getStats()

  const featured = getFeaturedCars(6)
  const latest = getLatestCars(6)
  // Fall back to newest stock when nothing is flagged featured yet.
  const showcase = featured.length >= 3 ? featured : latest
  const showcaseLabel = featured.length >= 3 ? "Featured stock" : "Latest arrivals"

  return (
    <>
      <SiteHeader phone={settings.phone} />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div
          className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/30 blur-3xl"
          aria-hidden
        />
        <div className="container relative py-20 lg:py-24">
          {/* Two columns so the vertically-shot intro video keeps its 9:16
              frame instead of being cropped into a letterbox. */}
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
            <div>
              <p className="animate-in-fade inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                {stats.cars} verified {stats.cars === 1 ? "car" : "cars"} in Kigali
              </p>

              <h1 className="animate-in-up mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Find a car you can
                <br />
                <span className="text-brand-300">actually trust.</span>
              </h1>

              <p className="animate-in-up mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                Browse cars for sale and rent across Rwanda. Real specs, honest prices, and every listing checked
                before it goes live.
              </p>

              <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
                {[
                  { label: "Cars listed", value: stats.cars, icon: CarIcon },
                  { label: "Brands", value: stats.brands, icon: TagIcon },
                  { label: "Cities", value: stats.cities, icon: PaletteIcon },
                  { label: "Verified sellers", value: stats.dealers || "—", icon: UsersIcon },
                ].map((s) => (
                  <div key={s.label}>
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/60">
                      <s.icon className="h-4 w-4" />
                      {s.label}
                    </dt>
                    <dd className="mt-1.5 text-3xl font-extrabold text-white">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-in-up">
              <HeroVideo
                src="/keycar-intro.mp4"
                poster="/keycar-intro-poster.jpg"
                label="Watch our intro"
                caption="Hear how Keycar keeps every listing honest."
              />
            </div>
          </div>

          <div className="animate-in-up mt-14">
            <HeroSearch
              brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
              bodyTypes={options.bodyTypes}
              purposes={options.purposes}
            />
          </div>
        </div>
      </section>

      {/* ---------------- Browse by body type ---------------- */}
      {options.bodyTypes.length ? (
        <section className="bg-tint-soft py-20">
          <div className="container">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Categories</span>
                <h2 className="h-section mt-4">Browse by body type</h2>
              </div>
              <Link href="/listings" className="btn-outline">
                All cars
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {options.bodyTypes.map((type) => (
                <Link
                  key={type}
                  href={`/listings?bodyType=${encodeURIComponent(type)}`}
                  className="card group flex items-center gap-4 p-6 hover:-translate-y-1 hover:border-brand-500 hover:shadow-card-hover"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <CarIcon className="h-7 w-7" />
                  </span>
                  <span>
                    <span className="block font-bold text-brand-900">{type}</span>
                    <span className="text-sm text-slate-500">View listings</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------- Showcase ---------------- */}
      {showcase.length ? (
        <section className="py-20">
          <div className="container">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">{showcaseLabel}</span>
                <h2 className="h-section mt-4">Handpicked for you</h2>
                <p className="mt-3 max-w-lg text-slate-600">
                  Fresh stock straight from the dealership floor, with full specs on every card.
                </p>
              </div>
              <Link href="/listings" className="btn-outline">
                See all {stats.cars}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((car, i) => (
                <CarCard key={car.id} car={car} currency={currency} priority={i < 3} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20">
          <div className="container">
            <div className="card mx-auto max-w-lg p-12 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-500">
                <CarIcon className="h-8 w-8" />
              </span>
              <h2 className="mt-6 text-2xl font-bold text-brand-900">No cars published yet</h2>
              <p className="mt-3 text-slate-600">
                Add your first car from the admin dashboard and it will appear here straight away.
              </p>
              <Link href="/admin" className="btn-primary mt-8">
                Go to admin
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Brands ---------------- */}
      {brands.length ? (
        <section className="bg-tint py-20">
          <div className="container">
            <div className="mb-10 text-center">
              <span className="eyebrow">Brands we stock</span>
              <h2 className="h-section mt-4">Shop by make</h2>
            </div>

            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/listings?brand=${b.slug}`}
                  className="card group flex flex-col items-center gap-3 p-6 text-center hover:-translate-y-1 hover:border-brand-500 hover:shadow-card-hover"
                >
                  <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-brand-100">
                    <Image
                      src={optimized(b.image, 96, 96)}
                      alt={b.name ?? b.slug}
                      fill
                      sizes="48px"
                      className="object-contain p-1.5"
                    />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-brand-900 group-hover:text-brand-500">
                      {b.name ?? b.slug}
                    </span>
                    <span className="text-xs text-slate-500">
                      {b.car_count ?? 0} {b.car_count === 1 ? "car" : "cars"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------- Why us ---------------- */}
      <section className="py-20">
        <div className="container">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <span className="eyebrow">Why Keycar</span>
              <h2 className="h-section mt-4">Buying a car shouldn&apos;t feel like a gamble</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                We check every listing before it goes public, publish the full specification, and put you in touch
                with the seller directly. No hidden fees, no mystery mileage.
              </p>

              <ul className="mt-8 space-y-5">
                {[
                  {
                    icon: ShieldIcon,
                    title: "Every listing verified",
                    body: "A car only goes live once we have confirmed its condition and paperwork.",
                  },
                  {
                    icon: TagIcon,
                    title: "Transparent pricing",
                    body: "The price you see is the asking price, with any discount shown plainly.",
                  },
                  {
                    icon: UsersIcon,
                    title: "Talk to a real person",
                    body: "Message the dealer straight from the listing and get a same-day reply.",
                  },
                ].map((f) => (
                  <li key={f.title} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-bold text-brand-900">{f.title}</span>
                      <span className="text-sm leading-relaxed text-slate-600">{f.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl bg-brand-gradient p-10 text-white shadow-card-hover">
                <p className="text-sm font-semibold uppercase tracking-widest text-white/60">Ready when you are</p>
                <p className="mt-4 text-3xl font-extrabold leading-tight">
                  Tell us what you&apos;re looking for and we&apos;ll find it.
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                  {["Free consultation", "Financing guidance", "Trade-in valuation", "Nationwide delivery"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
                <Link href="/contact" className="btn-white mt-10">
                  Talk to us
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="pb-4">
        <div className="container">
          <div className="rounded-3xl border border-brand-200 bg-tint px-8 py-14 text-center sm:px-16">
            <h2 className="h-section">Still deciding? Browse the full stock.</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Filter by brand, body type, fuel, transmission and price to narrow it down in seconds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/listings" className="btn-primary">
                Browse all cars
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="btn-outline">
                Contact the team
              </Link>
            </div>
          </div>
        </div>
      </section>

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
