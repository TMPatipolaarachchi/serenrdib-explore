# Riya.lk

Sri Lanka's marketplace for buying and selling vehicles, vehicle parts and vehicle services — mobile-first, in **Sinhala, English and Tamil**, with light and dark mode.

- **Public site:** search with filters, SEO-friendly ad pages, posting ads with up to 10 photos, favourites, in-app chat, Call and WhatsApp buttons, reporting, and a My Ads dashboard.
- **Admin panel** (at `/admin`, separate login): statistics, ad moderation, users, categories, brands and models, reports, and site settings.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Styling | Tailwind CSS v4, Framer Motion, lucide icons |
| Database | PostgreSQL + Prisma ORM 7 (`@prisma/adapter-pg`) |
| Auth | NextAuth v4 — email/password (bcrypt) + Google |
| Images | Cloudinary (browser-side compression + Cloudinary incoming transformation, `f_auto,q_auto` delivery) |
| Forms | react-hook-form + Zod (the same schemas validate in the browser and in the API) |
| Charts | Recharts (admin dashboard) |

> **Next.js 16 note:** request "middleware" is now called **proxy** — see `src/proxy.ts`.

---

## Quick start

### 1. Prerequisites

- **Node.js 20.19+** (Node 22/24 recommended)
- **PostgreSQL 14+**. No Postgres installed? `npx prisma dev` starts a local one and prints a connection URL. That local server handles only one connection at a time, so also set `DATABASE_POOL_MAX="1"` in `.env`.

### 2. Install

```bash
npm install            # also runs `prisma generate`
cp .env.example .env   # then edit .env
```

At minimum set `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_JWT_SECRET` and `OTP_SECRET`. Generate secrets with:

```bash
openssl rand -base64 32
```

### 3. Create the database

```bash
npm run db:deploy      # apply migrations (use `npm run db:migrate` while changing the schema)
npm run db:seed        # admin account, categories, brands/models, site settings
```

Set `SEED_DEMO_DATA="true"` before seeding to also create a demo seller (`demo@riya.lk` / `demo12345`) with 16 sample ads.

### 4. Run

```bash
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

---

## Admin panel

| | |
| --- | --- |
| URL | `http://localhost:3000/admin/login` (deliberately **not** linked anywhere on the public site) |
| Username | `admin` |
| Password | `admin@123` — **you must change it on first login** |

How the admin area is protected:

1. **Separate accounts.** Admins live in their own `Admin` table and use their own signed session cookie (`riya_admin_session`, httpOnly, `SameSite=Strict`, 8 hours). A public-site login never grants admin access.
2. **Hashed passwords.** Passwords are stored as bcrypt hashes (cost 12). The seed never overwrites an existing admin's password.
3. **Forced password change.** The seeded account is locked to the change-password page until a new password is set: at least 10 characters with upper- and lower-case letters, a number and a symbol.
4. **Proxy guard.** `src/proxy.ts` checks the session on every `/admin` and `/api/admin` request. Pages redirect to the login page; APIs return 401.
5. **Checked again server-side.** Every admin page and API route also re-validates the session against the database, so changing the password immediately signs out every other session.
6. **Login rate limiting (stored in the database).** Five failed attempts per IP, or 20 per username, within 15 minutes returns HTTP 429. Timing is constant, so the form doesn't reveal whether a username exists.
7. **Never indexed.** Admin pages send `X-Robots-Tag: noindex` and `Cache-Control: no-store`, and `/admin` is left out of `robots.txt` so its location isn't advertised.

Locked out? Run `npm run admin:reset`. It restores `admin` / `admin@123` (with a forced change on next login), signs out all admin sessions, and clears the rate-limit history.

---

## Configuration

### Cloudinary (image storage)

1. Create a free account at [cloudinary.com](https://cloudinary.com). Copy the cloud name, API key and API secret into `.env`.
2. That's all. Uploads go to `riya/ads`, `riya/banners` and `riya/branding`.

How images are processed:

- **In the browser**, photos are resized to at most 1920px and compressed to about 1 MB JPEG before upload.
- **On Cloudinary**, an incoming transformation caps them at 1600px with automatic quality.
- **On delivery**, `src/lib/image-loader.ts` asks Cloudinary for the exact width each screen needs, in WebP or AVIF (`f_auto,q_auto`).

Without Cloudinary keys, **development** uploads are saved to `public/uploads/`. **Production** refuses uploads until Cloudinary is configured.

### Google sign-in (optional)

Create an OAuth client at [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) with the redirect URI `<NEXTAUTH_URL>/api/auth/callback/google`, then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The "Continue with Google" button only appears when these are set.

### Phone verification (OTP)

Sellers must verify their mobile number before posting.

- **Codes:** 6 digits, valid for 10 minutes. Only an HMAC of the code is stored.
- **Limits:** 5 wrong guesses per code, a 60-second resend cooldown, and 5 codes per hour.
- **One account per number:** a number can only be verified on one account.

| `SMS_PROVIDER` | Settings |
| --- | --- |
| `console` (default) | Codes are printed in the server log and shown on screen in development. |
| `notifylk` | `NOTIFYLK_USER_ID`, `NOTIFYLK_API_KEY`, `NOTIFYLK_SENDER_ID` ([notify.lk](https://notify.lk)) |
| `textlk` | `TEXTLK_API_TOKEN`, `TEXTLK_SENDER_ID` ([text.lk](https://text.lk)) |

### Ad approval

New and edited ads wait in **Admin → Ads → Pending** until approved. Turn on *Publish new and edited ads immediately* in **Admin → Site settings** to skip review.

---

## Features

**Public site**

- **Homepage:** hero search, category grid with live counts, rotating banners, featured ads and latest ads.
- **Search** (`/search`, and `/category/<slug>` for SEO):
  - filters for keyword, category or subcategory, brand, model, price range, year range, condition, fuel, transmission, district and city;
  - four sort orders, with Top ads pinned first;
  - removable filter chips, and a bottom-sheet filter panel on phones.
- **Ad pages** (`/ads/<title>-<id>`):
  - swipeable photo gallery with a full-screen viewer, and a specs table;
  - "Show number" / Call, WhatsApp with a pre-filled message, in-app chat, save, share and report;
  - similar ads;
  - JSON-LD (Vehicle/Product), Open Graph tags, canonical URLs, and a real 404 status for removed ads.
- **Post an ad:**
  - category, then subcategory;
  - the form adapts to the category type:
    - vehicles: brand, model, year, mileage, fuel, transmission, engine;
    - parts: compatible brand/model, part number;
    - services: price optional.
  - up to 10 photos with reorder and choose-cover;
  - all 25 districts and their cities.
- **Accounts:**
  - register or log in with email/password or Google;
  - OTP phone verification;
  - profile and password change;
  - public seller pages.
- **My Ads:** status tabs, edit, delete and mark as sold. Editing sends the ad back for review.
- **Favourites, chat and reports:**
  - favourites are saved per account;
  - chat is buyer ↔ seller per ad, with unread badges and read receipts; it polls every 4 seconds, so it works on any host;
  - "Report ad" lets users flag an ad for review.
- **Languages and themes:** Sinhala / English / Tamil switcher (saved in a cookie); light, dark and system themes.
- **Loading and errors:** loading skeletons, empty states and error boundaries.
- **SEO:** `sitemap.xml` and `robots.txt`.

**Admin panel**

- **Dashboard:**
  - totals: users, ads, new ads today, pending, active, sold, rejected and open reports;
  - charts: ads and sign-ups per day, ads by status, ads by category;
  - 7 / 30 / 90-day range, plus a table view for every chart.
- **Ads:** review queue; approve, reject with reason, delete; mark as Featured or Top ad; full preview.
- **Users:** search; suspend (1–90 days), ban (takes their ads down), reactivate, delete.
- **Reports:** resolve, dismiss, or remove the ad.
- **Categories:** two-level tree; names in all 3 languages; type, icon, order, visibility.
- **Brands & models:** which categories each brand appears in; models per brand and category.
- **Site settings:** logo upload, contact details, social links, homepage banners, auto-approve toggle.

---

## Project structure

```
prisma/
  schema.prisma          database schema (documented inline)
  migrations/            SQL migrations
  seed.ts                admin + categories + brands/models + settings (+ demo data)
  reset-admin.ts         emergency admin reset
  data/                  category and brand/model seed lists
src/
  proxy.ts               admin guard, login redirects, /search → /category URLs
  app/
    (site)/              public pages (header/footer layout)
    admin/               admin login, change-password and the (panel)/ pages
    api/                 route handlers (public + /api/admin/*)
    sitemap.ts, robots.ts
  components/            UI kit (ui/), layout, ads, search, chat, admin, …
  lib/
    auth.ts              NextAuth config + getCurrentUser/requireUser
    admin-auth.ts        admin sessions, rate limiting, requireAdmin
    validations.ts       Zod schemas shared by forms and APIs
    ads.ts               search/filter queries
    i18n/                dictionaries (en/si/ta) + helpers
    data/locations.ts    25 districts with their cities
    upload.ts, otp.ts, sms.ts, …
```

### Adding or changing translations

All UI text lives in `src/lib/i18n/dictionaries/`. `en.ts` defines the shape, and `si.ts` / `ta.ts` must provide every key — TypeScript fails the build if one is missing. Category names are stored per language in the database and edited in the admin panel.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed admin, catalogue and settings |
| `npm run db:studio` | Browse the database |
| `npm run db:reset` | Drop and recreate the database (**destroys data**) |
| `npm run admin:reset` | Reset the admin password to `admin@123` |

---

## Deployment checklist

- **Environment:**
  - set every variable from `.env.example`;
  - use strong, *different* values for `NEXTAUTH_SECRET`, `ADMIN_JWT_SECRET` and `OTP_SECRET`;
  - set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to your real domain.
- **Services:** configure Cloudinary and a real `SMS_PROVIDER`.
- **Database:** run `npm run db:deploy` then `npm run db:seed` against the production database, then log in to `/admin` and change the password straight away.
- **Proxy:** run behind a proxy or CDN that sets `X-Forwarded-For` (Vercel, Nginx, Cloudflare). The admin login limiter keys on that header, and on username.
- **Rate limits:** user login, registration, upload and chat limits are in-memory, so each server instance counts separately. For several instances, swap `src/lib/rate-limit.ts` for Redis (e.g. Upstash). The admin login limiter already uses the database.
- **Build:** `npm run build` doesn't need database access. Every page renders on request, because pages depend on the visitor's language and session.

## Ideas for next steps

- "Forgot password" email flow (needs an email provider).
- Real-time chat over WebSockets or Pusher instead of polling.
- Scheduled cleanup of photos uploaded to ads that were never submitted.
- Ad expiry (the `EXPIRED` status already exists) and paid promotion for Featured and Top ads.
