import Link from "next/link"
import { getInquiries, countInquiries } from "@/lib/inquiries"
import { relativeDate } from "@/lib/format"
import { deleteInquiryAction, markInquiryAction } from "@/app/admin/actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, FilterChips, EmptyState } from "@/components/admin/page-header"
import { CheckIcon, MailIcon, CarIcon, SlidersIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Messages" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/**
 * The Laravel ContactMessage admin and the per-listing inquiry form are one
 * inbox here: both write to `car_inquiries`, and a message that came from a
 * listing simply carries a car slug.
 */
export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const filter = one(sp.filter) ?? "all"

  const all = getInquiries()
  const counts = countInquiries()

  const messages =
    filter === "unread"
      ? all.filter((m) => m.is_read === 0)
      : filter === "cars"
        ? all.filter((m) => m.car_slug)
        : filter === "contact"
          ? all.filter((m) => !m.car_slug)
          : all

  return (
    <div className="space-y-7">
      <PageHeader
        title="Messages"
        subtitle="Everything sent from the contact page and from car listings."
      >
        <Link href="/admin/messages/settings" className="btn-outline">
          <SlidersIcon className="h-4 w-4" />
          Settings
        </Link>
      </PageHeader>

      <FilterChips
        active={filter}
        options={[
          { key: "all", label: "All", count: counts.total, href: "/admin/messages" },
          { key: "unread", label: "Unread", count: counts.unread, href: "/admin/messages?filter=unread" },
          { key: "cars", label: "About a car", count: counts.aboutCars, href: "/admin/messages?filter=cars" },
          {
            key: "contact",
            label: "Contact page",
            count: counts.total - counts.aboutCars,
            href: "/admin/messages?filter=contact",
          },
        ]}
      />

      {messages.length ? (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={`card p-6 ${m.is_read === 0 ? "border-brand-400 bg-brand-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-brand-900">{m.name}</h2>
                    {m.is_read === 0 ? (
                      <span className="rounded-pill bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        New
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <a href={`mailto:${m.email}`} className="font-medium text-brand-500 hover:text-brand-600">
                      {m.email}
                    </a>
                    {m.phone ? (
                      <a href={`tel:${m.phone.replace(/\s+/g, "")}`} className="text-slate-600 hover:text-brand-500">
                        {m.phone}
                      </a>
                    ) : null}
                    <span className="text-slate-400">{relativeDate(m.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <form action={markInquiryAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="read" value={m.is_read === 0 ? "1" : "0"} />
                    <button
                      type="submit"
                      title={m.is_read === 0 ? "Mark as read" : "Mark as unread"}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                    >
                      {m.is_read === 0 ? <CheckIcon className="h-4 w-4" /> : <MailIcon className="h-4 w-4" />}
                    </button>
                  </form>

                  <form action={deleteInquiryAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmButton message={`Delete the message from ${m.name}?`} label="Delete message" />
                  </form>
                </div>
              </div>

              {m.subject ? <p className="mt-4 font-semibold text-brand-900">{m.subject}</p> : null}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{m.message}</p>

              {m.car_slug ? (
                <Link
                  href={`/listing/${m.car_slug}`}
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-2 rounded-pill bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-900 ring-1 ring-brand-200 hover:text-brand-500"
                >
                  <CarIcon className="h-3.5 w-3.5" />
                  About: {m.car_slug}
                </Link>
              ) : (
                <p className="mt-4 text-xs text-slate-400">Sent from the contact page</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MailIcon}
          title={filter === "all" ? "No messages yet" : "Nothing matches this filter"}
          description={
            filter === "all"
              ? "Messages sent from a car listing or the contact page show up here."
              : "Try a different filter."
          }
          action={filter === "all" ? undefined : { href: "/admin/messages", label: "Show all" }}
        />
      )}
    </div>
  )
}
