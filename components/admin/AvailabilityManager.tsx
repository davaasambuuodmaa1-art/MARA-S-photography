"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addBlockedDateAction,
  removeBlockedDateAction,
  saveAvailabilityAction,
} from "@/app/actions/admin";
import { cn, formatDate, todayISO } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Day {
  weekday: number;
  is_working: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  capacity: number;
}

export function AvailabilityManager({
  days,
  blocked,
}: {
  days: Day[];
  blocked: { date: string; reason: string }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(days);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [block, setBlock] = useState({ date: "", reason: "" });

  const save = async (row: Day) => {
    setBusy(`day-${row.weekday}`);
    setError(null);
    const result = await saveAvailabilityAction({
      weekday: row.weekday,
      is_working: Boolean(row.is_working),
      start_time: row.start_time,
      end_time: row.end_time,
      slot_minutes: row.slot_minutes,
      capacity: row.capacity,
    });
    setBusy(null);
    if (result.ok) {
      setMessage(`${DAYS[row.weekday]} updated.`);
      setTimeout(() => setMessage(null), 2500);
      router.refresh();
    } else setError(result.error);
  };

  const addBlocked = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy("block");
    const result = await addBlockedDateAction(block.date, block.reason);
    setBusy(null);
    if (result.ok) {
      setBlock({ date: "", reason: "" });
      router.refresh();
    } else setError(result.error);
  };

  return (
    <div className="space-y-6">
      {message ? <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p> : null}
      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p> : null}

      <div className="border border-ink/12 bg-white/70">
        <div className="border-b border-ink/10 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Working week</p>
          <p className="mt-1 text-[11px] text-smoke/70">
            Slots are generated from opening hours. Booked slots disappear from the website instantly.
          </p>
        </div>
        <div className="divide-y divide-ink/5">
          {rows.map((row, index) => (
            <div key={row.weekday} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <label className="flex w-32 items-center gap-2 text-xs text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(row.is_working)}
                  onChange={(event) => {
                    const next = [...rows];
                    next[index] = { ...row, is_working: event.target.checked ? 1 : 0 };
                    setRows(next);
                  }}
                />
                {DAYS[row.weekday]}
              </label>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-smoke">
                <input
                  type="time"
                  value={row.start_time}
                  disabled={!row.is_working}
                  onChange={(event) => {
                    const next = [...rows];
                    next[index] = { ...row, start_time: event.target.value };
                    setRows(next);
                  }}
                  className="field w-28 py-1.5 text-xs disabled:opacity-40"
                />
                <span>to</span>
                <input
                  type="time"
                  value={row.end_time}
                  disabled={!row.is_working}
                  onChange={(event) => {
                    const next = [...rows];
                    next[index] = { ...row, end_time: event.target.value };
                    setRows(next);
                  }}
                  className="field w-28 py-1.5 text-xs disabled:opacity-40"
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-smoke">
                Slot
                <select
                  value={row.slot_minutes}
                  disabled={!row.is_working}
                  onChange={(event) => {
                    const next = [...rows];
                    next[index] = { ...row, slot_minutes: Number(event.target.value) };
                    setRows(next);
                  }}
                  className="field w-24 py-1.5 text-xs disabled:opacity-40"
                >
                  {[60, 90, 120, 180, 240, 360].map((minutes) => (
                    <option key={minutes} value={minutes}>{minutes} min</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-smoke">
                Capacity
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={row.capacity}
                  disabled={!row.is_working}
                  onChange={(event) => {
                    const next = [...rows];
                    next[index] = { ...row, capacity: Number(event.target.value) };
                    setRows(next);
                  }}
                  className="field w-16 py-1.5 text-xs disabled:opacity-40"
                />
              </label>
              <button
                type="button"
                onClick={() => save(row)}
                disabled={busy === `day-${row.weekday}`}
                className={cn("ml-auto text-[9px] uppercase tracking-[0.14em] text-gold hover:text-ink disabled:opacity-50")}
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={addBlocked} className="border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Block a date</p>
          <p className="mt-1 text-[11px] text-smoke/70">Holidays, travel, or a day you need for editing.</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                min={todayISO()}
                value={block.date}
                onChange={(event) => setBlock({ ...block, date: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label">Reason (shown to clients)</label>
              <input
                value={block.reason}
                onChange={(event) => setBlock({ ...block, reason: event.target.value })}
                className="field"
                placeholder="Studio closed — team offsite"
              />
            </div>
            <button type="submit" disabled={busy === "block"} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
              Block date
            </button>
          </div>
        </form>

        <div className="border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Blocked dates</p>
          {blocked.length ? (
            <div className="mt-4 divide-y divide-ink/10">
              {blocked.map((row) => (
                <div key={row.date} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-[12px] text-ink">{formatDate(row.date)}</p>
                    <p className="text-[10px] text-smoke">{row.reason || "Unavailable"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeBlockedDateAction(row.date);
                      router.refresh();
                    }}
                    className="text-[9px] uppercase tracking-[0.14em] text-rose-700 hover:text-rose-900"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-smoke">No blocked dates — the whole working week is open.</p>
          )}
        </div>
      </div>
    </div>
  );
}
