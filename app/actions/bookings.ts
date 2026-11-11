"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  BookingError,
  cancelByCustomer,
  createBooking,
  rescheduleBooking,
  saveBookingDetails,
  setBookingStatus,
  type BookingInput,
} from "@/lib/booking";
import { currentUser } from "@/lib/auth";
import { getBookingByCode, getSlotsForDate } from "@/lib/data";

import { notifyAdmin, sendEmail } from "@/lib/notify";
import { first, run } from "@/lib/db";
import { getLocationById } from "@/lib/data";
import { newId } from "@/lib/utils";
import type { Booking } from "@/lib/types";
import type { ActionResult } from "./auth";

export async function submitBookingAction(
  input: BookingInput,
): Promise<ActionResult<{ code: string; amount: number; depositAmount: number }>> {
  try {
    const user = await currentUser();
    const result = await createBooking({ ...input, userId: user?.id ?? null });
    if (user) {
      await run("UPDATE bookings SET user_id = ? WHERE id = ?", [user.id, result.id]);
    }
    await sendEmail({
      to: input.email,
      subject: `We received your booking request (${result.code})`,
      text: `Dear ${input.customerName},\n\nThank you for choosing Mara's Photography. Your request ${result.code} for ${input.date} at ${input.timeSlot} is with the studio.\n\nWe review every request personally and will confirm within one business day.\n\nWith warmth,\nMara's Photography`,
    });
    revalidatePath("/account");
    revalidatePath("/admin");
    return { ok: true, code: result.code, amount: result.amount, depositAmount: result.depositAmount };
  } catch (error) {
    if (error instanceof BookingError) return { ok: false, error: error.message };
    console.error("booking failed", error);
    return { ok: false, error: "Something went wrong while saving your booking. Please try again." };
  }
}

export async function slotsAction(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { slots: [], working: false, reason: "Invalid date" };
  return getSlotsForDate(date);
}

export async function lookupBookingAction(
  code: string,
  email: string,
): Promise<ActionResult<{ code: string; status: string; date: string; time: string; name: string }>> {
  const booking = await getBookingByCode(code.trim());
  if (!booking) return { ok: false, error: "No booking found with that reference." };
  if (booking.email.toLowerCase() !== email.trim().toLowerCase()) {
    return { ok: false, error: "That reference and email do not match." };
  }
  return {
    ok: true,
    code: booking.code,
    status: booking.status,
    date: booking.date,
    time: booking.time_slot,
    name: booking.customer_name,
  };
}

export async function updateBookingStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await setBookingStatus(id, status);
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update." };
  }
}

export async function rescheduleBookingAction(
  id: string,
  date: string,
  timeSlot: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await rescheduleBooking(id, date, timeSlot);
    revalidatePath(`/admin/bookings/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reschedule." };
  }
}

export async function saveBookingAdminAction(
  id: string,
  patch: { admin_notes?: string; location?: string; notes?: string; people?: number; phone?: string },
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await saveBookingDetails(id, patch);
    revalidatePath(`/admin/bookings/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save." };
  }
}

export async function customerCancelAction(id: string, email: string): Promise<ActionResult> {
  try {
    await cancelByCustomer(id, email);
    revalidatePath("/account");
    revalidatePath(`/booking`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not cancel." };
  }
}

/* ------------------------------ location approval ------------------------------ */

/**
 * Approves the requested location — or swaps in a suggested one. Nothing is ever
 * confirmed automatically: this is the only path that sets a location to approved.
 */
export async function approveBookingLocationAction(
  id: string,
  locationId?: string | null,
  note?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [id]);
    if (!booking) return { ok: false, error: "Booking not found." };

    let name = booking.location;
    let mapsUrl = booking.maps_url;
    let travelFee = booking.travel_fee;
    let permit = booking.permit_status;
    let nextLocationId = booking.location_id ?? null;

    if (locationId) {
      const location = await getLocationById(locationId);
      if (!location) return { ok: false, error: "Location not found." };
      nextLocationId = location.id;
      name = `${location.name}, ${location.area}`;
      mapsUrl = location.maps_url;
      travelFee = location.travel_fee;
      permit = location.permit_status;
    }

    if (booking.payment_status === "unpaid") {
      const base = booking.base_amount || booking.amount - booking.travel_fee;
      const addons = booking.addon_total || 0;
      const discount = booking.discount_amount || 0;
      const total = Math.max(0, base + addons + travelFee - discount);
      const percent =
        booking.deposit_amount && booking.amount
          ? Math.round((booking.deposit_amount / booking.amount) * 100)
          : 30;
      await run(
        "UPDATE bookings SET location = ?, location_id = ?, maps_url = ?, location_status = 'approved', location_note = ?, travel_fee = ?, base_amount = ?, amount = ?, deposit_amount = ?, updated_at = ? WHERE id = ?",
        [name, nextLocationId, mapsUrl, (note ?? "").trim(), travelFee, base, total, Math.round((total * percent) / 100), new Date().toISOString(), id],
      );
    } else {
      await run(
        "UPDATE bookings SET location = ?, location_id = ?, maps_url = ?, location_status = 'approved', location_note = ?, travel_fee = ?, updated_at = ? WHERE id = ?",
        [name, nextLocationId, mapsUrl, (note ?? "").trim(), travelFee, new Date().toISOString(), id],
      );
    }

    await notifyAdmin({
      type: "status",
      title: `Location approved — ${booking.code}`,
      body: `${name} for ${booking.customer_name}.`,
      link: `/admin/bookings/${id}`,
    });
    await sendEmail({
      to: booking.email,
      subject: `Your location is confirmed (${booking.code})`,
      text: `Dear ${booking.customer_name},\n\nMara has confirmed ${name} for your session on ${booking.date} at ${booking.time_slot}.\n${note ? `\nNote from the studio: ${note}\n` : ""}\nIf anything changes we will be in touch.\n\nWith warmth,\nMara's Photography`,
    });

    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath(`/booking/${booking.code}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not approve the location." };
  }
}

export async function rejectBookingLocationAction(
  id: string,
  note: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [id]);
    if (!booking) return { ok: false, error: "Booking not found." };
    await run(
      "UPDATE bookings SET location_status = 'rejected', location_note = ?, updated_at = ? WHERE id = ?",
      [note.trim(), new Date().toISOString(), id],
    );
    await notifyAdmin({
      type: "status",
      title: `Location rejected — ${booking.code}`,
      body: `${booking.location} · ${note || "no reason given"}`,
      link: `/admin/bookings/${id}`,
    });
    await sendEmail({
      to: booking.email,
      subject: `About your location (${booking.code})`,
      text: `Dear ${booking.customer_name},\n\nWe could not confirm ${booking.location || "the requested location"} for your session on ${booking.date}.\n${note ? `\n${note}\n` : ""}\nReply to this email and we will suggest a nearby location that works.\n\nWith warmth,\nMara's Photography`,
    });
    revalidatePath(`/admin/bookings/${id}`);
    revalidatePath(`/booking/${booking.code}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update the location." };
  }
}

/* ------------------------------- rescheduling ------------------------------- */

/** Customer requests a new date, usually because of weather. */
export async function requestRescheduleAction(input: {
  code: string;
  email: string;
  date: string;
  time: string;
  reason: string;
  weather: boolean;
}): Promise<ActionResult> {
  try {
    const booking = await getBookingByCode(input.code.trim());
    if (!booking) return { ok: false, error: "Booking not found." };
    if (booking.email.toLowerCase() !== input.email.trim().toLowerCase()) {
      return { ok: false, error: "That reference and email do not match." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "Choose a new date." };
    if (["completed", "cancelled", "rejected"].includes(booking.status)) {
      return { ok: false, error: "This booking can no longer be moved." };
    }
    await run(
      "INSERT INTO reschedule_requests (id, booking_id, requested_by, preferred_date, preferred_time, reason, weather, status, admin_note, created_at) VALUES (?, ?, 'customer', ?, ?, ?, ?, 'pending', '', ?)",
      [
        newId("rsq_"),
        booking.id,
        input.date,
        input.time || booking.time_slot,
        input.reason.trim(),
        input.weather ? 1 : 0,
        new Date().toISOString(),
      ],
    );
    await notifyAdmin({
      type: "status",
      title: `${input.weather ? "Weather reschedule" : "Reschedule request"} — ${booking.code}`,
      body: `${booking.customer_name} would like ${input.date} at ${input.time || booking.time_slot}. ${input.reason}`.trim(),
      link: `/admin/bookings/${booking.id}`,
      emailSubject: `Reschedule request ${booking.code}`,
      emailBody: `${booking.customer_name} (${booking.email}) requested ${input.date} at ${input.time || booking.time_slot}. Reason: ${input.reason || "not given"}.`,
    });
    revalidatePath(`/booking/${booking.code}`);
    revalidatePath(`/admin/bookings/${booking.id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not send the request." };
  }
}

/** Admin approves or declines a reschedule request. Approving moves the booking. */
export async function resolveRescheduleAction(
  requestId: string,
  approve: boolean,
  note: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const request = await first<{
      id: string;
      booking_id: string;
      preferred_date: string;
      preferred_time: string;
    }>("SELECT * FROM reschedule_requests WHERE id = ?", [requestId]);
    if (!request) return { ok: false, error: "Request not found." };
    const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [request.booking_id]);
    if (!booking) return { ok: false, error: "Booking not found." };

    if (approve) {
      await rescheduleBooking(booking.id, request.preferred_date, request.preferred_time);
    }
    await run("UPDATE reschedule_requests SET status = ?, admin_note = ? WHERE id = ?", [
      approve ? "approved" : "declined",
      note.trim(),
      requestId,
    ]);
    await sendEmail({
      to: booking.email,
      subject: approve
        ? `Your session has moved (${booking.code})`
        : `About your reschedule request (${booking.code})`,
      text: approve
        ? `Dear ${booking.customer_name},\n\nDone — your session is now ${request.preferred_date} at ${request.preferred_time}.\n${note ? `\n${note}\n` : ""}\nWith warmth,\nMara's Photography`
        : `Dear ${booking.customer_name},\n\nWe could not move your session to ${request.preferred_date} at ${request.preferred_time}.\n${note ? `\n${note}\n` : ""}\nReply with another date and we will find something that works.\n\nWith warmth,\nMara's Photography`,
    });
    revalidatePath(`/admin/bookings/${booking.id}`);
    revalidatePath(`/booking/${booking.code}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not resolve the request." };
  }
}

export async function deleteBookingAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await run("DELETE FROM payments WHERE booking_id = ?", [id]);
    await run("DELETE FROM bookings WHERE id = ?", [id]);
    await notifyAdmin({
      type: "system",
      title: "Booking deleted",
      body: `Removed by ${admin.name}.`,
      link: "/admin/bookings",
    });
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete." };
  }
}
