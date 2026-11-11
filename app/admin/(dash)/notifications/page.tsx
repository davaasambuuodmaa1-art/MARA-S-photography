import { NotificationsList } from "@/components/admin/NotificationsList";
import { listNotifications } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const notifications = await listNotifications(80);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Notifications</p>
        <h1 className="display mt-2 text-3xl">Studio activity</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          New bookings, verified payments, cancellations, enquiries and gallery changes — every event
          is recorded here, with live badges in the header.
        </p>
      </div>
      <NotificationsList
        notifications={notifications.map((note) => ({
          id: note.id,
          type: note.type,
          title: note.title,
          body: note.body,
          link: note.link,
          read: note.read,
          created_at: note.created_at,
        }))}
      />
    </div>
  );
}
