import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/site/PrintButton";
import { getBookingByCode, getPaymentsForBooking, getSiteSettings } from "@/lib/data";
import { formatDate, formatDateTime, formatAUD } from "@/lib/utils";
import { currentSiteLocale } from "@/lib/current-site-locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment receipt" };

export default async function ReceiptPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const mn = (await currentSiteLocale()) === "mn";
  const booking = await getBookingByCode(code);
  if (!booking) notFound();
  const [payments, settings] = await Promise.all([
    getPaymentsForBooking(booking.id),
    getSiteSettings(),
  ]);
  const settled = payments.filter((p) => ["settlement", "capture"].includes(p.status));
  const paid = settled.reduce((sum, p) => sum + p.gross_amount, 0);

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <div className="border border-ink/12 bg-white p-8 sm:p-12">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/10 pb-8">
          <div>
            <p className="display text-3xl tracking-[0.06em]">{settings.brandName.replace("Photography", "").trim().toUpperCase()}</p>
            <p className="mt-1 text-[8px] uppercase tracking-[0.46em] text-smoke">{mn ? "Гэрэл зураг" : "Photography"}</p>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-smoke">{settings.address}</p>
            <p className="mt-1 text-xs text-smoke">{settings.email} · {settings.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">{mn ? "Төлбөрийн баримт" : "Receipt"}</p>
            <p className="mt-2 font-mono text-sm">{booking.code}</p>
            <p className="mt-1 text-[11px] text-smoke">{formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="grid gap-6 border-b border-ink/10 py-8 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-smoke">{mn ? "Төлбөр төлөгч" : "Billed to"}</p>
            <p className="mt-2 font-serif text-xl">{booking.customer_name}</p>
            <p className="text-xs text-smoke">{booking.email}</p>
            <p className="text-xs text-smoke">{booking.phone}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-smoke">{mn ? "Зураг авалт" : "Session"}</p>
            <p className="mt-2 text-sm">{booking.category_name}</p>
            <p className="text-xs text-smoke">{booking.package_name}</p>
            <p className="text-xs text-smoke">{formatDate(booking.date)} · {booking.time_slot}</p>
          </div>
        </div>

        <table className="w-full py-8 text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-[10px] uppercase tracking-[0.18em] text-smoke">
              <th className="py-3 font-normal">{mn ? "Үйлчилгээ" : "Item"}</th>
              <th className="py-3 font-normal">{mn ? "Лавлагаа" : "Reference"}</th>
              <th className="py-3 text-right font-normal">{mn ? "Дүн" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            {settled.length ? (
              settled.map((payment) => (
                <tr key={payment.id} className="border-b border-ink/5">
                  <td className="py-3">
                    {payment.kind === "deposit" ? (mn ? "Зураг авалтын урьдчилгаа" : "Session deposit") : (mn ? "Зураг авалт" : "Photography session")}
                    <span className="block text-[11px] text-smoke">
                      {payment.method ?? payment.provider} · {formatDateTime(payment.created_at)}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-smoke">{payment.order_id}</td>
                  <td className="py-3 text-right">{formatAUD(payment.gross_amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-6 text-center text-sm text-smoke">
                  {mn ? "Энэ захиалгын төлбөр хараахан баталгаажаагүй байна." : "No verified payment yet on this booking."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-smoke">{mn ? "Нийт үнэ" : "Session total"}</span><span>{formatAUD(booking.amount)}</span></div>
            <div className="flex justify-between"><span className="text-smoke">{mn ? "Баталгаажсан төлбөр" : "Verified paid"}</span><span>{formatAUD(paid)}</span></div>
            <div className="flex justify-between border-t border-ink/15 pt-2 text-base">
              <span>{mn ? "Үлдэгдэл" : "Balance"}</span>
              <span>{formatAUD(Math.max(0, booking.amount - paid))}</span>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-ink/10 pt-5 text-[10px] leading-relaxed text-smoke/70">
          {mn
            ? `Захиалгыг төлөгдсөн гэж тэмдэглэхээс өмнө үйлчилгээ үзүүлэгчийн гарын үсэгтэй мэдэгдлээр төлбөрийг сервер талд баталгаажуулна. Энэхүү баримтыг Сидней хотын ${settings.brandName} олгов.`
            : `Payments are verified server-side against the provider&apos;s signed notification before any booking is marked paid. This receipt is issued by ${settings.brandName}, Sydney.`}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Link href={`/booking/${booking.code}`} className="no-print btn-outline">{mn ? "← Захиалга руу буцах" : "← Back to booking"}</Link>
        <PrintButton />
      </div>
    </section>
  );
}
