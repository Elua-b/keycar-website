import Link from "next/link"
import { CarIcon } from "@/components/icons"

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-tint-soft px-6">
      <div className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-500 text-white shadow-btn">
          <CarIcon className="h-10 w-10" />
        </span>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-brand-500">Error 404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-900">This page took a wrong turn</h1>
        <p className="mx-auto mt-4 max-w-md text-slate-600">
          The page you were looking for isn&apos;t here. It may have been moved, or the car has already been sold.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Back home
          </Link>
          <Link href="/listings" className="btn-outline">
            Browse cars
          </Link>
        </div>
      </div>
    </main>
  )
}
