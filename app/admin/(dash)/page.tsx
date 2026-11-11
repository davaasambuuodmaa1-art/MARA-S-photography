import Link from "next/link";
import { RevenueChart, StatCard, StatusBars } from "@/components/admin/Charts";
import { bookingStats, getAvailability, listBookings, listNotifications } from "@/lib/data";
import { BOOKING_STATUS, cn, formatDate, formatDateTime, formatAUD, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const stats = await bookingStats();
  const recentBookings = await listBookings({});
  const notifications = await listNotifications(6);
  const availability = await getAvailability();

  const pending = recentBookings.filter((b) => b.status === "pending").slice(0, 5);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Overview</p>
          <h1 className="display mt-2 text-3xl">The studio at a glance</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/bookings" className="btn-outline py-2.5 text-[9px]">All bookings</Link>
          <Link href="/admin/galleries" className="btn-dark py-2.5 text-[9px]">Manage galleries</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bookings" value={String(stats.total)} hint={`${stats.pending} awaiting review`} accent />
        <StatCard label="Verified revenue" value={formatAUD(stats.revenue)} hint={`${formatAUD(stats.outstanding)} outstanding`} />
        <StatCard label="Completed shoots" value={String(stats.completed)} hint={`${stats.approved} confirmed upcoming`} />
        <StatCard label="Clients" value={String(stats.totalCustomers)} hint={`${stats.newInquiries} new enquiries`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="border border-ink/12 bg-white/70 p-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Revenue</p>
            <span className="text-[9px] uppercase tracking-[0.16em] text-smoke/60">verified only</span>
          </div>
          <div className="mt-4">
            <RevenueChart data={stats.monthly} />
          </div>
        </div>

        <div className="border border-ink/12 bg-white/70 p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Booking pipeline</p>
          <div className="mt-5">
            <StatusBars
              rows={[
                { label: "Pending review", value: stats.pending, tone: "#d97706" },
                { label: "Approved / awaiting payment", value: stats.approved, tone: "#0284c7" },
                { label: "Paid, upcoming", value: stats.paidCount, tone: "#059669" },
                { label: "Completed", value: stats.completed, tone: "#78716c" },
                { label: "Cancelled / rejected", value: stats.cancelled, tone: "#be123c" },
              ]}
            />
          </div>
          <div className="mt-6 border-t border-ink/10 pt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">This week</p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {availability.map((day) => (
                <div key={day.weekday} className="text-center">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-smoke/60">{days[day.weekday].slice(0, 2)}</p>
                  <div
                    className={cn(
                      "mt-1 h-8 border text-[8px] leading-8",
                      day.is_working ? "border-ink/10 bg-sand/60 text-ink/60" : "border-ink/5 bg-ink/5 text-smoke/40",
                    )}
                  >
                    {day.is_working ? `${day.start_time.slice(0, 2)}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="border border-ink/12 bg-white/70">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Awaiting your review</p>
            <Link href="/admin/bookings?status=pending" className="text-[9px] uppercase tracking-[0.16em] text-gold">View all</Link>
          </div>
          {pending.length ? (
            <div className="divide-y divide-ink/5">
              {pending.map((booking) => (
                <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-sand/50">
                  <div>
                    <p className="text-sm text-ink">{booking.customer_name}</p>
                    <p className="text-[11px] text-smoke">
                      {booking.category_name} · {formatDate(booking.date)} {booking.time_slot}
                    </p>
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.16em] text-amber-700">Review →</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-xs text-smoke">No requests waiting. Beautifully clear.</p>
          )}
        </div>

        <div className="border border-ink/12 bg-white/70">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Upcoming shoots</p>
            <Link href="/admin/availability" className="text-[9px] uppercase tracking-[0.16em] text-gold">Availability</Link>
          </div>
          {stats.upcoming.length ? (
            <div className="divide-y divide-ink/5">
              {stats.upcoming.map((booking) => (
                <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-sand/50">
                  <div>
                    <p className="text-sm text-ink">{booking.customer_name}</p>
                    <p className="text-[11px] text-smoke">
                      {booking.category_name ?? "Session"} · {booking.time_slot}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-ink">{formatDate(booking.date, { month: "short" })}</p>
                    <span className={cn("text-[9px] uppercase tracking-[0.14em]", BOOKING_STATUS[booking.status]?.className, "border px-1.5 py-0.5")}>
                      {BOOKING_STATUS[booking.status]?.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-xs text-smoke">Nothing on the calendar yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="border border-ink/12 bg-white/70">
          <div className="border-b border-ink/10 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Recent clients</p>
          </div>
          <div className="divide-y divide-ink/5">
            {stats.recentCustomers.map((customer) => (
              <div key={customer.email} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="text-sm">{customer.customer_name}</p>
                  <p className="text-[11px] text-smoke">{customer.email}</p>
                </div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">
                  {customer.total} booking{Number(customer.total) === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-ink/12 bg-white/70">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Latest activity</p>
            <Link href="/admin/notifications" className="text-[9px] uppercase tracking-[0.16em] text-gold">History</Link>
          </div>
          <div className="divide-y divide-ink/5">
            {notifications.map((note) => (
              <Link key={note.id} href={note.link ?? "/admin/notifications"} className="block px-5 py-3.5 hover:bg-sand/50">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[12px] text-ink">{note.title}</p>
                  {!note.read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" /> : null}
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-smoke/60">{formatDateTime(note.created_at)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.18em] text-smoke/50">
        Today is {formatDate(todayISO())} · all times AEST
      </p>
    </div>
  );
}
