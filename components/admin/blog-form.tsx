"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { ImageUploader } from "./image-uploader"

export interface BlogFormValues {
  id?: number
  title: string
  description: string
  seo_title: string
  seo_description: string
  blog_category_id: string
  image: string
  tags: string
  is_popular: boolean
  status: boolean
}

interface Props {
  readonly mode: "create" | "edit"
  readonly initial: BlogFormValues
  readonly categories: { id: number; name: string | null }[]
}

export function BlogForm({ mode, initial, categories }: Props) {
  const router = useRouter()
  const [v, setV] = useState<BlogFormValues>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = <K extends keyof BlogFormValues>(key: K, val: BlogFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: val }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (v.title.trim().length < 3) {
      setError("Give the post a title.")
      return
    }
    if (v.description.trim().length < 20) {
      setError("The article body is a little short.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/blog", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          id: initial.id,
          blog_category_id: v.blog_category_id ? Number(v.blog_category_id) : null,
        }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) throw new Error(json.error || "Could not save the post")

      router.push("/admin/blog")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the post")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          <section className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-brand-900">Article</h2>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Title</span>
                <input
                  value={v.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  placeholder="How to inspect a used car"
                  className="field"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Body</span>
                <textarea
                  value={v.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={16}
                  required
                  placeholder="<p>Write the article here. Basic HTML is allowed.</p>"
                  className="field font-mono text-[13px] leading-relaxed"
                />
                <span className="mt-1.5 block text-xs text-slate-400">
                  Plain paragraphs work; simple HTML tags (p, h3, ul, li, strong, a) are rendered as-is.
                </span>
              </label>
            </div>
          </section>

          <section className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-brand-900">Search engines</h2>
            <p className="mt-1 text-sm text-slate-500">Leave these empty to fall back to the title.</p>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">SEO title</span>
                <input value={v.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">SEO description</span>
                <textarea
                  value={v.seo_description}
                  onChange={(e) => set("seo_description", e.target.value)}
                  rows={2}
                  className="field"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Publishing</h2>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Category</span>
                <select
                  value={v.blog_category_id}
                  onChange={(e) => set("blog_category_id", e.target.value)}
                  className="field"
                >
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-brand-900">Tags</span>
                <input
                  value={v.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="buying, inspection"
                  className="field"
                />
                <span className="mt-1.5 block text-xs text-slate-400">Comma separated.</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm font-medium text-brand-900">
                <input
                  type="checkbox"
                  checked={v.status}
                  onChange={(e) => set("status", e.target.checked)}
                  className="h-4 w-4 rounded border-brand-200 text-brand-500"
                />
                Published
              </label>

              <label className="flex items-center gap-2.5 text-sm font-medium text-brand-900">
                <input
                  type="checkbox"
                  checked={v.is_popular}
                  onChange={(e) => set("is_popular", e.target.checked)}
                  className="h-4 w-4 rounded border-brand-200 text-brand-500"
                />
                Mark as popular
              </label>
            </div>
          </section>

          <section className="card p-6">
            <ImageUploader
              label="Cover image"
              hint="Optional"
              value={v.image ? [v.image] : []}
              onChange={(urls) => set("image", urls[0] ?? "")}
            />
          </section>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Saving…" : mode === "create" ? "Publish post" : "Save changes"}
            </button>
            <Link href="/admin/blog" className="btn-outline">
              Cancel
            </Link>
          </div>
        </aside>
      </div>
    </form>
  )
}
