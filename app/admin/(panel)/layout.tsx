import type React from "react"
import { redirect } from "next/navigation"
import { currentAdmin } from "@/lib/auth"
import { countUnreadInquiries } from "@/lib/inquiries"
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

  const unread = countUnreadInquiries()

  return (
    <AdminShell admin={admin} unread={unread}>
      {children}
    </AdminShell>
  )
}
