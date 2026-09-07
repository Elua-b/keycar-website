import { getKycTypes, getKycType } from "@/lib/kyc"
import { saveKycTypeAction, deleteKycTypeAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, StatusPill } from "@/components/admin/page-header"
import { EditIcon } from "@/components/icons"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const metadata = { title: "KYC document types" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function KycTypesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const editId = Number(one(sp.edit) ?? 0)
  const editing = editId ? getKycType(editId) : null
  const error = one(sp.error)

  const types = getKycTypes()

  return (
    <div className="space-y-7">
      <PageHeader
        title="Document types"
        subtitle="The identity documents sellers can submit for verification."
        back={{ href: "/admin/kyc", label: "Back to KYC" }}
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="card h-fit p-6">
          <h2 className="text-lg font-bold text-brand-900">{editing ? "Edit type" : "Add a type"}</h2>

          <form action={saveKycTypeAction} className="mt-5 space-y-5">
            <input type="hidden" name="id" value={editing?.id ?? 0} />

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-brand-900">Name</span>
              <input
                key={editing?.id ?? "new"}
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                placeholder="National ID"
                className="field"
              />
            </label>

            <label className="flex items-center gap-2.5 text-sm font-medium text-brand-900">
              <input
                type="checkbox"
                name="status"
                defaultChecked={editing ? editing.status === 1 : true}
                className="h-4 w-4 rounded border-brand-200 text-brand-500"
              />
              Offered to sellers
            </label>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">
                {editing ? "Save" : "Add type"}
              </button>
              {editing ? (
                <Link href="/admin/kyc/types" className="btn-outline">
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="card overflow-hidden">
          {types.length ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-200 bg-tint-soft text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Document</th>
                  <th className="px-4 py-3.5 font-semibold">Submissions</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-200">
                {types.map((t) => (
                  <tr key={t.id} className="hover:bg-tint-soft">
                    <td className="px-6 py-4 font-semibold text-brand-900">{t.name}</td>
                    <td className="px-4 py-4 text-slate-600">{t.submission_count ?? 0}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={t.status === 1 ? "on" : "off"}>{t.status === 1 ? "Active" : "Off"}</StatusPill>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/kyc/types?edit=${t.id}`}
                          title="Edit"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Link>
                        <form action={deleteKycTypeAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <ConfirmButton
                            message={
                              t.submission_count
                                ? `Delete "${t.name}"? Its ${t.submission_count} submission(s) are deleted too.`
                                : `Delete "${t.name}"?`
                            }
                            label="Delete type"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              No document types yet — add one on the left.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
