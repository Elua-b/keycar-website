"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { CarIcon, MenuIcon, CloseIcon, PhoneIcon } from "./icons"

const NAV = [
  { href: "/", label: "Home" },
  { href: "/listings", label: "Browse cars" },
  { href: "/listings?purpose=Rent", label: "Rent" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function SiteHeader({ phone }: { phone?: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the mobile sheet whenever the route changes.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "border-b border-brand-200/70 bg-white/90 backdrop-blur-md" : "bg-white"
      }`}
    >
      <div className="container flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-btn">
            <CarIcon className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-brand-900">
            Key<span className="text-brand-500">car</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.split("?")[0]) && item.href.split("?")[0] !== "/"
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand-100 text-brand-500" : "text-brand-900/80 hover:bg-brand-100 hover:text-brand-500"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="hidden items-center gap-2 text-sm font-semibold text-brand-900 hover:text-brand-500 xl:flex"
            >
              <PhoneIcon className="h-4 w-4 text-brand-500" />
              {phone}
            </a>
          ) : null}
          <Link href="/listings" className="btn-primary hidden sm:inline-flex">
            Find a car
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-xl border border-brand-200 text-brand-900 lg:hidden"
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-brand-200 bg-white lg:hidden">
          <nav className="container flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-brand-900 hover:bg-brand-100"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/listings" className="btn-primary mt-2">
              Find a car
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
