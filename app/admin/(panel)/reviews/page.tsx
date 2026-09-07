import Link from "next/link"
import { getReviews } from "@/lib/reviews"
import { relativeDate } from "@/lib/format"
import { setReviewStatusAction, deleteReviewAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, FilterChips, EmptyState, StatusPill } from "@/components/admin/page-header"
import { StarIcon, CheckIcon, CloseIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Reviews" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const filter = one(sp.status) ?? "all"

  const all = getReviews()
  const reviews =
    filter === "enable" ? all.filter((r) => r.status === "enable") : filter === "pending" ? all.filter((r) => r.status !== "enable") : all

  return (
    <div className="space-y-7">
      <PageHeader title="Reviews" subtitle="Buyer reviews stay hidden on the website until you approve them." />

      <FilterChips
        active={filter}
        options={[
          { key: "all", label: "All", count: all.length, href: "/admin/reviews" },
          { key: "pending", label: "Pending", count: all.filter((r) => r.status !== "enable").length, href: "/admin/reviews?status=pending" },
          { key: "enable", label: "Approved", count: all.filter((r) => r.status === "enable").length, href: "/admin/reviews?status=enable" },
        ]}
      />

      {reviews.length ? (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-brand-900">{r.user_name ?? "Anonymous"}</p>
                  <p className="text-sm text-slate-500">{r.user_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <StatusPill tone={r.status === "enable" ? "on" : "off"}>
                    {r.status === "enable" ? "Approved" : "Pending"}
                  </StatusPill>
                </div>
              </div>

              {r.comment ? <p className="mt-3 whitespace-pre-line text-slate-700">{r.comment}</p> : null}

              <p className="mt-3 text-sm text-slate-500">
                {r.car_slug ? (
                  <>
                    On{" "}
                    <Link href={`/listing/${r.car_slug}`} target="_blank" className="font-semibold text-brand-500">
                      {r.car_title ?? r.car_slug}
                    </Link>
                  </>
                ) : (
                  "Listing removed"
                )}
                {r.agent_name ? ` · seller ${r.agent_name}` : ""} · {relativeDate(r.created_at)}
              </p>

              <div className="mt-5 flex items-center gap-2">
                <form action={setReviewStatusAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="next" value={r.status === "enable" ? "0" : "1"} />
                  <button type="submit" className={r.status === "enable" ? "btn-outline text-xs" : "btn-primary text-xs"}>
                    {r.status === "enable" ? (
                      <>
                        <CloseIcon className="h-4 w-4" />
                        Unapprove
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </button>
                </form>

                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message="Delete this review?" label="Delete review" />
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={StarIcon}
          title={filter === "all" ? "No reviews yet" : "Nothing in this state"}
          description={
            filter === "all" ? "Buyers can review a car after contacting the seller." : "Try a different filter."
          }
          action={filter === "all" ? undefined : { href: "/admin/reviews", label: "Show all" }}
        />
      )}
    </div>
  )
}

function Stars({ rating }: { readonly rating: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={`h-4 w-4 ${n <= rating ? "text-brand-500" : "text-brand-200"}`} />
      ))}
    </span>
  )
}
