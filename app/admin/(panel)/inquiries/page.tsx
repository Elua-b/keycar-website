import { redirect } from "next/navigation"

/** Renamed to /admin/messages once contact-page messages joined car inquiries. */
export default function InquiriesRedirect() {
  redirect("/admin/messages")
}
