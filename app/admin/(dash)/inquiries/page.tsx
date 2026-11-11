import { InquiriesManager } from "@/components/admin/InquiriesManager";
import { listInquiries } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await listInquiries();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Enquiries</p>
        <h1 className="display mt-2 text-3xl">Messages from the website</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Every contact form submission lands here and triggers a notification.
        </p>
      </div>
      <InquiriesManager
        inquiries={inquiries.map((inquiry) => ({
          id: inquiry.id,
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          subject: inquiry.subject,
          message: inquiry.message,
          status: inquiry.status,
          created_at: inquiry.created_at,
        }))}
      />
    </div>
  );
}
