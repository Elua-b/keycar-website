import { NextResponse } from "next/server"
import { addInquiry } from "@/lib/inquiries"
import { getCarBySlug, getSettings } from "@/lib/db"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Crude per-IP throttle so the form can't be used as a spam relay. */
const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear() // keep the map from growing unbounded
  return recent.length > MAX_PER_WINDOW
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown"

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many messages. Please try again in a minute." }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim()
  const phone = body.phone ? String(body.phone).trim() : null
  const message = String(body.message ?? "").trim()
  const carSlug = body.carSlug ? String(body.carSlug).trim() : null
  const subject = body.subject ? String(body.subject).trim().slice(0, 180) : null

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 })
  }
  if (!EMAIL.test(email) || email.length > 180) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 })
  }
  if (message.length < 5 || message.length > 2000) {
    return NextResponse.json({ ok: false, error: "Please write a short message." }, { status: 400 })
  }
  if (phone && phone.length > 40) {
    return NextResponse.json({ ok: false, error: "That phone number looks too long." }, { status: 400 })
  }

  const car = carSlug ? getCarBySlug(carSlug) : null

  // Admin > Messages > Settings can turn off storing messages entirely, the
  // way the Laravel `save_contact_message` toggle did. A listing enquiry is
  // always kept — it is addressed to a seller, not to the site inbox.
  const settings = getSettings()
  if (!carSlug && settings.save_contact_message !== "enable") {
    return NextResponse.json({ ok: true })
  }

  try {
    addInquiry({
      car_id: car?.id ?? null,
      car_slug: carSlug,
      name,
      email,
      phone,
      subject,
      message,
    })
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save your message. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
