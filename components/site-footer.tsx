import Link from "next/link"
import { CarIcon, MailIcon, PhoneIcon, PinIcon, ArrowRightIcon } from "./icons"

interface FooterProps {
  readonly appName?: string
  readonly email?: string | null
  readonly phone?: string | null
  readonly address?: string | null
  readonly copyright?: string | null
  readonly brands?: { slug: string; name: string | null }[]
}

export function SiteFooter({ appName = "Keycar", email, phone, address, copyright, brands = [] }: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 bg-brand-900 text-white/80">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
                <CarIcon className="h-5 w-5" />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Key<span className="text-brand-400">car</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Rwanda&apos;s straightforward way to buy and rent cars. Every listing is checked before it goes live.
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Explore</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/listings", label: "All cars" },
                { href: "/listings?purpose=Sale", label: "Cars for sale" },
                { href: "/listings?purpose=Rent", label: "Cars for rent" },
                { href: "/about", label: "About us" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Brands</h3>
            {brands.length ? (
              <ul className="space-y-3 text-sm">
                {brands.slice(0, 6).map((b) => (
                  <li key={b.slug}>
                    <Link href={`/listings?brand=${b.slug}`} className="transition-colors hover:text-white">
                      {b.name ?? b.slug}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">Brands appear here as inventory grows.</p>
            )}
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Get in touch</h3>
            <ul className="space-y-4 text-sm">
              {phone ? (
                <li>
                  <a href={`tel:${phone.replace(/\s+/g, "")}`} className="flex items-start gap-3 hover:text-white">
                    <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li>
                  <a href={`mailto:${email}`} className="flex items-start gap-3 hover:text-white">
                    <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {email}
                  </a>
                </li>
              ) : null}
              <li className="flex items-start gap-3">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {address ?? "Kigali, Rwanda"}
              </li>
            </ul>

            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-white"
            >
              Send us a message
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs sm:flex-row">
          <p>{copyright ?? `© ${year} ${appName}. All rights reserved.`}</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
