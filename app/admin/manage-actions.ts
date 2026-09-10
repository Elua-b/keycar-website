"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { setCarApproval, updateContactSettings } from "@/lib/db"
import { updateUser, setUserStatus, deleteUser } from "@/lib/users"
import { createKycType, updateKycType, deleteKycType, setKycStatus, deleteKycSubmission } from "@/lib/kyc"
import {
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  deletePost,
  setPostStatus,
  setCommentStatus,
  deleteComment,
} from "@/lib/blog"
import { createCountry, updateCountry, deleteCountry, createCity, updateCity, deleteCity } from "@/lib/locations"
import { setReviewStatus, deleteReview } from "@/lib/reviews"
import { createBrand, updateBrand, deleteBrand, setBrandStatus } from "@/lib/brands"

/**
 * Server actions for the six admin areas ported from Laravel. Each one is the
 * Next equivalent of a controller method: check the session, do the write,
 * revalidate the screens that show the result.
 *
 * Laravel reported outcomes with a flash message. Here a failed guard comes
 * back as an `?error=` on the redirect, which the page renders as a banner.
 */

const id = (fd: FormData, key = "id") => Number(fd.get(key))
const text = (fd: FormData, key: string, max = 255) => String(fd.get(key) ?? "").trim().slice(0, max)
const flag = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "1" || fd.get(key) === "true"

function back(path: string, error?: string): never {
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path)
}

/* ------------------------------------------------------------------ */
/* Brands                                                             */
/* ------------------------------------------------------------------ */

export async function saveBrandAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = text(formData, "name", 120)
  const image = text(formData, "image", 500) || null
  const status = flag(formData, "status") ? "enable" : "disable"
  const brandId = id(formData)

  const result =
    Number.isFinite(brandId) && brandId > 0
      ? updateBrand(brandId, { name, image, status })
      : createBrand({ name, image, status })

  revalidatePath("/admin/brands")
  revalidatePath("/")
  revalidatePath("/listings")
  back("/admin/brands", result.ok ? undefined : result.error)
}

export async function deleteBrandAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const brandId = id(formData)
  if (!Number.isFinite(brandId)) return

  const result = deleteBrand(brandId)
  revalidatePath("/admin/brands")
  revalidatePath("/")
  revalidatePath("/listings")
  back("/admin/brands", result.ok ? undefined : result.error)
}

export async function toggleBrandStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const brandId = id(formData)
  if (!Number.isFinite(brandId)) return

  setBrandStatus(brandId, String(formData.get("next") ?? "enable"))
  revalidatePath("/admin/brands")
  revalidatePath("/")
  revalidatePath("/listings")
  back("/admin/brands")
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export async function updateUserAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const userId = id(formData)
  if (!Number.isFinite(userId)) return

  const name = text(formData, "name", 120)
  if (name.length < 2) back(`/admin/users/${userId}`, "A name is required.")

  updateUser(userId, {
    name,
    phone: text(formData, "phone", 40),
    address: text(formData, "address", 220),
    designation: text(formData, "designation", 120) || null,
    country: text(formData, "country", 120) || null,
    is_dealer: flag(formData, "is_dealer"),
    status: flag(formData, "status") ? "enable" : "disable",
  })

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  back(`/admin/users/${userId}`)
}

export async function toggleUserStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const userId = id(formData)
  if (Number.isFinite(userId)) setUserStatus(userId, String(formData.get("next") ?? "enable"))
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const userId = id(formData)
  if (!Number.isFinite(userId)) return

  const result = deleteUser(userId)
  revalidatePath("/admin/users")
  back("/admin/users", result.ok ? undefined : result.error)
}

/* ------------------------------------------------------------------ */
/* KYC                                                                 */
/* ------------------------------------------------------------------ */

export async function saveKycTypeAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = text(formData, "name", 120)
  if (!name) back("/admin/kyc/types", "Give the document type a name.")

  const typeId = id(formData)
  if (Number.isFinite(typeId) && typeId > 0) updateKycType(typeId, name, flag(formData, "status"))
  else createKycType(name, flag(formData, "status"))

  revalidatePath("/admin/kyc/types")
  back("/admin/kyc/types")
}

export async function deleteKycTypeAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const typeId = id(formData)
  if (Number.isFinite(typeId)) deleteKycType(typeId)
  revalidatePath("/admin/kyc/types")
  revalidatePath("/admin/kyc")
}

export async function setKycStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const submissionId = id(formData)
  const status = Number(formData.get("status"))
  if (Number.isFinite(submissionId) && Number.isFinite(status)) setKycStatus(submissionId, status)
  revalidatePath("/admin/kyc")
  revalidatePath("/admin/users")
}

export async function deleteKycAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const submissionId = id(formData)
  if (Number.isFinite(submissionId)) deleteKycSubmission(submissionId)
  revalidatePath("/admin/kyc")
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */

export async function saveBlogCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = text(formData, "name", 120)
  if (!name) back("/admin/blog/categories", "Give the category a name.")

  const categoryId = id(formData)
  if (Number.isFinite(categoryId) && categoryId > 0) updateBlogCategory(categoryId, name, flag(formData, "status"))
  else createBlogCategory(name, flag(formData, "status"))

  revalidatePath("/admin/blog/categories")
  revalidatePath("/blog")
  back("/admin/blog/categories")
}

export async function deleteBlogCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const categoryId = id(formData)
  if (!Number.isFinite(categoryId)) return

  const result = deleteBlogCategory(categoryId)
  revalidatePath("/admin/blog/categories")
  revalidatePath("/blog")
  back("/admin/blog/categories", result.ok ? undefined : result.error)
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const postId = id(formData)
  if (Number.isFinite(postId)) deletePost(postId)
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  back("/admin/blog")
}

export async function togglePostStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const postId = id(formData)
  if (Number.isFinite(postId)) setPostStatus(postId, String(formData.get("next")) === "1")
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
}

export async function setCommentStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const commentId = id(formData)
  if (Number.isFinite(commentId)) setCommentStatus(commentId, String(formData.get("next")) === "1")
  revalidatePath("/admin/blog/comments")
  revalidatePath("/blog")
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const commentId = id(formData)
  if (Number.isFinite(commentId)) deleteComment(commentId)
  revalidatePath("/admin/blog/comments")
  revalidatePath("/blog")
}

/* ------------------------------------------------------------------ */
/* Locations                                                           */
/* ------------------------------------------------------------------ */

export async function saveCountryAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = text(formData, "name", 120)
  if (!name) back("/admin/locations", "Give the country a name.")

  const code = text(formData, "code", 8).toUpperCase() || null
  const countryId = id(formData)
  if (Number.isFinite(countryId) && countryId > 0) updateCountry(countryId, name, code)
  else createCountry(name, code)

  revalidatePath("/admin/locations")
  back("/admin/locations")
}

export async function deleteCountryAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const countryId = id(formData)
  if (!Number.isFinite(countryId)) return

  const result = deleteCountry(countryId)
  revalidatePath("/admin/locations")
  back("/admin/locations", result.ok ? undefined : result.error)
}

export async function saveCityAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const name = text(formData, "name", 120)
  const countryId = Number(formData.get("country_id"))

  if (!name) back("/admin/locations/cities", "Give the city a name.")
  if (!Number.isFinite(countryId) || countryId <= 0) back("/admin/locations/cities", "Pick a country.")

  const cityId = id(formData)
  if (Number.isFinite(cityId) && cityId > 0) updateCity(cityId, name, countryId)
  else createCity(name, countryId)

  revalidatePath("/admin/locations/cities")
  revalidatePath("/listings")
  back("/admin/locations/cities")
}

export async function deleteCityAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const cityId = id(formData)
  if (!Number.isFinite(cityId)) return

  const result = deleteCity(cityId)
  revalidatePath("/admin/locations/cities")
  back("/admin/locations/cities", result.ok ? undefined : result.error)
}

/* ------------------------------------------------------------------ */
/* Cars — approval and reviews                                         */
/* ------------------------------------------------------------------ */

export async function setCarApprovalAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const carId = id(formData)
  if (Number.isFinite(carId)) setCarApproval(carId, String(formData.get("next")) === "1")
  revalidatePath("/admin/cars")
  revalidatePath("/")
  revalidatePath("/listings")
}

export async function setReviewStatusAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const reviewId = id(formData)
  if (Number.isFinite(reviewId)) setReviewStatus(reviewId, String(formData.get("next")) === "1")
  revalidatePath("/admin/reviews")
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const reviewId = id(formData)
  if (Number.isFinite(reviewId)) deleteReview(reviewId)
  revalidatePath("/admin/reviews")
}

/* ------------------------------------------------------------------ */
/* Contact message settings                                            */
/* ------------------------------------------------------------------ */

export async function saveContactSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const mail = text(formData, "contact_message_mail", 180)
  if (!mail) back("/admin/messages/settings", "A contact email is required.")

  updateContactSettings({
    contact_message_mail: mail,
    send_contact_message: flag(formData, "send_contact_message"),
    save_contact_message: flag(formData, "save_contact_message"),
  })

  revalidatePath("/admin/messages/settings")
  revalidatePath("/contact")
  back("/admin/messages/settings")
}
