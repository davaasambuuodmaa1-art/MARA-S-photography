import { revalidatePath } from "next/cache";
import { first, run } from "./db";
import { notifyAdmin, sendEmail } from "./notify";
import { siteOrigin } from "./payments";
import { formatAUD } from "./utils";
import type { Booking, Payment } from "./types";

/**
 * The single settlement path used by the provider webhook, the sandbox
 * simulation and verified manual bank transfers.
 */
export async function settleBooking(payment: Payment, method: string, provider: string) {
  const booking = await first<Booking>("SELECT * FROM bookings WHERE id = ?", [payment.booking_id]);
  if (!booking) throw new Error("Booking not found for payment.");
  const isDeposit = payment.kind === "deposit";

  await run(
    "UPDATE bookings SET payment_status = ?, status = 'paid', payment_method = ?, updated_at = ? WHERE id = ?",
    [isDeposit ? "deposit_paid" : "paid", method, new Date().toISOString(), booking.id],
  );

  await notifyAdmin({
    type: "payment",
    title: `Payment received — ${booking.code}`,
    body: `${formatAUD(payment.gross_amount)} ${isDeposit ? "deposit" : "full payment"} from ${booking.customer_name} via ${method}.`,
    link: `/admin/bookings/${booking.id}`,
    emailSubject: `Payment received for ${booking.code}`,
    emailBody: `${formatAUD(payment.gross_amount)} received from ${booking.customer_name} (${booking.email}) via ${method} on ${provider}.`,
  });

  const origin = await siteOrigin();
  await sendEmail({
    to: booking.email,
    subject: `Payment confirmed — ${booking.code}`,
    text: `Dear ${booking.customer_name},\n\nWe have verified your payment of ${formatAUD(
      payment.gross_amount,
    )} for booking ${booking.code}.\n\nYour session is confirmed for ${booking.date} at ${booking.time_slot}.\n\nReceipt: ${origin}/receipt/${booking.code}\n\nWith warmth,\nMara's Photography`,
  });

  for (const path of [
    "/admin",
    "/admin/bookings",
    `/admin/bookings/${booking.id}`,
    `/booking/${booking.code}`,
    `/receipt/${booking.code}`,
    "/account",
  ]) {
    try {
      revalidatePath(path);
    } catch {
      // Route handlers can call this outside a render pass; safe to ignore.
    }
  }
  return true;
}
