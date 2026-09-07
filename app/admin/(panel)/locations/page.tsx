import Link from "next/link"
import { getCountries, getCountry } from "@/lib/locations"
import { saveCountryAction, deleteCountryAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader } from "@/components/admin/page-header"
import { EditIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Countries" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function CountriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const editId = Number(one(sp.edit) ?? 0)
  const editing = editId ? getCountry(editId) : null
  const error = one(sp.error)

  const countries = getCountries()

  return (
    <div className="space-y-7">
      <PageHeader title="Locations" subtitle="Countries and the cities inside them. Listings point at both.">
        <Link href="/admin/locations/cities" className="btn-outline">
          Cities
        </Link>
      </PageHeader>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <span className="chip chip-active">Countries</span>
        <Link href="/admin/locations/cities" className="chip">
          Cities
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="card h-fit p-6">
          <h2 className="text-lg font-bold text-brand-900">{editing ? "Edit country" : "Add a country"}</h2>

          <form action={saveCountryAction} className="mt-5 space-y-5">
            <input type="hidden" name="id" value={editing?.id ?? 0} />

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-900">Name</span>
              <input
                key={`n-${editing?.id ?? "new"}`}
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                placeholder="Rwanda"
                className="field"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-900">
                Code <span className="font-normal text-slate-400">optional</span>
              </span>
              <input
                key={`c-${editing?.id ?? "new"}`}
                name="code"
                maxLength={8}
                defaultValue={editing?.code ?? ""}
                placeholder="RW"
                className="field uppercase"
              />
            </label>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">
                {editing ? "Save" : "Add country"}
              </button>
              {editing ? (
                <Link href="/admin/locations" className="btn-outline">
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="card overflow-hidden">
          {countries.length ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-200 bg-tint-soft text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Country</th>
                  <th className="px-4 py-3.5 font-semibold">Code</th>
                  <th className="px-4 py-3.5 font-semibold">Cities</th>
                  <th className="px-4 py-3.5 font-semibold">Listings</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-200">
                {countries.map((c) => (
                  <tr key={c.id} className="hover:bg-tint-soft">
                    <td className="px-6 py-4 font-semibold text-brand-900">{c.name}</td>
                    <td className="px-4 py-4 text-slate-600">{c.code ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{c.city_count ?? 0}</td>
                    <td className="px-4 py-4 text-slate-600">{c.car_count ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/locations?edit=${c.id}`}
                          title="Edit"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Link>
                        <form action={deleteCountryAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton message={`Delete ${c.name}?`} label="Delete country" />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-6 py-12 text-center text-sm text-slate-500">No countries yet — add one on the left.</p>
          )}
        </section>
      </div>
    </div>
  )
}
