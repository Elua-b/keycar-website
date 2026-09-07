import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getUser, getUserStats } from "@/lib/users"
import { getCarsForAdmin, getCurrency } from "@/lib/db"
import { getKycSubmissions } from "@/lib/kyc"
import { optimized } from "@/lib/images"
import { effectivePrice, formatPrice, relativeDate } from "@/lib/format"
import { updateUserAction, deleteUserAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, StatusPill } from "@/components/admin/page-header"
import { CarIcon, IdCardIcon, StarIcon, EyeIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = getUser(Number(id))
  return { title: user?.name ?? "User" }
}

export default async function AdminUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SP>
}) {
  const { id } = await params
  const sp = await searchParams
  const userId = Number(id)
  const user = getUser(userId)
  if (!user) notFound()

  const stats = getUserStats(userId)
  const currency = getCurrency()
  const cars = getCarsForAdmin("all").filter((c) => c.agent_id === userId)
  const kyc = getKycSubmissions().filter((k) => k.user_id === userId)
  const error = one(sp.error)

  return (
    <div className="space-y-7">
      <PageHeader
        title={user.name ?? "Unnamed user"}
        subtitle={user.email ?? undefined}
        back={{ href: "/admin/users", label: "Back to users" }}
      >
        <form action={deleteUserAction}>
          <input type="hidden" name="id" value={user.id} />
          <ConfirmButton
            message={`Delete ${user.name ?? "this user"}? This cannot be undone.`}
            className="btn btn-outline text-red-600 hover:border-red-500 hover:bg-red-500 hover:text-white"
          >
            Delete user
          </ConfirmButton>
        </form>
      </PageHeader>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CarIcon} label="Total listings" value={stats.totalListings} />
        <Stat icon={EyeIcon} label="Live listings" value={stats.activeListings} />
        <Stat icon={StarIcon} label="Reviews received" value={stats.reviews} />
        <Stat icon={IdCardIcon} label="KYC submissions" value={kyc.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---------- Profile form ---------- */}
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-brand-900">Profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            The same fields the Laravel admin could edit. Email and password stay with the account owner.
          </p>

          <form action={updateUserAction} className="mt-6 space-y-5">
            <input type="hidden" name="id" value={user.id} />

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Name</span>
                <input name="name" defaultValue={user.name ?? ""} required className="field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Phone</span>
                <input name="phone" defaultValue={user.phone ?? ""} className="field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Designation</span>
                <input
                  name="designation"
                  defaultValue={user.designation ?? ""}
                  placeholder="Dealer, Private seller…"
                  className="field"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Country</span>
                <input name="country" defaultValue={user.country ?? ""} className="field" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Address</span>
                <textarea name="address" rows={2} defaultValue={user.address ?? ""} className="field" />
              </label>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-brand-200 pt-5">
              <label className="flex items-center gap-2.5 text-sm font-medium text-brand-900">
                <input
                  type="checkbox"
                  name="status"
                  defaultChecked={user.status === "enable"}
                  className="h-4 w-4 rounded border-brand-200 text-brand-500"
                />
                Account active
              </label>
              <label className="flex items-center gap-2.5 text-sm font-medium text-brand-900">
                <input
                  type="checkbox"
                  name="is_dealer"
                  defaultChecked={!!user.is_dealer}
                  className="h-4 w-4 rounded border-brand-200 text-brand-500"
                />
                Verified dealer
              </label>
            </div>

            <button type="submit" className="btn-primary">
              Save changes
            </button>
          </form>
        </section>

        {/* ---------- Side panel ---------- */}
        <aside className="space-y-6">
          <div className="card p-6">
            <span className="relative mx-auto block h-20 w-20 overflow-hidden rounded-full bg-brand-100">
              {user.image ? (
                <Image src={optimized(user.image, 160, 160)} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-2xl font-bold text-brand-500">
                  {(user.name ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <p className="mt-4 text-center font-bold text-brand-900">{user.name}</p>
            <p className="text-center text-sm text-slate-500">{user.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              <StatusPill tone={user.status === "enable" ? "on" : "off"}>
                {user.status === "enable" ? "Active" : "Pending"}
              </StatusPill>
              {user.is_dealer ? <StatusPill tone="muted">Dealer</StatusPill> : null}
            </div>
            <dl className="mt-5 space-y-2 border-t border-brand-200 pt-5 text-sm">
              <Row label="Joined" value={relativeDate(user.created_at)} />
              <Row label="KYC" value={user.kyc_status ?? "pending"} />
              <Row label="Country" value={user.country ?? "—"} />
            </dl>
          </div>

          {kyc.length ? (
            <div className="card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">KYC submissions</h2>
              <ul className="mt-4 space-y-3">
                {kyc.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-brand-900">{k.type_name ?? "Document"}</span>
                      <span className="text-xs text-slate-400">{relativeDate(k.created_at)}</span>
                    </span>
                    <StatusPill tone={k.status === 1 ? "on" : k.status === 2 ? "warn" : "off"}>
                      {k.status === 1 ? "Approved" : k.status === 2 ? "Rejected" : "Pending"}
                    </StatusPill>
                  </li>
                ))}
              </ul>
              <Link href="/admin/kyc" className="btn-outline mt-5 w-full text-xs">
                Review in KYC
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      {/* ---------- Their listings ---------- */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-200 px-6 py-4">
          <h2 className="font-bold text-brand-900">Listings</h2>
          <span className="text-sm text-slate-500">{cars.length}</span>
        </div>
        {cars.length ? (
          <ul className="divide-y divide-brand-200">
            {cars.map((car) => (
              <li key={car.id} className="flex items-center gap-4 px-6 py-4">
                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-100">
                  <Image src={optimized(car.thumb_image, 128, 96)} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/admin/cars/${car.id}/edit`}
                    className="block truncate font-semibold text-brand-900 hover:text-brand-500"
                  >
                    {car.title || car.slug}
                  </Link>
                  <span className="text-xs text-slate-400">
                    {car.brand_name ?? "—"} · {formatPrice(effectivePrice(car), currency)}
                  </span>
                </span>
                <StatusPill tone={car.status === "enable" ? "on" : "off"}>
                  {car.status === "enable" ? "Live" : "Hidden"}
                </StatusPill>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-slate-500">This user has not listed a car yet.</p>
        )}
      </section>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: (p: { className?: string }) => React.JSX.Element
  readonly label: string
  readonly value: number
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-2xl font-extrabold text-brand-900">{value}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      </span>
    </div>
  )
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-semibold capitalize text-brand-900">{value}</dd>
    </div>
  )
}
