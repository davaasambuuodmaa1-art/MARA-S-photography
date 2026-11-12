import type { Bindings } from "./db";
import { PHOTOS } from "./seed-photos";
import { GALLERY_REMAP } from "./gallery-remap";
import { DEFAULT_SETTINGS, photo } from "./settings";
import { hashPassword } from "./auth";
import { ADMIN_SETUP_COMPLETE_KEY } from "./admin-access";
import { newId } from "./utils";

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  watermark INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_key TEXT,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover INTEGER NOT NULL DEFAULT 0,
  downloadable INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL,
  visitor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(image_id, visitor)
);
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  deposit_percent INTEGER NOT NULL DEFAULT 30,
  description TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  duration_hours INTEGER NOT NULL DEFAULT 1,
  edited_photos INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  badge TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id TEXT,
  category_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  people INTEGER NOT NULL DEFAULT 1,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  reference_images TEXT NOT NULL DEFAULT '[]',
  admin_notes TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'stripe',
  method TEXT,
  kind TEXT NOT NULL DEFAULT 'deposit',
  gross_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  raw TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS availability (
  weekday INTEGER PRIMARY KEY,
  is_working INTEGER NOT NULL DEFAULT 1,
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  slot_minutes INTEGER NOT NULL DEFAULT 120,
  capacity INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS blocked_dates (
  date TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL,
  image TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT 'General enquiry',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
`;

const CATEGORY_SEED: {
  name: string;
  blurb: string;
  photos: number[];
}[] = [
  {
    name: "Nature Photography",
    blurb:
      "Long walks, quiet light and the texture of the living world — photographed slowly, on foot, at the hour when everything softens.",
    photos: [14, 15, 16, 17, 25, 26, 40, 20],
  },
  {
    name: "Wedding Photography",
    blurb:
      "Unposed, editorial coverage of the day as it actually unfolds: the shaking hands, the stolen glance, the grandmother laughing too loudly.",
    photos: [0, 1, 2, 4, 13, 24, 28],
  },
  {
    name: "Football & Sports Photography",
    blurb:
      "On the touchline with fast glass — the tackle, the sweat, the roar. Made for clubs, athletes and the people who love them.",
    photos: [56, 63, 64, 65, 78],
  },
  {
    name: "Portrait Photography",
    blurb:
      "A one-hour sitting in natural light. No stiff posing, no forced smiles — just a conversation, a window and the version of you people remember.",
    photos: [3, 5, 7, 8, 10, 11, 12, 21, 31, 32],
  },
  {
    name: "Graduation Photography",
    blurb:
      "The gown, the campus, the family who drove six hours to be there. A short, celebratory session that captures all of it.",
    photos: [67, 88, 74],
  },
  {
    name: "Birthday Photography",
    blurb:
      "Cakes, candles, confetti and the chaos in between. Documentary coverage for milestones from first birthdays to fiftieths.",
    photos: [61, 84, 89, 76],
  },
  {
    name: "Couple Photography",
    blurb:
      "An hour for the two of you — golden hour, a quiet street, movement instead of posing. Often booked for anniversaries and engagements.",
    photos: [70, 71, 87, 2],
  },
  {
    name: "Family Photography",
    blurb:
      "Real families, gently directed. We plan for the chaos, photograph the in-between moments, and still get the frame for the wall.",
    photos: [82, 86, 68, 83],
  },
  {
    name: "Fashion Photography",
    blurb:
      "Lookbook, campaign and editorial work with a small, fast crew. Studio or location, film-inspired colour, wardrobe and styling support available.",
    photos: [34, 39, 50, 52, 59, 69, 6],
  },
  {
    name: "Street Photography",
    blurb:
      "The city as it is: rain, sodium light, strangers mid-gesture. Personal work from Sydney, Tokyo, Milan and New York.",
    photos: [35, 36, 37, 38, 47],
  },
  {
    name: "Travel Photography",
    blurb:
      "Commissions for hotels, tourism boards and travel brands — and the journals that come home with us afterwards.",
    photos: [41, 42, 43, 44, 45],
  },
  {
    name: "Landscape Photography",
    blurb:
      "Wide, quiet frames made at dawn. Available as archival fine-art prints in limited editions.",
    photos: [79, 80, 81, 90, 91, 29, 26],
  },
  {
    name: "Event Photography",
    blurb:
      "Launches, openings, dinners and conferences. Discreet coverage, same-week delivery of a curated highlight set.",
    photos: [74, 76, 77, 62],
  },
  {
    name: "Concert Photography",
    blurb:
      "Pit access, low light and honest energy. We work with promoters, labels and artists for tours and festival coverage.",
    photos: [48, 49, 51, 62, 72],
  },
  {
    name: "Product Photography",
    blurb:
      "Clean, considered product imagery for e-commerce and campaigns — including styling, set building and retouching.",
    photos: [54, 57, 58, 60, 75, 65],
  },
  {
    name: "Commercial Photography",
    blurb:
      "Brand, hospitality and interior commissions with full production support. One crew, one look, every deliverable you need.",
    photos: [55, 33, 46, 54, 57],
  },
  {
    name: "Maternity Photography",
    blurb:
      "A gentle, unhurried session in studio or at home, usually booked between 28 and 36 weeks. Partners and siblings welcome.",
    photos: [68, 83, 66],
  },
  {
    name: "Newborn Photography",
    blurb:
      "The first fourteen days, photographed slowly and safely. Warm studio, no rush, plenty of time for feeding and settling.",
    photos: [83, 85, 66, 68],
  },
  {
    name: "Lifestyle Photography",
    blurb:
      "Brands, creators and families at home in their own light — a documentary approach for people who hate being photographed.",
    photos: [73, 87, 6, 22, 27, 32],
  },
  {
    name: "Architecture Photography",
    blurb:
      "Spaces rendered honestly: verticals corrected, light balanced, the architect's intent preserved for portfolio and press.",
    photos: [30, 33, 46, 55, 47],
  },
];

const PACKAGE_SEED = [
  {
    name: "The Essential",
    slug: "essential",
    tagline: "For a single, beautiful hour",
    price: 450,
    duration: 1,
    photos: 10,
    features: [
      "1-hour session, studio or outdoors",
      "10 fully retouched images",
      "Private online gallery",
      "Digital delivery in 10 working days",
      "One outfit change",
    ],
    badge: null as string | null,
    discount: 0,
    deposit: 30,
  },
  {
    name: "The Signature",
    slug: "signature",
    tagline: "Our most-booked sitting",
    price: 890,
    duration: 2,
    photos: 25,
    features: [
      "2-hour session with Mara",
      "25 fully retouched images",
      "Up to two locations nearby",
      "Sneak preview within 72 hours",
      "Digital delivery in 10 working days",
      "Print-ready high resolution files",
    ],
    badge: "Most loved",
    discount: 10,
    deposit: 30,
  },
  {
    name: "The Atelier",
    slug: "atelier",
    tagline: "A full editorial production",
    price: 1950,
    duration: 4,
    photos: 50,
    features: [
      "4-hour session, full creative direction",
      "50 fully retouched images",
      "Multiple locations and looks",
      "Styling and moodboard consultation",
      "Priority delivery in 5 working days",
      "Fine-art print set of 5 images",
      "Private gallery for guests",
    ],
    badge: "Full experience",
    discount: 0,
    deposit: 30,
  },
  {
    name: "Bespoke Commission",
    slug: "bespoke",
    tagline: "Made entirely around you",
    price: 0,
    duration: 8,
    photos: 0,
    features: [
      "Custom scope, crew and locations",
      "Editorial, brand or multi-day coverage",
      "Dedicated producer",
      "Flexible payment plan",
      "Quoted within 48 hours",
    ],
    badge: "By request",
    discount: 0,
    deposit: 20,
  },
];

const LOCATION_DDL = `
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Sydney',
  description TEXT NOT NULL DEFAULT '',
  styles TEXT NOT NULL DEFAULT '[]',
  cover_image TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  maps_url TEXT NOT NULL DEFAULT '',
  travel_info TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  permit_status TEXT NOT NULL DEFAULT 'unchecked',
  venue_approved INTEGER NOT NULL DEFAULT 0,
  travel_fee INTEGER NOT NULL DEFAULT 0,
  min_spend INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  suggested INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS service_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  postcodes TEXT NOT NULL DEFAULT '',
  base_fee INTEGER NOT NULL DEFAULT 0,
  per_km INTEGER NOT NULL DEFAULT 0,
  min_spend INTEGER NOT NULL DEFAULT 0,
  free_within_km INTEGER NOT NULL DEFAULT 15,
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'percent',
  value INTEGER NOT NULL DEFAULT 0,
  min_spend INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL DEFAULT '',
  ends_at TEXT NOT NULL DEFAULT '',
  usage_limit INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS private_galleries (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  cover_image TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  expires_at TEXT NOT NULL DEFAULT '',
  downloads INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  requested_by TEXT NOT NULL DEFAULT 'customer',
  preferred_date TEXT NOT NULL DEFAULT '',
  preferred_time TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  weather INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
`;

// Columns added after the first release. D1 has no IF NOT EXISTS for columns.
const PACKAGE_COLUMNS = [
  "ALTER TABLE packages ADD COLUMN extra_photo_price INTEGER NOT NULL DEFAULT 45",
  "ALTER TABLE packages ADD COLUMN extra_hour_price INTEGER NOT NULL DEFAULT 150",
  "ALTER TABLE packages ADD COLUMN addons TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE packages ADD COLUMN quote_only INTEGER NOT NULL DEFAULT 0",
];

const BOOKING_COLUMNS = [
  "ALTER TABLE bookings ADD COLUMN location_id TEXT",
  "ALTER TABLE bookings ADD COLUMN maps_url TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE bookings ADD COLUMN location_status TEXT NOT NULL DEFAULT 'pending'",
  "ALTER TABLE bookings ADD COLUMN wants_recommendations INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE bookings ADD COLUMN permit_status TEXT NOT NULL DEFAULT 'unchecked'",
  "ALTER TABLE bookings ADD COLUMN location_note TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE bookings ADD COLUMN travel_fee INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE bookings ADD COLUMN base_amount INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE bookings ADD COLUMN addon_total INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE bookings ADD COLUMN extras TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE bookings ADD COLUMN discount_code TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE bookings ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0",
];

const SERVICE_AREA_SEED = [
  { name: "Sydney City & Inner", postcodes: "2000–2050", base: 0, perKm: 0, min: 0, free: 15, notes: "No travel fee within 15 km of the CBD." },
  { name: "Eastern Suburbs & Beaches", postcodes: "2021–2036", base: 40, perKm: 0, min: 0, free: 15, notes: "Bondi, Coogee, Watsons Bay, Paddington." },
  { name: "Northern Beaches", postcodes: "2084–2108", base: 90, perKm: 0, min: 600, free: 15, notes: "Manly to Palm Beach. Minimum session value applies." },
  { name: "Greater Sydney & Beyond", postcodes: "2100–2899", base: 180, perKm: 1, min: 900, free: 15, notes: "Blue Mountains, Central Coast, Southern Highlands — quoted individually." },
];

const LOCATION_SEED = [
  { name: "Bondi Beach", area: "Eastern Suburbs", styles: ["Couple", "Portrait", "Lifestyle", "Fashion"], fee: 40, min: 0, permit: "required", approved: 0, photo: 0, travel: "30 minutes from the CBD. Street parking on Curlewis Street, or arrive by train to Bondi Junction and a short bus.", requirements: "Waverley Council permits commercial photography on the sand and promenade; filming/photography permits must be requested at least 5 business days ahead.", description: "The obvious one, and still the best at first light — pale sand, cold Pacific light and the long curve of the promenade before the crowds arrive." },
  { name: "Mrs Macquarie's Chair", area: "Sydney Harbour", styles: ["Wedding", "Couple", "Portrait"], fee: 0, min: 0, permit: "required", approved: 0, photo: 4, travel: "Inside the Royal Botanic Garden, 15 minutes from the CBD. Paid parking at the Art Gallery Road car park.", requirements: "Royal Botanic Garden Sydney requires a permit for commercial photography and wedding parties; applications are assessed case by case.", description: "Harbour, bridge and opera house in one frame. Late afternoon light turns the sandstone gold." },
  { name: "Barangaroo Reserve", area: "Sydney Harbour", styles: ["Couple", "Fashion", "Architecture", "Lifestyle"], fee: 0, min: 0, permit: "approved", approved: 1, photo: 8, travel: "Walk from Wynyard station. Limited paid parking at Barangaroo.", requirements: "Permit approved for small editorial and portrait sessions (no crew, no tripods on the lawn). Bring the approval letter on the day.", description: "Sculpted headland, native planting and clean stone — modern Sydney at its most restrained." },
  { name: "Centennial Park", area: "Eastern Suburbs", styles: ["Family", "Couple", "Wedding", "Maternity"], fee: 0, min: 0, permit: "approved", approved: 1, photo: 12, travel: "15 minutes from the CBD. Parking on Grand Drive and Robertson Road gates.", requirements: "Centennial Parklands permit approved for portrait sessions; no confetti, no props on the grass, no blocking of paths.", description: "Fig trees, still water and long avenues — soft, green and endlessly forgiving in the middle of the day." },
  { name: "The Rocks", area: "Sydney Harbour", styles: ["Couple", "Street", "Fashion", "Wedding"], fee: 0, min: 0, permit: "required", approved: 0, photo: 16, travel: "Walking distance from Circular Quay. Weekend markets make early mornings essential.", requirements: "Place Management NSW requires a permit for commercial photography in the laneways and on the foreshore.", description: "Sandstone lanes and old brick — the history of the city as a backdrop." },
  { name: "Paddington Streets", area: "Eastern Suburbs", styles: ["Fashion", "Portrait", "Street", "Couple"], fee: 40, min: 0, permit: "not_required", approved: 1, photo: 20, travel: "10 minutes from the CBD. Best on weekday mornings; metered parking on Oxford Street.", requirements: "Public footpaths — no permit required. We keep clear of shopfronts and residents' doorways.", description: "Terraces, iron lace and quiet corners. A neighbourhood shoot with the feel of a European editorial." },
  { name: "Manly Beach", area: "Northern Beaches", styles: ["Couple", "Lifestyle", "Family", "Fashion"], fee: 90, min: 600, permit: "required", approved: 0, photo: 24, travel: "30 minutes by ferry from Circular Quay — the most pleasant commute in Sydney.", requirements: "Northern Beaches Council requires a permit for commercial photography on the beach and promenade.", description: "North-facing light all afternoon, pine trees and a genuinely relaxed crowd." },
  { name: "Palm Beach", area: "Northern Beaches", styles: ["Couple", "Wedding", "Fashion"], fee: 140, min: 750, permit: "unchecked", approved: 0, photo: 28, travel: "50 minutes north of the CBD. A full-day or sunset session is recommended to justify the drive.", requirements: "Permit requirements with Northern Beaches Council not yet confirmed for this location.", description: "The peninsula at the end of the line — lighthouse walks, turquoise water and nobody in a hurry." },
  { name: "Watsons Bay", area: "Eastern Suburbs", styles: ["Couple", "Wedding", "Portrait"], fee: 40, min: 0, permit: "unchecked", approved: 0, photo: 32, travel: "25 minutes from the CBD, or a ferry to Watsons Bay wharf.", requirements: "Council permit status to be confirmed before we shoot on the headland.", description: "Cliffs, harbour and the city in the distance. Wind is part of the picture." },
  { name: "Echo Point, Blue Mountains", area: "Greater Sydney", styles: ["Landscape", "Couple", "Travel"], fee: 180, min: 900, permit: "required", approved: 0, photo: 36, travel: "Two hours west of Sydney. Only offered with a full-day or bespoke booking.", requirements: "NSW National Parks requires a commercial photography licence for the Three Sisters lookout and walking tracks.", description: "Valley fog, eucalypt haze and the kind of scale that makes people quiet." },
];

function isoTomorrow(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoPast(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function splitSql(sql: string) {
  return sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function ensureSchema(database: D1Database, env: Bindings) {
  const chunks = splitSql(DDL);
  for (let i = 0; i < chunks.length; i += 20) {
    await database.batch(chunks.slice(i, i + 20).map((sql) => database.prepare(sql)));
  }

  await database.batch(splitSql(LOCATION_DDL).map((sql) => database.prepare(sql)));
  await database
    .prepare("UPDATE locations SET slug = 'mrs-macquaries-chair' WHERE slug = 'mrs-macquarie-s-chair'")
    .run();
  for (const statement of PACKAGE_COLUMNS) {
    try {
      await database.prepare(statement).run();
    } catch {
      // The column already exists.
    }
  }
  for (const statement of BOOKING_COLUMNS) {
    try {
      await database.prepare(statement).run();
    } catch {
      // The column already exists.
    }
  }

  // Package extras (pricing add-ons) — one-time defaults, only for rows that never had a value.
  const extrasSeeded = await database
    .prepare("SELECT value FROM settings WHERE key = 'package_extras_v1'")
    .first<{ value: string }>();
  if (!extrasSeeded) {
    await database
      .prepare(
        `UPDATE packages SET
           extra_photo_price = CASE WHEN extra_photo_price IS NULL OR extra_photo_price <= 0 THEN 45 ELSE extra_photo_price END,
           extra_hour_price = CASE WHEN extra_hour_price IS NULL OR extra_hour_price <= 0 THEN 150 ELSE extra_hour_price END,
           quote_only = CASE WHEN price = 0 THEN 1 ELSE 0 END
         WHERE 1`,
      )
      .run();
    await database
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('package_extras_v1', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  // Sydney location catalogue and travel rules — seeded once, independently of the demo content.
  const locationsSeeded = await database
    .prepare("SELECT value FROM settings WHERE key = 'locations_v1'")
    .first<{ value: string }>();
  if (!locationsSeeded) {
    const now = new Date().toISOString();
    const rows: { sql: string; params: unknown[] }[] = [];

    LOCATION_SEED.forEach((location, index) => {
      const images = [0, 1, 2].map((offset) => photo(PHOTOS[(location.photo + offset) % PHOTOS.length]));
      const slug =
        location.name
          .toLowerCase()
          .replace(/['’]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `location-${index}`;
      rows.push({
        sql: "INSERT OR IGNORE INTO locations (id, slug, name, area, description, styles, cover_image, images, maps_url, travel_info, requirements, permit_status, venue_approved, travel_fee, min_spend, available, suggested, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)",
        params: [
          newId("loc_"),
          slug,
          location.name,
          location.area,
          location.description,
          JSON.stringify(location.styles),
          images[0],
          JSON.stringify(images),
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.name} ${location.area} Sydney`)}`,
          location.travel,
          location.requirements,
          location.permit,
          location.approved,
          location.fee,
          location.min,
          index,
          now,
        ],
      });
    });

    SERVICE_AREA_SEED.forEach((area) => {
      rows.push({
        sql: "INSERT INTO service_areas (id, name, postcodes, base_fee, per_km, min_spend, free_within_km, notes, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
        params: [
          newId("sva_"),
          area.name,
          area.postcodes,
          area.base,
          area.perKm,
          area.min,
          area.free,
          area.notes,
        ],
      });
    });

    for (let i = 0; i < rows.length; i += 15) {
      await database.batch(
        rows.slice(i, i + 15).map((row) => database.prepare(row.sql).bind(...row.params)),
      );
    }

    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('locations_v1', ?)")
      .bind(now)
      .run();
    await database.prepare("UPDATE bookings SET base_amount = amount WHERE base_amount = 0").run();
    await database
      .prepare("UPDATE bookings SET location_status = 'approved' WHERE status IN ('approved','paid','completed')")
      .run();
  }

  // Design refresh — keep stored copy in step with the new brand line.
  const designV2 = await database
    .prepare("SELECT value FROM settings WHERE key = 'design_v2'")
    .first<{ value: string }>();
  if (!designV2) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      try {
        const current = JSON.parse(site.value) as Record<string, unknown>;
        const next = {
          ...current,
          tagline: "An art of remembering.",
          heroEyebrow: "Sydney · Australia · Worldwide",
        };
        await database
          .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
          .bind(JSON.stringify(next))
          .run();
      } catch {
        // Stored settings that cannot be parsed are left untouched.
      }
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('design_v2', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  // Imagery refresh — bring the flagship frames in line with the editorial palette.
  const imagery = await database
    .prepare("SELECT value FROM settings WHERE key = 'design_imagery_v1'")
    .first<{ value: string }>();
  if (!imagery) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      try {
        const current = JSON.parse(site.value) as Record<string, unknown>;
        const next = {
          ...current,
          heroImage:
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80",
          heroImage2:
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80",
          aboutImage:
            "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80",
        };
        await database
          .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
          .bind(JSON.stringify(next))
          .run();
      } catch {
        // Ignore stored settings that cannot be parsed.
      }
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('design_imagery_v1', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  // Founder scrub — clear invented demo identity, statistics and bank details from stored settings.
  const founderScrub = await database
    .prepare("SELECT value FROM settings WHERE key = 'founder_scrub_v1'")
    .first<{ value: string }>();
  if (!founderScrub) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      try {
        const current = JSON.parse(site.value) as Record<string, unknown>;
        const next = { ...current };
        const fabricatedBio =
          "Mara Adhiswara founded the studio in 2014 after a decade assisting in fashion and documentary photography.";
        if (typeof next.aboutBody === "string" && String(next.aboutBody).includes("fifteen years")) {
          // leave body; scrub only known fabricated fragments
        }
        if (typeof next.aboutBody === "string" && String(next.aboutBody).includes(fabricatedBio)) {
          next.aboutBody = "On-location photography in Sydney, NSW. Biography to be added by the owner.";
        }
        if (Array.isArray(next.aboutStats)) {
          const stats = next.aboutStats as { value?: string; label?: string }[];
          const fabricated =
            stats.length === 4 &&
            stats.some((s) => String(s.value) === "1,240") &&
            stats.some((s) => String(s.value) === "27");
          if (fabricated) next.aboutStats = [];
        }
        if (next.bankDetails && typeof next.bankDetails === "object") {
          const bd = next.bankDetails as Record<string, unknown>;
          if (String(bd.accountName ?? "").includes("Commonwealth")) {
            next.bankDetails = {
              accountName: "",
              bsb: "",
              accountNumber: "",
              payId: "",
              referenceNote: "Use your booking reference as the payment reference.",
            };
          }
        }
        // clear invented founder identity defaults if they match shipped placeholders' fabricated form
        if (next.founderName === "Mara Adhiswara") next.founderName = "";
        if (next.founderBio && String(next.founderBio).includes("founded the studio in 2014")) {
          next.founderBio = "";
        }
        await database
          .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
          .bind(JSON.stringify(next))
          .run();
      } catch {
        // Ignore.
      }
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('founder_scrub_v1', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  // Founder story — replace the shipped placeholder biography with the owner's real story, once.
  const founderStory = await database
    .prepare("SELECT value FROM settings WHERE key = 'founder_story_v1'")
    .first<{ value: string }>();
  if (!founderStory) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      try {
        const current = JSON.parse(site.value) as Record<string, unknown>;
        const next = { ...current };
        const bio = typeof next.founderBio === "string" ? next.founderBio : "";
        const bioIsPlaceholder =
          bio.trim() === "" ||
          bio.includes("Add your own biography in Admin") ||
          bio.includes("founded the studio in 2014");
        if (bioIsPlaceholder) next.founderBio = DEFAULT_SETTINGS.founderBio;
        const body = typeof next.aboutBody === "string" ? next.aboutBody : "";
        if (body.includes("This biography is a placeholder")) {
          next.aboutBody = DEFAULT_SETTINGS.aboutBody;
        }
        await database
          .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
          .bind(JSON.stringify(next))
          .run();
      } catch {
        // Ignore stored settings that cannot be parsed.
      }
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('founder_story_v1', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  // Imagery refresh — swap the original placeholder photographs for the current defaults, once.
  const imageryRefresh = await database
    .prepare("SELECT value FROM settings WHERE key = 'imagery_refresh_v1'")
    .first<{ value: string }>();
  if (!imageryRefresh) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      try {
        const current = JSON.parse(site.value) as Record<string, unknown>;
        const next = { ...current };
        const previous: Record<string, unknown> = {
          heroImage: photo("1519741497674-611481863552"),
          heroImage2: photo("1524504388940-b1c1722653e1"),
          heroImage3: photo("1516589178581-6cd7833ae3b2"),
          aboutImage: photo("1508214751196-bcfd4ca60f91"),
        };
        for (const [key, oldValue] of Object.entries(previous)) {
          if (!next[key] || next[key] === oldValue) {
            next[key] = (DEFAULT_SETTINGS as unknown as Record<string, unknown>)[key];
          }
        }
        const oldInstagram = [
          photo("1511818966892-d7d671e672a2"),
          photo("1483985988355-763728e1935b"),
          photo("1464349095431-e9a21285b5f3"),
          photo("1516589178581-6cd7833ae3b2"),
          photo("1499750310107-5fef28a66643"),
          photo("1511895426328-dc8714191300"),
        ];
        const currentInstagram = Array.isArray(next.instagramImages) ? next.instagramImages : [];
        if (
          currentInstagram.length === 0 ||
          JSON.stringify(currentInstagram) === JSON.stringify(oldInstagram)
        ) {
          next.instagramImages = DEFAULT_SETTINGS.instagramImages;
        }
        await database
          .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
          .bind(JSON.stringify(next))
          .run();
      } catch {
        // Ignore stored settings that cannot be parsed.
      }
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('imagery_refresh_v1', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  // Gallery refresh — replace the original demo portfolio photographs, once.
  // Only rows still holding a seed URL (no R2 storage key) are rewritten, so owner uploads survive.
  const galleryRefresh = await database
    .prepare("SELECT value FROM settings WHERE key = 'gallery_refresh_v2'")
    .first<{ value: string }>();
  if (!galleryRefresh) {
    for (const [oldId, newId] of Object.entries(GALLERY_REMAP)) {
      await database
        .prepare("UPDATE images SET url = ? WHERE url = ? AND storage_key IS NULL")
        .bind(photo(newId), photo(oldId))
        .run();
      await database
        .prepare("UPDATE categories SET cover_image = ? WHERE cover_image = ?")
        .bind(photo(newId), photo(oldId))
        .run();
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('gallery_refresh_v2', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  // About copy — replace the older fabricated biography still held by earlier databases, once.
  const aboutBodyRefresh = await database
    .prepare("SELECT value FROM settings WHERE key = 'about_body_v3'")
    .first<{ value: string }>();
  if (!aboutBodyRefresh) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      try {
        const current = JSON.parse(site.value) as Record<string, unknown>;
        const next = { ...current };
        const body = typeof next.aboutBody === "string" ? next.aboutBody : "";
        if (
          body.includes("small Sydney apartment") ||
          body.includes("Fifteen years on") ||
          body.includes("small team of photographers") ||
          body.includes("This biography is a placeholder")
        ) {
          next.aboutBody = DEFAULT_SETTINGS.aboutBody;
          next.aboutStats = [];
        }
        await database
          .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
          .bind(JSON.stringify(next))
          .run();
      } catch {
        // Ignore stored settings that cannot be parsed.
      }
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('about_body_v3', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  const whatsappNumberUpdated = await database
    .prepare("SELECT value FROM settings WHERE key = 'whatsapp_number_v1'")
    .first<{ value: string }>();
  if (!whatsappNumberUpdated) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      const current: unknown = JSON.parse(site.value);
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        throw new Error("Stored site settings must be a JSON object.");
      }
      const next = {
        ...(current as Record<string, unknown>),
        whatsapp: DEFAULT_SETTINGS.whatsapp,
      };
      await database
        .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
        .bind(JSON.stringify(next))
        .run();
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('whatsapp_number_v1', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  const ownerContactUpdated = await database
    .prepare("SELECT value FROM settings WHERE key = 'owner_contact_v1'")
    .first<{ value: string }>();
  if (!ownerContactUpdated) {
    const site = await database
      .prepare("SELECT value FROM settings WHERE key = 'site'")
      .first<{ value: string }>();
    if (site?.value) {
      const current: unknown = JSON.parse(site.value);
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        throw new Error("Stored site settings must be a JSON object.");
      }
      const next = {
        ...(current as Record<string, unknown>),
        founderName: DEFAULT_SETTINGS.founderName,
        email: DEFAULT_SETTINGS.email,
      };
      await database
        .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
        .bind(JSON.stringify(next))
        .run();
    }
    await database
      .prepare("INSERT INTO settings (key, value) VALUES ('owner_contact_v1', ?)")
      .bind(new Date().toISOString())
      .run();
  }

  const seeded = await database
    .prepare("SELECT value FROM settings WHERE key = 'seeded_aud_v1'")
    .first<{ value: string }>();
  if (seeded) {
    const adminSetupComplete = await database
      .prepare("SELECT value FROM settings WHERE key = ?")
      .bind(ADMIN_SETUP_COMPLETE_KEY)
      .first<{ value: string }>();
    const bootstrapAdminSeeded = await database
      .prepare("SELECT value FROM settings WHERE key = 'bootstrap_admin_v1'")
      .first<{ value: string }>();
    const bootstrapEmail = (env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
    if (
      !adminSetupComplete &&
      !bootstrapAdminSeeded &&
      bootstrapEmail &&
      env.SEED_ADMIN_PASSWORD
    ) {
      if (env.SEED_ADMIN_PASSWORD.length < 12) {
        throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters.");
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(bootstrapEmail)) {
        throw new Error("SEED_ADMIN_EMAIL must be a valid email address.");
      }
      await database
        .prepare(
          `INSERT INTO users (id, email, password_hash, name, phone, role, created_at)
           VALUES (?, ?, ?, 'Initial administrator', NULL, 'admin', ?)
           ON CONFLICT(email) DO UPDATE SET
             password_hash = excluded.password_hash,
             name = excluded.name,
             role = 'admin'`,
        )
        .bind(
          newId("u_"),
          bootstrapEmail,
          await hashPassword(env.SEED_ADMIN_PASSWORD),
          new Date().toISOString(),
        )
        .run();
      await database
        .prepare("INSERT INTO settings (key, value) VALUES ('bootstrap_admin_v1', ?)")
        .bind(new Date().toISOString())
        .run();
    }
    return;
  }

  // One-time content migration: the first seed was priced in rupiah and based in Jakarta.
  // When an older seed is present, clear the demo content so it is rebuilt in AUD / Sydney.
  const legacySeed = await database
    .prepare("SELECT value FROM settings WHERE key = 'seeded_v1'")
    .first<{ value: string }>();
  if (legacySeed) {
    const tables = [
      "payments",
      "bookings",
      "images",
      "categories",
      "packages",
      "testimonials",
      "inquiries",
      "notifications",
      "availability",
      "blocked_dates",
      "users",
      "settings",
    ];
    await database.batch(tables.map((table) => database.prepare(`DELETE FROM ${table}`)));
  }

  const now = new Date().toISOString();
  const stmts: { sql: string; params: unknown[] }[] = [];

  // Demo customer
  const customerId = newId("u_");
  const bootstrapEmail = (env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  if (env.SEED_ADMIN_PASSWORD) {
    if (env.SEED_ADMIN_PASSWORD.length < 12) {
      throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters.");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(bootstrapEmail)) {
      throw new Error("SEED_ADMIN_EMAIL must be a valid email address.");
    }
    stmts.push({
      sql: `INSERT INTO users (id, email, password_hash, name, phone, role, created_at)
            VALUES (?, ?, ?, 'Initial administrator', NULL, 'admin', ?)
            ON CONFLICT(email) DO UPDATE SET
              password_hash = excluded.password_hash,
              name = excluded.name,
              role = 'admin'`,
      params: [newId("u_"), bootstrapEmail, await hashPassword(env.SEED_ADMIN_PASSWORD), now],
    });
    stmts.push({
      sql: `INSERT INTO settings (key, value) VALUES ('bootstrap_admin_v1', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      params: [now],
    });
  }
  // Demo customer account — opt-in only, never seeded as a real client.
  if (env.SEED_DEMO_CONTENT === "true") {
    stmts.push({
      sql: "INSERT INTO users (id, email, password_hash, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, 'customer', ?)",
      params: [
        customerId,
        "demo@maras.studio",
        await hashPassword("DemoCustomer2026!"),
        "Alya Putri",
        "+61 412 233 445",
        now,
      ],
    });
  }


  // Categories + images
  CATEGORY_SEED.forEach((cat, index) => {
    const slug =
      cat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `series-${index}`;
    const categoryId = `cat_${slug}`;
    const cover = photo(PHOTOS[cat.photos[0]]);
    stmts.push({
      sql: "INSERT INTO categories (id, slug, name, description, cover_image, sort_order, published, watermark, downloads, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1, ?)",
      params: [categoryId, slug, cat.name, cat.blurb, cover, index, index % 4 === 0 ? 1 : 0, now],
    });
    cat.photos.forEach((photoIndex, imageIndex) => {
      const id = PHOTOS[photoIndex];
      if (!id) return;
      stmts.push({
        sql: "INSERT INTO images (id, category_id, url, storage_key, title, description, sort_order, is_cover, downloadable, created_at) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, NULL, ?)",
        params: [
          newId("img_"),
          categoryId,
          photo(id),
          `${cat.name.replace(" Photography", "")} · Frame ${String(imageIndex + 1).padStart(2, "0")}`,
          "",
          imageIndex,
          imageIndex === 0 ? 1 : 0,
          now,
        ],
      });
    });
  });

  PACKAGE_SEED.forEach((pkg, index) => {
    stmts.push({
      sql: "INSERT INTO packages (id, name, slug, tagline, price, deposit_percent, description, features, duration_hours, edited_photos, discount_percent, badge, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)",
      params: [
        `pkg_${pkg.slug}`,
        pkg.name,
        pkg.slug,
        pkg.tagline,
        pkg.price,
        pkg.deposit,
        pkg.features[0] ?? "",
        JSON.stringify(pkg.features),
        pkg.duration,
        pkg.photos,
        pkg.discount,
        pkg.badge,
        index,
      ],
    });
  });

  // Working week: Tuesday – Sunday, two-hour slots
  for (let weekday = 0; weekday < 7; weekday += 1) {
    stmts.push({
      sql: "INSERT INTO availability (weekday, is_working, start_time, end_time, slot_minutes, capacity) VALUES (?, ?, '09:00', '18:00', 120, 1)",
      params: [weekday, weekday === 1 ? 0 : 1],
    });
  }
  stmts.push({
    sql: "INSERT INTO blocked_dates (date, reason) VALUES (?, ?)",
    params: [isoTomorrow(24), "Studio closed — team offsite"],
  });

  // Settings
  stmts.push({
    sql: "INSERT INTO settings (key, value) VALUES ('site', ?)",
    params: [JSON.stringify(DEFAULT_SETTINGS)],
  });
  stmts.push({
    sql: "INSERT INTO settings (key, value) VALUES ('seeded_aud_v1', ?)",
    params: [now],
  });

  // Demo testimonials, enquiries and bookings — opt-in only; never published as real content.
  if (env.SEED_DEMO_CONTENT === "true") {
    // Testimonials
    const testimonials = [
      {
        name: "Alya & Reza",
        role: "Wedding, Southern Highlands",
        quote:
          "Mara disappeared into the day and came back with our whole family in her camera. We cried at the first preview — nothing felt staged.",
        rating: 5,
        image: photo(PHOTOS[4]),
      },
      {
        name: "Sinta Maharani",
        role: "Portrait session",
        quote:
          "I have hated every photo of myself for a decade. These are the first ones I have printed and hung in my own home.",
        rating: 5,
        image: photo(PHOTOS[32]),
      },
      {
        name: "Nadia Kusuma",
        role: "Brand campaign, Byron Bay",
        quote:
          "Three days, twelve looks, one small crew and zero drama. The campaign images are still running a year later.",
        rating: 5,
        image: photo(PHOTOS[50]),
      },
      {
        name: "Rangga Pratama",
        role: "Football club, A-League",
        quote:
          "She understands the game. She predicted the celebration before it happened and caught the only frame that mattered.",
        rating: 5,
        image: photo(PHOTOS[78]),
      },
      {
        name: "The Wijaya Family",
        role: "Family session",
        quote:
          "Two toddlers, one very patient photographer. Somehow every single image looks effortless and warm.",
        rating: 5,
        image: photo(PHOTOS[82]),
      },
      {
        name: "Clara Wijaya",
        role: "50th birthday",
        quote:
          "The photographs are the only thing from that night that still feels like the night itself. Worth every dollar.",
        rating: 5,
        image: photo(PHOTOS[61]),
      },
    ];
    testimonials.forEach((t, index) => {
      stmts.push({
        sql: "INSERT INTO testimonials (id, name, role, quote, image, rating, published, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
        params: [newId("tst_"), t.name, t.role, t.quote, t.image, t.rating, index],
      });
    });

    // Inquiries
    const inquiries = [
      {
        name: "Dimas Prakoso",
        email: "dimas.prakoso@example.com",
        phone: "+61 435 566 778",
        subject: "Wedding coverage in the Hunter Valley",
        message:
          "We are planning a 120-guest wedding in Bowral next autumn and would love full-day coverage with a second shooter. Could you share availability and your destination fee?",
        status: "new",
      },
      {
        name: "Hotel Amara",
        email: "marketing@amarahotel.example",
        phone: "+61 2 9000 5511",
        subject: "Commercial photography retainer",
        message:
          "We are refreshing our F&B and suite imagery for a rebrand across OTA channels. Looking for a monthly retainer with 40 deliverables.",
        status: "read",
      },
      {
        name: "Kevin Santoso",
        email: "kevin.s@example.com",
        phone: "",
        subject: "Bespoke commission question",
        message:
          "Do you travel outside New South Wales for engagement sessions? We would like something at Lord Howe Island at golden hour.",
        status: "new",
      },
    ];
    inquiries.forEach((inquiry, index) => {
      stmts.push({
        sql: "INSERT INTO inquiries (id, name, email, phone, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          newId("inq_"),
          inquiry.name,
          inquiry.email,
          inquiry.phone,
          inquiry.subject,
          inquiry.message,
          inquiry.status,
          isoPast(1 + index * 3),
        ],
      });
      stmts.push({
        sql: "INSERT INTO notifications (id, type, title, body, link, read, created_at) VALUES (?, 'inquiry', ?, ?, ?, ?, ?)",
        params: [
          newId("ntf_"),
          `New enquiry — ${inquiry.name}`,
          `${inquiry.subject} · ${inquiry.email}`,
          "/admin/inquiries",
          index === 0 ? 0 : 1,
          isoPast(1 + index * 3),
        ],
      });
    });

    // Packages referenced by demo bookings
    const pkgBySlug = (slug: string) => PACKAGE_SEED.find((p) => p.slug === slug)!;
    const slugOf = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const pkgId = (slug: string) => `pkg_${slug}`;
    const pkgPrice = (slug: string) => {
      const p = pkgBySlug(slug);
      return Math.round(p.price * (1 - p.discount / 100));
    };
    const catId = (name: string) => `cat_${slugOf(name)}`;

    const bookings = [
      {
        code: "MR-8KX42A",
        name: "Alya Putri",
        email: "demo@maras.studio",
        phone: "+61 412 233 445",
        category: "Wedding Photography",
        pkg: "signature",
        date: isoTomorrow(9),
        slot: "10:00",
        people: 2,
        location: "Centennial Homestead, Centennial Park",
        status: "pending",
        payment: "unpaid",
        daysAgo: 0,
        notes: "Ceremony at 11:00, portraits in the garden afterwards. Please keep coverage discreet.",
        userId: customerId,
      },
      {
        code: "MR-3QW91D",
        name: "Bima & Nadia",
        email: "nadia.kusuma@example.com",
        phone: "+61 498 877 266",
        category: "Couple Photography",
        pkg: "atelier",
        date: isoTomorrow(19),
        slot: "14:00",
        people: 2,
        location: "Bondi, Sydney",
        status: "awaiting_payment",
        payment: "unpaid",
        daysAgo: 2,
        notes: "Sunset engagement session — two looks, one outfit change in the car.",
        userId: null,
      },
      {
        code: "MR-7TB25F",
        name: "Sinta Maharani",
        email: "sinta.m@example.com",
        phone: "+61 434 552 211",
        category: "Portrait Photography",
        pkg: "essential",
        date: isoTomorrow(3),
        slot: "09:00",
        people: 1,
        location: "Mara Studio, Paddington",
        status: "paid",
        payment: "paid",
        daysAgo: 6,
        notes: "Headshots for a book jacket. Prefers muted colours.",
        userId: null,
      },
      {
        code: "MR-5NP80C",
        name: "Putri Anggraini",
        email: "putri.anggraini@example.com",
        phone: "+61 417 766 544",
        category: "Fashion Photography",
        pkg: "signature",
        date: isoTomorrow(26),
        slot: "13:00",
        people: 4,
        location: "Surry Hills, Sydney",
        status: "approved",
        payment: "unpaid",
        daysAgo: 3,
        notes: "Lookbook for a resort-wear label, 8 looks, one assistant coming.",
        userId: null,
      },
      {
        code: "MR-2HD67J",
        name: "Rangga Pratama",
        email: "rangga.p@example.com",
        phone: "+61 423 110 099",
        category: "Football & Sports Photography",
        pkg: "signature",
        date: isoTomorrow(-35),
        slot: "16:00",
        people: 22,
        location: "Allianz Stadium, Moore Park",
        status: "completed",
        payment: "paid",
        daysAgo: 48,
        notes: "Match day coverage plus tunnel and warm-up frames.",
        userId: null,
      },
      {
        code: "MR-9LC31B",
        name: "Clara Wijaya",
        email: "clara.w@example.com",
        phone: "+61 452 338 899",
        category: "Birthday Photography",
        pkg: "essential",
        date: isoTomorrow(-70),
        slot: "18:00",
        people: 40,
        location: "The Langham, Millers Point",
        status: "completed",
        payment: "paid",
        daysAgo: 88,
        notes: "50th birthday dinner, candid coverage only.",
        userId: null,
      },
      {
        code: "MR-4VZ16M",
        name: "Dimas & Tara",
        email: "tara.dimas@example.com",
        phone: "+61 410 022 334",
        category: "Wedding Photography",
        pkg: "atelier",
        date: isoTomorrow(-110),
        slot: "08:00",
        people: 2,
        location: "Bunker Bay, Margaret River",
        status: "completed",
        payment: "paid",
        daysAgo: 132,
        notes: "Full-day destination wedding with second shooter.",
        userId: null,
      },
      {
        code: "MR-6RG48N",
        name: "Nathan Lee",
        email: "nathan.lee@example.com",
        phone: "+61 426 677 123",
        category: "Graduation Photography",
        pkg: "essential",
        date: isoTomorrow(-150),
        slot: "10:00",
        people: 5,
        location: "University of Sydney, Camperdown",
        status: "completed",
        payment: "paid",
        daysAgo: 168,
        notes: "Family joined for the last 20 minutes.",
        userId: null,
      },
      {
        code: "MR-1PL93K",
        name: "Maya Kusuma",
        email: "maya.k@example.com",
        phone: "+61 431 122 909",
        category: "Maternity Photography",
        pkg: "essential",
        date: isoTomorrow(14),
        slot: "11:00",
        people: 3,
        location: "Home session, Balmain",
        status: "rejected",
        payment: "unpaid",
        daysAgo: 9,
        notes: "Requested date falls on a blocked studio day.",
        userId: null,
      },
    ];

    bookings.forEach((b) => {
      const id = newId("bkg_");
      const amount = pkgPrice(b.pkg);
      const deposit = Math.round((amount * pkgBySlug(b.pkg).deposit) / 100);
      stmts.push({
        sql: "INSERT INTO bookings (id, code, user_id, category_id, package_id, customer_name, email, phone, location, people, date, time_slot, notes, reference_images, admin_notes, amount, deposit_amount, status, payment_status, payment_method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '', ?, ?, ?, ?, ?, ?, ?)",
        params: [
          id,
          b.code,
          b.userId,
          catId(b.category),
          pkgId(b.pkg),
          b.name,
          b.email,
          b.phone,
          b.location,
          b.people,
          b.date,
          b.slot,
          b.notes,
          amount,
          deposit,
          b.status,
          b.payment,
          b.payment === "unpaid" ? null : "card",
          isoPast(b.daysAgo),
          isoPast(b.daysAgo),
        ],
      });
      if (b.payment === "paid") {
        stmts.push({
          sql: "INSERT INTO payments (id, booking_id, order_id, provider, method, kind, gross_amount, status, raw, created_at, updated_at) VALUES (?, ?, ?, 'stripe', 'card', 'full', ?, 'checkout.session.completed', ?, ?, ?)",
          params: [
            newId("pay_"),
            id,
            `${b.code}-FULL`,
            amount,
            JSON.stringify({ simulated: true, status_code: "200", transaction_status: "settlement" }),
            isoPast(b.daysAgo),
            isoPast(b.daysAgo),
          ],
        });
      }
      stmts.push({
        sql: "INSERT INTO notifications (id, type, title, body, link, read, created_at) VALUES (?, 'booking', ?, ?, ?, ?, ?)",
        params: [
          newId("ntf_"),
          `New booking ${b.code} — ${b.name}`,
          `${b.category} · ${b.date} at ${b.slot}`,
          `/admin/bookings/${id}`,
          b.daysAgo > 5 ? 1 : 0,
          isoPast(b.daysAgo),
        ],
      });
    });
  }


  for (let i = 0; i < stmts.length; i += 15) {
    await database.batch(
      stmts.slice(i, i + 15).map((s) => database.prepare(s.sql).bind(...s.params)),
    );
  }

}
