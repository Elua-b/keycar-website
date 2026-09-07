import Link from "next/link"
import Image from "next/image"
import { getAdminStats, getAllCarsForAdmin, getCurrency, countAwaitingCars } from "@/lib/db"
import { getInquiries } from "@/lib/inquiries"
import { countUsers } from "@/lib/users"
import { countPendingKyc } from "@/lib/kyc"
import { countPendingComments } from "@/lib/blog"
import { countPendingReviews } from "@/lib/reviews"
import { optimized } from "@/lib/images"
import { effectivePrice, formatPrice, relativeDate } from "@/lib/format"
import { cloudinaryConfigured } from "@/lib/cloudinary"
import {
  CarIcon,
  EyeIcon,
  MailIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  ArrowRightIcon,
  UploadIcon,
  UsersIcon,
  IdCardIcon,
  ChatIcon,
  CheckIcon,
} from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Overview" }

export default function AdminDashboardPage() {
  const stats = getAdminStats()
  const currency = getCurrency()
  const recent = getAllCarsForAdmin().slice(0, 5)
  const inquiries = getInquiries(5)

  const users = countUsers()

  const tiles = [
    { label: "Total cars", value: stats.totalCars, icon: CarIcon, href: "/admin/cars" },
    { label: "Published", value: stats.published, icon: TagIcon, href: "/admin/cars?scope=enable" },
    { label: "Featured", value: stats.featured, icon: StarIcon, href: "/admin/cars?scope=featured" },
    { label: "Total views", value: stats.views, icon: EyeIcon, href: "/admin/cars" },
  ]

  // Anything sitting in a queue, so the first screen says what needs a decision.
  const queues = [
    { label: "Cars awaiting approval", value: countAwaitingCars(), icon: CarIcon, href: "/admin/cars?scope=awaiting" },
    { label: "Users awaiting approval", value: users.pending, icon: UsersIcon, href: "/admin/users?scope=disable" },
    { label: "KYC to review", value: countPendingKyc(), icon: IdCardIcon, href: "/admin/kyc?status=0" },
    { label: "Reviews to approve", value: countPendingReviews(), icon: StarIcon, href: "/admin/reviews?status=pending" },
    { label: "Comments to moderate", value: countPendingComments(), icon: ChatIcon, href: "/admin/blog/comments?status=0" },
  ].filter((q) => q.value > 0)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Overview</h1>
          <p className="mt-1.5 text-slate-600">Your inventory at a glance.</p>
        </div>
        <Link href="/admin/cars/new" className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          Add a car
        </Link>
      </header>

      {!cloudinaryConfigured ? (
        <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-brand-300 bg-brand-100 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
            <UploadIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-brand-900">Cloudinary isn&apos;t configured yet</p>
            <p className="mt-1 text-sm text-brand-800">
              Image uploads will fail until you set <code className="font-mono text-xs">CLOUDINARY_CLOUD_NAME</code>,{" "}
              <code className="font-mono text-xs">CLOUDINARY_API_KEY</code> and{" "}
              <code className="font-mono text-xs">CLOUDINARY_API_SECRET</code> in your{" "}
              <code className="font-mono text-xs">.env</code> file, then restart the dev server.
            </p>
          </div>
        </div>
      ) : null}

      {queues.length ? (
        <section className="card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Needs your attention</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {queues.map((q) => (
              <li key={q.label}>
                <Link
                  href={q.href}
                  className="flex items-center gap-3 rounded-xl border border-brand-200 px-4 py-3 transition-colors hover:border-brand-500 hover:bg-brand-100"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500 text-white">
                    <q.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-brand-900">{q.label}</span>
                  <span className="rounded-pill bg-brand-900 px-2.5 py-0.5 text-xs font-bold text-white">{q.value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="flex items-center gap-2.5 rounded-2xl bg-brand-100 px-5 py-4 text-sm font-medium text-brand-800">
          <CheckIcon className="h-4 w-4 shrink-0" />
          Nothing is waiting for approval — you are all caught up.
        </p>
      )}

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card group p-6 hover:-translate-y-0.5 hover:border-brand-500">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <t.icon className="h-5 w-5" />
              </span>
              <ArrowRightIcon className="h-4 w-4 text-brand-200 transition-colors group-hover:text-brand-500" />
            </div>
            <p className="mt-5 text-3xl font-extrabold text-brand-900">{t.value.toLocaleString("en-US")}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{t.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Recent cars */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-brand-200 px-6 py-4">
            <h2 className="font-bold text-brand-900">Recently added</h2>
            <Link href="/admin/cars" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
              View all
            </Link>
          </header>

          {recent.length ? (
            <ul className="divide-y divide-brand-200">
              {recent.map((car) => (
                <li key={car.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                    <Image
                      src={optimized(car.thumb_image, 160, 112)}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/admin/cars/${car.id}/edit`}
                      className="block truncate font-semibold text-brand-900 hover:text-brand-500"
                    >
                      {car.title || car.slug}
                    </Link>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span>{car.brand_name ?? "—"}</span>
                      <span aria-hidden>·</span>
                      <span>{formatPrice(effectivePrice(car), currency)}</span>
                      <span aria-hidden>·</span>
                      <span>{relativeDate(car.created_at)}</span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase ${
                      car.status === "enable" ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {car.status === "enable" ? "Live" : "Hidden"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-500">
                <CarIcon className="h-7 w-7" />
              </span>
              <p className="mt-4 font-semibold text-brand-900">No cars yet</p>
              <Link href="/admin/cars/new" className="btn-primary mt-5">
                <PlusIcon className="h-4 w-4" />
                Add your first car
              </Link>
            </div>
          )}
        </section>

        {/* Recent inquiries */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-brand-200 px-6 py-4">
            <h2 className="font-bold text-brand-900">Latest inquiries</h2>
            <Link href="/admin/messages" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
              View all
            </Link>
          </header>

          {inquiries.length ? (
            <ul className="divide-y divide-brand-200">
              {inquiries.map((iq) => (
                <li key={iq.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-semibold text-brand-900">{iq.name}</p>
                    {iq.is_read === 0 ? (
                      <span className="shrink-0 rounded-pill bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{iq.message}</p>
                  <p className="mt-1.5 text-xs text-slate-400">{relativeDate(iq.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-500">
                <MailIcon className="h-7 w-7" />
              </span>
              <p className="mt-4 font-semibold text-brand-900">No inquiries yet</p>
              <p className="mt-1.5 text-sm text-slate-500">
                Messages from car pages and the contact form land here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
