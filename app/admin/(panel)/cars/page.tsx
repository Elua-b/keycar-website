import Link from "next/link"
import Image from "next/image"
import { getCarsForAdmin, countAwaitingCars, getCurrency, type CarScope } from "@/lib/db"
import { optimized } from "@/lib/images"
import { effectivePrice, formatPrice, relativeDate, titleCase } from "@/lib/format"
import { toggleFeaturedAction, toggleStatusAction } from "@/app/admin/actions"
import { setCarApprovalAction } from "@/app/admin/manage-actions"
import { DeleteCarButton } from "@/components/admin/delete-car-button"
import { FilterChips, StatusPill } from "@/components/admin/page-header"
import { CarIcon, EditIcon, EyeIcon, PlusIcon, StarIcon, CheckIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Cars" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const SCOPES: CarScope[] = ["all", "awaiting", "enable", "disable", "featured", "draft"]

export default async function AdminCarsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const raw = one(sp.scope) ?? "all"
  const scope = (SCOPES.includes(raw as CarScope) ? raw : "all") as CarScope

  const currency = getCurrency()
  const cars = getCarsForAdmin(scope)
  const all = scope === "all" ? cars : getCarsForAdmin("all")
  const awaiting = countAwaitingCars()

  const scopeLabel = {
    all: "",
    awaiting: " · awaiting approval",
    enable: " · published",
    disable: " · hidden",
    featured: " · featured",
    draft: " · drafts",
  }[scope]

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Cars</h1>
          <p className="mt-1.5 text-slate-600">
            {cars.length} {cars.length === 1 ? "car" : "cars"}
            {scopeLabel}
          </p>
        </div>
        <Link href="/admin/cars/new" className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          Add a car
        </Link>
      </header>

      <FilterChips
        active={scope}
        options={[
          { key: "all", label: "All", count: all.length, href: "/admin/cars" },
          { key: "awaiting", label: "Awaiting approval", count: awaiting, href: "/admin/cars?scope=awaiting" },
          {
            key: "enable",
            label: "Published",
            count: all.filter((c) => c.status === "enable" && c.is_draft === "disable").length,
            href: "/admin/cars?scope=enable",
          },
          {
            key: "disable",
            label: "Hidden",
            count: all.filter((c) => c.status === "disable" && c.is_draft === "disable").length,
            href: "/admin/cars?scope=disable",
          },
          {
            key: "featured",
            label: "Featured",
            count: all.filter((c) => c.is_featured === "enable").length,
            href: "/admin/cars?scope=featured",
          },
          {
            key: "draft",
            label: "Drafts",
            count: all.filter((c) => c.is_draft === "enable").length,
            href: "/admin/cars?scope=draft",
          },
        ]}
      />

      {cars.length ? (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-200 bg-tint-soft text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Car</th>
                  <th className="px-4 py-3.5 font-semibold">Brand</th>
                  <th className="px-4 py-3.5 font-semibold">Seller</th>
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
                    <td className="px-4 py-4">
                      {car.agent_id ? (
                        <Link href={`/admin/users/${car.agent_id}`} className="text-slate-600 hover:text-brand-500">
                          {car.agent_name ?? `#${car.agent_id}`}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
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
                        {car.approved_by_admin !== "approved" ? <StatusPill tone="warn">Awaiting</StatusPill> : null}
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
            {scope !== "all" ? "Nothing matches this filter" : "No cars yet"}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-slate-600">
            {scope !== "all"
              ? "Try a different filter."
              : "Add your first car and it will appear on the website straight away."}
          </p>
          <Link href={scope !== "all" ? "/admin/cars" : "/admin/cars/new"} className="btn-primary mt-8">
            {scope !== "all" ? "Show all cars" : "Add a car"}
          </Link>
        </div>
      )}
    </div>
  )
}

function ActionButtons({
  car,
}: {
  readonly car: {
    id: number
    slug: string
    status: string
    is_featured: string
    approved_by_admin: string
    title: string
  }
}) {
  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"

  return (
    <>
      {car.approved_by_admin !== "approved" ? (
        <form action={setCarApprovalAction}>
          <input type="hidden" name="id" value={car.id} />
          <input type="hidden" name="next" value="1" />
          <button
            type="submit"
            title="Approve and publish"
            className="grid h-9 w-9 place-items-center rounded-xl border border-brand-500 bg-brand-500 text-white transition-colors hover:bg-brand-600"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </form>
      ) : null}
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
