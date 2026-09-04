import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { currentAdmin } from "@/lib/auth"
import { LoginForm } from "./login-form"
import { CarIcon, ShieldIcon } from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  const admin = await currentAdmin()
  if (admin) redirect("/admin/dashboard")

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-gradient lg:block">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-14 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <CarIcon className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Key<span className="text-brand-300">car</span>
            </span>
          </Link>

          <div>
            <h2 className="max-w-sm text-4xl font-extrabold leading-tight tracking-tight">
              Manage your stock in one place.
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-white/70">
              Add cars, upload photos to Cloudinary, and publish to the site instantly.
            </p>
          </div>

          <p className="flex items-center gap-2 text-sm text-white/60">
            <ShieldIcon className="h-4 w-4" />
            Signs in against your existing admin account
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-white px-6 py-14">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
              <CarIcon className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-brand-900">
              Key<span className="text-brand-500">car</span>
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Use the admin credentials from your Keycar dashboard.</p>

          <LoginForm />

          <Link href="/" className="mt-8 block text-center text-sm text-slate-500 hover:text-brand-500">
            ← Back to the website
          </Link>
        </div>
      </div>
    </main>
  )
}
