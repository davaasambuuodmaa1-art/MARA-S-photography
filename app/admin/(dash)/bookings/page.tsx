import { BookingsTable } from "@/components/admin/BookingsTable";
import { listBookings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const bookings = await listBookings(status && status !== "all" ? { status } : {});

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Bookings</p>
        <h1 className="display mt-2 text-3xl">Requests & sessions</h1>
        <p className="mt-2 text-sm text-smoke">
          Approve, reschedule, take payment and close out every session from here.
        </p>
      </div>
      <BookingsTable
        bookings={bookings.map((b) => ({
          id: b.id,
          code: b.code,
          customer_name: b.customer_name,
          email: b.email,
          date: b.date,
          time_slot: b.time_slot,
          status: b.status,
          payment_status: b.payment_status,
          amount: b.amount,
          category_name: b.category_name,
          package_name: b.package_name,
        }))}
      />
    </div>
  );
}
