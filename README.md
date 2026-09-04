# Keycar — Next.js website

The Keycar car marketplace rebuilt as a Next.js 16 + Tailwind project. It reads
and writes **the same SQLite database as the Laravel app** (`keycar/database/database.sqlite`),
using the same tables and the same column names — nothing was migrated or copied.

New car photos upload to **Cloudinary**; the existing `uploads/...` paths still
resolve against the Laravel app, so old and new images coexist.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 3 · `node:sqlite` · Cloudinary · bcryptjs

No component library and no ORM — the six runtime dependencies are it.

## Setup

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # http://localhost:3000
```

### Environment

| Variable | What it does |
|---|---|
| `DATABASE_PATH` | Absolute path to the Laravel `database.sqlite`. **Required.** |
| `LARAVEL_PUBLIC_URL` | Base URL of the Laravel app, so legacy `uploads/...` images resolve. |
| `DEFAULT_LANG` | Language code used against the `*_translations` tables. Defaults to `en`. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard → Settings → API Keys. Uploads fail without these. |
| `ADMIN_SESSION_SECRET` | Long random string that signs the admin session cookie. |

Generate a session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

### Legacy images

The five pre-existing cars point at `uploads/custom-images/placeholder.jpg`, which
lives in the Laravel app's `public/` folder. Run the Laravel app alongside this one
to see them:

```bash
cd ../keycar && php artisan serve   # serves on 127.0.0.1:8000
```

Anything uploaded from the new admin goes to Cloudinary and needs no Laravel server.

## Admin dashboard

`/admin` signs in against the existing `admins` table. Laravel writes bcrypt hashes
with a `$2y$` prefix and this app normalises that when comparing, so one account
works in both.

The `admins` table was empty, so create an account:

```bash
npm run create-admin -- <email> <password> "Display Name"
```

Re-running it for an existing email resets that password.

Once signed in: **Overview** (stats, recent cars, latest inquiries), **Cars**
(publish/hide, feature, edit, delete), **Add a car** (full spec form with drag-and-drop
Cloudinary upload), **Inquiries** (messages from listing pages and the contact form).

## Colours

Blue and white only, taken from the Laravel stylesheet:

| Token | Hex | Was |
|---|---|---|
| `brand-500` | `#405ff2` | `--primary-color-2` |
| `brand-900` | `#0d274e` | `--headline-color` |
| `brand-100` | `#eef5ff` | section tint |
| `brand-800` | `#1e4073` | gradient mid-stop |

The old theme's green (`#46d993`) and red (`#ee3536`) are deliberately dropped.
Tokens live in [`tailwind.config.ts`](tailwind.config.ts); component classes
(`.btn-primary`, `.card`, `.field`, `.chip`) in [`app/globals.css`](app/globals.css).

## Layout

```
app/
  page.tsx                    home — hero search, body types, showcase, brands
  listings/page.tsx           browse with filters, sorting, pagination
  listing/[slug]/page.tsx     detail — gallery, specs, features, inquiry form
  about/, contact/
  admin/
    page.tsx                  login
    (panel)/                  authenticated shell: dashboard, cars, inquiries
  api/
    inquiries/                public contact + car inquiry endpoint (rate limited)
    admin/upload/             Cloudinary upload (auth required)
    admin/cars/               create + update (auth required)
lib/
  db.ts                       every query; column names mirror Laravel exactly
  auth.ts                     HMAC-signed session cookie, bcrypt against `admins`
  cloudinary.ts               upload/delete helpers
  images.ts                   resolves Cloudinary vs legacy Laravel paths
  format.ts                   price, mileage, features, relative dates
  inquiries.ts                the one table this app adds (see below)
proxy.ts                      optimistic redirect for /admin/*
```

## The one schema addition

Laravel's `ContactMessage` module was a stub that only sent email — there was no
table to reuse. `lib/inquiries.ts` creates `car_inquiries` on first use. Nothing
else touches it, so the Laravel app is unaffected.

## Notes

- Every page that reads the database is `force-dynamic`, since the admin changes
  inventory at runtime.
- `next/image` runs with `unoptimized: true` on purpose: Cloudinary URLs already
  carry `f_auto,q_auto,w_*` transforms, and the legacy Laravel host may be offline.
- WAL journal mode is enabled so Laravel and Next.js can use the database at once.
