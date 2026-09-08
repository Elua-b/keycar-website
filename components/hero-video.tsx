"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { CloseIcon } from "./icons"

interface Props {
  /** Video file or CDN URL. Swap for a Cloudinary URL when one is available. */
  readonly src: string
  readonly poster: string
  readonly label?: string
  readonly caption?: string
}

/**
 * The footage is a presenter speaking to camera, so this is deliberately NOT a
 * muted autoplay background: it shows a poster until the visitor asks for it,
 * then plays with sound and native controls. `preload="none"` means the file is
 * not fetched at all until then — the page stays light for people on mobile data.
 *
 * Shot vertically, so the frame is 9:16 rather than cropped to a letterbox.
 */
export function HeroVideo({ src, poster, label = "Watch our intro", caption }: Props) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function start() {
    setPlaying(true)
    // The element mounts on this state change, so play on the next frame.
    requestAnimationFrame(() => {
      const el = videoRef.current
      if (!el) return
      el.play().catch(() => {
        // If the browser refuses, the visible controls still work.
      })
    })
  }

  function stop() {
    videoRef.current?.pause()
    setPlaying(false)
  }

  return (
    <figure className="relative mx-auto w-full max-w-[19rem] lg:max-w-none">
      <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-white/15 bg-brand-950 shadow-card-hover">
        {playing ? (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              controls
              playsInline
              preload="auto"
              onEnded={() => setPlaying(false)}
              className="h-full w-full bg-black object-cover"
            >
              Your browser cannot play this video.
            </video>
            <button
              type="button"
              onClick={stop}
              aria-label="Close video"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-brand-950/70 text-white backdrop-blur transition-colors hover:bg-brand-950"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={start}
            aria-label={label}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={poster}
              alt=""
              fill
              sizes="(max-width: 1024px) 304px, 420px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Keeps the play control legible whatever the frame behind it. */}
            <span
              className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/10 to-brand-950/20"
              aria-hidden
            />

            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 shadow-card-hover transition-transform duration-300 group-hover:scale-110">
                {/* Play triangle */}
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-brand-600" aria-hidden>
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              </span>
            </span>

            <span className="absolute inset-x-0 bottom-0 p-5 text-left">
              <span className="block text-xs font-semibold uppercase tracking-widest text-white/70">
                {label}
              </span>
              {caption ? (
                <span className="mt-1 block text-sm font-medium leading-snug text-white">{caption}</span>
              ) : null}
            </span>
          </button>
        )}
      </div>

      {caption ? <figcaption className="sr-only">{caption}</figcaption> : null}
    </figure>
  )
}
