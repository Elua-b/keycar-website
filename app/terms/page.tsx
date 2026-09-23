import type { Metadata } from "next"
import { getDb, getSettings, LANG } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LegalPage } from "@/components/legal-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The terms you agree to when using the Key Car website and app.",
}

/**
 * Content comes from `term_and_conditions` when an admin has written one, with
 * the fallback below covering the gap. Linked from the app's More tab via
 * /api/terms-conditions.
 */
export default async function TermsPage() {
  const settings = getSettings()

  const row = getDb()
    .prepare("SELECT description, updated_at FROM term_and_conditions WHERE lang_code = ? LIMIT 1")
    .get(LANG) as { description: string | null; updated_at: string | null } | undefined

  return (
    <>
      <SiteHeader />
      <LegalPage
        title="Terms and conditions"
        updatedAt={row?.updated_at ?? null}
        html={row?.description?.trim() || null}
        fallback={<TermsFallback email={settings.contact_message_mail ?? settings.email} />}
      />
      <SiteFooter />
    </>
  )
}

function TermsFallback({ email }: { readonly email: string | null }) {
  const contact = email ?? "support@keycar.rw"

  return (
    <>
      <p>
        These terms apply to the keycar.rw website and the Key Car mobile app. By using either, you
        agree to them.
      </p>

      <h2>What Key Car is</h2>
      <p>
        Key Car is a marketplace that connects people buying and selling vehicles in Rwanda. We are
        not a party to any sale. We do not own the vehicles listed, we do not take payment for them,
        and we do not guarantee that any transaction will complete.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for keeping your password secure and for activity on your account. Tell us
        promptly if you believe someone else has accessed it. You must be at least 18 to create an
        account.
      </p>

      <h2>Listings</h2>
      <p>If you list a vehicle, you confirm that:</p>
      <ul>
        <li>You own it or are authorised to sell it.</li>
        <li>The details you provide — condition, mileage, ownership and history — are accurate.</li>
        <li>The photographs are of the actual vehicle.</li>
        <li>The sale does not breach Rwandan law.</li>
      </ul>
      <p>
        We may remove any listing that appears inaccurate, misleading or unlawful, and may suspend
        accounts that repeatedly post them.
      </p>

      <h2>Buying</h2>
      <p>
        Inspect any vehicle and verify its documents before paying. Listing information comes from
        sellers, and while we ask for accuracy we cannot independently verify every detail. Payment
        and handover happen directly between buyer and seller.
      </p>

      <h2>What we are not responsible for</h2>
      <p>
        Key Car provides the platform only. We are not liable for the condition of any vehicle, the
        conduct of any buyer or seller, or any loss arising from a transaction arranged through the
        service. Nothing here limits liability that cannot lawfully be limited.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not post false listings, harass other users, scrape the service, attempt to gain
        unauthorised access, or use Key Car for anything unlawful.
      </p>

      <h2>Suspension</h2>
      <p>
        We may suspend or close an account that breaches these terms. You can close your account at
        any time by contacting us.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; the date at the top shows when they last changed. Continuing to use
        Key Car after a change means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the Republic of Rwanda.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can go to <a href={`mailto:${contact}`}>{contact}</a>.
      </p>
    </>
  )
}
