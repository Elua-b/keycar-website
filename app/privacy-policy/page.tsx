import type { Metadata } from "next"
import { getDb, getSettings, LANG } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LegalPage } from "@/components/legal-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Key Car collects, uses and protects your personal information.",
}

/**
 * Google Play requires a reachable privacy policy URL, and this page is what
 * that declaration points at — a 404 here blocks every release.
 *
 * Content comes from the `privacy_policies` table when an admin has written
 * one; the fallback below is used while that is empty so the URL is never
 * dead. The fallback describes what this codebase actually does — see
 * lib/mobile-auth.ts, lib/inquiries.ts and app/api/admin/upload.
 */
export default async function PrivacyPolicyPage() {
  const settings = getSettings()

  const row = getDb()
    .prepare("SELECT description, updated_at FROM privacy_policies WHERE lang_code = ? LIMIT 1")
    .get(LANG) as { description: string | null; updated_at: string | null } | undefined

  return (
    <>
      <SiteHeader />
      <LegalPage
        title="Privacy policy"
        updatedAt={row?.updated_at ?? null}
        html={row?.description?.trim() || null}
        fallback={<PrivacyFallback email={settings.contact_message_mail ?? settings.email} />}
      />
      <SiteFooter />
    </>
  )
}

function PrivacyFallback({ email }: { readonly email: string | null }) {
  const contact = email ?? "support@keycar.rw"

  return (
    <>
      <p>
        Key Car operates the keycar.rw website and the Key Car mobile app. This policy explains what
        personal information we collect, why we collect it, and the choices you have. It applies to
        both the website and the app.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Browsing without an account.</strong> You can search and view vehicle listings without
        signing up. We do not require any personal information to browse.
      </p>
      <p>
        <strong>When you create an account.</strong> We store your name, email address and a securely
        hashed version of your password. Passwords are never stored in a form we can read. If you add
        a phone number, address or profile photo, we store those too.
      </p>
      <p>
        <strong>When you contact a seller.</strong> Enquiries you send through the site or app include
        your name, email address, an optional phone number, and your message. These are stored so the
        seller and our team can respond.
      </p>
      <p>
        <strong>When you save vehicles.</strong> We record which listings you have saved so the list is
        there when you return.
      </p>
      <p>
        <strong>When you list a vehicle.</strong> We store the vehicle details and photographs you
        provide, along with the contact details shown on the listing.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To show you listings and keep you signed in.</li>
        <li>To pass your enquiries to the relevant seller.</li>
        <li>To display listings you publish to other users.</li>
        <li>To respond to support requests.</li>
        <li>To detect and prevent fraudulent or abusive activity.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for advertising profiling.</p>

      <h2>Who we share it with</h2>
      <p>
        <strong>Sellers.</strong> When you send an enquiry, the seller receives the contact details and
        message you provided.
      </p>
      <p>
        <strong>Service providers.</strong> Photographs are stored with Cloudinary, our image hosting
        provider. Our website and database run on servers we control.
      </p>
      <p>
        <strong>Legal requests.</strong> We may disclose information where the law requires it, or to
        protect the rights and safety of our users.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account information is kept while your account is open. Enquiries and listings are kept while
        they remain relevant to the marketplace. When you ask us to delete your account, we remove
        your account details, saved vehicles and profile photograph.
      </p>

      <h2>Deleting your account and data</h2>
      <p>
        To delete your account and the personal data associated with it, email{" "}
        <a href={`mailto:${contact}`}>{contact}</a> from the address on the account. We will confirm
        and complete the deletion within 30 days. Listings that have already been sold may be retained
        in anonymised form for record-keeping.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us for a copy of the personal information we hold about you, ask us to correct
        anything inaccurate, or ask us to delete it. Contact us at the address below.
      </p>

      <h2>Children</h2>
      <p>
        Key Car is not directed at children under 13, and we do not knowingly collect their personal
        information. If you believe a child has given us information, contact us and we will remove
        it.
      </p>

      <h2>Security</h2>
      <p>
        Connections to Key Car use HTTPS. Passwords are stored using bcrypt hashing. No system is
        perfectly secure, so please use a strong, unique password and tell us promptly if you suspect
        your account has been accessed by someone else.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We will update this page when our practices change, and the date at the top will change with
        it. Significant changes will be announced in the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy, or about your data, can go to{" "}
        <a href={`mailto:${contact}`}>{contact}</a>.
      </p>
    </>
  )
}
