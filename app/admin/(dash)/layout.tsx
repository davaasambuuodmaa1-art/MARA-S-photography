import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { currentAdmin } from "@/lib/auth";
import { unreadNotificationCount } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio Manager" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const unread = await unreadNotificationCount();

  return (
    <AdminShell user={{ name: admin.name, email: admin.email }} unread={unread}>
      {children}
    </AdminShell>
  );
}
