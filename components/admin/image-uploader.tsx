"use client"

import Image from "next/image"
import { useId, useRef, useState } from "react"
import { optimized } from "@/lib/images"
import { CheckIcon, TrashIcon, UploadIcon } from "@/components/icons"

interface Props {
  readonly label: string
  readonly hint?: string
  /** Single-image mode returns one URL; multi appends to a list. */
  readonly multiple?: boolean
  readonly value: string[]
  readonly onChange: (urls: string[]) => void
}

export function ImageUploader({ label, hint, multiple = false, value, onChange }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)

  async function upload(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return

    setBusy(true)
    setError("")

    try {
      const body = new FormData()
      for (const f of (multiple ? list : list.slice(0, 1))) body.append("files", f)

      const res = await fetch("/api/admin/upload", { method: "POST", body })
      const json = (await res.json()) as { ok?: boolean; urls?: string[]; error?: string }
      if (!res.ok || !json.ok || !json.urls) throw new Error(json.error || "Upload failed")

      onChange(multiple ? [...value, ...json.urls] : json.urls.slice(0, 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const remove = (url: string) => onChange(value.filter((u) => u !== url))

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="label mb-0">{label}</span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>

      {/* Drop zone */}
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files?.length) void upload(e.dataTransfer.files)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-colors ${
          dragging ? "border-brand-500 bg-brand-100" : "border-brand-200 bg-tint-soft hover:border-brand-400"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-500">
          <UploadIcon className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-brand-900">
          {busy ? "Uploading to Cloudinary…" : "Drop images here or click to browse"}
        </span>
        <span className="text-xs text-slate-500">JPEG, PNG, WebP or AVIF · up to 10MB each</span>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files)
          }}
        />
      </label>

      {error ? (
        <p role="alert" className="mt-2 rounded-xl bg-brand-100 px-4 py-2.5 text-sm font-medium text-brand-700">
          {error}
        </p>
      ) : null}

      {/* Previews */}
      {value.length ? (
        <ul className={`mt-4 grid gap-3 ${multiple ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:max-w-xs"}`}>
          {value.map((url, i) => (
            <li key={url} className="group relative overflow-hidden rounded-xl border border-brand-200 bg-brand-100">
              <span className="relative block aspect-[4/3]">
                <Image src={optimized(url, 400, 300)} alt="" fill sizes="200px" className="object-cover" />
              </span>

              {multiple && i === 0 ? (
                <span className="absolute left-2 top-2 rounded-pill bg-brand-900/85 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur">
                  First
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove image"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand-900 opacity-0 shadow-card backdrop-blur transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!multiple && value.length ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-500">
          <CheckIcon className="h-3.5 w-3.5" />
          Image ready
        </p>
      ) : null}
    </div>
  )
}
