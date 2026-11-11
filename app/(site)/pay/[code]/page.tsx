import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/components/site/PaymentPanel";
import { Reveal } from "@/components/site/Reveal";
import { getBookingByCode, getPaymentsForBooking, getSiteSettings } from "@/lib/data";
import { formatAUD, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pay for your session" };

export default async function PayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const booking = await getBookingByCode(code);
  if (!booking) notFound();
  const [settings, payments] = await Promise.all([
    getSiteSettings(),
    getPaymentsForBooking(booking.id),
  ]);

  return (
    <section className="mx-auto max-w-[1000px] px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">Secure payment</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,5vw,3.6rem)] text-ink">Complete your booking</h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-smoke">
          Reference {booking.code}. Your date is held while payment is completed.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.05fr]">
        <Reveal className="border border-ink/12 bg-white/60 p-7">
          <p className="eyebrow">Summary</p>
          <p className="mt-4 font-serif text-2xl">{booking.category_name}</p>
          <p className="mt-1 text-sm text-smoke">{booking.package_name}</p>
          <div className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm">
            <div className="flex justify-between"><span className="text-smoke">Date</span><span>{formatDate(booking.date)}</span></div>
            <div className="flex justify-between"><span className="text-smoke">Time</span><span>{booking.time_slot}</span></div>
            <div className="flex justify-between"><span className="text-smoke">Session total</span><span>{formatAUD(booking.amount)}</span></div>
            <div className="flex justify-between"><span className="text-smoke">Deposit</span><span>{formatAUD(booking.deposit_amount)}</span></div>
          </div>
          {payments.filter((p) => ["settlement", "capture"].includes(p.status)).length ? (
            <p className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              We have already verified a payment on this booking.
            </p>
          ) : null}
          <Link href={`/booking/${booking.code}`} className="mt-6 inline-block text-[10px] uppercase tracking-[0.22em] text-smoke link-underline">
            ← Back to booking
          </Link>
        </Reveal>

        <Reveal delay={80}>
          <PaymentPanel
            code={booking.code}
            amount={booking.amount}
            depositAmount={booking.deposit_amount}
            paymentStatus={booking.payment_status}
            status={booking.status}
            methods={{
              card: settings.cardEnabled,
              wallet: settings.walletEnabled,
              bank: settings.bankEnabled,
              bankDetails: settings.bankDetails,
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}
