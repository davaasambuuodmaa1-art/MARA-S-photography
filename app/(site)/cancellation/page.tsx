import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CancellationPage() {
  const settings = await getSiteSettings();
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">Cancellation</p>
        <h1 className="display mt-4 text-4xl">Cancellation policy</h1>
      </Reveal>
      <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-smoke">
        {settings.cancellationPolicy || "Cancellation policy to be added by the owner."}
      </div>
      {settings.refundPolicy.trim() ? (
        <div className="mt-12">
          <Reveal>
            <p className="eyebrow">Refunds</p>
            <h2 className="display mt-3 text-3xl">Refund policy</h2>
          </Reveal>
          <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-smoke">
            {settings.refundPolicy}
          </div>
        </div>
      ) : null}
    </section>
  );
}
