import { GeneralSettings } from "@/components/admin/GeneralSettings";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminGeneralPage() {
  const settings = await getSiteSettings();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">General settings</p>
        <h1 className="display mt-2 text-3xl">Business &amp; policies</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Currency, contact details, social links, manual bank transfer instructions and the policies
          shown on the public site.
        </p>
      </div>
      <GeneralSettings settings={settings} />
    </div>
  );
}
