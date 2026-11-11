import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { getAvailability, getBlockedDates } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const [days, blocked] = await Promise.all([getAvailability(), getBlockedDates()]);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Availability</p>
        <h1 className="display mt-2 text-3xl">Your working calendar</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          The booking engine only offers slots inside these hours, skips blocked dates, and refuses to
          double-book a slot.
        </p>
      </div>
      <AvailabilityManager
        days={days.map((day) => ({
          weekday: day.weekday,
          is_working: day.is_working,
          start_time: day.start_time,
          end_time: day.end_time,
          slot_minutes: day.slot_minutes,
          capacity: day.capacity,
        }))}
        blocked={blocked}
      />
    </div>
  );
}
