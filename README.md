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
| Admin dashboard | `/admin/login` | `admin@marasphotography.com` / `MaraStudio2026!` |
| Client account demo | `/account` | `demo@maras.studio` / `DemoCustomer2026!` |

Change the admin password from **Account → Profile & security** after signing in, and set
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before first deploy if you want different seed
credentials. Those values are only used the very first time the database is created.

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
  session cookie and admin role; clients are redirected to `/admin/login`. Every admin server action
  also calls `requireAdmin()`.
- **Passwords** use PBKDF2-SHA256 (100k iterations, per-user salt). Sessions are HMAC-signed,
  httpOnly cookies.
- **Uploads persist** in the R2 bucket binding `FILES` and are served through `/api/media/...` with
  immutable caching. Seed demo photographs are remote Unsplash URLs — replace them from
  **Galleries** with your own uploads.

## 4. Environment variables

Nothing is required to run the app. These unlock production features (set them in Sites → Secrets,
never in code):

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key — enables real AUD checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe endpoint signing secret (verifies settlement) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (optional) |
| `RESEND_API_KEY` | Sends booking + payment emails |
| `EMAIL_FROM` | From address for those emails |
| `ADMIN_EMAIL` | Where admin notifications are emailed |
| `NEXT_PUBLIC_SITE_URL` | Public origin used in receipts and payment callbacks |
| `AUTH_SECRET` | Long random value that signs session cookies |

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

The local database and bucket bindings come from `freebuff.wrangler.jsonc` (generated for this
project) via `initOpenNextCloudflareForDev`, and persist under `.wrangler/state`.

## 6. Deployment

The Worker bundle is produced by OpenNext and deployed through Freebuff Sites. D1 (`DB`) and R2
(`FILES`) bindings are attached per environment; the first request creates the schema and seeds the
demo studio automatically.


## Design system

A luxury editorial identity layered over the existing product features — no booking, payment, admin or
auth logic was changed.

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
