import Link from "next/link"
import Image from "next/image"
import { getUsers, countUsers, type UserScope } from "@/lib/users"
import { optimized } from "@/lib/images"
import { relativeDate } from "@/lib/format"
import { toggleUserStatusAction, deleteUserAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, FilterChips, EmptyState, StatusPill } from "@/components/admin/page-header"
import { UsersIcon, EyeIcon, CheckIcon, CloseIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Users" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const SCOPES: UserScope[] = ["all", "enable", "disable", "dealer"]

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const raw = one(sp.scope) ?? "all"
  const scope = (SCOPES.includes(raw as UserScope) ? raw : "all") as UserScope
  const error = one(sp.error)

  const users = getUsers(scope)
  const counts = countUsers()

  return (
    <div className="space-y-7">
      <PageHeader title="Users" subtitle="Dealers and private sellers who own listings on the site." />

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <FilterChips
        active={scope}
        options={[
          { key: "all", label: "All", count: counts.total, href: "/admin/users" },
          { key: "enable", label: "Active", count: counts.active, href: "/admin/users?scope=enable" },
          { key: "disable", label: "Pending", count: counts.pending, href: "/admin/users?scope=disable" },
          { key: "dealer", label: "Dealers", count: counts.dealers, href: "/admin/users?scope=dealer" },
        ]}
      />

      {users.length ? (
        <div className="card overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-200 bg-tint-soft text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">User</th>
                  <th className="px-4 py-3.5 font-semibold">Phone</th>
                  <th className="px-4 py-3.5 font-semibold">Listings</th>
                  <th className="px-4 py-3.5 font-semibold">KYC</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-tint-soft">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-100">
                          {u.image ? (
                            <Image src={optimized(u.image, 80, 80)} alt="" fill sizes="40px" className="object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-sm font-bold text-brand-500">
                              {(u.name ?? "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="block truncate font-semibold text-brand-900 hover:text-brand-500"
                          >
                            {u.name ?? "Unnamed"}
                          </Link>
                          <span className="text-xs text-slate-400">{u.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{u.phone ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{u.car_count ?? 0}</td>
                    <td className="px-4 py-4">
                      <KycPill status={u.kyc_status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusPill tone={u.status === "enable" ? "on" : "off"}>
                          {u.status === "enable" ? "Active" : "Pending"}
                        </StatusPill>
                        {u.is_dealer ? <StatusPill tone="muted">Dealer</StatusPill> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <RowActions user={u} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-brand-200 lg:hidden">
            {users.map((u) => (
              <li key={u.id} className="p-5">
                <Link href={`/admin/users/${u.id}`} className="font-semibold text-brand-900">
                  {u.name ?? "Unnamed"}
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">{u.email}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {u.car_count ?? 0} listing{u.car_count === 1 ? "" : "s"} · joined {relativeDate(u.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <StatusPill tone={u.status === "enable" ? "on" : "off"}>
                    {u.status === "enable" ? "Active" : "Pending"}
                  </StatusPill>
                  <KycPill status={u.kyc_status} />
                </div>
                <div className="mt-4 flex items-center justify-end gap-1">
                  <RowActions user={u} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={UsersIcon}
          title={scope === "all" ? "No users yet" : "Nothing matches this filter"}
          description={
            scope === "all"
              ? "Accounts created on the website will appear here."
              : "Try a different filter to see other accounts."
          }
          action={scope === "all" ? undefined : { href: "/admin/users", label: "Show all users" }}
        />
      )}
    </div>
  )
}

function KycPill({ status }: { readonly status: string | null }) {
  if (status === "approved") return <StatusPill tone="on">Verified</StatusPill>
  if (status === "rejected") return <StatusPill tone="warn">Rejected</StatusPill>
  return <StatusPill tone="off">Pending</StatusPill>
}

function RowActions({ user }: { readonly user: { id: number; name: string | null; status: string } }) {
  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"

  return (
    <>
      <Link href={`/admin/users/${user.id}`} className={iconBtn} title="View profile">
        <EyeIcon className="h-4 w-4" />
      </Link>

      <form action={toggleUserStatusAction}>
        <input type="hidden" name="id" value={user.id} />
        <input type="hidden" name="next" value={user.status === "enable" ? "disable" : "enable"} />
        <button
          type="submit"
          className={iconBtn}
          title={user.status === "enable" ? "Suspend this account" : "Approve this account"}
        >
          {user.status === "enable" ? <CloseIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
        </button>
      </form>

      <form action={deleteUserAction}>
        <input type="hidden" name="id" value={user.id} />
        <ConfirmButton
          message={`Delete ${user.name ?? "this user"}? Their reviews and saved cars go too. This cannot be undone.`}
          label="Delete user"
        />
      </form>
    </>
  )
}
