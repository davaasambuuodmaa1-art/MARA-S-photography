import { NextResponse } from "next/server";
import { first, run } from "@/lib/db";
import { isFailedStatus, isSettledStatus, verifyStripeSignature } from "@/lib/payments";
import { settleBooking } from "@/lib/settle";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

type StripeObject = {
  id?: string;
  amount_total?: number;
  amount_received?: number;
  currency?: string;
  payment_method_types?: string[];
  metadata?: Record<string, string>;
};

/**
 * Stripe webhook endpoint.
 * A payment is only ever settled after the HMAC-SHA256 signature check passes and
 * the stored order reference, amount and currency all match the event.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("stripe-signature");

  const valid = await verifyStripeSignature(raw, signature);
  if (!valid) {
    console.warn("stripe webhook rejected: bad or missing signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: { object?: StripeObject } };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.type ?? "";
  const object = event.data?.object ?? {};
  const orderId = object.metadata?.order_id;
  if (!orderId) return NextResponse.json({ received: true, ignored: "no order reference" });

  const payment = await first<Payment>("SELECT * FROM payments WHERE order_id = ?", [orderId]);
  if (!payment) return NextResponse.json({ error: "Unknown order" }, { status: 404 });

  if (object.currency && object.currency.toLowerCase() !== "aud") {
    console.warn("stripe currency mismatch", { orderId, currency: object.currency });
    return NextResponse.json({ error: "Currency mismatch" }, { status: 409 });
  }

  // Stripe reports minor units (cents).
  const reported = Number(object.amount_total ?? object.amount_received ?? 0);
  if (reported && reported !== Math.round(Number(payment.gross_amount) * 100)) {
    console.warn("stripe amount mismatch", {
      orderId,
      reported,
      stored: payment.gross_amount,
    });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
  }

  const method = object.payment_method_types?.[0] ?? payment.method ?? "card";

  await run("UPDATE payments SET status = ?, method = ?, raw = ?, updated_at = ? WHERE id = ?", [
    type || "pending",
    method,
    raw.slice(0, 4000),
    new Date().toISOString(),
    payment.id,
  ]);

  if (isSettledStatus(type)) {
    if (!["settlement", "capture", "checkout.session.completed", "payment_intent.succeeded"].includes(payment.status)) {
      await settleBooking({ ...payment, method }, method, "stripe");
    }
  } else if (isFailedStatus(type)) {
    await run("UPDATE bookings SET status = 'awaiting_payment', updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      payment.booking_id,
    ]);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "Stripe webhook",
    method: "POST",
    events: ["checkout.session.completed", "payment_intent.succeeded", "payment_intent.payment_failed"],
    note: "Add this URL as a Stripe endpoint, then set STRIPE_WEBHOOK_SECRET.",
  });
}
