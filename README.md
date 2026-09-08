# Keycar — Next.js website

The Keycar car marketplace rebuilt as a Next.js 16 + Tailwind project, replacing
the Laravel app in `../keycar`.

It runs on **SQLite** (`node:sqlite`, no ORM) using the Laravel schema unchanged —
same tables, same column names, same `*_translations` split — so the two apps
describe the same data. The Laravel install itself is configured for MySQL, so
there is no shared file: `npm run init-db` creates the SQLite database locally
from that schema and seeds it with sample content.

New photos upload to **Cloudinary**; legacy `uploads/...` paths still resolve
against the Laravel app if you run it, so old and new images coexist.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 3 · `node:sqlite` · Cloudinary · bcryptjs

No component library and no ORM — the six runtime dependencies are it.

## Setup

```bash
npm install
cp .env.example .env     # then fill in the values below
npm run init-db          # create + seed the SQLite database
npm run dev              # http://localhost:3000
```

### Environment

| Variable | What it does |
|---|---|
| `DATABASE_PATH` | Absolute path to the SQLite file. **Required.** `npm run init-db` creates it. |
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

### The six management areas

Each mirrors a Laravel controller, including its guards and status vocabulary.

| Area | Screens | Ported from |
|---|---|---|
| **Cars** | list with All / Awaiting approval / Published / Hidden / Featured / Drafts, approve-and-publish, feature, seller assignment, full spec editor | `Modules/Car/…/CarController` |
| **Reviews** | approve, unapprove, delete; only approved reviews reach the site | `CarController::review_*` |
| **Locations** | countries and cities (cities carry a translated name), both deletes blocked while listings point at them | `Modules/Country`, `Modules/City` |
| **Users** | active / pending / dealer lists, profile editor, suspend, delete (blocked while they own listings) | `Admin/UserController` |
| **KYC** | document types CRUD, submission queue with Pending / Approved / Rejected, approving stamps `users.kyc_status` | `Modules/Kyc` |
| **Blog** | posts, categories, comment moderation, plus the public `/blog` and `/blog/[slug]` | `Modules/Blog` |
| **Messages** | one inbox for contact-page messages and listing enquiries, read/unread, delete, settings | `Modules/ContactMessage` |

Two deliberate departures from Laravel:

- **Contact messages and car enquiries share one table.** Laravel's
  `ContactMessage` module wrote to `contact_messages`, but that migration was
  never run — the table does not exist in the MySQL database. Both kinds of
  message go to `car_inquiries` instead; one carries a car slug, the other a
  subject. Admin → Messages → Settings keeps the `save_contact_message` and
  `send_contact_message` toggles.
- **Emails are not sent.** Laravel mailed on KYC decisions and contact messages.
  No SMTP credentials are wired up here, so those points are no-ops; the
  "email a copy" toggle is off and labelled as such.

## Replacing the inventory

`scripts/seed-cars.mjs` wipes every car and re-inserts the real stock list held
at the top of that file. Edit the `INVENTORY` array to change what gets loaded.

```bash
npm run seed-cars            # dry run — reports what it would delete, changes nothing
npm run seed-cars -- --yes   # actually apply
```

It deletes `cars`, `car_translations`, `car_galleries`, `reviews` and `wishlists`,
then inserts the list. Brands and cities that don't exist yet are created. Customer
messages in `car_inquiries` are left alone — those are real leads.

Every listing is inserted published, unfeatured, and with `/placeholder.svg` as its
photo; add real images from **Admin → Cars → Edit → Photos**.

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
  blog/                       article index + detail with comments
  about/, contact/
  admin/
    page.tsx                  login
    actions.ts                car + message server actions
    manage-actions.ts         users, KYC, blog, locations, reviews, settings
    (panel)/                  authenticated shell
      dashboard/              stats and the "needs your attention" queues
      cars/                   list, approval queue, add, edit
      reviews/                approve or remove buyer reviews
      locations/              countries; locations/cities for cities
      users/                  list and per-user profile
      kyc/                    submission queue; kyc/types for document types
      blog/                   posts, blog/new, blog/[id]/edit, categories, comments
      messages/               inbox; messages/settings
  api/
    inquiries/                public contact + car enquiry endpoint (rate limited)
    comments/                 public blog comment endpoint (rate limited)
    admin/upload/             Cloudinary upload (auth required)
    admin/cars/               create + update (auth required)
    admin/blog/               create + update posts (auth required)
lib/
  db.ts                       cars, brands, settings, currency, stats
  users.ts                    the Laravel `users` table (sellers, not admins)
  kyc.ts                      kyc_types + kyc_information
  blog.ts                     posts, categories, comments
  locations.ts                countries + cities
  reviews.ts                  listing reviews
  inquiries.ts                the one table this app adds (see below)
  auth.ts                     HMAC-signed session cookie, bcrypt against `admins`
  cloudinary.ts               upload/delete helpers
  images.ts                   resolves Cloudinary vs legacy Laravel paths
  format.ts                   price, mileage, features, relative dates
scripts/
  init-sqlite.mjs             schema + sample data (npm run init-db)
  seed-cars.mjs               replace the whole inventory with the real stock list (npm run seed-cars)
  create-admin.mjs            create or reset an admin account
proxy.ts                      optimistic redirect for /admin/*
```

## The one schema addition

Laravel's `ContactMessage` module never had its migration run, so there was no
table to reuse. `lib/inquiries.ts` creates `car_inquiries` on first use — the
same shape plus a `subject` column and an optional car link. Every other table
comes straight from the Laravel schema.

`scripts/init-sqlite.mjs` owns the schema and is safe to re-run: tables are
created `IF NOT EXISTS`, new columns are added through a `PRAGMA table_info`
check, and sample rows are only written into tables that are still empty.

## Notes

- **Prices are in Rwandan francs.** The currency comes from the default row in
  `multi_currencies` (`currency_icon` `RWF`, `currency_position` `after_price`),
  read by `getCurrency()` in [`lib/db.ts`](lib/db.ts) and rendered by
  `formatPrice()` in [`lib/format.ts`](lib/format.ts) — change that one row to
  switch currency; `DEFAULT_CURRENCY` is only the fallback when the row is missing.
  Amounts already in the database are never rescaled automatically.

- Every page that reads the database is `force-dynamic`, since the admin changes
  inventory at runtime.
- `next/image` runs with `unoptimized: true` on purpose: Cloudinary URLs already
  carry `f_auto,q_auto,w_*` transforms, and the legacy Laravel host may be offline.
- WAL journal mode is enabled so Laravel and Next.js can use the database at once.
