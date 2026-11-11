import { PrivateGalleriesManager, type AdminGallery } from "@/components/admin/PrivateGalleriesManager";
import { getPrivateGalleries } from "@/lib/data";
import { all } from "@/lib/db";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPrivateGalleriesPage() {
  const [rows, bookings] = await Promise.all([
    getPrivateGalleries(),
    all<Booking>(
      "SELECT * FROM bookings WHERE status NOT IN ('cancelled','rejected') ORDER BY date DESC LIMIT 80",
    ),
  ]);

  const galleries: AdminGallery[] = rows.map((gallery) => {
    let images: string[] = [];
    try {
      const parsed = JSON.parse(gallery.images);
      if (Array.isArray(parsed)) images = parsed.map(String);
    } catch {
      images = [];
    }
    return {
      id: gallery.id,
      title: gallery.title,
      customerName: gallery.customer_name,
      customerEmail: gallery.customer_email,
      bookingId: gallery.booking_id,
      note: gallery.note,
      expiresAt: gallery.expires_at,
      downloads: Boolean(gallery.downloads),
      published: Boolean(gallery.published),
      images,
      token: gallery.token,
      createdAt: gallery.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Private galleries</p>
        <h1 className="display mt-2 text-3xl">Deliver the photographs</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          One gallery per session, linked to the client&apos;s email. Nothing is public: a gallery only
          opens for the matching signed-in account or the private link, and it can expire on a date you
          choose. Downloads are optional.
        </p>
      </div>
      <PrivateGalleriesManager
        galleries={galleries}
        bookings={bookings.map((booking) => ({
          id: booking.id,
          code: booking.code,
          name: booking.customer_name,
          email: booking.email,
          date: booking.date,
        }))}
      />
    </div>
  );
}
