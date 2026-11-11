"use client";

import Link from "next/link";
import { useState } from "react";
import { lookupBookingAction } from "@/app/actions/bookings";
import { BOOKING_STATUS, formatDate, cn } from "@/lib/utils";

export function BookingLookup() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    code: string;
    status: string;
    date: string;
    time: string;
    name: string;
  } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await lookupBookingAction(code, email);
    setBusy(false);
    if (response.ok) setResult(response);
    else setError(response.error);
  };

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={submit} className="space-y-5 border border-ink/12 bg-white/70 p-8">
        <div>
          <label className="label" htmlFor="lookup-code">Booking reference</label>
          <input
            id="lookup-code"
            className="field font-mono uppercase tracking-widest"
            placeholder="MR-XXXXXX"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="lookup-email">Email used for the booking</label>
          <input
            id="lookup-email"
            type="email"
            className="field"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
        ) : null}
        <button type="submit" disabled={busy} className={cn("btn-dark w-full", busy && "opacity-60")}>
          {busy ? "Looking…" : "Find my booking"}
        </button>
      </form>

      {result ? (
        <div className="mt-6 border border-ink/12 bg-cream p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-smoke">{result.code}</p>
              <p className="mt-1 font-serif text-2xl">{result.name}</p>
            </div>
            <span
              className={cn(
                "border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]",
                BOOKING_STATUS[result.status]?.className,
              )}
            >
              {BOOKING_STATUS[result.status]?.label ?? result.status}
            </span>
          </div>
          <p className="mt-4 text-sm text-smoke">
            {formatDate(result.date)} · {result.time}
          </p>
          <Link href={`/booking/${result.code}`} className="btn-outline mt-5 w-full">
            Open full booking
          </Link>
        </div>
      ) : null}

      <p className="mt-8 text-center text-[11px] leading-relaxed text-smoke/70">
        Signed in? All of your bookings live in{" "}
        <Link href="/account" className="underline">your account</Link>.
      </p>
    </div>
  );
}
