import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/lib/data";
import { currentSiteLocale } from "@/lib/current-site-locale";
import { localizeSiteContent } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const [settings, locale] = await Promise.all([getSiteSettings(), currentSiteLocale()]);
  const mn = locale === "mn";
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">{mn ? "Нууцлал" : "Privacy"}</p>
        <h1 className="display mt-4 text-4xl">{mn ? "Нууцлалын бодлого" : "Privacy policy"}</h1>
      </Reveal>
      <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-smoke">
        {localizeSiteContent(settings.privacyPolicy || (mn ? "Нууцлалын бодлогыг сайтын эзэмшигч оруулна." : "Privacy policy to be added by the owner."), locale)}
      </div>
    </section>
  );
}
