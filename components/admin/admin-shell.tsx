"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { logoutAction } from "@/app/admin/actions"
import { CarIcon, CloseIcon, DashboardIcon, EyeIcon, GlobeIcon, IdCardIcon, LogoutIcon, MailIcon, MenuIcon, NewspaperIcon, PlusIcon, StarIcon, TagIcon, UsersIcon } from "@/components/icons"

export interface NavCounts {
  /** Unread contact/inquiry messages. */
  messages: number
  /** Listings sitting in the approval queue. */
  awaitingCars: number
  /** KYC submissions still to review. */
  pendingKyc: number
  /** Blog comments awaiting moderation. */
  pendingComments: number
  /** Reviews awaiting approval. */
  pendingReviews: number
  /** User accounts awaiting approval. */
  pendingUsers: number
}

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => React.JSX.Element; count?: number }

interface Props {
  readonly admin: { name: string; email: string }
  readonly counts: NavCounts
  readonly children: React.ReactNode
}

export function AdminShell({ admin, counts, children }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  const groups: { heading: string | null; items: NavItem[] }[] = [
    {
      heading: null,
      items: [{ href: "/admin/dashboard", label: "Overview", icon: DashboardIcon }],
    },
    {
      heading: "Inventory",
      items: [
        { href: "/admin/cars", label: "Cars", icon: CarIcon, count: counts.awaitingCars },
        { href: "/admin/brands", label: "Brands", icon: TagIcon },
        { href: "/admin/reviews", label: "Reviews", icon: StarIcon, count: counts.pendingReviews },
        { href: "/admin/locations", label: "Locations", icon: GlobeIcon },
      ],
    },
    {
      heading: "People",
      items: [
        { href: "/admin/users", label: "Users", icon: UsersIcon, count: counts.pendingUsers },
        { href: "/admin/kyc", label: "KYC", icon: IdCardIcon, count: counts.pendingKyc },
      ],
    },
    {
      heading: "Content",
      items: [
        { href: "/admin/blog", label: "Blog", icon: NewspaperIcon, count: counts.pendingComments },
        { href: "/admin/messages", label: "Messages", icon: MailIcon, count: counts.messages },
      ],
    },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const nav = (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group.heading ?? "root"} className="space-y-1">
          {group.heading ? (
            <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group.heading}</p>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-500 text-white shadow-btn"
                    : "text-brand-900/75 hover:bg-brand-100 hover:text-brand-500"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                {item.count ? (
                  <span
                    className={`rounded-pill px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-white/20 text-white" : "bg-brand-500 text-white"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )

  const footer = (
    <div className="space-y-3">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-brand-900/75 hover:bg-brand-100 hover:text-brand-500"
      >
        <EyeIcon className="h-[18px] w-[18px]" />
        View website
      </Link>
      <div className="rounded-xl bg-brand-100 p-4">
        <p className="truncate text-sm font-bold text-brand-900">{admin.name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{admin.email}</p>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-white px-4 py-2 text-xs font-semibold text-brand-900 transition-colors hover:bg-brand-500 hover:text-white"
          >
            <LogoutIcon className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-tint-soft">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-200 bg-white px-5 py-3 lg:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white">
            <CarIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="font-extrabold tracking-tight text-brand-900">
            Key<span className="text-brand-500">car</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900"
        >
          {open ? <CloseIcon className="h-[18px] w-[18px]" /> : <MenuIcon className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-brand-200 bg-white p-5 lg:flex">
          <div>
            <Link href="/admin/dashboard" className="mb-9 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-btn">
                <CarIcon className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-brand-900">
                Key<span className="text-brand-500">car</span>
              </span>
            </Link>
            {nav}
            <Link href="/admin/cars/new" className="btn-primary mt-6 w-full text-xs">
              <PlusIcon className="h-4 w-4" />
              Add a car
            </Link>
          </div>
          {footer}
        </aside>

        {/* Mobile drawer */}
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between overflow-y-auto bg-white p-5">
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-lg font-extrabold tracking-tight text-brand-900">Menu</span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
                {nav}
                <Link href="/admin/cars/new" className="btn-primary mt-6 w-full text-xs">
                  <PlusIcon className="h-4 w-4" />
                  Add a car
                </Link>
              </div>
              <div className="mt-8">{footer}</div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
