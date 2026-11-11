import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { Accordion } from "@/components/site/Accordion";
import { finalPrice, getPackages, getSiteSettings, packageFeatures } from "@/lib/data";
import { formatAUD } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sessions & Pricing",
  description: "Photography packages from Mara's Photography — one-hour sittings to full editorial productions.",
};

export default async function PackagesPage() {
  const [packages, settings] = await Promise.all([getPackages(), getSiteSettings()]);

  return (
    <>
      <section className="border-b border-ink/10 bg-sand/40 pb-16 pt-36 lg:pb-20 lg:pt-44">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 lg:px-16">
          <Reveal>
            <p className="eyebrow">Sessions & pricing</p>
            <h1 className="display mt-5 max-w-4xl text-balance text-[clamp(3rem,7vw,5.6rem)] text-ink">
              Time, attention, and a finished body of work
            </h1>
            <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-smoke">
              Every session includes Mara&apos;s direction on the day, professional retouching and a
              private online gallery. Prices below are complete — no hidden deliverables, no upsell
              you did not ask for.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="grid gap-5 lg:grid-cols-2">
          {packages.map((pkg, i) => {
            const price = finalPrice(pkg);
            const features = packageFeatures(pkg);
            return (
              <Reveal key={pkg.id} delay={i * 60}>
                <div className="flex h-full flex-col justify-between border border-ink/12 bg-white/60 p-8 transition-colors hover:border-ink/25 sm:p-10">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.28em] text-smoke">
                          {pkg.duration_hours}h · {pkg.edited_photos ? `${pkg.edited_photos} images` : "Custom scope"}
                        </p>
                        <h2 className="display mt-3 text-3xl">{pkg.name}</h2>
                      </div>
                      {pkg.badge ? (
                        <span className="border border-gold/50 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-gold">
                          {pkg.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 font-serif text-lg italic text-smoke">{pkg.tagline}</p>
                    <div className="mt-7 flex flex-wrap items-end gap-3">
                      {pkg.price === 0 ? (
                        <span className="display text-3xl">Quoted within 48h</span>
                      ) : (
                        <>
                          <span className="display text-4xl">{formatAUD(price)}</span>
                          {pkg.discount_percent > 0 ? (
                            <span className="pb-1 text-sm text-smoke/60 line-through">{formatAUD(pkg.price)}</span>
                          ) : null}
                          <span className="pb-1 text-[10px] uppercase tracking-[0.18em] text-smoke">
                            · {pkg.deposit_percent}% deposit
                          </span>
                        </>
                      )}
                    </div>
                    <ul className="mt-7 space-y-2.5 border-t border-ink/10 pt-6 text-sm text-smoke">
                      {features.map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <span className="text-gold">—</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link href={`/book?package=${pkg.slug}`} className="btn-dark flex-1 text-center">
                      Book {pkg.name}
                    </Link>
                    <Link href="/contact" className="btn-outline">
                      Ask a question
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-16 grid gap-8 border-t border-ink/10 pt-12 sm:grid-cols-3">
          {[
            {
              title: "The deposit",
              body: `A ${settings.depositPercent}% deposit reserves your date. The balance is due seven days before the session, and instalments can be arranged for larger commissions.`,
            },
            {
              title: "Travel",
              body: "Greater Sydney travel is included. The Blue Mountains, Hunter Valley and international locations are quoted at cost, always transparently.",
            },
            {
              title: "Rescheduling",
              body: "Life happens. You may move your session once at no cost up to 72 hours before your booking, subject to availability.",
            },
          ].map((item) => (
            <div key={item.title}>
              <p className="eyebrow">{item.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-smoke">{item.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="mt-20">
          <h2 className="display text-3xl">Packages, answered</h2>
          <div className="mt-8">
            <Accordion items={settings.faqs.slice(0, 5)} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
