import { FounderManager } from "@/components/admin/FounderManager";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminFounderPage() {
  const settings = await getSiteSettings();
  const configured = Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Founder</p>
        <h1 className="display mt-2 text-3xl">Your story, in your words</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          The demo biography and statistics that shipped with the site have been cleared — they were
          placeholder copy, not facts about you. Write your own introduction here and upload a portrait.
          This is also where you control whether the founder section appears at all.
        </p>
        <p className="mt-2 text-[11px] text-smoke/70">
          Email delivery: {configured ? "provider connected" : "no provider connected yet"} — see{" "}
          <a href="/admin/email" className="text-gold underline">
            Email settings
          </a>
          .
        </p>
      </div>
      <FounderManager settings={settings} />
    </div>
  );
}
