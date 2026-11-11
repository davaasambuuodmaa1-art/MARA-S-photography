"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getBookingByCode, getPaymentsForBooking } from "@/lib/data";
import { first, run } from "@/lib/db";
import { createPaymentIntent, stripeConfig } from "@/lib/payments";
import { settleBooking } from "@/lib/settle";
import { formatAUD, newId } from "@/lib/utils";
import type { ActionResult } from "./auth";
import type { Booking, Payment } from "@/lib/types";

function revalidateBooking(booking: Booking) {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${booking.id}`);
  revalidatePath(`/booking/${booking.code}`);
  revalidatePath("/account");
}

export async function startPaymentAction(
  code: string,
  kind: "deposit" | "full",
): Promise<ActionResult<{ redirectUrl: string; simulated: boolean; orderId: string }>> {
  try {
    const booking = await getBookingByCode(code);
    if (!booking) return { ok: false, error: "Booking not found." };
    if (booking.payment_status === "paid") return { ok: false, error: "This booking is already paid in full." };
    if (["cancelled", "rejected"].includes(booking.status)) {
      return { ok: false, error: "This booking is no longer active." };
    }
    if (booking.amount === 0) {
      return { ok: false, error: "Bespoke commissions are quoted by the studio — please await our proposal." };
    }
    if (kind === "deposit" && booking.payment_status === "deposit_paid") {
      return { ok: false, error: "The deposit is already settled." };
    }
    const amount = kind === "deposit" ? booking.deposit_amount : booking.amount;
    if (amount <= 0) return { ok: false, error: "Nothing outstanding on this booking." };

    const intent = await createPaymentIntent({
      bookingCode: booking.code,
      kind,
      amount,
      customerName: booking.customer_name,
      email: booking.email,
      phone: booking.phone,
      description: `${kind === "deposit" ? "Deposit" : "Full payment"} · ${booking.category_name ?? "Session"}`,
    });

    await run(
      "INSERT INTO payments (id, booking_id, order_id, provider, method, kind, gross_amount, status, raw, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, 'pending', NULL, ?, ?)",
      [
        newId("pay_"),
        booking.id,
        intent.orderId,
        intent.provider,
        kind,
        amount,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );
    await run("UPDATE bookings SET status = 'awaiting_payment', payment_method = ?, updated_at = ? WHERE id = ?", [
      intent.provider === "sandbox" ? "sandbox" : "stripe",
      new Date().toISOString(),
      booking.id,
    ]);
    revalidateBooking(booking);
    return { ok: true, redirectUrl: intent.redirectUrl, simulated: intent.simulated, orderId: intent.orderId };
  } catch (error) {
    console.error("payment start failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "Could not start the payment." };
  }
}

/** Sandbox-only settlement, used when no Stripe keys are configured. */
export async function confirmSandboxPaymentAction(
  orderId: string,
  method: string,
): Promise<ActionResult> {
  try {
    if (stripeConfig().configured) {
      return { ok: false, error: "Live payments are configured — settle through Stripe." };
    }
    const payment = await first<Payment>("SELECT * FROM payments WHERE order_id = ?", [orderId]);
    if (!payment) return { ok: false, error: "Payment intent not found." };
    if (payment.status !== "pending") return { ok: false, error: "This payment was already processed." };

    await run("UPDATE payments SET status = 'settlement', method = ?, updated_at = ? WHERE id = ?", [
      method,
      new Date().toISOString(),
      payment.id,
    ]);
    await settleBooking(payment, method, "sandbox");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not confirm." };
  }
}

/** Administrator verifies a bank transfer / cash payment manually. */
export async function recordManualPaymentAction(
  bookingId: string,
  kind: "deposit" | "full",
  reference: string,
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
    if (!booking) return { ok: false, error: "Booking not found." };
    if (!reference.trim()) return { ok: false, error: "Add the bank reference you verified." };
    const amount = kind === "deposit" ? booking.deposit_amount : booking.amount;
    const payment: Payment = {
      id: newId("pay_"),
      booking_id: booking.id,
      order_id: `${booking.code}-MANUAL-${Date.now().toString().slice(-6)}`,
      provider: "manual",
      method: "bank_transfer",
      kind,
      gross_amount: amount,
      status: "settlement",
      raw: JSON.stringify({ verified_by: admin.email, reference }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await run(
      "INSERT INTO payments (id, booking_id, order_id, provider, method, kind, gross_amount, status, raw, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'settlement', ?, ?, ?)",
      [
        payment.id,
        payment.booking_id,
        payment.order_id,
        payment.provider,
        payment.method,
        payment.kind,
        payment.gross_amount,
        payment.raw,
        payment.created_at,
        payment.updated_at,
      ],
    );
    await settleBooking(payment, "bank_transfer", "manual");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not record payment." };
  }
}

export async function refundPaymentAction(paymentId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const payment = await first<Payment>("SELECT * FROM payments WHERE id = ?", [paymentId]);
    if (!payment) return { ok: false, error: "Payment not found." };
    await run("UPDATE payments SET status = 'refund', updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      paymentId,
    ]);
    await run("UPDATE bookings SET payment_status = 'refunded', updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      payment.booking_id,
    ]);
    const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [payment.booking_id]);
    if (booking) revalidateBooking(booking);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not refund." };
  }
}

export async function bookingPayments(bookingId: string) {
  return getPaymentsForBooking(bookingId);
}
