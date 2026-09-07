import { notFound } from "next/navigation"
import { getPostById, getBlogCategories } from "@/lib/blog"
import { BlogForm, type BlogFormValues } from "@/components/admin/blog-form"
import { PageHeader } from "@/components/admin/page-header"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getPostById(Number(id))
  return { title: post?.title ?? "Edit post" }
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getPostById(Number(id))
  if (!post) notFound()

  const categories = getBlogCategories()

  const initial: BlogFormValues = {
    id: post.id,
    title: post.title ?? "",
    description: post.description ?? "",
    seo_title: post.seo_title ?? "",
    seo_description: post.seo_description ?? "",
    blog_category_id: post.blog_category_id ? String(post.blog_category_id) : "",
    image: post.image ?? "",
    tags: post.tags ?? "",
    is_popular: post.is_popular === "yes",
    status: post.status === 1,
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Edit post"
        subtitle={`/blog/${post.slug}`}
        back={{ href: "/admin/blog", label: "Back to blog" }}
      />
      <BlogForm mode="edit" initial={initial} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
