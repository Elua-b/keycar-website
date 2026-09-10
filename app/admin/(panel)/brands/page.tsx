import Link from "next/link"
import Image from "next/image"
import { getBrandsForAdmin, getBrand, countBrands } from "@/lib/brands"
import { deleteBrandAction, toggleBrandStatusAction } from "@/app/admin/manage-actions"
import { BrandForm } from "@/components/admin/brand-form"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader } from "@/components/admin/page-header"
import { optimized } from "@/lib/images"
import { EditIcon, EyeIcon, TagIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Brands" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const iconBtn =
  "grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"

export default async function BrandsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const editId = Number(one(sp.edit) ?? 0)
  const editing = editId ? getBrand(editId) : null
  const error = one(sp.error)

  const brands = getBrandsForAdmin()
  const counts = countBrands()

  return (
    <div className="space-y-7">
      <PageHeader
        title="Brands"
        subtitle="The makes buyers filter by. Each one carries a logo shown on the homepage."
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total brands", value: counts.total },
          { label: "Visible", value: counts.enabled },
          { label: "Missing a logo", value: counts.withoutImage },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-2xl font-extrabold text-brand-900">{s.value}</p>
            <p className="mt-0.5 text-sm font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="card h-fit p-6">
          <h2 className="text-lg font-bold text-brand-900">{editing ? "Edit brand" : "Add a brand"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {editing ? "Renaming updates the filter URL for this brand." : "The logo uploads to Cloudinary."}
          </p>
          <BrandForm brand={editing} />
        </section>

        <section className="card overflow-hidden">
          {brands.length ? (
            <>
              {/* Desktop table */}
              <table className="hidden w-full text-left text-sm lg:table">
                <thead className="border-b border-brand-200 bg-tint-soft text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Brand</th>
                    <th className="px-4 py-3.5 font-semibold">Filter slug</th>
                    <th className="px-4 py-3.5 font-semibold">Listings</th>
                    <th className="px-4 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-200">
                  {brands.map((b) => (
                    <tr key={b.id} className="hover:bg-tint-soft">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Logo brand={b} />
                          <span className="font-semibold text-brand-900">{b.name ?? b.slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">{b.slug}</td>
                      <td className="px-4 py-4 text-slate-600">{b.car_count}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Actions brand={b} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <ul className="divide-y divide-brand-200 lg:hidden">
                {brands.map((b) => (
                  <li key={b.id} className="flex items-center gap-4 p-5">
                    <Logo brand={b} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-brand-900">{b.name ?? b.slug}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {b.car_count} {b.car_count === 1 ? "listing" : "listings"} · {b.slug}
                      </p>
                      <div className="mt-2">
                        <StatusPill status={b.status} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Actions brand={b} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-500">
                <TagIcon className="h-7 w-7" />
              </span>
              <p className="mt-4 font-semibold text-brand-900">No brands yet</p>
              <p className="mt-1.5 text-sm text-slate-500">Add one on the left to start filtering by make.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Logo({ brand }: { readonly brand: { image: string | null; name: string | null; slug: string } }) {
  if (!brand.image) {
    return (
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-dashed border-brand-300 text-brand-300"
        title="No logo uploaded"
      >
        <TagIcon className="h-5 w-5" />
      </span>
    )
  }
  return (
    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-brand-200 bg-white">
      <Image
        src={optimized(brand.image, 88, 88)}
        alt={brand.name ?? brand.slug}
        fill
        sizes="44px"
        className="object-contain p-1"
      />
    </span>
  )
}

function StatusPill({ status }: { readonly status: string }) {
  const live = status === "enable"
  return (
    <span
      className={`rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase ${
        live ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700"
      }`}
    >
      {live ? "Visible" : "Hidden"}
    </span>
  )
}

function Actions({
  brand,
}: {
  readonly brand: { id: number; slug: string; status: string; name: string | null; car_count: number }
}) {
  return (
    <>
      {brand.car_count > 0 ? (
        <Link href={`/listings?brand=${brand.slug}`} target="_blank" className={iconBtn} title="View on site">
          <EyeIcon className="h-4 w-4" />
        </Link>
      ) : null}

      <form action={toggleBrandStatusAction}>
        <input type="hidden" name="id" value={brand.id} />
        <input type="hidden" name="next" value={brand.status === "enable" ? "disable" : "enable"} />
        <button
          type="submit"
          className={iconBtn}
          title={brand.status === "enable" ? "Hide from website" : "Make visible"}
        >
          <EyeIcon className="h-4 w-4" />
        </button>
      </form>

      <Link href={`/admin/brands?edit=${brand.id}`} className={iconBtn} title="Edit">
        <EditIcon className="h-4 w-4" />
      </Link>

      <form action={deleteBrandAction}>
        <input type="hidden" name="id" value={brand.id} />
        <ConfirmButton
          message={`Delete ${brand.name ?? brand.slug}?`}
          label={`Delete ${brand.name ?? brand.slug}`}
        />
      </form>
    </>
  )
}
