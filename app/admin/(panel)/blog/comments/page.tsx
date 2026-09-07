import Link from "next/link"
import { getComments } from "@/lib/blog"
import { relativeDate } from "@/lib/format"
import { setCommentStatusAction, deleteCommentAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, FilterChips, EmptyState, StatusPill } from "@/components/admin/page-header"
import { ChatIcon, CheckIcon, CloseIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Blog comments" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function BlogCommentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const filter = one(sp.status) ?? "all"

  const all = getComments()
  const comments = filter === "1" ? all.filter((c) => c.status === 1) : filter === "0" ? all.filter((c) => c.status === 0) : all

  return (
    <div className="space-y-7">
      <PageHeader
        title="Comments"
        subtitle="Comments stay hidden until you approve them."
        back={{ href: "/admin/blog", label: "Back to blog" }}
      />

      <FilterChips
        active={filter}
        options={[
          { key: "all", label: "All", count: all.length, href: "/admin/blog/comments" },
          { key: "0", label: "Pending", count: all.filter((c) => c.status === 0).length, href: "/admin/blog/comments?status=0" },
          { key: "1", label: "Approved", count: all.filter((c) => c.status === 1).length, href: "/admin/blog/comments?status=1" },
        ]}
      />

      {comments.length ? (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-brand-900">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    {c.email}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={c.status === 1 ? "on" : "off"}>
                    {c.status === 1 ? "Approved" : "Pending"}
                  </StatusPill>
                  <span className="text-xs text-slate-400">{relativeDate(c.created_at)}</span>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-slate-700">{c.comment}</p>

              {c.post_slug ? (
                <p className="mt-3 text-sm text-slate-500">
                  On{" "}
                  <Link href={`/blog/${c.post_slug}`} target="_blank" className="font-semibold text-brand-500">
                    {c.post_title ?? c.post_slug}
                  </Link>
                </p>
              ) : null}

              <div className="mt-5 flex items-center gap-2">
                <form action={setCommentStatusAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="next" value={c.status === 1 ? "0" : "1"} />
                  <button type="submit" className={c.status === 1 ? "btn-outline text-xs" : "btn-primary text-xs"}>
                    {c.status === 1 ? (
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

                <form action={deleteCommentAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton message={`Delete the comment from ${c.name}?`} label="Delete comment" />
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ChatIcon}
          title={filter === "all" ? "No comments yet" : "Nothing in this state"}
          description={
            filter === "all"
              ? "Readers can comment at the bottom of every article."
              : "Try a different filter."
          }
          action={filter === "all" ? undefined : { href: "/admin/blog/comments", label: "Show all" }}
        />
      )}
    </div>
  )
}
