import Image from "next/image"
import Link from "next/link"
import type { Car } from "@/lib/db"
import { optimized } from "@/lib/images"
import { type Currency, DEFAULT_CURRENCY, effectivePrice, formatPrice, hasDiscount, discountPercent, formatMileage, titleCase } from "@/lib/format"
import { CalendarIcon, FuelIcon, GaugeIcon, GearIcon, PinIcon } from "./icons"

interface Props {
  readonly car: Car
  readonly currency?: Currency
  readonly priority?: boolean
}

export function CarCard({ car, currency = DEFAULT_CURRENCY, priority = false }: Props) {
  const price = effectivePrice(car)
  const discounted = hasDiscount(car)

  const specs = [
    car.year ? { icon: CalendarIcon, label: car.year } : null,
    car.mileage ? { icon: GaugeIcon, label: formatMileage(car.mileage) } : null,
    car.fuel_type ? { icon: FuelIcon, label: titleCase(car.fuel_type) } : null,
    car.transmission ? { icon: GearIcon, label: titleCase(car.transmission) } : null,
  ].filter(Boolean) as { icon: typeof CalendarIcon; label: string }[]

  return (
    <article className="card group overflow-hidden hover:-translate-y-1 hover:shadow-card-hover">
      <Link href={`/listing/${car.slug}`} className="block">
        <div className="relative aspect-[16/11] overflow-hidden bg-brand-100">
          <Image
            src={optimized(car.thumb_image, 640, 440)}
            alt={car.title || car.slug}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {car.purpose ? (
              <span className="rounded-pill bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-btn">
                For {car.purpose}
              </span>
            ) : null}
            {car.condition ? (
              <span className="rounded-pill bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-900 backdrop-blur">
                {titleCase(car.condition)}
              </span>
            ) : null}
          </div>

          {discounted ? (
            <span className="absolute right-3 top-3 rounded-pill bg-brand-900 px-3 py-1 text-[11px] font-bold text-white">
              −{discountPercent(car)}%
            </span>
          ) : null}
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          {car.brand_name ? <span className="text-brand-500">{car.brand_name}</span> : null}
          {car.city_name ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <PinIcon className="h-3.5 w-3.5" />
                {car.city_name}
              </span>
            </>
          ) : null}
        </div>

        <h3 className="mb-4 text-lg font-bold leading-snug text-brand-900">
          <Link href={`/listing/${car.slug}`} className="transition-colors hover:text-brand-500">
            {car.title || titleCase(car.slug.replace(/-/g, " "))}
          </Link>
        </h3>

        {specs.length ? (
          <ul className="mb-5 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-brand-200/70 pt-4 text-xs text-slate-600">
            {specs.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <s.icon className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="truncate">{s.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-end justify-between gap-3">
          <div>
            {discounted ? (
              <p className="text-xs text-slate-400 line-through">{formatPrice(car.regular_price, currency)}</p>
            ) : null}
            <p className="text-xl font-extrabold text-brand-900">
              {formatPrice(price, currency)}
              {car.purpose === "Rent" && car.rent_period ? (
                <span className="ml-1 text-xs font-medium text-slate-500">/{car.rent_period}</span>
              ) : null}
            </p>
          </div>
          <Link
            href={`/listing/${car.slug}`}
            className="rounded-pill border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  )
}
