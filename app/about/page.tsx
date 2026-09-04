import Link from "next/link"
import type { Metadata } from "next"
import { getBrands, getSettings, getStats } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArrowRightIcon, CarIcon, CheckIcon, ShieldIcon, TagIcon, UsersIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "About us",
  description: "Who we are and how Keycar checks every car before it reaches you.",
}

export default function AboutPage() {
  const settings = getSettings()
  const brands = getBrands(false)
  const stats = getStats()

  return (
    <>
      <SiteHeader phone={settings.phone} />

      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div className="container relative py-20">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-white">About</span>
          </nav>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            We make buying a car in Rwanda straightforward.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Keycar started with a simple frustration: too many listings, too little honest information. So we built
            the opposite.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <span className="eyebrow">Our story</span>
              <h2 className="h-section mt-4">Built around one idea: tell the truth about the car</h2>
              <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
                {settings.about_us ? (
                  <div dangerouslySetInnerHTML={{ __html: settings.about_us }} />
                ) : (
                  <>
                    <p>
                      Buying a used car usually means guesswork. Photos hide the dents, the mileage is a rumour, and
                      the price moves depending on who&apos;s asking. We thought that was a solvable problem.
                    </p>
                    <p>
                      Every car on Keycar is inspected before it appears. We publish the full specification — year,
                      mileage, engine, transmission, colours, previous owners — and we show the asking price plainly,
                      with any discount spelled out.
                    </p>
                    <p>
                      Then we get out of the way. You talk to the seller directly, ask your own questions, and make
                      your own decision. No pressure, no commission-driven nudging.
                    </p>
                  </>
                )}
              </div>

              <Link href="/listings" className="btn-primary mt-8">
                Browse our stock
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: ShieldIcon,
                  title: "Inspected before listing",
                  body: "Condition and paperwork are checked in person. A car that doesn't pass doesn't go live.",
                },
                {
                  icon: TagIcon,
                  title: "One honest price",
                  body: "The number you see is the asking price. Discounts are shown against the original, not invented.",
                },
                {
                  icon: UsersIcon,
                  title: "Direct to the seller",
                  body: "Message from the listing page and speak to the person who actually knows the car.",
                },
                {
                  icon: CarIcon,
                  title: "Sale and rental",
                  body: "Whether you're buying outright or need a car for a few weeks, it's the same catalogue.",
                },
              ].map((f) => (
                <div key={f.title} className="card flex gap-5 p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-bold text-brand-900">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-tint py-16">
        <div className="container">
          <dl className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            {[
              { label: "Cars in stock", value: stats.cars },
              { label: "Brands", value: stats.brands },
              { label: "Cities served", value: stats.cities },
              { label: "Happy buyers", value: "100+" },
            ].map((s) => (
              <div key={s.label}>
                <dd className="text-4xl font-extrabold text-brand-500">{s.value}</dd>
                <dt className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-500">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="h-section mt-4">Four steps, no surprises</h2>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Search", d: "Filter by brand, body type, fuel, transmission and price." },
              { n: "02", t: "Compare", d: "Read the full specification side by side. Nothing is hidden." },
              { n: "03", t: "Ask", d: "Message the seller straight from the listing with your questions." },
              { n: "04", t: "Drive", d: "Arrange a viewing, take it for a test drive, and decide." },
            ].map((s) => (
              <li key={s.n} className="card p-7">
                <span className="text-sm font-extrabold tracking-widest text-brand-300">{s.n}</span>
                <h3 className="mt-3 text-lg font-bold text-brand-900">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-4">
        <div className="container">
          <div className="overflow-hidden rounded-3xl bg-brand-gradient px-8 py-14 text-center text-white sm:px-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to find your car?</h2>
            <p className="mx-auto mt-4 max-w-lg text-white/80">
              Tell us what you&apos;re after and we&apos;ll point you at the right cars — or source one for you.
            </p>
            <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
              {["Free consultation", "Financing guidance", "Trade-in valuation", "Nationwide delivery"].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/listings" className="btn-white">
                Browse cars
              </Link>
              <Link
                href="/contact"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

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
