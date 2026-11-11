import { all, first, run } from "./db";
import {
  finalPrice,
  getLocationById,
  getPackageById,
  getSlotsForDate,
  packageFeatures,
  priceExtras,
  quotePromotion,
} from "./data";
import { bookingCode, formatAUD, newId } from "./utils";
import type { Booking } from "./types";
import { notifyAdmin } from "./notify";

export interface BookingInput {
  categoryId: string;
  packageId: string;
  customerName: string;
  email: string;
  phone: string;
  location: string;
  locationId?: string | null;
  mapsUrl?: string;
  wantsRecommendations?: boolean;
  people: number;
  date: string;
  timeSlot: string;
  notes: string;
  referenceImages: string[];
  userId?: string | null;
  extras?: { photos?: number; hours?: number; addonIds?: string[] };
  promoCode?: string;
}

export class BookingError extends Error {}

export async function createBooking(input: BookingInput) {
  const pkg = await getPackageById(input.packageId);
  if (!pkg) throw new BookingError("That package is no longer available.");

  const name = input.customerName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (name.length < 2) throw new BookingError("Please enter your full name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) throw new BookingError("Please enter a valid email.");
  if (phone.replace(/\D/g, "").length < 8) throw new BookingError("Please enter a valid phone number.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new BookingError("Please choose a date.");
  if (!/^\d{2}:\d{2}$/.test(input.timeSlot)) throw new BookingError("Please choose a time slot.");
  if (input.date < new Date().toISOString().slice(0, 10)) {
    throw new BookingError("Please choose a date in the future.");
  }

  const { slots } = await getSlotsForDate(input.date);
  const slot = slots.find((s) => s.time === input.timeSlot);
  if (!slot) throw new BookingError("That time is not part of our working hours.");
  if (!slot.available) throw new BookingError("That time slot was just taken. Please pick another.");

  // On location: resolve the requested Sydney location. Nothing is confirmed
  // automatically — the photographer approves every location after the request.
  let locationName = input.location.trim();
  let locationId: string | null = null;
  let mapsUrl = (input.mapsUrl ?? "").trim();
  let travelFee = 0;
  let minSpend = 0;
  let permitStatus = "unchecked";
  let locationStatus = "custom_pending";

  if (input.locationId) {
    const location = await getLocationById(input.locationId);
    if (!location || !location.available) {
      throw new BookingError(
        "That location is not currently available. Choose another, or send a custom address.",
      );
    }
    locationId = location.id;
    locationName = `${location.name}, ${location.area}`;
    mapsUrl = mapsUrl || location.maps_url;
    travelFee = location.travel_fee;
    minSpend = location.min_spend;
    permitStatus = location.permit_status;
    locationStatus = "pending";
  }

  if (locationName.length < 3 && !input.wantsRecommendations) {
    throw new BookingError("Choose a location or ask us to recommend one.");
  }

  const base = pkg.price === 0 ? 0 : finalPrice(pkg);
  const extras = priceExtras(pkg, input.extras ?? {});
  if (minSpend > 0 && base > 0 && base + extras.total < minSpend) {
    throw new BookingError(
      `${locationName} requires a minimum session of ${formatAUD(minSpend)}. Choose a larger package or another location.`,
    );
  }

  const subtotal = base + extras.total + travelFee;
  let discountCode = "";
  let discountAmount = 0;
  if (input.promoCode && input.promoCode.trim()) {
    const quote = await quotePromotion(input.promoCode, subtotal);
    if (!quote.ok) throw new BookingError(quote.error);
    discountCode = quote.promo.code;
    discountAmount = quote.discount;
  }
  const amount = Math.max(0, subtotal - discountAmount);
  const depositAmount = Math.round((amount * (pkg.deposit_percent || 30)) / 100);
  const id = newId("bkg_");

  let code = bookingCode();
  let guard = 0;
  while (!(await isCodeFree(code)) && guard < 6) {
    code = bookingCode();
    guard += 1;
  }

  // Atomic insert: only writes when the slot still has capacity.
  const result = await run(
    `INSERT INTO bookings
      (id, code, user_id, category_id, package_id, customer_name, email, phone, location, location_id, maps_url, location_status, wants_recommendations, permit_status, location_note, people, date, time_slot, notes, reference_images, admin_notes, base_amount, addon_total, extras, discount_code, discount_amount, travel_fee, amount, deposit_amount, status, payment_status, created_at, updated_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?
     WHERE (SELECT COUNT(*) FROM bookings WHERE date = ? AND time_slot = ? AND status NOT IN ('cancelled','rejected')) < ?`,
    [
      id,
      code,
      input.userId ?? null,
      input.categoryId,
      input.packageId,
      name,
      email,
      phone,
      locationName,
      locationId,
      mapsUrl,
      locationStatus,
      input.wantsRecommendations ? 1 : 0,
      permitStatus,
      Math.max(1, Math.min(500, Number(input.people) || 1)),
      input.date,
      input.timeSlot,
      input.notes.trim(),
      JSON.stringify(input.referenceImages.slice(0, 6)),
      base,
      extras.total,
      JSON.stringify({ photos: extras.photos, hours: extras.hours, addonIds: extras.addonIds, lines: extras.lines }),
      discountCode,
      discountAmount,
      travelFee,
      amount,
      depositAmount,
      new Date().toISOString(),
      new Date().toISOString(),
      input.date,
      input.timeSlot,
      slot.capacity,
    ],
  );

  if (!result.meta || result.meta.changes === 0) {
    throw new BookingError("That time slot has just been booked. Please choose another.");
  }

  if (discountCode) {
    await run("UPDATE promotions SET used_count = used_count + 1 WHERE code = ?", [discountCode]);
  }

  await notifyAdmin({
    type: "booking",
    title: `New booking ${code} — ${name}`,
    body: `${pkg.name}${extras.lines.length ? ` + ${extras.lines.map((line) => line.label).join(", ")}` : ""} · ${input.date} at ${input.timeSlot}${locationName ? ` · ${locationName}` : " · location to be recommended"}${discountCode ? ` · code ${discountCode} (−${formatAUD(discountAmount)})` : ""}`,
    link: `/admin/bookings/${id}`,
    emailSubject: `New booking request ${code}`,
    emailBody: `${name} (${email}, ${phone}) requested ${pkg.name} on ${input.date} at ${input.timeSlot}. Location: ${locationName || "to be recommended"}${mapsUrl ? ` (${mapsUrl})` : ""}. Package ${formatAUD(base)}${extras.total ? `, extras ${formatAUD(extras.total)}` : ""}${travelFee ? `, travel ${formatAUD(travelFee)}` : ""}${discountCode ? `, code ${discountCode} −${formatAUD(discountAmount)}` : ""}. Total ${formatAUD(amount)}. This location is not confirmed until you approve it.`,
  });

  return { id, code, amount, depositAmount, baseAmount: base, travelFee, extras, discountAmount, discountCode };
}

async function isCodeFree(code: string) {
  const row = await first<{ id: string }>("SELECT id FROM bookings WHERE code = ?", [code]);
  return !row;
}

export async function setBookingStatus(bookingId: string, status: string) {
  const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
  if (!booking) throw new BookingError("Booking not found.");
  const allowed = [
    "pending",
    "approved",
    "awaiting_confirmation",
    "awaiting_payment",
    "paid",
    "completed",
    "rejected",
    "cancelled",
    "reschedule_requested",
  ];
  if (!allowed.includes(status)) throw new BookingError("Unknown status.");

  await run("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?", [
    status,
    new Date().toISOString(),
    bookingId,
  ]);

  if (status === "approved") {
    await notifyAdmin({
      type: "status",
      title: `Booking ${booking.code} approved`,
      body: `${booking.customer_name}'s session is confirmed. Send the payment link to collect the deposit.`,
      link: `/admin/bookings/${bookingId}`,
    });
  }
  if (status === "cancelled" || status === "rejected") {
    await notifyAdmin({
      type: "status",
      title: `Booking ${booking.code} ${status}`,
      body: `${booking.customer_name} · ${booking.date} ${booking.time_slot}`,
      link: `/admin/bookings/${bookingId}`,
    });
  }
  return true;
}

export async function rescheduleBooking(
  bookingId: string,
  date: string,
  timeSlot: string,
) {
  const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
  if (!booking) throw new BookingError("Booking not found.");
  const { slots } = await getSlotsForDate(date);
  const slot = slots.find((s) => s.time === timeSlot);
  if (!slot) throw new BookingError("That time is outside working hours.");
  const clash = await first<{ id: string }>(
    `SELECT id FROM bookings WHERE date = ? AND time_slot = ? AND id != ? AND status NOT IN ('cancelled','rejected')`,
    [date, timeSlot, bookingId],
  );
  if (clash || !slot.available) throw new BookingError("That slot is already booked.");
  await run("UPDATE bookings SET date = ?, time_slot = ?, updated_at = ? WHERE id = ?", [
    date,
    timeSlot,
    new Date().toISOString(),
    bookingId,
  ]);
  await notifyAdmin({
    type: "status",
    title: `Booking ${booking.code} rescheduled`,
    body: `Moved to ${date} at ${timeSlot}.`,
    link: `/admin/bookings/${bookingId}`,
  });
  return true;
}

export async function saveBookingDetails(
  bookingId: string,
  patch: Partial<Pick<Booking, "admin_notes" | "location" | "notes" | "people" | "phone" | "customer_name" | "email">>,
) {
  const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
  if (!booking) throw new BookingError("Booking not found.");
  await run(
    `UPDATE bookings SET admin_notes = ?, location = ?, notes = ?, people = ?, phone = ?, customer_name = ?, email = ?, updated_at = ? WHERE id = ?`,
    [
      patch.admin_notes ?? booking.admin_notes,
      patch.location ?? booking.location,
      patch.notes ?? booking.notes,
      patch.people ?? booking.people,
      patch.phone ?? booking.phone,
      patch.customer_name ?? booking.customer_name,
      patch.email ?? booking.email,
      new Date().toISOString(),
      bookingId,
    ],
  );
  return true;
}

export async function cancelByCustomer(bookingId: string, email: string) {
  const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
  if (!booking) throw new BookingError("Booking not found.");
  if (booking.email.toLowerCase() !== email.toLowerCase()) {
    throw new BookingError("That booking does not belong to this email address.");
  }
  if (["completed", "cancelled"].includes(booking.status)) {
    throw new BookingError("This booking can no longer be cancelled.");
  }
  await run("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?", [
    new Date().toISOString(),
    bookingId,
  ]);
  await notifyAdmin({
    type: "cancellation",
    title: `Customer cancelled ${booking.code}`,
    body: `${booking.customer_name} cancelled ${booking.date} at ${booking.time_slot}.`,
    link: `/admin/bookings/${bookingId}`,
  });
  return true;
}

export async function upcomingReminders() {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);
  const iso = tomorrow.toISOString().slice(0, 10);
  return all<Booking>(
    `SELECT * FROM bookings WHERE date = ? AND status IN ('approved','awaiting_payment','paid')`,
    [iso],
  );
}

export function packageChecklist(pkg: { features: string }) {
  return packageFeatures(pkg);
}
