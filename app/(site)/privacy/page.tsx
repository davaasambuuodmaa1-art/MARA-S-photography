import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">Privacy</p>
        <h1 className="display mt-4 text-4xl">Privacy policy</h1>
      </Reveal>
      <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-smoke">
        {settings.privacyPolicy || "Privacy policy to be added by the owner."}
      </div>
    </section>
  );
}
