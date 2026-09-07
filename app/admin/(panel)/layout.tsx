import type React from "react"
import { redirect } from "next/navigation"
import { currentAdmin } from "@/lib/auth"
import { countUnreadInquiries } from "@/lib/inquiries"
import { countAwaitingCars } from "@/lib/db"
import { countPendingKyc } from "@/lib/kyc"
import { countPendingComments } from "@/lib/blog"
import { countPendingReviews } from "@/lib/reviews"
import { countUsers } from "@/lib/users"
import { AdminShell } from "@/components/admin/admin-shell"

export const dynamic = "force-dynamic"

export const metadata = {
  title: { default: "Admin", template: "%s · Keycar admin" },
  robots: { index: false, follow: false },
}

export default async function PanelLayout({ children }: { readonly children: React.ReactNode }) {
  // Middleware only checks that a cookie exists; this is the real gate.
  const admin = await currentAdmin()
  if (!admin) redirect("/admin")

  // Every badge in the sidebar is "work waiting for you".
  const counts = {
    messages: countUnreadInquiries(),
    awaitingCars: countAwaitingCars(),
    pendingKyc: countPendingKyc(),
    pendingComments: countPendingComments(),
    pendingReviews: countPendingReviews(),
    pendingUsers: countUsers().pending,
  }

  return (
    <AdminShell admin={admin} counts={counts}>
      {children}
    </AdminShell>
  )
}
