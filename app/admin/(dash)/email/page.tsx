import { EmailSettings } from "@/components/admin/EmailSettings";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  const settings = await getSiteSettings();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Email</p>
        <h1 className="display mt-2 text-3xl">Delivery &amp; notifications</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Configure sender details, recipients and templates. Delivery uses the provider you connect
          through environment variables — nothing is simulated. If a provider is not configured, test
          messages fail visibly.
        </p>
      </div>
      <EmailSettings settings={settings} />
    </div>
  );
}
