"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { SearchIcon } from "./icons"

interface Props {
  readonly brands: { slug: string; name: string | null }[]
  readonly bodyTypes: string[]
  readonly purposes: string[]
}

export function HeroSearch({ brands, bodyTypes, purposes }: Props) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [brand, setBrand] = useState("")
  const [bodyType, setBodyType] = useState("")
  const [purpose, setPurpose] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (brand) params.set("brand", brand)
    if (bodyType) params.set("bodyType", bodyType)
    if (purpose) params.set("purpose", purpose)
    router.push(`/listings${params.toString() ? `?${params}` : ""}`)
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/15 bg-white/95 p-3 shadow-card-hover backdrop-blur-md sm:p-4"
    >
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search cars</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search make or model…"
            className="field pl-11"
          />
        </label>

        <Select value={brand} onChange={setBrand} label="Any brand">
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name ?? b.slug}
            </option>
          ))}
        </Select>

        <Select value={bodyType} onChange={setBodyType} label="Any body type">
          {bodyTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Select value={purpose} onChange={setPurpose} label="Sale or rent">
          {purposes.map((p) => (
            <option key={p} value={p}>
              For {p}
            </option>
          ))}
        </Select>

        <button type="submit" className="btn-primary lg:px-8">
          <SearchIcon className="h-4 w-4" />
          Search
        </button>
      </div>
    </form>
  )
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  readonly value: string
  readonly onChange: (v: string) => void
  readonly label: string
  readonly children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field appearance-none bg-white pr-9">
        <option value="">{label}</option>
        {children}
      </select>
    </label>
  )
}
