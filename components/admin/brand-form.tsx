"use client"

import Link from "next/link"
import { useState } from "react"
import { useFormStatus } from "react-dom"
import { saveBrandAction } from "@/app/admin/manage-actions"
import { ImageUploader } from "./image-uploader"

interface Props {
  readonly brand: { id: number; name: string | null; image: string | null; status: string } | null
}

/**
 * Client component because the logo goes through the same Cloudinary uploader
 * the car form uses: that keeps its own state and hands back a URL, which
 * rides along in a hidden field when the server action runs.
 */
export function BrandForm({ brand }: Props) {
  const [image, setImage] = useState(brand?.image ?? "")
  const [enabled, setEnabled] = useState((brand?.status ?? "enable") !== "disable")

  return (
    <form action={saveBrandAction} className="mt-5 space-y-5">
      <input type="hidden" name="id" value={brand?.id ?? 0} />
      <input type="hidden" name="image" value={image} />
      <input type="hidden" name="status" value={enabled ? "1" : "0"} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-brand-900">Name</span>
        <input
          key={`n-${brand?.id ?? "new"}`}
          name="name"
          required
          maxLength={120}
          defaultValue={brand?.name ?? ""}
          placeholder="Toyota"
          className="field"
        />
      </label>

      <ImageUploader
        label="Logo"
        hint="Optional · square works best"
        value={image ? [image] : []}
        onChange={(urls) => setImage(urls[0] ?? "")}
      />

      <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-brand-200 p-4 transition-colors hover:border-brand-400">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-pill transition-colors ${
            enabled ? "bg-brand-500" : "bg-brand-200"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              enabled ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </span>
        <span>
          <span className="block text-sm font-semibold text-brand-900">Visible on the website</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Turn off to hide the brand and its filter without deleting it.
          </span>
        </span>
      </label>

      <div className="flex gap-2">
        <SubmitButton editing={Boolean(brand)} />
        {brand ? (
          <Link href="/admin/brands" className="btn-outline">
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  )
}

function SubmitButton({ editing }: { readonly editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary flex-1 disabled:opacity-60">
      {pending ? "Saving…" : editing ? "Save" : "Add brand"}
    </button>
  )
}
