import Link from "next/link"
import { getBrands, getCities, getCurrency } from "@/lib/db"
import { CarForm, type CarFormValues } from "@/components/admin/car-form"
import { ChevronLeftIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Add a car" }

export default function NewCarPage() {
  const brands = getBrands(false)
  const cities = getCities()
  const currency = getCurrency()

  const initial: CarFormValues = {
    title: "",
    description: "",
    address: "",
    brand_id: brands.length === 1 ? String(brands[0].id) : "",
    city_id: cities.length === 1 ? String(cities[0].id) : "",
    country_id: cities.length === 1 ? String(cities[0].country_id) : "0",
    car_model: "",
    purpose: "Sale",
    condition: "used",
    regular_price: "",
    offer_price: "",
    body_type: "",
    engine_size: "",
    drive: "",
    interior_color: "",
    exterior_color: "",
    year: "",
    mileage: "",
    number_of_owner: "",
    fuel_type: "",
    transmission: "",
    seller_type: "",
    rent_period: "",
    thumb_image: "",
    features: [],
    gallery: [],
    is_featured: false,
    status: true,
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
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-900">Add a car</h1>
        <p className="mt-1.5 text-slate-600">
          Photos upload straight to Cloudinary. Everything else is saved to your existing database.
        </p>
      </header>

      <CarForm
        mode="create"
        initial={initial}
        brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
        cities={cities.map((c) => ({ id: c.id, name: c.name, country_id: c.country_id }))}
        currencyIcon={currency.icon}
      />
    </div>
  )
}
