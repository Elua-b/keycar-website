// Keep this file exactly this short. Next.js executes it on every dev run and
// build, which made it a hiding place once before: the version inherited from
// the previous project had an obfuscated payload appended after this config,
// padded with whitespace so it looked untouched in an editor. If this file is
// ever more than a few lines, treat that as a compromise, not a config change.

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
