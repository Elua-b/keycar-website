"use client"

import { deleteCarAction } from "@/app/admin/actions"
import { TrashIcon } from "@/components/icons"

/**
 * Deleting removes the car, its translation and its gallery rows, so it asks
 * first. Confirmation lives client-side; the action still re-checks the admin.
 */
export function DeleteCarButton({ id, title }: { readonly id: number; readonly title: string }) {
  return (
    <form
      action={deleteCarAction}
      onSubmit={(e) => {
        const ok = window.confirm(`Delete "${title}"? This removes the listing and its photos from the site permanently.`)
        if (!ok) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        title="Delete"
        aria-label={`Delete ${title}`}
        className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 text-brand-900 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </form>
  )
}
