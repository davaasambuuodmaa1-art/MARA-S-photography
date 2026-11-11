import { all } from "@/lib/db";
import { getBlockedDates, getAvailability } from "@/lib/data";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const [bookings, blocked, availability] = await Promise.all([
    all<Booking>(
      "SELECT * FROM bookings WHERE status NOT IN ('cancelled','rejected') ORDER BY date ASC, time ASC",
    ),
    getBlockedDates(),
    getAvailability(),
  ]);

  const byDate = new Map<string, Booking[]>();
  for (const booking of bookings) {
    if (!byDate.has(booking.date)) byDate.set(booking.date, []);
    byDate.get(booking.date)!.push(booking);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Calendar</p>
        <h1 className="display mt-2 text-3xl">Schedule &amp; availability</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Working days, hours and buffers are configured under Availability. Blocked dates appear below.
          Double bookings are prevented at submission time by checking the selected date and time.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-ink/12 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Working days</p>
          <p className="mt-2 text-sm text-ink">
            {availability.filter((a) => a.is_working).map((a) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][a.weekday]).join(", ") || "—"}
          </p>
        </div>
        <div className="border border-ink/12 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Working hours</p>
          <p className="mt-2 text-sm text-ink">
            {availability.length ? `${availability[0].start_time} – ${availability[0].end_time}` : "—"}
          </p>
        </div>
        <div className="border border-ink/12 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Slot length</p>
          <p className="mt-2 text-sm text-ink">
            {availability.length ? `${availability[0].slot_minutes} minutes` : "—"}
          </p>
        </div>
      </section>

      {blocked.length ? (
        <section className="border border-ink/12 bg-white/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Blocked dates</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {blocked.map((entry) => (
              <span key={entry.date} className="border border-ink/15 px-2 py-1 text-[10px] text-smoke">
                {entry.date}{entry.reason ? ` — ${entry.reason}` : ""}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-4">
        {byDate.size === 0 ? (
          <p className="border border-ink/12 bg-white/70 p-6 text-center text-sm text-smoke">No upcoming bookings.</p>
        ) : null}
        {Array.from(byDate.entries()).map(([date, items]) => (
          <section key={date} className="border border-ink/12 bg-white/70">
            <header className="border-b border-ink/10 px-4 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">{date}</p>
            </header>
            <ul className="divide-y divide-ink/10">
              {items.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-serif text-[15px]">{booking.customer_name}</p>
                    <p className="text-[10px] text-smoke">
                      {booking.time_slot} · {booking.package_name} · {booking.location || "location to be confirmed"}
                    </p>
                  </div>
                  <span className="border border-ink/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-smoke">
                    {booking.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
