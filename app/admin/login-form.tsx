"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { loginAction } from "./actions"
import { LogoutIcon } from "@/components/icons"

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {})

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="field"
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
          placeholder="••••••••"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="rounded-xl bg-brand-100 px-4 py-3 text-sm font-medium text-brand-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
      <LogoutIcon className="h-4 w-4 rotate-180" />
      {pending ? "Signing in…" : "Sign in"}
    </button>
  )
}
