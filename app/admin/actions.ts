"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { signIn, signOut, requireAdmin } from "@/lib/auth"
import { deleteCar, setCarStatus, setCarFeatured } from "@/lib/db"
import { markInquiryRead, deleteInquiry } from "@/lib/inquiries"

export async function loginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!email || !password) return { error: "Enter your email and password." }

  try {
    const admin = await signIn(email, password)
    if (!admin) return { error: "Those credentials don't match an active admin account." }
  } catch (err) {
    // A missing ADMIN_SESSION_SECRET surfaces here — worth saying plainly.
    return { error: err instanceof Error ? err.message : "Could not sign you in." }
  }

  redirect("/admin/dashboard")
}

export async function logoutAction(): Promise<void> {
  await signOut()
  redirect("/admin")
}

export async function deleteCarAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (Number.isFinite(id)) deleteCar(id)
  revalidatePath("/admin/cars")
  revalidatePath("/")
}

export async function toggleStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get("id"))
  const next = String(formData.get("next") ?? "enable")
  if (Number.isFinite(id)) setCarStatus(id, next === "enable" ? "enable" : "disable")
  revalidatePath("/admin/cars")
  revalidatePath("/")
}

export async function toggleFeaturedAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get("id"))
  const next = String(formData.get("next") ?? "enable")
  if (Number.isFinite(id)) setCarFeatured(id, next === "enable" ? "enable" : "disable")
  revalidatePath("/admin/cars")
  revalidatePath("/")
}

export async function markInquiryAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get("id"))
  const read = String(formData.get("read") ?? "1") === "1"
  if (Number.isFinite(id)) markInquiryRead(id, read)
  revalidatePath("/admin/messages")
}

export async function deleteInquiryAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (Number.isFinite(id)) deleteInquiry(id)
  revalidatePath("/admin/messages")
}
