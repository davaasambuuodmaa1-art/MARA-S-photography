import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingActions } from "@/components/admin/BookingActions";
import {
  getAllLocations,
  getBookingById,
  getPaymentsForBooking,
  getRescheduleRequests,
} from "@/lib/data";
import { BOOKING_STATUS, PAYMENT_STATUS_LABEL, cn, formatDate, formatDateTime, formatAUD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();
  const [payments, locations, reschedules] = await Promise.all([
    getPaymentsForBooking(booking.id),
    getAllLocations(),
    getRescheduleRequests(booking.id),
  ]);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/bookings" className="text-[9px] uppercase tracking-[0.18em] text-smoke hover:text-ink">
            ← All bookings
          </Link>
          <h1 className="display mt-2 text-3xl">{booking.customer_name}</h1>
          <p className="mt-1 font-mono text-[11px] text-smoke">{booking.code}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("border px-3 py-1.5 text-[9px] uppercase tracking-[0.14em]", BOOKING_STATUS[booking.status]?.className)}>
            {BOOKING_STATUS[booking.status]?.label}
          </span>
          <span className="border border-ink/15 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-smoke">
            {PAYMENT_STATUS_LABEL[booking.payment_status]}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <section className="border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Session</p>
            <div className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Collection", booking.category_name ?? "—"],
                ["Package", booking.package_name ?? "—"],
                ...(extrasLines.length
                  ? extrasLines.map((line) => [line.label, formatAUD(line.amount)])
                  : []),
                ...(booking.discount_code
                  ? [["Promo", `${booking.discount_code} (−${formatAUD(booking.discount_amount)})`]]
                  : []),
                ["Date", formatDate(booking.date)],
                ["Time", booking.time_slot],
                ["People", String(booking.people)],
                ["Session", formatAUD(booking.base_amount || booking.amount)],
                ["Travel", booking.travel_fee ? formatAUD(booking.travel_fee) : "Included"],
                ["Total", formatAUD(booking.amount)],
                ["Deposit", formatAUD(booking.deposit_amount)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-smoke/60">{label}</p>
                  <p className="mt-0.5 text-ink">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-ink/12 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Location & permit</p>
              <span className="border border-ink/15 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-smoke">
                {booking.location_status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-3 font-serif text-xl">{booking.location || "Location to be recommended"}</p>
            {booking.maps_url ? (
              <a
                href={booking.maps_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-[10px] uppercase tracking-[0.14em] text-gold underline"
              >
                {booking.maps_url}
              </a>
            ) : (
              <p className="mt-1 text-[10px] text-smoke">No map link supplied.</p>
            )}
            <div className="mt-3 grid gap-2 text-[11px] text-smoke sm:grid-cols-2">
              <p>Permit: {booking.permit_status.replace("_", " ")}</p>
              <p>Travel: {booking.travel_fee ? formatAUD(booking.travel_fee) : "Included"}</p>
            </div>
            {booking.location_note ? (
              <p className="mt-2 border-t border-ink/10 pt-2 text-[11px] text-smoke">
                Note: {booking.location_note}
              </p>
            ) : null}
            {booking.wants_recommendations ? (
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-gold">
                Client would also like recommendations
              </p>
            ) : null}
          </section>

          <section className="border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Client</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p>{booking.customer_name}</p>
              <p><a href={`mailto:${booking.email}`} className="text-smoke underline">{booking.email}</a></p>
              <p><a href={`https://wa.me/${booking.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-smoke underline">{booking.phone}</a></p>
            </div>
            <div className="mt-4 border-t border-ink/10 pt-3">
              <p className="text-[9px] uppercase tracking-[0.16em] text-smoke/60">Client notes</p>
              <p className="mt-1 text-sm text-smoke">{booking.notes || "No notes from the client."}</p>
            </div>
            {references.length ? (
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-[9px] uppercase tracking-[0.16em] text-smoke/60">Reference images</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {references.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden border border-ink/10">
                      <img src={url} alt="Client reference" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">History</p>
            <div className="mt-3 space-y-2 text-[12px] text-smoke">
              <p>Requested {formatDateTime(booking.created_at)}</p>
              <p>Last updated {formatDateTime(booking.updated_at)}</p>
              {payments.length ? <p>{payments.length} payment record(s)</p> : <p>No payment records yet</p>}
            </div>
          </section>
        </div>

        <BookingActions
          booking={{
            id: booking.id,
            code: booking.code,
            status: booking.status,
            date: booking.date,
            time_slot: booking.time_slot,
            admin_notes: booking.admin_notes,
            location: booking.location,
            location_id: booking.location_id,
            location_status: booking.location_status,
            location_note: booking.location_note,
            maps_url: booking.maps_url,
            permit_status: booking.permit_status,
            travel_fee: booking.travel_fee,
            base_amount: booking.base_amount,
            notes: booking.notes,
            people: booking.people,
            phone: booking.phone,
            amount: booking.amount,
            deposit_amount: booking.deposit_amount,
            payment_status: booking.payment_status,
          }}
          payments={payments.map((p) => ({
            id: p.id,
            kind: p.kind,
            gross_amount: p.gross_amount,
            status: p.status,
            provider: p.provider,
          }))}
          locations={locations.map((location) => ({
            id: location.id,
            name: location.name,
            area: location.area,
            travelFee: location.travel_fee,
            permitStatus: location.permit_status,
          }))}
          reschedules={reschedules.map((request) => ({
            id: request.id,
            preferred_date: request.preferred_date,
            preferred_time: request.preferred_time,
            reason: request.reason,
            weather: request.weather,
            status: request.status,
            created_at: request.created_at,
          }))}
        />
      </div>
    </div>
  );
}
