"use client"

import Image from "next/image"
import { useState } from "react"
import { optimized } from "@/lib/images"
import { ChevronLeftIcon, ChevronRightIcon } from "./icons"

export function CarGallery({ images, alt }: { readonly images: string[]; readonly alt: string }) {
  const [index, setIndex] = useState(0)
  const safe = images.length ? images : [""]
  const current = safe[Math.min(index, safe.length - 1)]

  const step = (delta: number) => setIndex((i) => (i + delta + safe.length) % safe.length)

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-brand-100">
        <Image
          src={optimized(current, 1280, 800)}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
          className="object-cover"
        />

        {safe.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-900 shadow-card backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-900 shadow-card backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-pill bg-brand-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {Math.min(index, safe.length - 1) + 1} / {safe.length}
            </span>
          </>
        ) : null}
      </div>

      {safe.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          {safe.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                i === index ? "border-brand-500" : "border-transparent hover:border-brand-300"
              }`}
            >
              <Image src={optimized(img, 224, 160)} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
