import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { currentAdmin } from "@/lib/auth"
import { createPost, updatePost, type BlogInput } from "@/lib/blog"

export const runtime = "nodejs"

const str = (v: unknown, max = 255): string | null => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s) return null
  return s.slice(0, max)
}

function parseBody(body: Record<string, unknown>): { input?: BlogInput; error?: string } {
  const title = str(body.title, 200)
  if (!title || title.length < 3) return { error: "Give the post a title." }

  const description = str(body.description, 100_000)
  if (!description || description.length < 20) return { error: "The article body is a little short." }

  const categoryId = body.blog_category_id === null || body.blog_category_id === "" ? null : Number(body.blog_category_id)
  if (categoryId !== null && !Number.isFinite(categoryId)) return { error: "That category is not valid." }

  return {
    input: {
      title,
      description,
      seo_title: str(body.seo_title, 200),
      seo_description: str(body.seo_description, 500),
      blog_category_id: categoryId,
      image: str(body.image, 500),
      tags: str(body.tags, 500),
      is_popular: body.is_popular === true,
      status: body.status !== false,
    },
  }
}

export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 })

  const { input, error } = parseBody((await request.json()) as Record<string, unknown>)
  if (!input) return NextResponse.json({ ok: false, error }, { status: 400 })

  const id = createPost(input, admin.id)

  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  return NextResponse.json({ ok: true, id })
}

export async function PUT(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 })

  const body = (await request.json()) as Record<string, unknown>
  const id = Number(body.id)
  if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: "Unknown post." }, { status: 400 })

  const { input, error } = parseBody(body)
  if (!input) return NextResponse.json({ ok: false, error }, { status: 400 })

  updatePost(id, input)

  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  return NextResponse.json({ ok: true, id })
}
