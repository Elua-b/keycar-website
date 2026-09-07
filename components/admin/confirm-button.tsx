"use client"

import { useFormStatus } from "react-dom"
import { TrashIcon } from "@/components/icons"

/**
 * A submit button that asks before it fires. Used for every destructive admin
 * action so a delete is never one stray click away.
 */
export function ConfirmButton({
  message,
  label,
  title,
  className,
  children,
}: {
  readonly message: string
  readonly label?: string
  readonly title?: string
  readonly className?: string
  readonly children?: React.ReactNode
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      title={title ?? label}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
      className={
        className ??
        "grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
      }
    >
      {children ?? <TrashIcon className="h-4 w-4" />}
      {label ? <span className="sr-only">{label}</span> : null}
    </button>
  )
}
