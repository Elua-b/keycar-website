"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { ImageUploader } from "./image-uploader"
import { CheckIcon, CloseIcon, PlusIcon } from "@/components/icons"

export interface CarFormValues {
  id?: number
  title: string
  description: string
  address: string
  brand_id: string
  city_id: string
  country_id: string
  car_model: string
  purpose: string
  condition: string
  regular_price: string
  offer_price: string
  body_type: string
  engine_size: string
  drive: string
  interior_color: string
  exterior_color: string
  year: string
  mileage: string
  number_of_owner: string
  fuel_type: string
  transmission: string
  seller_type: string
  rent_period: string
  thumb_image: string
  features: string[]
  gallery: string[]
  is_featured: boolean
  status: boolean
}

interface Props {
  readonly mode: "create" | "edit"
  readonly initial: CarFormValues
  readonly brands: { id: number; name: string | null; slug: string }[]
  readonly cities: { id: number; name: string | null; country_id: number }[]
  readonly currencyIcon: string
}

const BODY_TYPES = ["SUV", "Sedan", "Hatchback", "Pickup", "Coupe", "Convertible", "Minivan", "Wagon", "Truck"]
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "CNG", "LPG"]
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Semi-automatic"]
const DRIVES = ["2WD", "4WD", "AWD", "FWD", "RWD"]
const CONDITIONS = ["new", "used", "certified"]
const PURPOSES = ["Sale", "Rent"]
const RENT_PERIODS = ["day", "week", "month", "year"]
const SELLER_TYPES = ["Dealer", "Private", "Owner"]

export function CarForm({ mode, initial, brands, cities, currencyIcon }: Props) {
  const router = useRouter()
  const [v, setV] = useState<CarFormValues>(initial)
  const [featureDraft, setFeatureDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = <K extends keyof CarFormValues>(key: K, val: CarFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: val }))

  function addFeature() {
    const f = featureDraft.trim()
    if (!f || v.features.includes(f)) return
    set("features", [...v.features, f])
    setFeatureDraft("")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!v.thumb_image) {
      setError("Upload a main image before saving.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/cars", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          id: initial.id,
          brand_id: Number(v.brand_id),
          city_id: Number(v.city_id),
          country_id: Number(v.country_id || 0),
          regular_price: Number(v.regular_price),
          offer_price: v.offer_price === "" ? null : Number(v.offer_price),
        }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) throw new Error(json.error || "Could not save the car")

      router.push("/admin/cars")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the car")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-2xl bg-brand-100 px-5 py-4 text-sm font-medium text-brand-700">
          {error}
        </p>
      ) : null}

      {/* ---------- Images ---------- */}
      <Section title="Photos" desc="The main image is what shows on cards and search results.">
        <div className="space-y-6">
          <ImageUploader
            label="Main image"
            hint="Required"
            value={v.thumb_image ? [v.thumb_image] : []}
            onChange={(urls) => set("thumb_image", urls[0] ?? "")}
          />
          <ImageUploader
            label="Gallery"
            hint="Optional · up to 20"
            multiple
            value={v.gallery}
            onChange={(urls) => set("gallery", urls)}
          />
        </div>
      </Section>

      {/* ---------- Basics ---------- */}
      <Section title="Basics" desc="What the car is and where it is.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <input
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Toyota Land Cruiser 2018"
              className="field"
            />
          </Field>

          <Field label="Brand" required>
            <select value={v.brand_id} onChange={(e) => set("brand_id", e.target.value)} required className="field">
              <option value="">Select a brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name ?? b.slug}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Model">
            <input
              value={v.car_model}
              onChange={(e) => set("car_model", e.target.value)}
              maxLength={120}
              placeholder="Land Cruiser"
              className="field"
            />
          </Field>

          <Field label="City" required>
            <select value={v.city_id} onChange={(e) => set("city_id", e.target.value)} required className="field">
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? `City ${c.id}`}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Listing type" required>
            <select value={v.purpose} onChange={(e) => set("purpose", e.target.value)} className="field">
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  For {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Condition">
            <select value={v.condition} onChange={(e) => set("condition", e.target.value)} className="field">
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Seller type">
            <select value={v.seller_type} onChange={(e) => set("seller_type", e.target.value)} className="field">
              <option value="">Not specified</option>
              {SELLER_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Address" className="sm:col-span-2">
            <input
              value={v.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={500}
              placeholder="KG 7 Ave, Kigali"
              className="field"
            />
          </Field>
        </div>
      </Section>

      {/* ---------- Pricing ---------- */}
      <Section title="Pricing" desc="Set an offer price only if the car is discounted.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={`Regular price (${currencyIcon})`} required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={v.regular_price}
              onChange={(e) => set("regular_price", e.target.value)}
              required
              className="field"
              placeholder="15000"
            />
          </Field>

          <Field label={`Offer price (${currencyIcon})`}>
            <input
              type="number"
              min={0}
              step="0.01"
              value={v.offer_price}
              onChange={(e) => set("offer_price", e.target.value)}
              className="field"
              placeholder="Leave empty if none"
            />
          </Field>

          {v.purpose === "Rent" ? (
            <Field label="Rental period">
              <select value={v.rent_period} onChange={(e) => set("rent_period", e.target.value)} className="field">
                <option value="">Select a period</option>
                {RENT_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    Per {p}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>
      </Section>

      {/* ---------- Specification ---------- */}
      <Section title="Specification" desc="Everything shown in the spec table on the listing page.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Year">
            <input
              value={v.year}
              onChange={(e) => set("year", e.target.value)}
              maxLength={10}
              placeholder="2018"
              className="field"
            />
          </Field>

          <Field label="Mileage">
            <input
              value={v.mileage}
              onChange={(e) => set("mileage", e.target.value)}
              maxLength={40}
              placeholder="84000"
              className="field"
            />
          </Field>

          <Field label="Body type">
            <select value={v.body_type} onChange={(e) => set("body_type", e.target.value)} className="field">
              <option value="">Not specified</option>
              {BODY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fuel type">
            <select value={v.fuel_type} onChange={(e) => set("fuel_type", e.target.value)} className="field">
              <option value="">Not specified</option>
              {FUEL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Transmission">
            <select value={v.transmission} onChange={(e) => set("transmission", e.target.value)} className="field">
              <option value="">Not specified</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Drive">
            <select value={v.drive} onChange={(e) => set("drive", e.target.value)} className="field">
              <option value="">Not specified</option>
              {DRIVES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Engine size">
            <input
              value={v.engine_size}
              onChange={(e) => set("engine_size", e.target.value)}
              maxLength={60}
              placeholder="2000cc"
              className="field"
            />
          </Field>

          <Field label="Exterior colour">
            <input
              value={v.exterior_color}
              onChange={(e) => set("exterior_color", e.target.value)}
              maxLength={60}
              placeholder="White"
              className="field"
            />
          </Field>

          <Field label="Interior colour">
            <input
              value={v.interior_color}
              onChange={(e) => set("interior_color", e.target.value)}
              maxLength={60}
              placeholder="Black"
              className="field"
            />
          </Field>

          <Field label="Previous owners">
            <input
              value={v.number_of_owner}
              onChange={(e) => set("number_of_owner", e.target.value)}
              maxLength={20}
              placeholder="1"
              className="field"
            />
          </Field>
        </div>
      </Section>

      {/* ---------- Description & features ---------- */}
      <Section title="Description & features" desc="Tell buyers what the specs can't.">
        <div className="space-y-5">
          <Field label="Description">
            <textarea
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              rows={6}
              maxLength={20000}
              placeholder="Service history, recent work, why it's a good buy…"
              className="field resize-y"
            />
          </Field>

          <Field label="Features">
            <div className="flex gap-2">
              <input
                value={featureDraft}
                onChange={(e) => setFeatureDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addFeature()
                  }
                }}
                placeholder="e.g. Reverse camera, then press Enter"
                className="field"
              />
              <button type="button" onClick={addFeature} className="btn-outline shrink-0 px-4">
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            </div>

            {v.features.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {v.features.map((f) => (
                  <li
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-pill bg-brand-100 px-3 py-1.5 text-xs font-medium text-brand-900"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => set("features", v.features.filter((x) => x !== f))}
                      aria-label={`Remove ${f}`}
                      className="text-brand-500 hover:text-brand-700"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Field>
        </div>
      </Section>

      {/* ---------- Visibility ---------- */}
      <Section title="Visibility" desc="Control where this car appears.">
        <div className="space-y-3">
          <Toggle
            checked={v.status}
            onChange={(c) => set("status", c)}
            label="Published"
            desc="Visible on the website. Turn off to hide without deleting."
          />
          <Toggle
            checked={v.is_featured}
            onChange={(c) => set("is_featured", c)}
            label="Featured"
            desc="Highlighted in the featured section on the homepage."
          />
        </div>
      </Section>

      {/* ---------- Actions ---------- */}
      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-brand-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Link href="/admin/cars" className="btn-outline">
          Cancel
        </Link>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          <CheckIcon className="h-4 w-4" />
          {saving ? "Saving…" : mode === "create" ? "Publish car" : "Save changes"}
        </button>
      </div>
    </form>
  )
}

/* ---------------- small layout helpers ---------------- */

function Section({
  title,
  desc,
  children,
}: {
  readonly title: string
  readonly desc?: string
  readonly children: React.ReactNode
}) {
  return (
    <section className="card p-6 sm:p-7">
      <h2 className="text-lg font-bold text-brand-900">{title}</h2>
      {desc ? <p className="mt-1 text-sm text-slate-500">{desc}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  readonly label: string
  readonly required?: boolean
  readonly className?: string
  readonly children: React.ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">
        {label}
        {required ? <span className="ml-1 text-brand-500">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  readonly checked: boolean
  readonly onChange: (c: boolean) => void
  readonly label: string
  readonly desc: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-brand-200 p-4 transition-colors hover:border-brand-400">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-pill transition-colors ${
          checked ? "bg-brand-500" : "bg-brand-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-semibold text-brand-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>
      </span>
    </label>
  )
}
