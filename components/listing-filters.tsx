"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { CloseIcon, SearchIcon, SlidersIcon } from "./icons"

interface Props {
  readonly brands: { slug: string; name: string | null }[]
  readonly bodyTypes: string[]
  readonly fuelTypes: string[]
  readonly transmissions: string[]
  readonly conditions: string[]
  readonly purposes: string[]
  readonly minPrice: number
  readonly maxPrice: number
}

export function ListingFilters(props: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)

  const get = (k: string) => params.get(k) ?? ""

  /** Writes one filter into the URL; the server component re-queries. */
  const apply = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      next.delete("page") // a new filter always resets pagination
      router.push(`/listings${next.toString() ? `?${next}` : ""}`, { scroll: false })
    },
    [params, router],
  )

  const activeCount = ["q", "brand", "purpose", "condition", "bodyType", "fuelType", "transmission", "minPrice", "maxPrice"].filter(
    (k) => params.get(k),
  ).length

  const body = (
    <div className="space-y-7">
      <Group label="Search">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            defaultValue={get("q")}
            placeholder="Make or model…"
            className="field pl-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") apply({ q: (e.target as HTMLInputElement).value })
            }}
            onBlur={(e) => {
              if (e.target.value !== get("q")) apply({ q: e.target.value })
            }}
          />
        </div>
      </Group>

      {props.purposes.length ? (
        <Group label="Looking to">
          <div className="flex flex-wrap gap-2">
            <Chip active={!get("purpose")} onClick={() => apply({ purpose: "" })}>
              Any
            </Chip>
            {props.purposes.map((p) => (
              <Chip key={p} active={get("purpose") === p} onClick={() => apply({ purpose: p })}>
                {/* Stored lowercase ("sale"/"rent"); shown capitalised. */}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Chip>
            ))}
          </div>
        </Group>
      ) : null}

      <Group label="Brand">
        <select value={get("brand")} onChange={(e) => apply({ brand: e.target.value })} className="field">
          <option value="">Any brand</option>
          {props.brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name ?? b.slug}
            </option>
          ))}
        </select>
      </Group>

      {props.bodyTypes.length ? (
        <Group label="Body type">
          <select value={get("bodyType")} onChange={(e) => apply({ bodyType: e.target.value })} className="field">
            <option value="">Any body type</option>
            {props.bodyTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Group>
      ) : null}

      <Group label="Price range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={`${Math.floor(props.minPrice)}`}
            defaultValue={get("minPrice")}
            className="field"
            onBlur={(e) => apply({ minPrice: e.target.value })}
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={`${Math.ceil(props.maxPrice)}`}
            defaultValue={get("maxPrice")}
            className="field"
            onBlur={(e) => apply({ maxPrice: e.target.value })}
          />
        </div>
      </Group>

      {props.conditions.length ? (
        <Group label="Condition">
          <div className="flex flex-wrap gap-2">
            <Chip active={!get("condition")} onClick={() => apply({ condition: "" })}>
              Any
            </Chip>
            {props.conditions.map((c) => (
              <Chip key={c} active={get("condition") === c} onClick={() => apply({ condition: c })}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Chip>
            ))}
          </div>
        </Group>
      ) : null}

      {props.fuelTypes.length ? (
        <Group label="Fuel">
          <div className="flex flex-wrap gap-2">
            <Chip active={!get("fuelType")} onClick={() => apply({ fuelType: "" })}>
              Any
            </Chip>
            {props.fuelTypes.map((f) => (
              <Chip key={f} active={get("fuelType") === f} onClick={() => apply({ fuelType: f })}>
                {f}
              </Chip>
            ))}
          </div>
        </Group>
      ) : null}

      {props.transmissions.length ? (
        <Group label="Transmission">
          <div className="flex flex-wrap gap-2">
            <Chip active={!get("transmission")} onClick={() => apply({ transmission: "" })}>
              Any
            </Chip>
            {props.transmissions.map((t) => (
              <Chip key={t} active={get("transmission") === t} onClick={() => apply({ transmission: t })}>
                {t}
              </Chip>
            ))}
          </div>
        </Group>
      ) : null}

      {activeCount > 0 ? (
        <button type="button" onClick={() => router.push("/listings")} className="btn-outline w-full">
          <CloseIcon className="h-4 w-4" />
          Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
        </button>
      ) : null}
    </div>
  )

  return (
    <>
      {/* Mobile trigger */}
      <button type="button" onClick={() => setOpen(true)} className="btn-outline w-full lg:hidden">
        <SlidersIcon className="h-4 w-4" />
        Filters{activeCount ? ` (${activeCount})` : ""}
      </button>

      {/* Desktop rail */}
      <aside className="hidden lg:block">
        <div className="card sticky top-24 p-6">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-900">
            <SlidersIcon className="h-4 w-4 text-brand-500" />
            Refine
          </h2>
          {body}
        </div>
      </aside>

      {/* Mobile sheet */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-6 shadow-card-hover">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-brand-900">Refine</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            {body}
            <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-6 w-full">
              Show results
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Group({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{label}</p>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  readonly active: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className={`chip ${active ? "chip-active" : ""}`}>
      {children}
    </button>
  )
}

/** Sort dropdown, kept next to the result count. */
export function SortSelect() {
  const router = useRouter()
  const params = useSearchParams()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="shrink-0 text-slate-500">Sort</span>
      <select
        value={params.get("sort") ?? "latest"}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString())
          if (e.target.value === "latest") next.delete("sort")
          else next.set("sort", e.target.value)
          next.delete("page")
          router.push(`/listings${next.toString() ? `?${next}` : ""}`, { scroll: false })
        }}
        className="field py-2"
      >
        <option value="latest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="year_desc">Year: newest</option>
        <option value="year_asc">Year: oldest</option>
        <option value="popular">Most viewed</option>
      </select>
    </label>
  )
}
