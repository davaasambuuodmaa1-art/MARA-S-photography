# Mara's Photography

An on-location photography business platform for Sydney: a premium public website, location and
travel-fee management, a real booking engine that never confirms a location before the photographer
approves it, a verified payment flow, and an admin dashboard with full control of galleries, pricing,
locations, content, availability and clients. There is no physical studio — Mara travels to the
client's chosen location.

Built with Next.js (App Router) on Cloudflare Workers, with D1 (SQLite) for data and R2 for image
storage. No third-party database or auth account is required to run it.

---

## 1. Sign in

| Area | URL | Credentials |
| --- | --- | --- |
| Admin dashboard | `/admin/login` | The one-time bootstrap values configured in `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` |
| Client account demo | `/account` | `demo@maras.studio` / `DemoCustomer2026!` |

Set a unique 12-character-or-longer bootstrap password in local/hosting secrets before the first
admin sign-in, using the primary owner's email for `SEED_ADMIN_EMAIL`. Then visit **Owner setup** and
create separate, different passwords for the primary owner (`marlaa9939@yahoo.com`) and the only
other admin (`starmaa0307@gmail.com`). Setup replaces the one-time bootstrap password; only those
two administrator emails remain allowed. Each administrator can change their own password under
**Account & security**. No admin password is stored in this repository.

## 2. What is included

### Customer website
- Cinematic homepage: full-bleed hero, featured collections, selected frames with full-screen
  viewer, packages, testimonials carousel, Instagram strip, FAQ, CTA.
- 21 seeded collections (`/work`, `/work/[slug]`) with masonry galleries, keyboard/swipe lightbox,
  likes, share, downloads (only when the admin enables them) and watermarked previews.
- Five-step booking wizard: category → package → date/time → location → details, with suggested
  Sydney locations (travel fee and minimum-spend badges), a custom address or Google Maps link,
  a "recommend a location for me" option, live slot availability and inspiration-image upload.
- Public Locations section (`/locations`, `/locations/[slug]`): preview photographs, style tags,
  travel fee, access and permit notes, plus travel and rain policies. Permit badges only advertise
  commercial access when the permit and venue approval have both been recorded.
- Booking status lookup by reference + email, client accounts with booking and payment history.
- Contact form that stores every enquiry and notifies the studio, plus WhatsApp/email links and FAQ.
- Payment pages for deposit or full payment, printable receipts.

### Admin dashboard (`/admin`)
- **Overview** — bookings, verified revenue, outstanding balance, pipeline chart, upcoming shoots,
  recent clients, live activity feed.
- **Bookings** — filter/search, approve or reject, change status, reschedule with clash detection,
  private notes, client reference images, verified manual bank-transfer entry, refunds, delete.
  Each booking shows the requested location, Google Maps link, permit status and travel fee, with
  approve / reject / suggest-another-location controls and a weather-reschedule queue (customers
  request a new date from their booking page; approving moves the session and notifies them).
- **Galleries** — create/rename/delete collections, publish/hide, toggle downloads and watermarks,
  drag-and-drop multi-upload, add by URL, set cover, reorder (drag or arrows), edit titles.
- **Availability** — working days, opening hours, slot length, per-slot capacity, blocked dates.
- **Locations** — add Sydney locations, upload preview photographs, descriptions, style tags,
  travel information, availability, location requirements, per-location travel fees and minimum
  session values, permit status and venue approval.
- **Travel & areas** — service areas with base fee, per-km rate, free radius and minimum spend, plus
  the travel and bad-weather policies shown to clients and a list of permits still to be confirmed.
- **Customers** — contact details, booking history, spend, private studio notes.
- **Packages** — prices, deposits, discounts, inclusions, badges, visibility.
- **Website content** — hero copy and image, logo, about section and statistics, contact details,
  socials, testimonials, FAQs, announcement bar, Instagram strip, featured collections.
- **Enquiries** — read, mark replied/archived, reply by email or WhatsApp, delete.
- **Notifications** — live bell polling every 10 seconds plus a full history.
- **Payments** — provider status, checkout method toggles, deposit percentage, bank details.
- **Owner setup** — a six-section onboarding hub for business details, services, packages,
  payment policies, site content and the two administrator accounts.

## 3. How the important rules are enforced

- **A location is never confirmed automatically.** New bookings are stored with
  `location_status = pending` (suggested location) or `custom_pending` (custom address/map link).
  Only `approveBookingLocationAction` sets `approved`; it re-checks the chosen location's travel fee
  and minimum spend and recomputes the deposit while the booking is unpaid.
- **Permits are not implied.** `permit_status` is one of `unchecked | required | approved |
  not_required` plus a separate `venue_approved` flag. The public site only says "commercial
  photography approved" when both are set; otherwise it says the requirement is being confirmed.
- **No double bookings.** The booking insert is a single atomic `INSERT … SELECT … WHERE` statement
  that re-checks live capacity, so two people cannot take the same slot.
- **Payments are verified, never assumed.** The only way a booking becomes paid is
  `settleBooking()` in `lib/settle.ts`, reached from (a) the Stripe webhook after an
  HMAC-SHA256 signature, currency and amount check, (b) an admin-entered bank transfer reference, or (c) the
  clearly-labelled sandbox simulation used while no keys exist.
- **Admin routes are separated and protected.** `/admin/*` renders inside a layout that verifies the
  session cookie, admin role and (after setup) the two-email allowlist; every admin server action
  also calls `requireAdmin()`. Public registration cannot claim either protected email.
- **Passwords** use PBKDF2-SHA256 (100k iterations, per-user salt). Admin passwords must be at least
  12 characters and the two initial admin passwords must be different. Production sessions require
  a configured `AUTH_SECRET` and use HMAC-signed, httpOnly cookies.
- **Uploads persist** in the R2 bucket binding `FILES` and are served through `/api/media/...` with
  immutable caching. Seed demo photographs are remote Unsplash URLs — replace them from
  **Galleries** with your own uploads.

## 4. Environment variables

Set secrets in `.dev.vars` for local Workers development and in Sites → Secrets for production.
Never commit passwords, tokens or API keys:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key — enables real AUD checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe endpoint signing secret (verifies settlement) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (optional) |
| `RESEND_API_KEY` | Sends booking + payment emails |
| `EMAIL_FROM` | From address for those emails |
| `ADMIN_EMAIL` | Where admin notifications are emailed |
| `NEXT_PUBLIC_SITE_URL` | Public origin used in receipts and payment callbacks |
| `AUTH_SECRET` | Long random value required to sign production session cookies |
| `SEED_ADMIN_EMAIL` | One-time bootstrap login email, before Owner setup is complete |
| `SEED_ADMIN_PASSWORD` | Unique 12+ character bootstrap password; no default is provided |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google admin sign-in OAuth credentials |
| `APPLE_CLIENT_ID` | Optional Apple Services ID for admin sign-in |
| `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | Apple developer credentials used to sign the OAuth client secret |

**Admin Google / Apple sign-in:** create OAuth credentials with callback URLs
`https://your-domain/api/auth/admin/google/callback` and
`https://your-domain/api/auth/admin/apple/callback`, then set the variables above in `.dev.vars`
or hosting secrets. For local Google testing, register
`http://localhost:3000/api/auth/admin/google/callback`. Apple sign-in requires an Apple Developer
Services ID and Sign in with Apple key. The Apple private key must be stored as a secret; escaped
`\n` line breaks are supported. Social sign-in only works for an existing, verified, allowlisted
admin email. Apple Hide My Email addresses and other emails are not granted access. Email/password
sign-in remains available.

**Stripe setup:** create a Stripe account, copy the secret key, add a webhook endpoint pointing at
`https://your-domain/api/payments/stripe` for `checkout.session.completed` and
`payment_intent.succeeded` / `payment_intent.payment_failed`, then copy its signing secret into
`STRIPE_WEBHOOK_SECRET`. Test with card `4242 4242 4242 4242`. Booking status only changes when a
signature-verified event with a matching AUD amount arrives.

## 5. Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

The local database and bucket bindings come from `freebuff.dev.wrangler.jsonc` via
`initOpenNextCloudflareForDev`, and persist under `.wrangler/state`. This development-only config
omits the OpenNext cache Durable Objects, which are exported by the generated production Worker.
Before using the
admin dashboard, create an untracked `.dev.vars` file with `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD` and `AUTH_SECRET`; choose a unique bootstrap password. Sign in at
`/admin/login`, complete `/admin/setup`, and then sign in separately with the two allowed accounts.

## 6. Deployment

The Worker bundle is produced by OpenNext and deployed through Freebuff Sites. D1 (`DB`) and R2
(`FILES`) bindings are attached per environment; the first request creates the schema and seeds the
demo studio automatically.


## Design system

A luxury editorial identity for the public website and admin experience.

- **Palette** — ink `#0a0908`, espresso `#2b1d16`, burgundy `#561b27`, cream `#f8f2e7`,
  sand `#efe3d1`, champagne `#cdaf86`, gold `#a9855b`, blush `#e7cfc9`, taupe `#a3947f`.
- **Typography** — Bodoni Moda for display headlines (`.display`), Cormorant Garamond italic for
  editorial accents (`.editorial`), Jost for interface sans. All loaded in `app/layout.tsx`.
- **Hero** — `components/site/HeroEditorial.tsx`: asymmetric magazine-cover layout, oversized serif
  headline with an italic burgundy accent, offset inset frame, pointer/scroll parallax, staggered
  entrance animation.
- **Motion** — one easing curve (`cubic-bezier(0.22, 1, 0.36, 1)`), `.reveal` scroll reveals, subtle
  image parallax, film grain overlay, and a two-part custom cursor (`components/site/Cursor.tsx`).
  Everything is disabled under `prefers-reduced-motion`.
- **Photography grade** — `img.grade` applies a single film grade so mixed sources read as one body of
  work; colour returns on hover. The front page draws its frames from a curated set of collections.
