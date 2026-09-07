import { NextResponse } from "next/server"
import { currentAdmin } from "@/lib/auth"
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, uploadImage } from "@/lib/cloudinary"

export const runtime = "nodejs"

/** Uploads one or more images to local server storage and returns their public URLs. */
export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a multipart upload." }, { status: 400 })
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File)
  if (!files.length) {
    return NextResponse.json({ ok: false, error: "No files received." }, { status: 400 })
  }
  if (files.length > 12) {
    return NextResponse.json({ ok: false, error: "Upload at most 12 images at a time." }, { status: 400 })
  }

  const urls: string[] = []

  for (const file of files) {
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `${file.name}: only JPEG, PNG, WebP and AVIF images are allowed.` },
        { status: 415 },
      )
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: `${file.name} is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` },
        { status: 413 },
      )
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await uploadImage(buffer, file.name)
      urls.push(result.url)
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : `Could not upload ${file.name}.` },
        { status: 502 },
      )
    }
  }

  return NextResponse.json({ ok: true, urls })
}
