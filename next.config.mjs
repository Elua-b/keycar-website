/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    /**
     * The optimizer is bypassed on purpose:
     *  - Cloudinary URLs already carry f_auto/q_auto/w_* transforms (lib/images.ts),
     *    so re-optimizing them server-side only adds a hop.
     *  - Legacy Laravel uploads live on a host that may not be running, which
     *    made /_next/image return 400 and log console errors on every page.
     * next/image still handles layout, sizes and lazy loading.
     */
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // The Laravel app still serves the legacy /uploads images.
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "localhost", port: "8000" },
    ],
  },
  // cloudinary's SDK must stay on the Node runtime rather than being bundled.
  serverExternalPackages: ["cloudinary"],
}

export default nextConfig
