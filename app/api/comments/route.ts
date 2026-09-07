import { NextResponse } from "next/server"
import { addComment, getPostById } from "@/lib/blog"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Same crude per-IP throttle the inquiry endpoint uses. */
const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 4

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown"

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many comments. Try again in a minute." }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  const blogId = Number(body.blog_id)
  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim()
  const phone = body.phone ? String(body.phone).trim() : null
  const comment = String(body.comment ?? "").trim()

  if (!Number.isFinite(blogId) || !getPostById(blogId)) {
    return NextResponse.json({ ok: false, error: "That article no longer exists." }, { status: 400 })
  }
  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 })
  }
  if (!EMAIL.test(email) || email.length > 180) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 })
  }
  if (comment.length < 5 || comment.length > 2000) {
    return NextResponse.json({ ok: false, error: "Please write a slightly longer comment." }, { status: 400 })
  }
  if (phone && phone.length > 40) {
    return NextResponse.json({ ok: false, error: "That phone number looks too long." }, { status: 400 })
  }

  try {
    addComment({ blog_id: blogId, name, email, phone, comment })
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save your comment. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
