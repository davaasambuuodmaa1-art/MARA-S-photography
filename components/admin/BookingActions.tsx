"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  approveBookingLocationAction,
  deleteBookingAction,
  rejectBookingLocationAction,
  rescheduleBookingAction,
  resolveRescheduleAction,
  saveBookingAdminAction,
  updateBookingStatusAction,
} from "@/app/actions/bookings";
import { recordManualPaymentAction, refundPaymentAction } from "@/app/actions/payments";
import { BOOKING_STATUSES, BOOKING_STATUS, cn, formatDate, formatAUD } from "@/lib/utils";

export function BookingActions({
  booking,
  payments,
  locations,
  reschedules,
}: {
  booking: {
    id: string;
    code: string;
    status: string;
    date: string;
    time_slot: string;
    admin_notes: string;
    location: string;
    location_id: string | null;
    location_status: string;
    location_note: string;
    maps_url: string;
    permit_status: string;
    travel_fee: number;
    base_amount: number;
    notes: string;
    people: number;
    phone: string;
    amount: number;
    deposit_amount: number;
    payment_status: string;
  };
  payments: { id: string; kind: string; gross_amount: number; status: string; provider: string }[];
  locations: { id: string; name: string; area: string; travelFee: number; permitStatus: string }[];
  reschedules: {
    id: string;
    preferred_date: string;
    preferred_time: string;
    reason: string;
    weather: number;
    status: string;
    created_at: string;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(booking.admin_notes);
  const [reschedule, setReschedule] = useState({ date: booking.date, time: booking.time_slot });
  const [locationPick, setLocationPick] = useState(booking.location_id ?? "");
  const [locationNote, setLocationNote] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState<Record<string, string>>({});
  const [manual, setManual] = useState({ kind: "deposit", reference: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await fn();
    setBusy(false);
    if (result.ok) {
      setMessage(success);
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  };

  return (
    <div className="space-y-5">
      {message ? <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p> : null}
      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p> : null}

      <section className="border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Status</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {BOOKING_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              onClick={() => run(() => updateBookingStatusAction(booking.id, status), `Status set to ${BOOKING_STATUS[status].label}.`)}
              className={cn(
                "border px-3 py-2 text-[9px] uppercase tracking-[0.14em] transition-colors disabled:opacity-50",
                booking.status === status
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/15 text-smoke hover:border-ink/40 hover:text-ink",
              )}
            >
              {BOOKING_STATUS[status].label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-smoke/70">
          Marking a booking paid here is only a status change. Verified payments are recorded below.
        </p>
      </section>

      <section className="border border-ink/12 bg-white/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Location</p>
          <span
            className={cn(
              "border px-2 py-1 text-[8px] uppercase tracking-[0.12em]",
              booking.location_status === "approved"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : booking.location_status === "rejected"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-amber-200 bg-amber-50 text-amber-800",
            )}
          >
            {booking.location_status.replace("_", " ")}
          </span>
        </div>
        <p className="mt-2 font-serif text-xl">{booking.location || "No location yet"}</p>
        {booking.maps_url ? (
          <a
            href={booking.maps_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-[10px] uppercase tracking-[0.16em] text-gold underline"
          >
            Open in Google Maps →
          </a>
        ) : null}
        <p className="mt-2 text-[10px] leading-relaxed text-smoke">
          Permit status: {booking.permit_status.replace("_", " ")} · Travel{" "}
          {booking.travel_fee > 0 ? formatAUD(booking.travel_fee) : "included"}
          {booking.location_note ? ` · ${booking.location_note}` : ""}
        </p>

        <div className="mt-3 space-y-2">
          <label className="label">Approve or suggest another location</label>
          <select
            value={locationPick}
            onChange={(event) => setLocationPick(event.target.value)}
            className="field py-2 text-xs"
          >
            <option value="">Keep the requested location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} · {location.area} ·{" "}
                {location.travelFee > 0 ? formatAUD(location.travelFee) : "travel included"}
              </option>
            ))}
          </select>
          <input
            value={locationNote}
            onChange={(event) => setLocationNote(event.target.value)}
            className="field py-2 text-xs"
            placeholder="Note to the client (optional)"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  () => approveBookingLocationAction(booking.id, locationPick || null, locationNote),
                  "Location approved and client notified.",
                )
              }
              className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
            >
              Approve location
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  () => rejectBookingLocationAction(booking.id, locationNote),
                  "Location rejected and client notified.",
                )
              }
              className="border border-rose-200 bg-rose-50 px-4 py-2.5 text-[9px] uppercase tracking-[0.14em] text-rose-700"
            >
              Reject
            </button>
          </div>
          <p className="text-[10px] leading-relaxed text-smoke/70">
            Nothing is confirmed for the client until you approve it here. Approving recalculates
            travel and the deposit while the booking is unpaid.
          </p>
        </div>
      </section>

      <section className="border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Reschedule requests</p>
        {reschedules.length === 0 ? (
          <p className="mt-2 text-[11px] text-smoke">No requests. Clients can ask for a new date from their booking page.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {reschedules.map((request) => (
              <div key={request.id} className="border-t border-ink/10 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-ink">
                    {formatDate(request.preferred_date)} at {request.preferred_time}
                  </p>
                  <span className="text-[8px] uppercase tracking-[0.12em] text-smoke">
                    {request.weather ? "weather" : "request"} · {request.status}
                  </span>
                </div>
                {request.reason ? <p className="mt-1 text-[10px] text-smoke">{request.reason}</p> : null}
                {request.status === "pending" ? (
                  <div className="mt-2 space-y-2">
                    <input
                      value={rescheduleNotes[request.id] ?? ""}
                      onChange={(event) =>
                        setRescheduleNotes({ ...rescheduleNotes, [request.id]: event.target.value })
                      }
                      className="field py-1.5 text-[11px]"
                      placeholder="Note to the client (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => resolveRescheduleAction(request.id, true, rescheduleNotes[request.id] ?? ""),
                            "Rescheduled and client notified.",
                          )
                        }
                        className="btn-dark py-2 text-[8px] disabled:opacity-50"
                      >
                        Approve & move
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => resolveRescheduleAction(request.id, false, rescheduleNotes[request.id] ?? ""),
                            "Request declined.",
                          )
                        }
                        className="text-[8px] uppercase tracking-[0.14em] text-rose-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Reschedule</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="rs-date">Date</label>
            <input
              id="rs-date"
              type="date"
              value={reschedule.date}
              onChange={(event) => setReschedule({ ...reschedule, date: event.target.value })}
              className="field py-2 text-xs"
            />
          </div>
          <div>
            <label className="label" htmlFor="rs-time">Time</label>
            <input
              id="rs-time"
              type="time"
              value={reschedule.time}
              onChange={(event) => setReschedule({ ...reschedule, time: event.target.value })}
              className="field py-2 text-xs"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => rescheduleBookingAction(booking.id, reschedule.date, reschedule.time),
                "Booking moved.",
              )
            }
            className="btn-outline py-2.5 text-[9px] disabled:opacity-50"
          >
            Move session
          </button>
        </div>
        <p className="mt-2 text-[10px] text-smoke/70">
          Current: {formatDate(booking.date)} at {booking.time_slot}. Clashes are blocked automatically.
        </p>
      </section>

      <section className="border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Private admin notes</p>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="field mt-3 resize-none text-xs"
          placeholder="Only the studio sees this."
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => saveBookingAdminAction(booking.id, { admin_notes: notes }), "Notes saved.")}
          className="btn-dark mt-3 py-2.5 text-[9px] disabled:opacity-50"
        >
          Save notes
        </button>
      </section>

      <section className="border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Record a verified payment</p>
        <p className="mt-2 text-[11px] leading-relaxed text-smoke">
          Use this only after confirming a bank transfer or cash payment yourself. It records the
          reference and settles the booking exactly like a provider callback.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="m-kind">Type</label>
            <select
              id="m-kind"
              value={manual.kind}
              onChange={(event) => setManual({ ...manual, kind: event.target.value })}
              className="field py-2 text-xs"
            >
              <option value="deposit">Deposit · {formatAUD(booking.deposit_amount)}</option>
              <option value="full">Full payment · {formatAUD(booking.amount)}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="m-ref">Bank reference</label>
            <input
              id="m-ref"
              value={manual.reference}
              onChange={(event) => setManual({ ...manual, reference: event.target.value })}
              className="field py-2 text-xs"
              placeholder="TRX-889012"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => recordManualPaymentAction(booking.id, manual.kind as "deposit" | "full", manual.reference),
                "Payment recorded and booking settled.",
              )
            }
            className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
          >
            Record payment
          </button>
        </div>
      </section>

      {payments.length ? (
        <section className="border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Transactions</p>
          <div className="mt-3 divide-y divide-ink/10">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-[12px]">
                    {payment.kind === "deposit" ? "Deposit" : "Full"} · {formatAUD(payment.gross_amount)}
                  </p>
                  <p className="text-[10px] text-smoke">{payment.provider} · {payment.status}</p>
                </div>
                {["settlement", "capture"].includes(payment.status) ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => refundPaymentAction(payment.id), "Refund recorded.")}
                    className="text-[9px] uppercase tracking-[0.14em] text-rose-700 hover:text-rose-900"
                  >
                    Mark refunded
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border border-rose-200 bg-rose-50/50 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-rose-800">Danger zone</p>
        <p className="mt-2 text-[11px] text-rose-900/70">
          Deleting removes the booking and its payment records permanently.
        </p>
        {confirmDelete ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => deleteBookingAction(booking.id), "Booking deleted.")}
              className="border border-rose-300 bg-rose-600 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-white"
            >
              Yes, delete permanently
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-rose-800">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-3 text-[9px] uppercase tracking-[0.14em] text-rose-700 underline"
          >
            Delete this booking
          </button>
        )}
      </section>
    </div>
  );
}
