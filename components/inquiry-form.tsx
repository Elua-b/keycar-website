"use client"

import { useState } from "react"
import { CheckIcon, MailIcon, PhoneIcon } from "./icons"

interface Props {
  readonly carTitle?: string
  readonly carSlug?: string
  readonly phone?: string | null
  readonly variant?: "card" | "plain"
}

type State = "idle" | "sending" | "sent" | "error"

export function InquiryForm({ carTitle, carSlug, phone, variant = "card" }: Props) {
  const [state, setState] = useState<State>("idle")
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    setState("sending")
    setError("")

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          subject: data.get("subject"),
          message: data.get("message"),
          carSlug: carSlug ?? null,
        }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) throw new Error(json.error || "Something went wrong")
      setState("sent")
      form.reset()
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (state === "sent") {
    return (
      <div className={variant === "card" ? "card p-7 text-center" : "text-center"}>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-500">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h3 className="mt-5 text-lg font-bold text-brand-900">Message sent</h3>
        <p className="mt-2 text-sm text-slate-600">
          Thanks — we&apos;ve got your details and will get back to you shortly.
        </p>
        <button type="button" onClick={() => setState("idle")} className="btn-outline mt-6">
          Send another
        </button>
      </div>
    )
  }

  return (
    <div className={variant === "card" ? "card p-7" : ""}>
      <h3 className="text-lg font-bold text-brand-900">
        {carTitle ? "Interested in this car?" : "Send us a message"}
      </h3>
      <p className="mt-1.5 text-sm text-slate-600">
        {carTitle ? "Leave your details and we'll get straight back to you." : "We usually reply the same day."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="iq-name" className="label">
            Your name
          </label>
          <input id="iq-name" name="name" required minLength={2} maxLength={120} className="field" placeholder="Jane Doe" />
        </div>

        <div>
          <label htmlFor="iq-email" className="label">
            Email
          </label>
          <input
            id="iq-email"
            name="email"
            type="email"
            required
            maxLength={180}
            className="field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="iq-phone" className="label">
            Phone <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <input id="iq-phone" name="phone" type="tel" maxLength={40} className="field" placeholder="+250 …" />
        </div>

        {carSlug ? null : (
          <div>
            <label htmlFor="iq-subject" className="label">
              Subject <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <input
              id="iq-subject"
              name="subject"
              maxLength={180}
              className="field"
              placeholder="Selling my car, partnership, something else…"
            />
          </div>
        )}

        <div>
          <label htmlFor="iq-message" className="label">
            Message
          </label>
          <textarea
            id="iq-message"
            name="message"
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            className="field resize-y"
            defaultValue={carTitle ? `Hi, I'd like to know more about the ${carTitle}.` : ""}
          />
        </div>

        {state === "error" ? (
          <p role="alert" className="rounded-xl bg-brand-100 px-4 py-3 text-sm font-medium text-brand-700">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={state === "sending"} className="btn-primary w-full disabled:opacity-60">
          <MailIcon className="h-4 w-4" />
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </form>

      {phone ? (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand-900 hover:text-brand-500"
        >
          <PhoneIcon className="h-4 w-4 text-brand-500" />
          Or call {phone}
        </a>
      ) : null}
    </div>
  )
}
