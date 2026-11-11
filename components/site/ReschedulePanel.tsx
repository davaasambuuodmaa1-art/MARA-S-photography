"use client";

import { useState } from "react";
import { requestRescheduleAction } from "@/app/actions/bookings";

export function ReschedulePanel({
  code,
  email,
  date,
  time,
  rainPolicy,
  whatsapp,
}: {
  code: string;
  email: string;
  date: string;
  time: string;
  rainPolicy: string;
  whatsapp: string;
}) {
  const [open, setOpen] = useState(false);
  const [preferredDate, setPreferredDate] = useState(date);
  const [preferredTime, setPreferredTime] = useState(time);
  const [reason, setReason] = useState("");
  const [weather, setWeather] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await requestRescheduleAction({
      code,
      email,
      date: preferredDate,
      time: preferredTime,
      reason,
      weather,
    });
    setBusy(false);
    if (result.ok) {
      setDone("Request sent. Mara will confirm the new time with you.");
      setOpen(false);
    } else setError(result.error);
  };

  return (
    <div className="border border-ink/12 bg-white/50 p-6 text-sm">
      <p className="eyebrow">Weather or a change of plan</p>
      <p className="mt-3 text-xs leading-relaxed text-smoke">{rainPolicy}</p>

      {done ? (
        <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] leading-relaxed text-emerald-800">
          {done}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">{error}</p>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">New date</label>
              <input
                type="date"
                className="field py-2 text-xs"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
              />
            </div>
            <div>
              <label className="label">Preferred time</label>
              <select
                className="field py-2 text-xs"
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
              >
                {["07:00", "09:00", "11:00", "14:00", "16:00", "18:00", "Golden hour (sunset)"].map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Anything we should know?</label>
            <textarea
              rows={2}
              className="field resize-none text-xs"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Forecast, illness, travel plans…"
            />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-smoke">
            <input type="checkbox" checked={weather} onChange={(event) => setWeather(event.target.checked)} />
            This is because of the weather
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
            >
              {busy ? "Sending…" : "Request new date"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[9px] uppercase tracking-[0.14em] text-smoke"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] leading-relaxed text-smoke/70">
            Nothing moves until Mara approves the new time — you will get a notification either way.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-dark py-2.5 text-[9px]"
          >
            Request a new date
          </button>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline py-2.5 text-[9px]"
          >
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
