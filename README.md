# Retail POS — Progressive Web App

A fast, installable **Point of Sale** system that works **online and offline**. Built
as a PWA so it installs on phone, tablet, and desktop, and keeps selling when the
internet drops — queuing sales locally and syncing automatically when back online.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **PostgreSQL** via **Prisma** (ORM)
- **Auth.js v5** (NextAuth) — admin email/password login
- **Dexie.js** (IndexedDB) — offline queue + local product cache
- **Zustand** — cart state
- **@ducanh2912/next-pwa** — service worker + installability
- **Recharts** — dashboard charts
- **html5-qrcode** — camera barcode scanning

## Features

- 🔐 Admin login, all routes protected (role field ready for future staff accounts)
- 📦 Product & inventory CRUD, low-stock alerts, barcode scanning, CSV bulk import
- 🧾 Checkout: search/scan, cart, per-item & cart discounts, tax, **split payments**, receipts (print / WhatsApp / SMS / email)
- 📶 **Offline mode**: queues sales locally, deducts local stock, auto-syncs on reconnect; oversell conflicts flagged for review
- 👤 Customers with purchase history and loyalty points
- 📊 Reports: revenue trend, best sellers, sales by staff, stock overview
- ⚙️ Settings: store info, tax/loyalty defaults, receipt template, categories

## Getting started

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL etc.
npm run db:migrate          # create tables
npm run db:seed             # admin user + sample data
npm run dev                 # http://localhost:3000
```

Default seeded login: **admin@pos.local** / **admin1234** (change in `.env`).

### Environment variables

See [.env.example](.env.example):

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection (pooled) — Supabase / Neon |
| `DIRECT_URL` | Direct Postgres connection (migrations) |
| `AUTH_SECRET` | Auth.js secret (`npx auth secret`) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000` or your domain) |
| `SEED_ADMIN_*` | Seed admin credentials |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (service worker disabled) |
| `npm run build` | Production build (uses `--webpack` for the PWA plugin) |
| `npm start` | Production server (service worker **active** — use this to test PWA/offline) |
| `npm run db:migrate` | Create & apply a migration |
| `npm run db:seed` | Seed admin + sample data |
| `npm run db:studio` | Prisma Studio |

## Testing PWA & offline

Always test in production mode (`npm run build && npm start`):

1. **Install** — open in Chrome/Edge/Android/iOS Safari → "Add to Home Screen".
2. **Offline sale** — DevTools → Network → "Offline" → complete a sale (queues, shows "Offline · N pending") → go back online → it auto-syncs.

## Deployment (Vercel)

Import the repo, set the env vars above (`NEXTAUTH_URL` = your real domain), and deploy.
The build runs `prisma generate` automatically via `postinstall`.

## Project structure

```
app/            App Router pages (checkout, inventory, customers, reports, settings, login)
app/api/        API routes (products, sales, customers, categories, settings, auth)
components/     Shared + feature UI components
lib/            db client, validations, serializers, sale math, offline sync
store/          Zustand cart store
prisma/         schema, migrations, seed
```
