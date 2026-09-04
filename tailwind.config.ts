import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        // The KeyCar brand scale — blue only, taken from the Laravel
        // stylesheet's --primary-color-2 (#405ff2) and --headline-color (#0d274e).
        brand: {
          50: "#f9faff",
          100: "#eef5ff",
          200: "#e7ebfe",
          300: "#c3ccfb",
          400: "#8496f6",
          500: "#405ff2",
          600: "#2f47d4",
          700: "#2637a8",
          800: "#1e4073",
          900: "#0d274e",
          950: "#081b38",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "999px",
      },
      boxShadow: {
        card: "0 4px 16px rgba(13, 39, 78, 0.08)",
        "card-hover": "0 14px 30px rgba(13, 39, 78, 0.16)",
        btn: "0 8px 20px rgba(64, 95, 242, 0.22)",
      },
      keyframes: {
        inUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        inFade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "in-up": "inUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "in-fade": "inFade 0.8s ease-out both",
      },
    },
  },
  plugins: [],
}

export default config
