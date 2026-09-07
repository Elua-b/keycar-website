import Link from "next/link"
import Image from "next/image"
import { getAllPostsForAdmin, countPendingComments } from "@/lib/blog"
import { optimized } from "@/lib/images"
import { relativeDate } from "@/lib/format"
import { togglePostStatusAction, deletePostAction } from "@/app/admin/manage-actions"
import { ConfirmButton } from "@/components/admin/confirm-button"
import { PageHeader, FilterChips, EmptyState, StatusPill } from "@/components/admin/page-header"
import { NewspaperIcon, EditIcon, EyeIcon, PlusIcon, CloseIcon, CheckIcon } from "@/components/icons"

export const dynamic = "force-dynamic"
export const metadata = { title: "Blog" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const filter = one(sp.status) ?? "all"
  const error = one(sp.error)

  const all = getAllPostsForAdmin()
  const posts = filter === "1" ? all.filter((p) => p.status === 1) : filter === "0" ? all.filter((p) => p.status === 0) : all
  const pendingComments = countPendingComments()

  return (
    <div className="space-y-7">
      <PageHeader title="Blog" subtitle="Articles published on the website.">
        <Link href="/admin/blog/categories" className="btn-outline">
          Categories
        </Link>
        <Link href="/admin/blog/comments" className="btn-outline">
          Comments
          {pendingComments ? (
            <span className="ml-1.5 rounded-pill bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {pendingComments}
            </span>
          ) : null}
        </Link>
        <Link href="/admin/blog/new" className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          Write a post
        </Link>
      </PageHeader>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <FilterChips
        active={filter}
        options={[
          { key: "all", label: "All", count: all.length, href: "/admin/blog" },
          { key: "1", label: "Published", count: all.filter((p) => p.status === 1).length, href: "/admin/blog?status=1" },
          { key: "0", label: "Drafts", count: all.filter((p) => p.status === 0).length, href: "/admin/blog?status=0" },
        ]}
      />

      {posts.length ? (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-brand-200">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-5 hover:bg-tint-soft">
                <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                  <Image src={optimized(p.image, 192, 128)} alt="" fill sizes="96px" className="object-cover" />
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/blog/${p.id}/edit`}
                    className="block truncate font-semibold text-brand-900 hover:text-brand-500"
                  >
                    {p.title ?? p.slug}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {p.category_name ?? "Uncategorised"} · {p.views} view{p.views === 1 ? "" : "s"} ·{" "}
                    {p.comment_count ?? 0} comment{p.comment_count === 1 ? "" : "s"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusPill tone={p.status === 1 ? "on" : "off"}>
                      {p.status === 1 ? "Published" : "Draft"}
                    </StatusPill>
                    {p.is_popular === "yes" ? <StatusPill tone="muted">Popular</StatusPill> : null}
                    <span className="text-xs text-slate-400">{relativeDate(p.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    title="View on site"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>

                  <form action={togglePostStatusAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="next" value={p.status === 1 ? "0" : "1"} />
                    <button
                      type="submit"
                      title={p.status === 1 ? "Unpublish" : "Publish"}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                    >
                      {p.status === 1 ? <CloseIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                    </button>
                  </form>

                  <Link
                    href={`/admin/blog/${p.id}/edit`}
                    title="Edit"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Link>

                  <form action={deletePostAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message={`Delete "${p.title ?? p.slug}"? Its comments go too.`} label="Delete post" />
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={NewspaperIcon}
          title={filter === "all" ? "No posts yet" : "Nothing matches this filter"}
          description={
            filter === "all"
              ? "Write your first article and it appears on the website straight away."
              : "Try a different filter."
          }
          action={filter === "all" ? { href: "/admin/blog/new", label: "Write a post" } : { href: "/admin/blog", label: "Show all" }}
        />
      )}
    </div>
  )
}
