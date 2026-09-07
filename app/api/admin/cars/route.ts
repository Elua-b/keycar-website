import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { currentAdmin } from "@/lib/auth"
import { createCar, updateCar, type CarInput } from "@/lib/db"

export const runtime = "nodejs"

const str = (v: unknown, max = 255): string | null => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s) return null
  return s.slice(0, max)
}

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parseBody(body: Record<string, unknown>): { input?: CarInput; error?: string } {
  const title = str(body.title, 200)
  if (!title || title.length < 2) return { error: "A title is required." }

  const brand_id = numOrNull(body.brand_id)
  if (!brand_id) return { error: "Pick a brand." }

  const city_id = numOrNull(body.city_id)
  if (!city_id) return { error: "Pick a city." }

  const regular_price = numOrNull(body.regular_price)
  if (regular_price === null || regular_price < 0) return { error: "Enter a valid price." }

  const offer_price = numOrNull(body.offer_price)
  if (offer_price !== null && offer_price < 0) return { error: "The offer price can't be negative." }
  if (offer_price !== null && offer_price > regular_price) {
    return { error: "The offer price must be lower than the regular price." }
  }

  const thumb_image = str(body.thumb_image, 500)
  if (!thumb_image) return { error: "Upload a main image." }

  const gallery = Array.isArray(body.gallery)
    ? body.gallery.map((g) => String(g).trim()).filter(Boolean).slice(0, 20)
    : []

  const features = Array.isArray(body.features)
    ? body.features.map((f) => String(f).trim()).filter(Boolean).slice(0, 60)
    : []

  const purpose = str(body.purpose, 20) ?? "Sale"

  return {
    input: {
      agent_id: numOrNull(body.agent_id) ?? 0,
      title,
      description: str(body.description, 20000) ?? "",
      address: str(body.address, 500) ?? "",
      brand_id,
      city_id,
      country_id: numOrNull(body.country_id) ?? 0,
      car_model: str(body.car_model, 120),
      purpose,
      condition: str(body.condition, 20) ?? "used",
      regular_price,
      offer_price,
      body_type: str(body.body_type, 60),
      engine_size: str(body.engine_size, 60),
      drive: str(body.drive, 60),
      interior_color: str(body.interior_color, 60),
      exterior_color: str(body.exterior_color, 60),
      year: str(body.year, 10),
      mileage: str(body.mileage, 40),
      number_of_owner: str(body.number_of_owner, 20),
      fuel_type: str(body.fuel_type, 40),
      transmission: str(body.transmission, 40),
      seller_type: str(body.seller_type, 40),
      rent_period: purpose === "Rent" ? str(body.rent_period, 40) : null,
      thumb_image,
      features,
      gallery,
      is_featured: body.is_featured ? "enable" : "disable",
      status: body.status === false ? "disable" : "enable",
    },
  }
}

export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  const { input, error } = parseBody(body)
  if (!input) return NextResponse.json({ ok: false, error }, { status: 400 })

  try {
    const id = createCar(input)
    revalidatePath("/")
    revalidatePath("/listings")
    revalidatePath("/admin/cars")
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Could not save the car." },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  const id = numOrNull(body.id)
  if (!id) return NextResponse.json({ ok: false, error: "Missing car id." }, { status: 400 })

  const { input, error } = parseBody(body)
  if (!input) return NextResponse.json({ ok: false, error }, { status: 400 })

  try {
    updateCar(id, input)
    revalidatePath("/")
    revalidatePath("/listings")
    revalidatePath("/admin/cars")
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Could not update the car." },
      { status: 500 },
    )
  }
}
