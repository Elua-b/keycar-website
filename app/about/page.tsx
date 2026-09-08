import Link from "next/link"
import type { Metadata } from "next"
import { getBrands, getSettings, getStats } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  GaugeIcon,
  GearIcon,
  SearchIcon,
  ShieldIcon,
  SlidersIcon,
  StarIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "About us",
  description:
    "Where Trust Drives Every Deal. Key Car is building Rwanda's most trusted car marketplace through transparency, verified listings and fair pricing.",
}

/* The six pillars of the platform, from the Key Car website profile. */
const PILLARS = [
  {
    icon: ShieldIcon,
    title: "Verified Listings",
    body: "Sellers provide complete and accurate information about their vehicles, reducing misleading or incomplete listings.",
  },
  {
    icon: GaugeIcon,
    title: "Comprehensive Vehicle Information",
    body: "Buyers can view key details such as the vehicle's condition, maintenance history, mileage, ownership information, and any reported damage or repairs.",
  },
  {
    icon: EyeIcon,
    title: "Transparency First",
    body: "The platform encourages full disclosure, helping eliminate hidden issues and unexpected costs.",
  },
  {
    icon: StarIcon,
    title: "Trusted Marketplace",
    body: "Seller verification and user reviews promote accountability and increase confidence between buyers and sellers.",
  },
  {
    icon: TagIcon,
    title: "Affordable Access",
    body: "Key Car connects buyers with vehicles that match their budget while ensuring they have the information needed to make confident purchasing decisions.",
  },
  {
    icon: SearchIcon,
    title: "Simple Digital Experience",
    body: "An intuitive platform allows users to search, compare, and connect with sellers quickly and securely.",
  },
]

/* The undisclosed problems named in the profile's problem statement. */
const HIDDEN_ISSUES = [
  { label: "Accident history", icon: ShieldIcon },
  { label: "Mechanical faults", icon: GearIcon },
  { label: "Mileage discrepancies", icon: GaugeIcon },
  { label: "Poor maintenance", icon: SlidersIcon },
]

export default function AboutPage() {
  const settings = getSettings()
  const brands = getBrands(false)
  const stats = getStats()

  return (
    <>
      <SiteHeader phone={settings.phone} />

      {/* ---------------- Hero / tagline ---------------- */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div
          className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-brand-500/30 blur-3xl"
          aria-hidden
        />
        <div className="container relative py-20 lg:py-24">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-white">About</span>
          </nav>

          <p className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
            About Key Car
          </p>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Where Trust Drives
            <br />
            <span className="text-brand-300">Every Deal.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
            Key Car is a trusted digital marketplace designed to make buying and selling cars in Rwanda transparent,
            safe, and accessible.
          </p>
        </div>
      </section>

      {/* ---------------- Vision & Mission ---------------- */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">What drives us</span>
            <h2 className="h-section mt-4">Our vision and mission</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="card p-8 sm:p-10">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-500">
                <EyeIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-2xl font-bold text-brand-900">Vision</h3>
              <p className="mt-4 leading-relaxed text-slate-600">
                To become Rwanda&apos;s most trusted car marketplace, where every buyer and seller can transact with
                confidence through transparency, verified information, and fair pricing.
              </p>
            </article>

            <article className="card p-8 sm:p-10">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-500">
                <ShieldIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-2xl font-bold text-brand-900">Mission</h3>
              <p className="mt-4 leading-relaxed text-slate-600">
                At Key Car, our mission is to make buying and selling vehicles simple, transparent, and trustworthy. We
                empower buyers with accurate vehicle information and verified listings while helping honest sellers
                connect with confident buyers. By promoting openness and accountability, we aim to eliminate uncertainty
                and build a safer, more reliable automotive marketplace for everyone.
              </p>
            </article>
          </div>

          {/* Anything written in the admin settings appears as an extra note. */}
          {settings.about_us ? (
            <div
              className="prose-sm mx-auto mt-10 max-w-3xl space-y-4 leading-relaxed text-slate-600 [&_a]:text-brand-500 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-brand-900"
              dangerouslySetInnerHTML={{ __html: settings.about_us }}
            />
          ) : null}
        </div>
      </section>

      {/* ---------------- Problem statement ---------------- */}
      <section className="bg-tint py-20">
        <div className="container">
          <div className="grid items-start gap-14 lg:grid-cols-2">
            <div>
              <span className="eyebrow">The problem</span>
              <h2 className="h-section mt-4">
                Too many cars are sold without anyone knowing their true condition
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
                <p>
                  In Rwanda&apos;s car market, many buyers purchase vehicles without knowing their true condition.
                  Important issues such as accident history, mechanical faults, mileage discrepancies, or poor
                  maintenance are often undisclosed, leaving buyers vulnerable to costly repairs, financial loss, and
                  unsafe vehicles.
                </p>
                <p>
                  Key Car exists to solve this problem by increasing transparency throughout the buying and selling
                  process. Through verified listings, detailed vehicle information, and trusted seller practices, we
                  help buyers make informed decisions while rewarding honest sellers with greater credibility and
                  trust.
                </p>
              </div>
            </div>

            <div className="card p-8 sm:p-10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-500">
                What usually stays hidden
              </h3>
              <ul className="mt-6 space-y-4">
                {HIDDEN_ISSUES.map((issue) => (
                  <li
                    key={issue.label}
                    className="flex items-center gap-4 border-b border-brand-200 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-500">
                      <issue.icon className="h-4 w-4" />
                    </span>
                    <span className="font-semibold text-brand-900">{issue.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 rounded-xl bg-brand-100 px-5 py-4 text-sm leading-relaxed text-brand-800">
                Every one of these is a field a seller must complete before a listing goes live on Key Car.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Platform solution ---------------- */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">The platform</span>
            <h2 className="h-section mt-4">How Key Car solves it</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Our platform addresses the lack of reliable vehicle information by giving buyers the tools they need to
              make informed decisions, and helping honest sellers build credibility.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <article
                key={p.title}
                className="card group p-7 hover:-translate-y-1 hover:border-brand-500 hover:shadow-card-hover"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-lg font-bold leading-snug text-brand-900">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-brand-200 bg-tint-soft px-8 py-10 text-center sm:px-12">
            <p className="text-lg leading-relaxed text-brand-900">
              By combining transparency, verification, and ease of use, Key Car is building a marketplace where every
              car transaction is based on trust — empowering buyers to purchase with confidence and helping honest
              sellers stand out.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="bg-tint py-16">
        <div className="container">
          <dl className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            {[
              { label: "Cars listed", value: stats.cars },
              { label: "Brands", value: stats.brands },
              { label: "Cities served", value: stats.cities },
              { label: "Verified sellers", value: stats.dealers || "—" },
            ].map((s) => (
              <div key={s.label}>
                <dd className="text-4xl font-extrabold text-brand-500">{s.value}</dd>
                <dt className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-500">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="h-section mt-4">Four steps, no surprises</h2>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Search", d: "Filter by brand, body type, fuel, transmission and price." },
              { n: "02", t: "Compare", d: "Read the full disclosed specification side by side. Nothing is hidden." },
              { n: "03", t: "Ask", d: "Message the verified seller straight from the listing with your questions." },
              { n: "04", t: "Drive", d: "Arrange a viewing, take it for a test drive, and decide with confidence." },
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

      {/* ---------------- CTA ---------------- */}
      <section className="pb-4">
        <div className="container">
          <div className="overflow-hidden rounded-3xl bg-brand-gradient px-8 py-14 text-center text-white sm:px-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Buy with confidence. Sell with credibility.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/80">
              Browse verified listings, or list your own vehicle and let full disclosure work in your favour.
            </p>
            <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
              {["Verified listings", "Full vehicle history", "Seller verification", "Buyer reviews"].map((i) => (
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
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="btn border border-white/30 text-white hover:bg-white/10">
                <UsersIcon className="h-4 w-4" />
                Talk to us
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
