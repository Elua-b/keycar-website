"use client"

import { useState } from "react"
import { CheckIcon, ChatIcon } from "@/components/icons"

/**
 * Comments post to /api/comments and land unapproved, exactly like the Laravel
 * blog did — an admin approves them before they show on the page.
 */
export function CommentForm({ blogId }: { readonly blogId: number }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setState("sending")

    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blog_id: blogId,
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          comment: fd.get("comment"),
        }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) throw new Error(json.error || "Could not post your comment")
      setState("sent")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your comment")
      setState("idle")
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl bg-brand-100 p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand-500 text-white">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-4 font-bold text-brand-900">Thanks for the comment</p>
        <p className="mt-1 text-sm text-slate-600">It appears here once a moderator approves it.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <h3 className="flex items-center gap-2 font-bold text-brand-900">
        <ChatIcon className="h-4 w-4 text-brand-500" />
        Leave a comment
      </h3>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-brand-900">Your name</span>
          <input name="name" required placeholder="Jane Doe" className="field" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-brand-900">Email</span>
          <input name="email" type="email" required placeholder="you@example.com" className="field" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-brand-900">
            Phone <span className="font-normal text-slate-400">optional</span>
          </span>
          <input name="phone" placeholder="+250 …" className="field" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-brand-900">Comment</span>
          <textarea name="comment" rows={4} required placeholder="What did you think?" className="field" />
        </label>
      </div>

      <button type="submit" disabled={state === "sending"} className="btn-primary mt-5 disabled:opacity-60">
        {state === "sending" ? "Posting…" : "Post comment"}
      </button>
    </form>
  )
}
