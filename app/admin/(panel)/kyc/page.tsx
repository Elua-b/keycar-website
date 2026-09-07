import Link from "next/link"
import Image from "next/image"
import { getKycSubmissions, KYC_PENDING, KYC_APPROVED, KYC_REJECTED } from "@/lib/kyc"
import { imageUrl, optimized } from "@/lib/images"
import { relativeDate } from "@/lib/format"
import { setKycStatusAction, deleteKycAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, FilterChips, EmptyState, StatusPill } from "@/components/admin/page-header"
import { IdCardIcon, EyeIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "KYC" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function AdminKycPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const filter = one(sp.status)
  const status = filter === "0" || filter === "1" || filter === "2" ? Number(filter) : undefined

  const all = getKycSubmissions()
  const rows = typeof status === "number" ? all.filter((k) => k.status === status) : all

  const count = (s: number) => all.filter((k) => k.status === s).length

  return (
    <div className="space-y-7">
      <PageHeader
        title="KYC verification"
        subtitle="Identity documents submitted by sellers. Approving one marks the account verified."
      >
        <Link href="/admin/kyc/types" className="btn-outline">
          Document types
        </Link>
      </PageHeader>

      <FilterChips
        active={filter ?? "all"}
        options={[
          { key: "all", label: "All", count: all.length, href: "/admin/kyc" },
          { key: "0", label: "Pending", count: count(KYC_PENDING), href: "/admin/kyc?status=0" },
          { key: "1", label: "Approved", count: count(KYC_APPROVED), href: "/admin/kyc?status=1" },
          { key: "2", label: "Rejected", count: count(KYC_REJECTED), href: "/admin/kyc?status=2" },
        ]}
      />

      {rows.length ? (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((k) => (
            <li key={k.id} className="card flex flex-col overflow-hidden">
              <a
                href={imageUrl(k.file)}
                target="_blank"
                rel="noreferrer"
                className="relative block h-44 bg-brand-100"
                title="Open the document full size"
              >
                <Image src={optimized(k.file, 600, 400)} alt="" fill sizes="400px" className="object-contain p-2" />
                <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-brand-900">
                  <EyeIcon className="h-4 w-4" />
                </span>
              </a>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {k.user_id ? (
                      <Link
                        href={`/admin/users/${k.user_id}`}
                        className="block truncate font-bold text-brand-900 hover:text-brand-500"
                      >
                        {k.user_name ?? "Unknown user"}
                      </Link>
                    ) : (
                      <p className="truncate font-bold text-brand-900">{k.user_name ?? "Unknown user"}</p>
                    )}
                    <p className="truncate text-xs text-slate-400">{k.user_email}</p>
                  </div>
                  <StatusPill tone={k.status === 1 ? "on" : k.status === 2 ? "warn" : "off"}>
                    {k.status === 1 ? "Approved" : k.status === 2 ? "Rejected" : "Pending"}
                  </StatusPill>
                </div>

                <p className="mt-3 text-sm font-semibold text-brand-900">{k.type_name ?? "Document"}</p>
                {k.message ? <p className="mt-1 text-sm text-slate-600">{k.message}</p> : null}
                <p className="mt-2 text-xs text-slate-400">Submitted {relativeDate(k.created_at)}</p>

                <div className="mt-auto flex items-center gap-2 pt-5">
                  {k.status !== KYC_APPROVED ? (
                    <form action={setKycStatusAction} className="flex-1">
                      <input type="hidden" name="id" value={k.id} />
                      <input type="hidden" name="status" value={KYC_APPROVED} />
                      <button type="submit" className="btn-primary w-full text-xs">
                        Approve
                      </button>
                    </form>
                  ) : null}

                  {k.status !== KYC_REJECTED ? (
                    <form action={setKycStatusAction} className="flex-1">
                      <input type="hidden" name="id" value={k.id} />
                      <input type="hidden" name="status" value={KYC_REJECTED} />
                      <button type="submit" className="btn-outline w-full text-xs">
                        Reject
                      </button>
                    </form>
                  ) : null}

                  <form action={deleteKycAction}>
                    <input type="hidden" name="id" value={k.id} />
                    <ConfirmButton message="Delete this KYC submission?" label="Delete submission" />
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={IdCardIcon}
          title={typeof status === "number" ? "Nothing in this state" : "No submissions yet"}
          description={
            typeof status === "number"
              ? "Try a different filter."
              : "When a seller uploads an identity document it lands here for review."
          }
          action={typeof status === "number" ? { href: "/admin/kyc", label: "Show all" } : undefined}
        />
      )}
    </div>
  )
}
