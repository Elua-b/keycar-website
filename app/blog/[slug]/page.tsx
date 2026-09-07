import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getPostBySlug, getRelatedPosts, getApprovedComments, incrementPostViews } from "@/lib/blog"
import { optimized } from "@/lib/images"
import { relativeDate } from "@/lib/format"
import { getBrands, getSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CommentForm } from "@/components/comment-form"
import { ChevronLeftIcon, ChatIcon, EyeIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: "Article not found" }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seo_title || post.title || undefined,
      description: post.seo_description || undefined,
      type: "article",
      url: `/blog/${post.slug}`,
      images: post.image ? [{ url: optimized(post.image, 1200, 630) }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  incrementPostViews(post.id)

  const settings = getSettings()
  const brands = getBrands(false)

  const comments = getApprovedComments(post.id)
  const related = getRelatedPosts(post, 3)
  const tags = (post.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <>
      <SiteHeader phone={settings.phone} />

      <article className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-500"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            All articles
          </Link>

          <header className="mt-6">
            {post.category_name ? (
              <Link
                href={`/blog?category=${post.category_slug}`}
                className="text-xs font-bold uppercase tracking-wide text-brand-500"
              >
                {post.category_name}
              </Link>
            ) : null}
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>{relativeDate(post.created_at)}</span>
              <span className="inline-flex items-center gap-1.5">
                <EyeIcon className="h-4 w-4" />
                {post.views} view{post.views === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ChatIcon className="h-4 w-4" />
                {comments.length} comment{comments.length === 1 ? "" : "s"}
              </span>
            </p>
          </header>

          {post.image ? (
            <div className="relative mt-8 h-64 overflow-hidden rounded-2xl bg-brand-100 sm:h-96">
              <Image src={optimized(post.image, 1200, 700)} alt="" fill sizes="768px" className="object-cover" priority />
            </div>
          ) : null}

          {/* Body is admin-authored HTML from the blog editor. */}
          <div
            className="prose-blog mt-9 text-[15px] leading-relaxed text-slate-700"
            dangerouslySetInnerHTML={{ __html: post.description ?? "" }}
          />

          {tags.length ? (
            <div className="mt-9 flex flex-wrap gap-2 border-t border-brand-200 pt-6">
              {tags.map((t) => (
                <Link key={t} href={`/blog?q=${encodeURIComponent(t)}`} className="chip">
                  #{t}
                </Link>
              ))}
            </div>
          ) : null}

          {/* ---------- Comments ---------- */}
          <section className="mt-12 border-t border-brand-200 pt-10">
            <h2 className="text-xl font-bold text-brand-900">
              {comments.length ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Join the conversation"}
            </h2>

            {comments.length ? (
              <ul className="mt-6 space-y-5">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-2xl bg-tint-soft p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-brand-900">{c.name}</span>
                        <span className="text-xs text-slate-400">{relativeDate(c.created_at)}</span>
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{c.comment}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8">
              <CommentForm blogId={post.id} />
            </div>
          </section>
        </div>

        {related.length ? (
          <section className="bg-tint-soft py-14">
            <div className="mx-auto max-w-6xl px-5">
              <h2 className="text-2xl font-extrabold tracking-tight text-brand-900">Keep reading</h2>
              <ul className="mt-7 grid gap-6 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id} className="card group overflow-hidden">
                    <Link href={`/blog/${r.slug}`} className="relative block h-36 bg-brand-100">
                      <Image
                        src={optimized(r.image, 480, 300)}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 240px, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <div className="p-5">
                      <h3 className="text-sm font-bold leading-snug text-brand-900">
                        <Link href={`/blog/${r.slug}`} className="hover:text-brand-500">
                          {r.title}
                        </Link>
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-400">{relativeDate(r.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </article>

      <SiteFooter
        appName={settings.app_name}
        email={settings.email}
        phone={settings.phone}
        address={settings.address}
        copyright={settings.copyright}
        brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
      />
    </>
  )
}
