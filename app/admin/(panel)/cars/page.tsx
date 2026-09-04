import Link from "next/link"
import Image from "next/image"
import { getAllCarsForAdmin, getCurrency } from "@/lib/db"
import { optimized } from "@/lib/images"
import { effectivePrice, formatPrice, relativeDate, titleCase } from "@/lib/format"
import { toggleFeaturedAction, toggleStatusAction } from "@/app/admin/actions"
import { DeleteCarButton } from "@/components/admin/delete-car-button"
import { CarIcon, EditIcon, EyeIcon, PlusIcon, StarIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Cars" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function AdminCarsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const statusFilter = one(sp.status)
  const featuredOnly = one(sp.featured) === "1"

  const currency = getCurrency()
  let cars = getAllCarsForAdmin()

  if (statusFilter) cars = cars.filter((c) => c.status === statusFilter)
  if (featuredOnly) cars = cars.filter((c) => c.is_featured === "enable")

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Cars</h1>
          <p className="mt-1.5 text-slate-600">
            {cars.length} {cars.length === 1 ? "car" : "cars"}
            {statusFilter ? ` · ${statusFilter === "enable" ? "published" : "hidden"}` : ""}
            {featuredOnly ? " · featured" : ""}
          </p>
        </div>
        <Link href="/admin/cars/new" className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          Add a car
        </Link>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/cars" className={`chip ${!statusFilter && !featuredOnly ? "chip-active" : ""}`}>
          All
        </Link>
        <Link href="/admin/cars?status=enable" className={`chip ${statusFilter === "enable" ? "chip-active" : ""}`}>
          Published
        </Link>
        <Link href="/admin/cars?status=disable" className={`chip ${statusFilter === "disable" ? "chip-active" : ""}`}>
          Hidden
        </Link>
        <Link href="/admin/cars?featured=1" className={`chip ${featuredOnly ? "chip-active" : ""}`}>
          Featured
        </Link>
      </div>

      {cars.length ? (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-200 bg-tint-soft text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Car</th>
                  <th className="px-4 py-3.5 font-semibold">Brand</th>
                  <th className="px-4 py-3.5 font-semibold">Price</th>
                  <th className="px-4 py-3.5 font-semibold">Type</th>
                  <th className="px-4 py-3.5 font-semibold">Views</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-200">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-tint-soft">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-100">
                          <Image
                            src={optimized(car.thumb_image, 128, 96)}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/admin/cars/${car.id}/edit`}
                            className="block max-w-[16rem] truncate font-semibold text-brand-900 hover:text-brand-500"
                          >
                            {car.title || car.slug}
                          </Link>
                          <span className="text-xs text-slate-400">{relativeDate(car.created_at)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{car.brand_name ?? "—"}</td>
                    <td className="px-4 py-4 font-semibold text-brand-900">
                      {formatPrice(effectivePrice(car), currency)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{car.purpose ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{car.total_view}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase ${
                            car.status === "enable" ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700"
                          }`}
                        >
                          {car.status === "enable" ? "Live" : "Hidden"}
                        </span>
                        {car.is_featured === "enable" ? (
                          <span className="rounded-pill bg-brand-900 px-2.5 py-1 text-[11px] font-bold uppercase text-white">
                            Featured
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButtons car={car} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-brand-200 lg:hidden">
            {cars.map((car) => (
              <li key={car.id} className="p-5">
                <div className="flex gap-4">
                  <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                    <Image
                      src={optimized(car.thumb_image, 192, 128)}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/cars/${car.id}/edit`}
                      className="block truncate font-semibold text-brand-900"
                    >
                      {car.title || car.slug}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {car.brand_name ?? "—"} · {formatPrice(effectivePrice(car), currency)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-pill px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          car.status === "enable" ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700"
                        }`}
                      >
                        {car.status === "enable" ? "Live" : "Hidden"}
                      </span>
                      {car.purpose ? (
                        <span className="rounded-pill border border-brand-200 px-2.5 py-0.5 text-[11px] font-bold uppercase text-brand-900">
                          {titleCase(car.purpose)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-1">
                  <ActionButtons car={car} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="card p-14 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-500">
            <CarIcon className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-xl font-bold text-brand-900">
            {statusFilter || featuredOnly ? "Nothing matches this filter" : "No cars yet"}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-slate-600">
            {statusFilter || featuredOnly
              ? "Try a different filter."
              : "Add your first car and it will appear on the website straight away."}
          </p>
          <Link href={statusFilter || featuredOnly ? "/admin/cars" : "/admin/cars/new"} className="btn-primary mt-8">
            {statusFilter || featuredOnly ? "Show all cars" : "Add a car"}
          </Link>
        </div>
      )}
    </div>
  )
}

function ActionButtons({
  car,
}: {
  readonly car: { id: number; slug: string; status: string; is_featured: string; title: string }
}) {
  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"

  return (
    <>
      <Link href={`/listing/${car.slug}`} target="_blank" className={iconBtn} title="View on site">
        <EyeIcon className="h-4 w-4" />
      </Link>

      <form action={toggleFeaturedAction}>
        <input type="hidden" name="id" value={car.id} />
        <input type="hidden" name="next" value={car.is_featured === "enable" ? "disable" : "enable"} />
        <button
          type="submit"
          title={car.is_featured === "enable" ? "Remove from featured" : "Mark as featured"}
          className={`${iconBtn} ${car.is_featured === "enable" ? "border-brand-500 bg-brand-500 text-white" : ""}`}
        >
          <StarIcon className="h-4 w-4" />
        </button>
      </form>

      <form action={toggleStatusAction}>
        <input type="hidden" name="id" value={car.id} />
        <input type="hidden" name="next" value={car.status === "enable" ? "disable" : "enable"} />
        <button
          type="submit"
          title={car.status === "enable" ? "Hide from website" : "Publish"}
          className={iconBtn}
        >
          {car.status === "enable" ? <EyeIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        </button>
      </form>

      <Link href={`/admin/cars/${car.id}/edit`} className={iconBtn} title="Edit">
        <EditIcon className="h-4 w-4" />
      </Link>

      <DeleteCarButton id={car.id} title={car.title || car.slug} />
    </>
  )
}
