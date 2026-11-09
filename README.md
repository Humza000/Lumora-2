# Lumora

The website and client platform for **Lumora**, a boutique web design & development studio.

- **Public site**: home, services, about, contact, and a portfolio of past work managed from the admin.
- **Quote wizard**: an interactive, multi-step quote builder with a live price estimate. Customers create an account (with email verification) before starting, and drafts autosave.
- **Client portal**: customers log in to follow their project timeline (milestones and progress), read updates, view quotes, and view, download and pay invoices (Stripe).
- **Admin dashboard**: review quotes and convert them into projects, manage clients (with email invites), projects, milestones and updates, invoices (sequential numbering, VAT, PDF, payments), hosting & maintenance plans with renewals, portfolio and quote pricing.

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the roadmap and [CLAUDE.md](CLAUDE.md) for code conventions.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (brand theme in `src/app/globals.css`) |
| Database | PostgreSQL + Prisma 7 |
| Auth | Email + password, signed JWT session cookie (jose), bcrypt, role-based (ADMIN / CLIENT) |
| Payments | Stripe Checkout + webhook |
| Email | Gmail SMTP via Nodemailer, or Resend (printed to console, not sent, if neither is configured) |
| PDFs | @react-pdf/renderer |
| Tests | Vitest (unit), Playwright (end-to-end) |

## Getting started

**Requirements:** Node.js 20.9+ (22 recommended) and a PostgreSQL database.

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   - DATABASE_URL     your Postgres connection string
#   - SESSION_SECRET   openssl rand -base64 48
#   - ADMIN_PASSWORD   password for the seeded admin account (10+ chars)

# 3. Create the database schema and seed it
npm run db:migrate      # applies prisma/migrations
npm run db:seed         # admin user, quote pricing, portfolio, demo client

# 4. Run
npm run dev             # http://localhost:3000
```

**No Postgres handy?** Prisma can run one locally:

```bash
npx prisma dev --name lumora --detach   # prints a postgres://… TCP URL, put it in DATABASE_URL
```

### Accounts after seeding

| Role | Login |
| --- | --- |
| Admin | `hello.lumoradesign@gmail.com` (`ADMIN_EMAIL`) / `ADMIN_PASSWORD` from `.env` → `/admin`. Re-run `npm run db:seed` after changing either. |
| Demo client | `demo.client@example.com` / `DemoClient123` → `/portal` (set `SEED_DEMO=false` in production) |

### Email (verification, invites, invoices)

Sign-up needs working email, because customers must click a verification link. The easiest setup is the Lumora Gmail account:

1. Turn on 2-Step Verification for `hello.lumoradesign@gmail.com`.
2. Create an App Password at https://myaccount.google.com/apppasswords.
3. Put it in `.env` as `SMTP_PASS` (`SMTP_HOST`, `SMTP_PORT` and `SMTP_USER` are already set for Gmail), then restart `npm run dev`.

If neither SMTP nor `RESEND_API_KEY` is configured, emails are **not sent**: they are printed to the terminal running `npm run dev`, and the "Check your email" page shows a dev notice saying so. Replies to any Lumora email go to `hello.lumoradesign@gmail.com`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, uses your local Google Chrome) |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed admin, pricing, portfolio, demo data |
| `npm run db:studio` | Browse the database |

## Testing

```bash
npm test             # pricing, invoice maths/numbering, hosting renewals, money, redirects
npm run test:e2e     # needs a migrated + seeded DB and ADMIN_PASSWORD in .env
```

The end-to-end suite covers: sign-up → email verification → quote wizard → submission; admin accepting the quote into a project, updating milestones, posting updates, creating/sending an invoice (and PDF), and adding a hosting plan; the client seeing their timeline and invoice; and one client being unable to access another's data.

## Branding

- **Colours**: a light lavender theme: Ghost White `#F8F8FF` backgrounds, Cetacean Blue `#150A35` text, Lavender `#A577FF` accents, with soft flowing gradients. Edit the CSS variables at the top of [src/app/globals.css](src/app/globals.css); everything uses these tokens. Emails and invoice PDFs keep their own copies in `src/lib/email.ts` and `src/lib/invoice-pdf.tsx`.
- **Logo**: the LUMORA wordmark is rendered by [src/components/logo.tsx](src/components/logo.tsx) (static copy: [public/logo.svg](public/logo.svg)); the favicon/app icon comes from `src/app/icon.png` / `apple-icon.png`.
- **Business details** (contact email, tagline): [src/lib/site.ts](src/lib/site.ts). Marketing copy: [src/lib/content.ts](src/lib/content.ts) and the pages in `src/app/(public)`.

## Payments (Stripe)

1. Add `STRIPE_SECRET_KEY` (use test keys while developing).
2. Create a webhook endpoint pointing to `https://<your-domain>/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and set `STRIPE_WEBHOOK_SECRET`.
3. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Clients pay via **Pay now** on a sent invoice. The webhook marks the invoice paid if the amount matches.

## Deployment

Designed for **Vercel** + a managed Postgres (e.g. Neon or Supabase):

1. Create the database and set all variables from `.env.example` in the hosting provider (`APP_URL` = your public URL, `SEED_DEMO=false`).
2. Build command: `npm run build`. Run `npm run db:deploy` (and `npm run db:seed` once) against the production database.
3. Configure the Stripe webhook and email (`SMTP_*` for Gmail, or `RESEND_API_KEY` + `EMAIL_FROM` on a verified domain).

## Project structure

```
src/app/(public)     marketing pages, portfolio, quote wizard
src/app/(auth)       login, sign-up, email verification, invite acceptance
src/app/portal       client portal
src/app/admin        admin dashboard (+ _actions/ server actions)
src/app/api          Stripe webhook, invoice PDFs
src/components       UI primitives, forms, shells, timeline, invoice view
src/lib              auth/DAL, pricing, invoices, hosting, email, Stripe, validation
src/proxy.ts         route protection (optimistic redirects)
prisma/              schema, migrations, seed
e2e/                 Playwright tests
```
