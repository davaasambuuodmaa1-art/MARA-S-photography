import { all, first, run } from "./db";
import { mergeSettings } from "./settings";
import { formatAUD } from "./utils";
import type {
  Availability,
  Booking,
  BlockedDate,
  Category,
  GalleryImage,
  Inquiry,
  Location,
  RescheduleRequest,
  ServiceArea,
  Notification,
  Package,
  PackageAddon,
  Payment,
  PrivateGallery,
  Promotion,
  SiteSettings,
  Testimonial,
  User,
} from "./types";
import { buildSlots, todayISO, weekdayOf } from "./utils";

export async function getLocations(): Promise<Location[]> {
  return all<Location>(
    "SELECT * FROM locations WHERE available = 1 ORDER BY sort_order ASC, name ASC",
  );
}

export async function getAllLocations(): Promise<Location[]> {
  return all<Location>("SELECT * FROM locations ORDER BY sort_order ASC, name ASC");
}

export async function getSuggestedLocations(): Promise<Location[]> {
  return all<Location>(
    "SELECT * FROM locations WHERE available = 1 AND suggested = 1 ORDER BY sort_order ASC, name ASC",
  );
}

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  return first<Location>("SELECT * FROM locations WHERE slug = ?", [slug]);
}

export async function getLocationById(id: string): Promise<Location | null> {
  return first<Location>("SELECT * FROM locations WHERE id = ?", [id]);
}

export async function getServiceAreas(): Promise<ServiceArea[]> {
  return all<ServiceArea>("SELECT * FROM service_areas WHERE active = 1 ORDER BY base_fee ASC");
}

export function locationStyles(location: Pick<Location, "styles">): string[] {
  try {
    const parsed = JSON.parse(location.styles);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function locationImages(location: Pick<Location, "images" | "cover_image">): string[] {
  try {
    const parsed = JSON.parse(location.images);
    if (Array.isArray(parsed) && parsed.length) return parsed.map(String);
  } catch {
    // Fall through to the cover image.
  }
  return location.cover_image ? [location.cover_image] : [];
}

export async function getRescheduleRequests(bookingId: string): Promise<RescheduleRequest[]> {
  return all<RescheduleRequest>(
    "SELECT * FROM reschedule_requests WHERE booking_id = ? ORDER BY created_at DESC",
    [bookingId],
  );
}

export async function getPendingReschedules(): Promise<RescheduleRequest[]> {
  return all<RescheduleRequest>(
    "SELECT * FROM reschedule_requests WHERE status = 'pending' ORDER BY created_at ASC",
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await first<{ value: string }>("SELECT value FROM settings WHERE key = 'site'");
  return mergeSettings(row?.value ?? null);
}

export async function saveSiteSettings(patch: Partial<SiteSettings>) {
  const current = await getSiteSettings();
  const next = { ...current, ...patch };
  await run(
    "INSERT INTO settings (key, value) VALUES ('site', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [JSON.stringify(next)],
  );
  return next;
}

export type CategoryWithCount = Category & { image_count: number };

export async function getCategories(publishedOnly = true): Promise<CategoryWithCount[]> {
  return all<CategoryWithCount>(
    `SELECT c.*, (SELECT COUNT(*) FROM images i WHERE i.category_id = c.id) AS image_count
     FROM categories c
     ${publishedOnly ? "WHERE c.published = 1" : ""}
     ORDER BY c.sort_order ASC, c.name ASC`,
  );
}

export async function getCategoryBySlug(slug: string) {
  return first<CategoryWithCount>(
    `SELECT c.*, (SELECT COUNT(*) FROM images i WHERE i.category_id = c.id) AS image_count
     FROM categories c WHERE c.slug = ?`,
    [slug],
  );
}

export async function getCategoryById(id: string) {
  return first<Category>("SELECT * FROM categories WHERE id = ?", [id]);
}

export async function getImages(categoryId: string): Promise<GalleryImage[]> {
  return all<GalleryImage>(
    "SELECT * FROM images WHERE category_id = ? ORDER BY is_cover DESC, sort_order ASC, created_at ASC",
    [categoryId],
  );
}

export async function getAllImages(): Promise<(GalleryImage & { category_name: string; category_slug: string })[]> {
  return all(
    `SELECT i.*, c.name AS category_name, c.slug AS category_slug
     FROM images i JOIN categories c ON c.id = i.category_id
     ORDER BY i.created_at DESC`,
  );
}

export async function getPackages(activeOnly = true): Promise<Package[]> {
  return all<Package>(
    `SELECT * FROM packages ${activeOnly ? "WHERE active = 1" : ""} ORDER BY sort_order ASC, price ASC`,
  );
}

export async function getPackageById(id: string) {
  return first<Package>("SELECT * FROM packages WHERE id = ?", [id]);
}

export function packageFeatures(pkg: Pick<Package, "features">): string[] {
  try {
    const parsed = JSON.parse(pkg.features);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function finalPrice(pkg: Pick<Package, "price" | "discount_percent">) {
  const discount = Math.max(0, Math.min(90, pkg.discount_percent || 0));
  return Math.round(pkg.price * (1 - discount / 100));
}

export function packageAddons(pkg: Pick<Package, "addons">): PackageAddon[] {
  try {
    const parsed = JSON.parse(pkg.addons || "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter((raw) => raw && typeof raw === "object")
          .map((raw, index) => ({
            id: String(raw.id ?? `addon-${index}`),
            name: String(raw.name ?? "Extra"),
            price: Math.max(0, Math.round(Number(raw.price) || 0)),
            note: raw.note ? String(raw.note) : undefined,
          }))
      : [];
  } catch {
    return [];
  }
}

/** Server-side pricing for add-ons: package + extra photos/hours + selected add-ons. */
export function priceExtras(
  pkg: Pick<Package, "extra_photo_price" | "extra_hour_price" | "addons">,
  extras: { photos?: number; hours?: number; addonIds?: string[] },
) {
  const photos = Math.max(0, Math.min(200, Math.round(Number(extras.photos) || 0)));
  const hours = Math.max(0, Math.min(12, Number(extras.hours) || 0));
  const catalogue = packageAddons(pkg);
  const selected = catalogue.filter((addon) => (extras.addonIds ?? []).includes(addon.id));
  const photoTotal = photos * Math.max(0, pkg.extra_photo_price || 0);
  const hourTotal = Math.round(hours * Math.max(0, pkg.extra_hour_price || 0));
  const addonTotal = selected.reduce((sum, addon) => sum + addon.price, 0);
  return {
    photos,
    hours,
    addonIds: selected.map((addon) => addon.id),
    photoTotal,
    hourTotal,
    addonTotal,
    total: photoTotal + hourTotal + addonTotal,
    lines: [
      ...(photos > 0
        ? [{ label: `${photos} extra edited photo${photos === 1 ? "" : "s"}`, amount: photoTotal }]
        : []),
      ...(hours > 0
        ? [{ label: `${hours} additional hour${hours === 1 ? "" : "s"}`, amount: hourTotal }]
        : []),
      ...selected.map((addon) => ({ label: addon.name, amount: addon.price })),
    ],
  };
}

export async function getPromotions() {
  return all<Promotion>("SELECT * FROM promotions ORDER BY created_at DESC");
}

export function promotionState(promo: Promotion) {
  const today = new Date().toISOString().slice(0, 10);
  if (!promo.active) return "inactive" as const;
  if (promo.starts_at && promo.starts_at > today) return "scheduled" as const;
  if (promo.ends_at && promo.ends_at < today) return "expired" as const;
  if (promo.usage_limit > 0 && promo.used_count >= promo.usage_limit) return "exhausted" as const;
  return "live" as const;
}

/** Validate a code against a subtotal. Returns the discount in AUD. */
export async function quotePromotion(code: string, subtotal: number) {
  const cleaned = code.trim().toUpperCase();
  if (!cleaned) return { ok: false as const, error: "Enter a code." };
  const promo = await first<Promotion>("SELECT * FROM promotions WHERE UPPER(code) = ?", [cleaned]);
  if (!promo) return { ok: false as const, error: "That code is not recognised." };
  const state = promotionState(promo);
  if (state !== "live") {
    return {
      ok: false as const,
      error:
        state === "expired"
          ? "That code has expired."
          : state === "scheduled"
            ? "That code is not active yet."
            : "That code is no longer available.",
    };
  }
  if (promo.min_spend > 0 && subtotal < promo.min_spend) {
    return { ok: false as const, error: `That code applies to bookings from ${formatAUD(promo.min_spend)}.` };
  }
  const raw = promo.kind === "percent" ? Math.round((subtotal * promo.value) / 100) : promo.value;
  const discount = Math.max(0, Math.min(subtotal, raw));
  return {
    ok: true as const,
    promo,
    discount,
    label: promo.label || (promo.kind === "percent" ? `${promo.value}% off` : `${formatAUD(promo.value)} off`),
  };
}

export async function getPrivateGalleries() {
  return all<PrivateGallery>("SELECT * FROM private_galleries ORDER BY created_at DESC");
}

export async function getPrivateGalleryById(id: string) {
  return first<PrivateGallery>("SELECT * FROM private_galleries WHERE id = ?", [id]);
}

export async function getPrivateGalleryByToken(token: string) {
  return first<PrivateGallery>("SELECT * FROM private_galleries WHERE token = ?", [token]);
}

export async function getPrivateGalleriesForEmail(email: string) {
  return all<PrivateGallery>(
    "SELECT * FROM private_galleries WHERE lower(customer_email) = ? ORDER BY created_at DESC",
    [email.trim().toLowerCase()],
  );
}

export async function getTestimonials(publishedOnly = true) {
  return all<Testimonial>(
    `SELECT * FROM testimonials ${publishedOnly ? "WHERE published = 1" : ""} ORDER BY sort_order ASC`,
  );
}

export async function getAvailability(): Promise<Availability[]> {
  return all<Availability>("SELECT * FROM availability ORDER BY weekday ASC");
}

export async function getBlockedDates(): Promise<BlockedDate[]> {
  return all<BlockedDate>("SELECT * FROM blocked_dates WHERE date >= ? ORDER BY date ASC", [
    todayISO(),
  ]);
}

export interface SlotInfo {
  time: string;
  label: string;
  available: boolean;
  booked: number;
  capacity: number;
}

export async function getSlotsForDate(date: string): Promise<{
  slots: SlotInfo[];
  reason?: string;
  working: boolean;
}> {
  const availability = await first<Availability>("SELECT * FROM availability WHERE weekday = ?", [
    weekdayOf(date),
  ]);
  if (!availability || !availability.is_working) {
    return { slots: [], working: false, reason: "The studio is closed on this day." };
  }
  const blocked = await first<BlockedDate>("SELECT * FROM blocked_dates WHERE date = ?", [date]);
  if (blocked) {
    return { slots: [], working: false, reason: blocked.reason || "This date is unavailable." };
  }

  const times = buildSlots(availability.start_time, availability.end_time, availability.slot_minutes);
  const booked = await all<{ time_slot: string; count: number }>(
    `SELECT time_slot, COUNT(*) AS count FROM bookings
     WHERE date = ? AND status NOT IN ('cancelled', 'rejected')
     GROUP BY time_slot`,
    [date],
  );
  const counts = new Map(booked.map((b) => [b.time_slot, Number(b.count)]));
  const isToday = date === todayISO();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const slots = times.map((time) => {
    const [h, m] = time.split(":").map(Number);
    const used = counts.get(time) ?? 0;
    const past = isToday && h * 60 + m <= nowMinutes;
    return {
      time,
      label: `${time} — ${String(Number(time.split(":")[0]) + 2).padStart(2, "0")}:${time.split(":")[1]}`,
      available: used < availability.capacity && !past,
      booked: used,
      capacity: availability.capacity,
    };
  });
  return { slots, working: true };
}

export async function getBookingByCode(code: string) {
  return first<Booking>(
    `SELECT b.*, c.name AS category_name, p.name AS package_name
     FROM bookings b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN packages p ON p.id = b.package_id
     WHERE b.code = ?`,
    [code.toUpperCase()],
  );
}

export async function getBookingById(id: string) {
  return first<Booking>(
    `SELECT b.*, c.name AS category_name, p.name AS package_name
     FROM bookings b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN packages p ON p.id = b.package_id
     WHERE b.id = ?`,
    [id],
  );
}

export async function getPaymentsForBooking(bookingId: string) {
  return all<Payment>("SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC", [
    bookingId,
  ]);
}

export async function getPaymentByOrder(orderId: string) {
  return first<Payment & { booking_code: string; customer_name: string; category_name: string | null }>(
    `SELECT p.*, b.code AS booking_code, b.customer_name, c.name AS category_name
     FROM payments p JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE p.order_id = ?`,
    [orderId],
  );
}

export async function getUserPayments(userId: string) {
  return all<Payment & { code: string; category_name: string }>(
    `SELECT p.*, b.code, c.name AS category_name FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.user_id = ? ORDER BY p.created_at DESC`,
    [userId],
  );
}

export async function getUserBookings(userId: string) {
  return all<Booking>(
    `SELECT b.*, c.name AS category_name, p.name AS package_name
     FROM bookings b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN packages p ON p.id = b.package_id
     WHERE b.user_id = ? ORDER BY b.date DESC`,
    [userId],
  );
}

export interface BookingFilter {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
}

export async function listBookings(filter: BookingFilter = {}) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filter.status && filter.status !== "all") {
    clauses.push("b.status = ?");
    params.push(filter.status);
  }
  if (filter.q) {
    clauses.push("(b.code LIKE ? OR b.customer_name LIKE ? OR b.email LIKE ? OR b.phone LIKE ?)");
    const term = `%${filter.q}%`;
    params.push(term, term, term, term);
  }
  if (filter.from) {
    clauses.push("b.date >= ?");
    params.push(filter.from);
  }
  if (filter.to) {
    clauses.push("b.date <= ?");
    params.push(filter.to);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return all<Booking>(
    `SELECT b.*, c.name AS category_name, p.name AS package_name
     FROM bookings b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN packages p ON p.id = b.package_id
     ${where}
     ORDER BY b.created_at DESC LIMIT 300`,
    params,
  );
}

export async function bookingStats() {
  const counts = await all<{ status: string; count: number }>(
    "SELECT status, COUNT(*) AS count FROM bookings GROUP BY status",
  );
  const countMap = new Map(counts.map((c) => [c.status, Number(c.count)]));
  const total = counts.reduce((sum, c) => sum + Number(c.count), 0);
  const revenueRow = await first<{ total: number }>(
    "SELECT COALESCE(SUM(gross_amount), 0) AS total FROM payments WHERE status IN ('settlement', 'capture')",
  );
  const outstanding = await first<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM bookings WHERE payment_status = 'unpaid' AND status IN ('pending', 'approved', 'awaiting_payment', 'paid')",
  );
  const upcoming = await all<Booking>(
    `SELECT b.*, c.name AS category_name FROM bookings b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.date >= ? AND b.status IN ('approved', 'awaiting_payment', 'paid')
     ORDER BY b.date ASC LIMIT 6`,
    [todayISO()],
  );
  const recentCustomers = await all<{ customer_name: string; email: string; created_at: string; total: number }>(
    `SELECT customer_name, email, MAX(created_at) AS created_at, COUNT(*) AS total
     FROM bookings GROUP BY email ORDER BY created_at DESC LIMIT 6`,
  );
  const monthly = await all<{ month: string; total: number }>(
    `SELECT substr(created_at, 1, 7) AS month, COALESCE(SUM(gross_amount), 0) AS total
     FROM payments WHERE status IN ('settlement', 'capture')
     GROUP BY month ORDER BY month DESC LIMIT 6`,
  );
  const newInquiries = await first<{ count: number }>(
    "SELECT COUNT(*) AS count FROM inquiries WHERE status = 'new'",
  );
  const totalCustomers = await first<{ count: number }>(
    "SELECT COUNT(DISTINCT email) AS count FROM bookings",
  );
  const pendingPayments = await first<{ count: number }>(
    "SELECT COUNT(*) AS count FROM bookings WHERE payment_status = 'unpaid' AND status IN ('approved','awaiting_payment','paid')",
  );

  return {
    total,
    pending: countMap.get("pending") ?? 0,
    approved: (countMap.get("approved") ?? 0) + (countMap.get("awaiting_payment") ?? 0),
    completed: countMap.get("completed") ?? 0,
    paidCount: countMap.get("paid") ?? 0,
    cancelled: (countMap.get("cancelled") ?? 0) + (countMap.get("rejected") ?? 0),
    revenue: Number(revenueRow?.total ?? 0),
    outstanding: Number(outstanding?.total ?? 0),
    upcoming,
    recentCustomers,
    monthly: monthly.reverse(),
    newInquiries: Number(newInquiries?.count ?? 0),
    totalCustomers: Number(totalCustomers?.count ?? 0),
    pendingPayments: Number(pendingPayments?.count ?? 0),
  };
}

export async function listCustomers() {
  return all<{
    name: string;
    email: string;
    phone: string;
    bookings: number;
    spent: number;
    last_booking: string;
    user_id: string | null;
    notes: string | null;
  }>(
    `SELECT b.customer_name AS name, b.email AS email, MAX(b.phone) AS phone,
            COUNT(*) AS bookings,
            COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.amount WHEN b.payment_status = 'deposit_paid' THEN b.deposit_amount ELSE 0 END), 0) AS spent,
            MAX(b.created_at) AS last_booking,
            MAX(b.user_id) AS user_id,
            (SELECT notes FROM users u WHERE u.email = b.email LIMIT 1) AS notes
     FROM bookings b GROUP BY b.email ORDER BY last_booking DESC`,
  );
}

export async function listUsers() {
  return all<User>("SELECT * FROM users ORDER BY created_at DESC");
}

export async function customerDetail(email: string) {
  const user = await first<User>("SELECT * FROM users WHERE email = ?", [email]);
  const bookings = await all<Booking>(
    `SELECT b.*, c.name AS category_name, p.name AS package_name FROM bookings b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN packages p ON p.id = b.package_id
     WHERE b.email = ? ORDER BY b.date DESC`,
    [email],
  );
  return { user, bookings };
}

export async function listInquiries(status = "all") {
  return all<Inquiry>(
    `SELECT * FROM inquiries ${status !== "all" ? "WHERE status = ?" : ""} ORDER BY created_at DESC LIMIT 200`,
    status !== "all" ? [status] : [],
  );
}

export async function listNotifications(limit = 40) {
  return all<Notification>("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?", [limit]);
}

export async function unreadNotificationCount() {
  const row = await first<{ count: number }>(
    "SELECT COUNT(*) AS count FROM notifications WHERE read = 0",
  );
  return Number(row?.count ?? 0);
}

export async function likeCounts(imageIds: string[]): Promise<Record<string, number>> {
  if (!imageIds.length) return {};
  const placeholders = imageIds.map(() => "?").join(",");
  const rows = await all<{ image_id: string; count: number }>(
    `SELECT image_id, COUNT(*) AS count FROM likes WHERE image_id IN (${placeholders}) GROUP BY image_id`,
    imageIds,
  );
  return Object.fromEntries(rows.map((r) => [r.image_id, Number(r.count)]));
}

export async function featuredImages(limit = 12) {
  return all<GalleryImage & { category_name: string; category_slug: string }>(
    `SELECT i.*, c.name AS category_name, c.slug AS category_slug
     FROM images i JOIN categories c ON c.id = i.category_id
     WHERE c.published = 1 AND i.is_cover = 1
     ORDER BY c.sort_order ASC LIMIT ?`,
    [limit],
  );
}

/** Frames drawn only from a curated set of collections, interleaved for editorial front pages. */
export async function curatedFrames(slugs: string[], limit = 12) {
  if (slugs.length === 0) return featuredImages(limit);
  const marks = slugs.map(() => "?").join(",");
  const rows = await all<GalleryImage & { category_name: string; category_slug: string }>(
    `SELECT i.*, c.name AS category_name, c.slug AS category_slug
     FROM images i JOIN categories c ON c.id = i.category_id
     WHERE c.published = 1 AND c.slug IN (${marks})
     ORDER BY i.is_cover DESC, i.sort_order ASC
     LIMIT ?`,
    [...slugs, limit * 4],
  );

  const buckets = new Map<string, typeof rows>();
  for (const slug of slugs) buckets.set(slug, []);
  for (const row of rows) buckets.get(row.category_slug)?.push(row);

  const out: typeof rows = [];
  for (let round = 0; out.length < limit && round < 12; round += 1) {
    for (const slug of slugs) {
      const next = buckets.get(slug)?.shift();
      if (next && out.length < limit) out.push(next);
    }
  }
  return out;
}

export async function likeState(imageId: string, visitor: string) {
  const count = await first<{ count: number }>(
    "SELECT COUNT(*) AS count FROM likes WHERE image_id = ?",
    [imageId],
  );
  const mine = await first<{ id: string }>(
    "SELECT id FROM likes WHERE image_id = ? AND visitor = ?",
    [imageId, visitor],
  );
  return { count: Number(count?.count ?? 0), liked: Boolean(mine) };
}

export async function bookingCountForEmail(email: string) {
  const row = await first<{ count: number }>("SELECT COUNT(*) AS count FROM bookings WHERE email = ?", [
    email,
  ]);
  return Number(row?.count ?? 0);
}
