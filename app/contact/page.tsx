import Link from "next/link"
import type { Metadata } from "next"
import { getBrands, getContactInfo, getSettings } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { InquiryForm } from "@/components/inquiry-form"
import { MailIcon, PhoneIcon, PinIcon, CalendarIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Keycar team in Kigali about buying, renting or selling a car.",
}

export default function ContactPage() {
  const settings = getSettings()
  const contact = getContactInfo()
  const brands = getBrands(false)

  const phone = settings.phone ?? contact.phone
  const email = settings.email ?? contact.email

  const cards = [
    phone ? { icon: PhoneIcon, label: "Phone", value: phone, href: `tel:${phone.replace(/\s+/g, "")}` } : null,
    email ? { icon: MailIcon, label: "Email", value: email, href: `mailto:${email}` } : null,
    { icon: PinIcon, label: "Address", value: settings.address ?? "Kigali, Rwanda", href: null },
    {
      icon: CalendarIcon,
      label: "Opening hours",
      value:
        settings.open_day && settings.closed_day
          ? `${settings.open_day} — ${settings.closed_day}`
          : "Mon – Sat, 8:00 – 18:00",
      href: null,
    },
  ].filter(Boolean) as { icon: typeof PhoneIcon; label: string; value: string; href: string | null }[]

  return (
    <>
      <SiteHeader phone={settings.phone} />

      <section className="border-b border-brand-200 bg-tint">
        <div className="container py-12">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-500">
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-brand-900">Contact</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">Get in touch</h1>
          <p className="mt-2 max-w-lg text-slate-600">
            Questions about a listing, a trade-in, or financing? Send a message and we&apos;ll reply the same day.
          </p>
        </div>
      </section>

      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((c) => {
                const inner = (
                  <>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {c.label}
                      </span>
                      <span className="mt-0.5 block truncate font-semibold text-brand-900">{c.value}</span>
                    </span>
                  </>
                )
                return c.href ? (
                  <a key={c.label} href={c.href} className="card flex items-center gap-4 p-5 hover:border-brand-500">
                    {inner}
                  </a>
                ) : (
                  <div key={c.label} className="card flex items-center gap-4 p-5">
                    {inner}
                  </div>
                )
              })}
            </div>

            {contact.map_code ? (
              <div
                className="mt-6 overflow-hidden rounded-2xl border border-brand-200 [&_iframe]:h-80 [&_iframe]:w-full"
                dangerouslySetInnerHTML={{ __html: contact.map_code }}
              />
            ) : (
              <div className="mt-6 grid h-80 place-items-center rounded-2xl border border-dashed border-brand-200 bg-tint-soft text-center">
                <div>
                  <PinIcon className="mx-auto h-8 w-8 text-brand-300" />
                  <p className="mt-3 text-sm font-medium text-slate-500">Kigali, Rwanda</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add a map embed in the admin settings to show it here.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-7 sm:p-9">
            <InquiryForm phone={phone} variant="plain" />
          </div>
        </div>
      </div>

      <SiteFooter
        appName={settings.app_name}
        email={settings.email}
        phone={settings.phone}
        address={settings.address}
        copyright={settings.copyright}
        brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
      />
    </>
  )
}
