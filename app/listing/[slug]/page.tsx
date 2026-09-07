import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getBrands,
  getCarBySlug,
  getCurrency,
  getGallery,
  getRelatedCars,
  getSettings,
  incrementCarView,
} from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CarCard } from "@/components/car-card"
import { CarGallery } from "@/components/car-gallery"
import { InquiryForm } from "@/components/inquiry-form"
import { effectivePrice, formatMileage, formatPrice, hasDiscount, discountPercent, parseFeatures, titleCase, relativeDate } from "@/lib/format"
import { optimized } from "@/lib/images"
import {
  CalendarIcon,
  CheckIcon,
  DoorIcon,
  EyeIcon,
  FuelIcon,
  GaugeIcon,
  GearIcon,
  PaletteIcon,
  PinIcon,
  ShieldIcon,
  TagIcon,
} from "@/components/icons"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const car = getCarBySlug(slug)
  if (!car) return { title: "Car not found" }
  const description =
    car.seo_description || car.description?.slice(0, 155) || `${car.title} for ${car.purpose}.`

  return {
    title: car.seo_title || car.title,
    description,
    alternates: { canonical: `/listing/${car.slug}` },
    openGraph: {
      title: car.seo_title || car.title,
      description,
      type: "article",
      url: `/listing/${car.slug}`,
      images: car.thumb_image ? [{ url: optimized(car.thumb_image, 1200, 630) }] : undefined,
    },
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const car = getCarBySlug(slug)
  if (!car) notFound()

  const settings = getSettings()
  const currency = getCurrency()
  const brands = getBrands(false)
  const gallery = getGallery(car.id)
  const related = getRelatedCars(car, 3)
  const features = parseFeatures(car.features)

  incrementCarView(car.id)

  const images = [car.thumb_image, ...gallery.map((g) => g.image ?? "")].filter(Boolean) as string[]
  const price = effectivePrice(car)
  const discounted = hasDiscount(car)

  const specs = [
    { icon: CalendarIcon, label: "Year", value: car.year },
    { icon: GaugeIcon, label: "Mileage", value: formatMileage(car.mileage) },
    { icon: FuelIcon, label: "Fuel type", value: titleCase(car.fuel_type) },
    { icon: GearIcon, label: "Transmission", value: titleCase(car.transmission) },
    { icon: DoorIcon, label: "Body type", value: car.body_type },
    { icon: TagIcon, label: "Engine size", value: car.engine_size },
    { icon: GearIcon, label: "Drive", value: car.drive },
    { icon: PaletteIcon, label: "Exterior colour", value: car.exterior_color },
    { icon: PaletteIcon, label: "Interior colour", value: car.interior_color },
    { icon: ShieldIcon, label: "Condition", value: titleCase(car.condition) },
    { icon: EyeIcon, label: "Previous owners", value: car.number_of_owner },
    { icon: TagIcon, label: "Model", value: car.car_model },
  ].filter((s) => s.value)

  return (
    <>
      <SiteHeader phone={settings.phone} />

      <section className="border-b border-brand-200 bg-tint">
        <div className="container py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-500">
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <Link href="/listings" className="hover:text-brand-500">
              Cars
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-brand-900">{car.title}</span>
          </nav>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid gap-10 lg:grid-cols-[1.55fr_1fr]">
          {/* ---------- Left: gallery + detail ---------- */}
          <div>
            <CarGallery images={images} alt={car.title} />

            <div className="mt-10">
              <div className="flex flex-wrap items-center gap-2">
                {car.purpose ? (
                  <span className="rounded-pill bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    For {car.purpose}
                  </span>
                ) : null}
                {car.condition ? (
                  <span className="rounded-pill border border-brand-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-900">
                    {titleCase(car.condition)}
                  </span>
                ) : null}
                {car.is_featured === "enable" ? (
                  <span className="rounded-pill bg-brand-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Featured
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">{car.title}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                {car.brand_name ? (
                  <Link href={`/listings?brand=${car.brand_slug}`} className="font-semibold text-brand-500">
                    {car.brand_name}
                  </Link>
                ) : null}
                {car.city_name ? (
                  <span className="inline-flex items-center gap-1.5">
                    <PinIcon className="h-4 w-4 text-brand-400" />
                    {car.city_name}
                    {car.country_name ? `, ${car.country_name}` : ""}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <EyeIcon className="h-4 w-4 text-brand-400" />
                  {car.total_view} {car.total_view === 1 ? "view" : "views"}
                </span>
                {car.created_at ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-brand-400" />
                    Listed {relativeDate(car.created_at)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Specs */}
            {specs.length ? (
              <section className="mt-10">
                <h2 className="mb-5 text-xl font-bold text-brand-900">Specification</h2>
                {/* Dividers come from each cell's own border so a partial last
                    row doesn't leave a tinted empty cell. */}
                <dl className="grid overflow-hidden rounded-2xl border border-brand-200 bg-white sm:grid-cols-2 lg:grid-cols-3">
                  {specs.map((s) => (
                    <div key={s.label} className="border-b border-r border-brand-200 p-5 last:border-r-0">
                      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <s.icon className="h-4 w-4 text-brand-400" />
                        {s.label}
                      </dt>
                      <dd className="mt-1.5 font-bold text-brand-900">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {/* Description */}
            {car.description ? (
              <section className="mt-10">
                <h2 className="mb-4 text-xl font-bold text-brand-900">About this car</h2>
                <div
                  className="prose-sm max-w-none space-y-4 leading-relaxed text-slate-600 [&_a]:text-brand-500 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-brand-900"
                  // The Laravel admin authored these with a rich-text editor.
                  dangerouslySetInnerHTML={{ __html: car.description }}
                />
              </section>
            ) : null}

            {/* Features */}
            {features.length ? (
              <section className="mt-10">
                <h2 className="mb-5 text-xl font-bold text-brand-900">Features</h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-500">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Location */}
            {car.address ? (
              <section className="mt-10">
                <h2 className="mb-4 text-xl font-bold text-brand-900">Location</h2>
                <p className="flex items-start gap-2.5 text-slate-600">
                  <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                  {car.address}
                </p>
              </section>
            ) : null}
          </div>

          {/* ---------- Right: sticky price + inquiry ---------- */}
          <div>
            <div className="sticky top-24 space-y-6">
              <div className="card p-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {car.purpose === "Rent" ? "Rental price" : "Asking price"}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <p className="text-4xl font-extrabold text-brand-900">{formatPrice(price, currency)}</p>
                  {car.purpose === "Rent" && car.rent_period ? (
                    <span className="pb-1 text-sm font-medium text-slate-500">/ {car.rent_period}</span>
                  ) : null}
                </div>
                {discounted ? (
                  <p className="mt-1.5 flex items-center gap-2 text-sm">
                    <span className="text-slate-400 line-through">{formatPrice(car.regular_price, currency)}</span>
                    <span className="rounded-pill bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-500">
                      Save {discountPercent(car)}%
                    </span>
                  </p>
                ) : null}

                <ul className="mt-6 space-y-3 border-t border-brand-200 pt-6 text-sm text-slate-600">
                  {[
                    "Verified before listing",
                    "Full specification published",
                    "Talk to the seller directly",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-500">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <InquiryForm carTitle={car.title} carSlug={car.slug} phone={settings.phone} />
            </div>
          </div>
        </div>

        {/* ---------- Related ---------- */}
        {related.length ? (
          <section className="mt-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">You might also like</span>
                <h2 className="h-section mt-4">Similar cars</h2>
              </div>
              <Link href="/listings" className="btn-outline">
                Browse all
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <CarCard key={r.id} car={r} currency={currency} />
              ))}
            </div>
          </section>
        ) : null}
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
