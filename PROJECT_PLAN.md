# Lumora: Project Plan

_Last updated: 9 Nov 2026_

## 1. Vision

Replace the existing portfolio site (lumoradesign.uk) with a full platform that **wins clients** (premium marketing site, portfolio, instant quotes) and **runs the business** (client portal, project tracking, invoicing, hosting & maintenance), keeping Lumora's colour scheme and logo.

**Goals**
- Turn visitors into qualified leads through an interactive quote wizard with an instant estimate.
- Give clients total transparency: a live project timeline, updates and invoices in one place.
- Cut admin: quotes → projects → invoices → payments → renewals, all in one dashboard.

**Success measures (first 6 months)**
- ≥ 30% of new projects originate from the quote wizard.
- Average time from quote submission to response < 2 working days.
- ≥ 80% of invoices paid online; overdue invoices < 10%.

## 2. Users & roles

| Role | How they get access | Can do |
| --- | --- | --- |
| Visitor | — | Browse site & portfolio; must sign up to request a quote |
| Client | Self sign-up (verified email) **or** admin invite | Quote wizard, view own projects/timeline/updates, quotes, invoices, pay online |
| Admin | Seeded (single admin role) | Everything in the admin dashboard |

Decisions: self-signup is required before submitting a quote (with email verification, rate limiting and honeypot). Admin invites are kept for existing clients. One admin role only for MVP.

## 3. Scope

### MVP (Phase 1)

| Area | Feature | Status |
| --- | --- | --- |
| Public site | Home, Services, About, Contact, responsive header/footer, SEO metadata, sitemap, robots | ✅ Done |
| Public site | Portfolio list + case study pages (6 projects carried over from current site) | ✅ Done |
| Accounts | Sign-up, email verification, login/logout, role-based routing | ✅ Done |
| Accounts | Admin invites client → client sets password | ✅ Done |
| Quote wizard | 6-step wizard (type, pages & features, design & content, timeline & budget, business, review) | ✅ Done |
| Quote wizard | Live estimate range + monthly hosting, autosaved drafts, server-side recalculation | ✅ Done |
| Quote wizard | Admin-editable pricing table | ✅ Done |
| Client portal | Overview, projects list, **project timeline** (milestones, progress %, updates) | ✅ Done |
| Client portal | Quotes list with status | ✅ Done |
| Client portal | Invoices list/detail, PDF download, Stripe "Pay now" | ✅ Done |
| Admin | Overview: quotes to review, active projects, outstanding £, hosting MRR, renewals due | ✅ Done |
| Admin | Quote review: status, notes, **accept → project** with default milestone plan | ✅ Done |
| Admin | Clients: list, invite, edit, resend invite, per-client history | ✅ Done |
| Admin | Projects: CRUD, milestones (add/reorder/status/remove), client updates | ✅ Done |
| Invoicing | Sequential numbers (LUM-YYYY-NNNN, allocated on send), issue/due dates, line items, VAT 0/5/20%, notes | ✅ Done |
| Invoicing | Draft → Sent → Paid/Overdue/Void, edit drafts, PDF, Stripe webhook, paid date | ✅ Done |
| Hosting & maintenance | Plans per client/project (domain, provider, plan, price, monthly/annual, renewal, status, notes) | ✅ Done |
| Hosting & maintenance | Renewal alerts, MRR, "Invoice next period" (draft invoice + roll renewal date) | ✅ Done |
| Portfolio | Admin CRUD (publish/feature/order) | ✅ Done |
| Email | Basic transactional: verification, invite, quote received, admin new-quote alert, invoice sent | ✅ Done |
| Quality | Unit tests (pricing, invoices, hosting, money, redirects) and E2E journeys | ✅ Done |

### Phase 2

| Feature | Notes |
| --- | --- |
| Messaging / comments per project | Client ↔ admin threads on the project page; email notification |
| File sharing | Uploads on projects (S3/R2/Vercel Blob); until then, share externally |
| Testimonials management | Admin CRUD + display on home/case studies |
| Recurring / automated billing | Stripe subscriptions for hosting plans, auto-invoice on renewal |
| Email notification polish | Branded templates (React Email), milestone-complete & update emails, overdue reminders |
| Password reset | `PASSWORD_RESET` token type already exists in the schema |
| Proposal documents | Turn an accepted quote into a formal proposal with e-sign/accept |
| Portfolio images | Image upload instead of URLs |

### Out of scope (removed)

- Advanced analytics dashboards
- Multiple admin roles / staff permissions

## 4. Launch checklist (blockers in **bold**)

- [x] Brand colours: light lavender palette (Ghost White `#F8F8FF`, Cetacean Blue `#150A35`, Lavender `#A577FF`) in `src/app/globals.css`
- [x] Logo: LUMORA wordmark recreated as SVG; PNG used as favicon/app icon
- [x] Premium light lavender UI + interactivity (flowing gradient backgrounds, scroll reveals, cursor spotlight, hover glow)
- [ ] **Portfolio images** for the 6 case studies (+ case-study write-ups)
- [ ] Final copy for About / Services / Contact (current text is a solid draft); confirm contact email in `src/lib/site.ts`
- [ ] **Production Postgres** (Neon/Supabase) + Vercel project, env vars, `npm run db:deploy`, seed with `SEED_DEMO=false`
- [ ] **Resend**: verify sending domain, set `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`
- [ ] **Stripe**: live keys, webhook endpoint + secret, test a live £1 payment
- [ ] Review quote pricing in Admin → Quote pricing
- [ ] Confirm VAT status (default invoices to 0% until VAT-registered) and payment terms text for invoice notes
- [ ] Domain cut-over from the current site + redirects for old URLs (`/portfolio/<slug>` paths are preserved)
- [ ] Replace in-memory rate limiter with a shared store (e.g. Upstash Redis)
- [ ] Add Cloudflare Turnstile (or similar) to sign-up if spam appears
- [ ] Privacy policy & terms pages (GDPR: accounts store personal data)
- [ ] Lighthouse / accessibility pass on production build

## 5. Data model (summary)

`User` (ADMIN/CLIENT) → `ClientProfile`; `AuthToken` (verification/invite/reset, hashed); `Quote` (answers JSON, estimate range, status); `PricingItem`; `Project` → `Milestone`, `ProjectUpdate`; `Invoice` → `InvoiceLine`, `InvoiceSequence` (per-year counter); `HostingPlan`; `PortfolioItem`. Money in integer pence. Full schema: `prisma/schema.prisma`.

## 6. Route map

| Area | Routes |
| --- | --- |
| Public | `/`, `/services`, `/portfolio`, `/portfolio/[slug]`, `/about`, `/contact` |
| Auth | `/signup`, `/login`, `/check-email`, `/verify-email`, `/accept-invite` |
| Quote | `/quote` (verified clients), `/quote/thanks` |
| Portal | `/portal`, `/portal/projects[/id]`, `/portal/quotes`, `/portal/invoices[/id]` |
| Admin | `/admin`, `/admin/quotes[/id]`, `/admin/clients[/new|/id]`, `/admin/projects[/new|/id]`, `/admin/invoices[/new|/id]`, `/admin/hosting[/new|/id]`, `/admin/portfolio[/new|/id]`, `/admin/pricing` |
| API | `/api/stripe/webhook`, `/api/invoices/[id]/pdf` |

## 7. Milestones

| # | Milestone | Status |
| --- | --- | --- |
| M1 | Scaffold, theme, data model, auth | ✅ |
| M2 | Public site + portfolio | ✅ |
| M3 | Quote wizard + admin quote review → project | ✅ |
| M4 | Client portal timeline + admin project management | ✅ |
| M5 | Invoicing + Stripe + PDF | ✅ |
| M6 | Hosting & maintenance module | ✅ |
| M7 | Brand assets, content, production setup (see checklist) | ⏳ Next |
| M8 | Launch + domain cut-over | ⏳ |
| M9 | Phase 2 features | Planned |

## 8. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Account-before-quote reduces conversions | Wizard is fast (~3 min) with live estimate; monitor sign-up → submit drop-off; option to move sign-up to the final step later |
| Spam sign-ups | Rate limiting + honeypot now; Turnstile ready to add |
| Estimates misread as fixed prices | Shown as a range with a clear "guide, not a fixed price" disclaimer; admin confirms |
| Payment/webhook mismatch | Webhook verifies signature and amount; mismatches are logged and left unpaid for review |
| Invoice numbering gaps/duplicates | Numbers allocated atomically only when sent; issued invoices can't be deleted |

## 9. Open questions

- A transparent, high-res logo export (SVG preferred) to replace the recreated wordmark if you want a pixel-exact match.
- Are you VAT registered? (affects default VAT rate and invoice wording)
- Preferred payment terms (e.g. 50% deposit / 50% on launch) to bake into the default milestone & invoice flow?
- Should hosting plans move to automatic Stripe subscriptions in Phase 2?
