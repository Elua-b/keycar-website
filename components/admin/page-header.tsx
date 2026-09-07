import Link from "next/link"
import type React from "react"
import { ChevronLeftIcon } from "@/components/icons"

/** The heading block every admin screen opens with. */
export function PageHeader({
  title,
  subtitle,
  back,
  children,
}: {
  readonly title: string
  readonly subtitle?: string
  readonly back?: { href: string; label: string }
  readonly children?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back ? (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-500"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            {back.label}
          </Link>
        ) : null}
        <h1 className={`text-3xl font-extrabold tracking-tight text-brand-900 ${back ? "mt-3" : ""}`}>{title}</h1>
        {subtitle ? <p className="mt-1.5 text-slate-600">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  )
}

/** Filter chips shared by the list screens. */
export function FilterChips({
  options,
  active,
}: {
  readonly options: { href: string; label: string; count?: number; key: string }[]
  readonly active: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Link key={o.key} href={o.href} className={`chip ${active === o.key ? "chip-active" : ""}`}>
          {o.label}
          {typeof o.count === "number" ? <span className="ml-1.5 opacity-60">{o.count}</span> : null}
        </Link>
      ))}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  readonly icon: (props: { className?: string }) => React.JSX.Element
  readonly title: string
  readonly description: string
  readonly action?: { href: string; label: string }
}) {
  return (
    <div className="card p-14 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-500">
        <Icon className="h-8 w-8" />
      </span>
      <h2 className="mt-6 text-xl font-bold text-brand-900">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-slate-600">{description}</p>
      {action ? (
        <Link href={action.href} className="btn-primary mt-8">
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

/** Small coloured pill used for statuses across the admin. */
export function StatusPill({
  tone,
  children,
}: {
  readonly tone: "on" | "off" | "warn" | "muted"
  readonly children: React.ReactNode
}) {
  const tones = {
    on: "bg-brand-500 text-white",
    off: "bg-brand-100 text-brand-700",
    warn: "bg-amber-100 text-amber-800",
    muted: "border border-brand-200 text-brand-900",
  }
  return (
    <span className={`inline-block rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase ${tones[tone]}`}>
      {children}
    </span>
  )
}
