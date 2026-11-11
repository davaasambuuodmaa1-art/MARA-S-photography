import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/components/site/PaymentPanel";
import { ReschedulePanel } from "@/components/site/ReschedulePanel";
import { Reveal } from "@/components/site/Reveal";
import { getBookingByCode, getPaymentsForBooking, getSiteSettings } from "@/lib/data";
import { BOOKING_STATUS, PAYMENT_STATUS_LABEL, cn, formatDate, formatDateTime, formatAUD } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIMELINE = [
  { key: "pending", label: "Request received" },
  { key: "approved", label: "Date confirmed" },
  { key: "paid", label: "Session secured" },
  { key: "completed", label: "Gallery delivered" },
];

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { code } = await params;
  const { paid } = await searchParams;
  const booking = await getBookingByCode(code);
  if (!booking) notFound();
  const [payments, settings] = await Promise.all([getPaymentsForBooking(booking.id), getSiteSettings()]);

  const statusMeta = BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.pending;
  const stageIndex =
    booking.status === "completed"
      ? 3
      : booking.status === "paid"
        ? 2
        : booking.status === "approved" || booking.status === "awaiting_payment"
          ? 1
          : 0;
  const closed = ["cancelled", "rejected"].includes(booking.status);
  const references: string[] = (() => {
    try {
      const parsed = JSON.parse(booking.reference_images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const extrasLines: { label: string; amount: number }[] = (() => {
    try {
      const parsed = JSON.parse(booking.extras);
      return Array.isArray(parsed?.lines) ? parsed.lines : [];
    } catch {
      return [];
    }
  })();

  return (
    <section className="mx-auto max-w-[1120px] px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      {paid ? (
        <Reveal className="mb-8 border border-champagne/40 bg-champagne/10 px-5 py-4 text-sm text-ink">
          Thank you — if you have just completed a payment, it can take a few seconds to appear below.
          Refresh if it has not updated.
        </Reveal>
      ) : null}

      <Reveal className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow">Booking {booking.code}</p>
          <h1 className="display mt-3 text-balance text-[clamp(2.4rem,5vw,3.8rem)] text-ink">
            {booking.category_name ?? "Photography session"}
          </h1>
          <p className="mt-3 text-sm text-smoke">
            {booking.package_name} · {formatDate(booking.date)} at {booking.time_slot}
          </p>
        </div>
        <span className={cn("border px-4 py-2 text-[10px] uppercase tracking-[0.18em]", statusMeta.className)}>
          {statusMeta.label}
        </span>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-10">
          <Reveal className="border border-ink/12 bg-white/60 p-7">
            <p className="eyebrow">Progress</p>
            <ol className="mt-6 space-y-5">
              {TIMELINE.map((item, index) => {
                const reached = !closed && index <= stageIndex;
                return (
                  <li key={item.key} className="flex gap-4">
                    <span
                      className={cn(
                        "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px]",
                        reached ? "border-ink bg-ink text-cream" : "border-ink/20 text-smoke/50",
                      )}
                    >
                      {reached ? "✓" : index + 1}
                    </span>
                    <div>
                      <p className={cn("text-sm", reached ? "text-ink" : "text-smoke/60")}>{item.label}</p>
                      {index === 0 ? (
                        <p className="mt-1 text-[11px] text-smoke/70">
                          Submitted {formatDateTime(booking.created_at)}
                        </p>
                      ) : null}
                      {item.key === "paid" && booking.payment_status !== "unpaid" ? (
                        <p className="mt-1 text-[11px] text-smoke/70">
                          {PAYMENT_STATUS_LABEL[booking.payment_status]}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
            {closed ? (
              <p className="mt-5 border border-ink/10 bg-sand/60 px-4 py-3 text-xs text-smoke">
                This booking was {booking.status}. You are welcome to start a new request at any time.
              </p>
            ) : null}
          </Reveal>

          <Reveal delay={80}>
            <p className="eyebrow">Session details</p>
            <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {[
                ["Collection", booking.category_name ?? "—"],
                ["Package", booking.package_name ?? "—"],
                ...extrasLines.map((line) => [line.label, formatAUD(line.amount)] as [string, string]),
                ...(booking.discount_code
                  ? ([["Promo code", `${booking.discount_code} (−${formatAUD(booking.discount_amount)})`]] as [string, string][])
                  : []),
                ["Date", formatDate(booking.date)],
                ["Time", booking.time_slot],
                ["People", String(booking.people)],
                ["Location", booking.location || "To be confirmed"],
                ["Name", booking.customer_name],
                ["Email", booking.email],
                ["Phone", booking.phone],
                ["Notes", booking.notes || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3">
                  <dt className="shrink-0 text-smoke">{label}</dt>
                  <dd className="text-right text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {references.length ? (
            <Reveal delay={100}>
              <p className="eyebrow">Your references</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {references.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-24 w-24 overflow-hidden">
                    <img src={url} alt="Reference" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </Reveal>
          ) : null}

          {payments.length ? (
            <Reveal delay={120}>
              <p className="eyebrow">Transactions</p>
              <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10 text-sm">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-ink">
                        {payment.kind === "deposit" ? "Deposit" : "Full payment"} ·{" "}
                        {formatAUD(payment.gross_amount)}
                      </p>
                      <p className="text-[11px] text-smoke">
                        {payment.provider} · {formatDateTime(payment.created_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "border px-2.5 py-1 text-[9px] uppercase tracking-[0.16em]",
                        ["settlement", "capture"].includes(payment.status)
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : payment.status === "pending"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-ink/15 text-smoke",
                      )}
                    >
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>

        <div className="space-y-4">
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
          <ReschedulePanel
            code={booking.code}
            email={booking.email}
            date={booking.date}
            time={booking.time_slot}
            rainPolicy={settings.rainPolicy}
            whatsapp={settings.whatsapp}
          />
          <div className="border border-ink/12 bg-white/50 p-6 text-sm">
            <p className="eyebrow">Questions?</p>
            <p className="mt-3 text-xs leading-relaxed text-smoke">
              Reply to your confirmation email or message Mara directly — she plans every session herself.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="btn-outline py-2.5 text-[9px]">
                WhatsApp
              </a>
              <a href={`mailto:${settings.email}`} className="btn-outline py-2.5 text-[9px]">
                Email
              </a>
            </div>
          </div>
          <Link href="/account" className="block text-center text-[10px] uppercase tracking-[0.22em] text-smoke link-underline">
            All my bookings
          </Link>
        </div>
      </div>
    </section>
  );
}
