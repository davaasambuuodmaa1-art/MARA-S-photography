import { CustomersManager } from "@/components/admin/CustomersManager";
import { listBookings, listCustomers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const [customers, bookings] = await Promise.all([listCustomers(), listBookings({})]);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Customers</p>
        <h1 className="display mt-2 text-3xl">The people you photograph</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Contact details, booking history, spend and private notes — everything in one place.
        </p>
      </div>
      <CustomersManager
        customers={customers.map((customer) => ({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          bookings: Number(customer.bookings),
          spent: Number(customer.spent),
          last_booking: customer.last_booking,
          notes: customer.notes,
        }))}
        bookings={bookings.map((booking) => ({
          id: booking.id,
          code: booking.code,
          email: booking.email,
          date: booking.date,
          time_slot: booking.time_slot,
          status: booking.status,
          amount: booking.amount,
          category_name: booking.category_name,
        }))}
      />
    </div>
  );
}
