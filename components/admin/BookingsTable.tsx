"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { updateBookingStatusAction } from "@/app/actions/bookings";
import { BOOKING_STATUS, cn, formatDate, formatAUD } from "@/lib/utils";

interface Row {
  id: string;
  code: string;
  customer_name: string;
  email: string;
  date: string;
  time_slot: string;
  status: string;
  payment_status: string;
  amount: number;
  category_name?: string;
  package_name?: string;
}

const STATUS_FILTERS = [
  "all",
  "pending",
  "approved",
  "awaiting_payment",
  "paid",
  "completed",
  "rejected",
  "cancelled",
];

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  deposit_paid: "Deposit",
  paid: "Paid",
  refunded: "Refunded",
};

export function BookingsTable({ bookings }: { bookings: Row[] }) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = status === "all" || booking.status === status;
      const matchesQuery =
        !term ||
        booking.code.toLowerCase().includes(term) ||
        booking.customer_name.toLowerCase().includes(term) ||
        booking.email.toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [bookings, status, query]);

  const approve = async (id: string) => {
    setBusy(id);
    await updateBookingStatusAction(id, "approved");
    setBusy(null);
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatus(filter)}
              className={cn(
                "shrink-0 border px-3 py-2 text-[9px] uppercase tracking-[0.16em] transition-colors",
                status === filter
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/15 text-smoke hover:border-ink/40 hover:text-ink",
              )}
            >
              {filter === "all" ? "All" : BOOKING_STATUS[filter]?.label ?? filter}
              {filter !== "all" ? (
                <span className="ml-2 text-[8px] opacity-60">
                  {bookings.filter((b) => b.status === filter).length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email or reference"
          className="field w-full py-2.5 text-xs sm:w-72"
        />
      </div>

      <div className="overflow-x-auto border border-ink/12 bg-white/70">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-[9px] uppercase tracking-[0.18em] text-smoke">
              <th className="px-4 py-3 font-normal">Reference</th>
              <th className="px-4 py-3 font-normal">Client</th>
              <th className="px-4 py-3 font-normal">Session</th>
              <th className="px-4 py-3 font-normal">Date</th>
              <th className="px-4 py-3 font-normal">Amount</th>
              <th className="px-4 py-3 font-normal">Payment</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking) => (
              <tr key={booking.id} className="border-b border-ink/5 align-middle hover:bg-sand/40">
                <td className="px-4 py-3 font-mono text-[11px] text-smoke">{booking.code}</td>
                <td className="px-4 py-3">
                  <p className="text-ink">{booking.customer_name}</p>
                  <p className="text-[11px] text-smoke">{booking.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[12px] text-ink">{booking.category_name ?? "—"}</p>
                  <p className="text-[11px] text-smoke">{booking.package_name}</p>
                </td>
                <td className="px-4 py-3 text-[12px]">
                  {formatDate(booking.date, { month: "short" })}
                  <span className="block text-[11px] text-smoke">{booking.time_slot}</span>
                </td>
                <td className="px-4 py-3 text-[12px]">{formatAUD(booking.amount)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-[0.12em]",
                      booking.payment_status === "paid"
                        ? "text-emerald-700"
                        : booking.payment_status === "unpaid"
                          ? "text-rose-700"
                          : "text-amber-700",
                    )}
                  >
                    {PAYMENT_LABEL[booking.payment_status] ?? booking.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("border px-2 py-1 text-[9px] uppercase tracking-[0.14em]", BOOKING_STATUS[booking.status]?.className)}>
                    {BOOKING_STATUS[booking.status]?.label ?? booking.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/bookings/${booking.id}`} className="text-[10px] uppercase tracking-[0.14em] text-ink link-underline">
                      Open
                    </Link>
                    {booking.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => approve(booking.id)}
                        disabled={busy === booking.id}
                        className="text-[10px] uppercase tracking-[0.14em] text-emerald-700 hover:text-emerald-900"
                      >
                        {busy === booking.id ? "…" : "Approve"}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="px-5 py-14 text-center text-xs text-smoke">No bookings match those filters.</p>
        ) : null}
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-smoke/60">
        {filtered.length} of {bookings.length} bookings
      </p>
    </div>
  );
}
