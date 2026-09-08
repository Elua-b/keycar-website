import Link from "next/link"
import { notFound } from "next/navigation"
import { getBrands, getCarById, getCities, getCurrency, getGallery } from "@/lib/db"
import { getDealers } from "@/lib/users"
import { parseFeatures } from "@/lib/format"
import { CarForm, type CarFormValues } from "@/components/admin/car-form"
import { ChevronLeftIcon, EyeIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const carId = Number(id)
  if (!Number.isFinite(carId)) notFound()

  const car = getCarById(carId)
  if (!car) notFound()

  const brands = getBrands(false)
  const cities = getCities()
  const dealers = getDealers()
  const currency = getCurrency()
  const gallery = getGallery(car.id)

  const s = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v))

  const initial: CarFormValues = {
    id: car.id,
    agent_id: String(car.agent_id ?? 0),
    title: car.title ?? "",
    description: car.description ?? "",
    address: car.address ?? "",
    brand_id: s(car.brand_id),
    city_id: s(car.city_id),
    country_id: s(car.country_id),
    car_model: s(car.car_model),
    purpose: car.purpose ?? "Sale",
    condition: car.condition ?? "used",
    regular_price: s(car.regular_price),
    offer_price: car.offer_price ? s(car.offer_price) : "",
    body_type: s(car.body_type),
    engine_size: s(car.engine_size),
    drive: s(car.drive),
    interior_color: s(car.interior_color),
    exterior_color: s(car.exterior_color),
    year: s(car.year),
    mileage: s(car.mileage),
    number_of_owner: s(car.number_of_owner),
    seats: s(car.seats),
    fuel_type: s(car.fuel_type),
    transmission: s(car.transmission),
    seller_type: s(car.seller_type),
    rent_period: s(car.rent_period),
    thumb_image: car.thumb_image ?? "",
    features: parseFeatures(car.features),
    gallery: gallery.map((g) => g.image ?? "").filter(Boolean),
    is_featured: car.is_featured === "enable",
    status: car.status === "enable",
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header>
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-500"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to cars
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Edit car</h1>
            <p className="mt-1.5 text-slate-600">{car.title}</p>
          </div>
          <Link href={`/listing/${car.slug}`} target="_blank" className="btn-outline">
            <EyeIcon className="h-4 w-4" />
            View on site
          </Link>
        </div>
      </header>

      <CarForm
        mode="edit"
        initial={initial}
        brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
        cities={cities.map((c) => ({ id: c.id, name: c.name, country_id: c.country_id }))}
        dealers={dealers.map((d) => ({ id: d.id, name: d.name, email: d.email }))}
        currencyIcon={currency.icon}
      />
    </div>
  )
}
