import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/lib/data";
import { currentSiteLocale } from "@/lib/current-site-locale";
import { localizeSiteContent } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function CancellationPage() {
  const [settings, locale] = await Promise.all([getSiteSettings(), currentSiteLocale()]);
  const mn = locale === "mn";
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">{mn ? "Цуцлалт" : "Cancellation"}</p>
        <h1 className="display mt-4 text-4xl">{mn ? "Цуцлах журам" : "Cancellation policy"}</h1>
      </Reveal>
      <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-smoke">
        {localizeSiteContent(settings.cancellationPolicy || (mn ? "Цуцлах журмыг сайтын эзэмшигч оруулна." : "Cancellation policy to be added by the owner."), locale)}
      </div>
      {settings.refundPolicy.trim() ? (
        <div className="mt-12">
          <Reveal>
            <p className="eyebrow">{mn ? "Буцаан олголт" : "Refunds"}</p>
            <h2 className="display mt-3 text-3xl">{mn ? "Төлбөр буцаах журам" : "Refund policy"}</h2>
          </Reveal>
          <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-smoke">
            {localizeSiteContent(settings.refundPolicy, locale)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
