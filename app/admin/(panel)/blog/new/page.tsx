import { getBlogCategories } from "@/lib/blog"
import { BlogForm, type BlogFormValues } from "@/components/admin/blog-form"
import { PageHeader } from "@/components/admin/page-header"

export const dynamic = "force-dynamic"
export const metadata = { title: "Write a post" }

export default function NewPostPage() {
  const categories = getBlogCategories()

  const initial: BlogFormValues = {
    title: "",
    description: "",
    seo_title: "",
    seo_description: "",
    blog_category_id: categories.length === 1 ? String(categories[0].id) : "",
    image: "",
    tags: "",
    is_popular: false,
    status: true,
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Write a post"
        subtitle="Published articles appear on /blog immediately."
        back={{ href: "/admin/blog", label: "Back to blog" }}
      />
      <BlogForm mode="create" initial={initial} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
