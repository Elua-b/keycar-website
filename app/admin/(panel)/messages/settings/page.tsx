import { getSettings } from "@/lib/db"
import { saveContactSettingsAction } from "@/app/admin/manage-actions"
import { PageHeader } from "@/components/admin/page-header"

export const dynamic = "force-dynamic"
export const metadata = { title: "Message settings" }

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function MessageSettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const error = one(sp.error)
  const settings = getSettings()

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <PageHeader
        title="Message settings"
        subtitle="Where contact messages go, and whether they are stored."
        back={{ href: "/admin/messages", label: "Back to messages" }}
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <form action={saveContactSettingsAction} className="card space-y-6 p-6 sm:p-8">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-brand-900">Contact email</span>
          <input
            name="contact_message_mail"
            type="email"
            required
            defaultValue={settings.contact_message_mail ?? ""}
            placeholder="hello@keycar.rw"
            className="field"
          />
          <span className="mt-1.5 block text-xs text-slate-400">
            The inbox that receives a copy of every contact message.
          </span>
        </label>

        <div className="space-y-4 border-t border-brand-200 pt-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="save_contact_message"
              defaultChecked={settings.save_contact_message === "enable"}
              className="mt-1 h-4 w-4 rounded border-brand-200 text-brand-500"
            />
            <span>
              <span className="block text-sm font-semibold text-brand-900">Store messages in the database</span>
              <span className="text-sm text-slate-500">
                Turn this off and messages are only emailed, never kept. The inbox stays empty.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="send_contact_message"
              defaultChecked={settings.send_contact_message === "enable"}
              className="mt-1 h-4 w-4 rounded border-brand-200 text-brand-500"
            />
            <span>
              <span className="block text-sm font-semibold text-brand-900">Email a copy on every message</span>
              <span className="text-sm text-slate-500">
                Needs SMTP credentials, which this app does not carry yet — leave it off until mail is wired up.
              </span>
            </span>
          </label>
        </div>

        <button type="submit" className="btn-primary">
          Save settings
        </button>
      </form>
    </div>
  )
}
