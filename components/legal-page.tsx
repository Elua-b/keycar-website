import type { ReactNode } from "react"

interface Props {
  readonly title: string
  readonly updatedAt: string | null
  /** Admin-authored HTML from the database, when present. */
  readonly html: string | null
  /** Rendered instead while no admin content exists, so the URL is never dead. */
  readonly fallback: ReactNode
}

/**
 * Shared shell for the privacy and terms pages.
 *
 * Both are linked from the app's More tab and, more importantly, from the
 * Play Console policy declaration — a 404 on either blocks releases, so these
 * always render something.
 */
export function LegalPage({ title, updatedAt, html, fallback }: Props) {
  const date = updatedAt ? new Date(updatedAt.replace(" ", "T")) : null
  const shown =
    date && !Number.isNaN(date.valueOf())
      ? date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null

  return (
    <main className="bg-tint-soft">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <header className="border-b border-brand-200 pb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">{title}</h1>
          {shown ? <p className="mt-3 text-sm font-medium text-slate-500">Last updated {shown}</p> : null}
        </header>

        {/*
          Descendant selectors rather than `prose`: @tailwindcss/typography is
          not a dependency of this project, so prose-* classes would compile to
          nothing. These arbitrary variants style the fallback JSX and any
          admin-authored HTML identically, with no plugin.
        */}
        <div
          className="mt-10 text-base leading-relaxed text-slate-700
                     [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-brand-900
                     [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-brand-900
                     [&_p]:mt-4
                     [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6
                     [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6
                     [&_strong]:font-semibold [&_strong]:text-brand-900
                     [&_a]:font-semibold [&_a]:text-brand-500 [&_a:hover]:text-brand-700 [&_a]:underline"
        >
          {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : fallback}
        </div>
      </div>
    </main>
  )
}
