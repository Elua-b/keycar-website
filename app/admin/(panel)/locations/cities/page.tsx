import Link from "next/link"
import { getCitiesForAdmin, getCity, getCountries } from "@/lib/locations"
import { saveCityAction, deleteCityAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader } from "@/components/admin/page-header"
import { EditIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Cities" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function CitiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const editId = Number(one(sp.edit) ?? 0)
  const editing = editId ? getCity(editId) : null
  const error = one(sp.error)

  const cities = getCitiesForAdmin()
  const countries = getCountries()

  return (
    <div className="space-y-7">
      <PageHeader title="Locations" subtitle="Cities sellers can list a car in.">
        <Link href="/admin/locations" className="btn-outline">
          Countries
        </Link>
      </PageHeader>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/locations" className="chip">
          Countries
        </Link>
        <span className="chip chip-active">Cities</span>
      </div>

      {countries.length === 0 ? (
        <p className="rounded-2xl bg-brand-100 px-5 py-4 text-sm font-medium text-brand-700">
          Add a country first — every city belongs to one.{" "}
          <Link href="/admin/locations" className="underline">
            Add a country
          </Link>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="card h-fit p-6">
          <h2 className="text-lg font-bold text-brand-900">{editing ? "Edit city" : "Add a city"}</h2>

          <form action={saveCityAction} className="mt-5 space-y-5">
            <input type="hidden" name="id" value={editing?.id ?? 0} />

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-900">Name</span>
              <input
                key={`n-${editing?.id ?? "new"}`}
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                placeholder="Kigali"
                className="field"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-900">Country</span>
              <select
                key={`c-${editing?.id ?? "new"}`}
                name="country_id"
                required
                defaultValue={editing?.country_id ?? countries[0]?.id ?? ""}
                className="field"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <button type="submit" disabled={countries.length === 0} className="btn-primary flex-1 disabled:opacity-50">
                {editing ? "Save" : "Add city"}
              </button>
              {editing ? (
                <Link href="/admin/locations/cities" className="btn-outline">
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="card overflow-hidden">
          {cities.length ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-200 bg-tint-soft text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">City</th>
                  <th className="px-4 py-3.5 font-semibold">Country</th>
                  <th className="px-4 py-3.5 font-semibold">Listings</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-200">
                {cities.map((c) => (
                  <tr key={c.id} className="hover:bg-tint-soft">
                    <td className="px-6 py-4 font-semibold text-brand-900">{c.name ?? "Unnamed"}</td>
                    <td className="px-4 py-4 text-slate-600">{c.country_name ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{c.car_count ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/locations/cities?edit=${c.id}`}
                          title="Edit"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Link>
                        <form action={deleteCityAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton message={`Delete ${c.name}?`} label="Delete city" />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-6 py-12 text-center text-sm text-slate-500">No cities yet — add one on the left.</p>
          )}
        </section>
      </div>
    </div>
  )
}
