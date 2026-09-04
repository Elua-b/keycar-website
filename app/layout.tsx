import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  title: {
    default: "Keycar — Find your next car in Rwanda",
    template: "%s · Keycar",
  },
  description:
    "Browse verified cars for sale and rent in Kigali. Compare specs, prices and mileage, then talk to the dealer directly.",
  openGraph: {
    title: "Keycar — Find your next car in Rwanda",
    description: "Browse verified cars for sale and rent in Kigali.",
    type: "website",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}
