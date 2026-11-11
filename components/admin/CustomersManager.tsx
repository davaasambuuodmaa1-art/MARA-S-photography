"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveCustomerNotesAction } from "@/app/actions/admin";
import { BOOKING_STATUS, cn, formatDate, formatAUD } from "@/lib/utils";

interface Customer {
  name: string;
  email: string;
  phone: string;
  bookings: number;
  spent: number;
  last_booking: string;
  notes: string | null;
}

interface BookingLite {
  id: string;
  code: string;
  email: string;
  date: string;
  time_slot: string;
  status: string;
  amount: number;
  category_name?: string;
}

export function CustomersManager({
  customers,
  bookings,
}: {
  customers: Customer[];
  bookings: BookingLite[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const filtered = customers.filter((customer) => {
    const term = query.trim().toLowerCase();
    return (
      !term ||
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)
    );
  });

  const open = (customer: Customer) => {
    setSelected(customer);
    setNotes(customer.notes ?? "");
    setSaved(false);
  };

  const saveNotes = async () => {
    if (!selected) return;
    setBusy(true);
    await saveCustomerNotesAction(selected.email, notes);
    setBusy(false);
    setSaved(true);
    router.refresh();
  };

  const clientBookings = selected ? bookings.filter((b) => b.email === selected.email) : [];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clients"
          className="field w-full py-2.5 text-xs sm:w-72"
        />
      </div>

      <div className="overflow-x-auto border border-ink/12 bg-white/70">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[9px] uppercase tracking-[0.18em] text-smoke">
              <th className="px-4 py-3 font-normal">Client</th>
              <th className="px-4 py-3 font-normal">Phone</th>
              <th className="px-4 py-3 font-normal">Bookings</th>
              <th className="px-4 py-3 font-normal">Spent</th>
              <th className="px-4 py-3 font-normal">Last booking</th>
              <th className="px-4 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.email} className="border-b border-ink/5 hover:bg-sand/40">
                <td className="px-4 py-3">
                  <p className="text-ink">{customer.name}</p>
                  <p className="text-[11px] text-smoke">{customer.email}</p>
                </td>
                <td className="px-4 py-3 text-[12px] text-smoke">{customer.phone || "—"}</td>
                <td className="px-4 py-3 text-[12px]">{customer.bookings}</td>
                <td className="px-4 py-3 text-[12px]">{formatAUD(customer.spent)}</td>
                <td className="px-4 py-3 text-[11px] text-smoke">{formatDate(customer.last_booking, { month: "short" })}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => open(customer)} className="text-[9px] uppercase tracking-[0.14em] text-ink link-underline">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <p className="px-5 py-12 text-center text-xs text-smoke">No clients match.</p> : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[90] flex justify-end bg-ink/50">
          <button type="button" aria-label="Close" onClick={() => setSelected(null)} className="flex-1" />
          <div className="h-full w-full max-w-md overflow-y-auto bg-cream p-6">
            <p className="eyebrow">Client</p>
            <h2 className="display mt-2 text-3xl">{selected.name}</h2>
            <div className="mt-2 space-y-1 text-sm text-smoke">
              <p><a href={`mailto:${selected.email}`} className="underline">{selected.email}</a></p>
              <p>{selected.phone || "No phone on file"}</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-y border-ink/10 py-4 text-center">
              <div>
                <p className="display text-2xl">{selected.bookings}</p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-smoke">Bookings</p>
              </div>
              <div>
                <p className="display text-2xl">{formatAUD(selected.spent).replace("$", "")}</p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-smoke">Spent (AUD)</p>
              </div>
              <div>
                <p className="display text-2xl">{formatDate(selected.last_booking, { day: "numeric", month: "short" }).split(" ")[0]}</p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-smoke">Last</p>
              </div>
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-smoke">Booking history</p>
            <div className="mt-2 divide-y divide-ink/10">
              {clientBookings.map((booking) => (
                <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-[12px]">{booking.category_name ?? "Session"}</p>
                    <p className="text-[10px] text-smoke">{formatDate(booking.date)} · {booking.time_slot}</p>
                  </div>
                  <span className={cn("border px-2 py-0.5 text-[8px] uppercase tracking-[0.12em]", BOOKING_STATUS[booking.status]?.className)}>
                    {BOOKING_STATUS[booking.status]?.label}
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-smoke">Private studio notes</p>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="field mt-2 resize-none text-xs"
              placeholder="Preferences, allergies, how you met, what they love…"
            />
            <div className="mt-3 flex items-center gap-3">
              <button type="button" onClick={saveNotes} disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
                {busy ? "Saving…" : "Save notes"}
              </button>
              {saved ? <span className="text-[9px] uppercase tracking-[0.14em] text-emerald-700">Saved</span> : null}
            </div>

            <button type="button" onClick={() => setSelected(null)} className="mt-8 text-[9px] uppercase tracking-[0.16em] text-smoke">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
