import Link from "next/link"
import { getInquiries } from "@/lib/inquiries"
import { relativeDate } from "@/lib/format"
import { deleteInquiryAction, markInquiryAction } from "@/app/admin/actions"
import { CheckIcon, MailIcon, TrashIcon, CarIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Inquiries" }

export default function AdminInquiriesPage() {
  const inquiries = getInquiries()
  const unread = inquiries.filter((i) => i.is_read === 0).length

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Inquiries</h1>
        <p className="mt-1.5 text-slate-600">
          {inquiries.length} total{unread ? ` · ${unread} unread` : ""}
        </p>
      </header>

      {inquiries.length ? (
        <ul className="space-y-4">
          {inquiries.map((iq) => (
            <li
              key={iq.id}
              className={`card p-6 ${iq.is_read === 0 ? "border-brand-400 bg-brand-50" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-brand-900">{iq.name}</h2>
                    {iq.is_read === 0 ? (
                      <span className="rounded-pill bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        New
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <a href={`mailto:${iq.email}`} className="font-medium text-brand-500 hover:text-brand-600">
                      {iq.email}
                    </a>
                    {iq.phone ? (
                      <a href={`tel:${iq.phone.replace(/\s+/g, "")}`} className="text-slate-600 hover:text-brand-500">
                        {iq.phone}
                      </a>
                    ) : null}
                    <span className="text-slate-400">{relativeDate(iq.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <form action={markInquiryAction}>
                    <input type="hidden" name="id" value={iq.id} />
                    <input type="hidden" name="read" value={iq.is_read === 0 ? "1" : "0"} />
                    <button
                      type="submit"
                      title={iq.is_read === 0 ? "Mark as read" : "Mark as unread"}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                    >
                      {iq.is_read === 0 ? <CheckIcon className="h-4 w-4" /> : <MailIcon className="h-4 w-4" />}
                    </button>
                  </form>

                  <DeleteInquiry id={iq.id} name={iq.name} />
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{iq.message}</p>

              {iq.car_slug ? (
                <Link
                  href={`/listing/${iq.car_slug}`}
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-2 rounded-pill bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-900 ring-1 ring-brand-200 hover:text-brand-500"
                >
                  <CarIcon className="h-3.5 w-3.5" />
                  About: {iq.car_slug}
                </Link>
              ) : (
                <p className="mt-4 text-xs text-slate-400">Sent from the contact page</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="card p-14 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-500">
            <MailIcon className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-xl font-bold text-brand-900">No inquiries yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-slate-600">
            Messages sent from a car listing or the contact page will show up here.
          </p>
        </div>
      )}
    </div>
  )
}

function DeleteInquiry({ id, name }: { readonly id: number; readonly name: string }) {
  return (
    <form action={deleteInquiryAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        title="Delete"
        aria-label={`Delete message from ${name}`}
        className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </form>
  )
}
