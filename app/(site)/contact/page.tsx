import { Accordion } from "@/components/site/Accordion";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact",
  description: "Speak with Mara about portraits, weddings, brand commissions and shoot locations across Sydney.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const mapQuery = encodeURIComponent(settings.address);

  return (
    <>
      <section className="border-b border-ink/10 bg-sand/40 pb-14 pt-36 lg:pb-16 lg:pt-44">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 lg:px-16">
          <Reveal>
            <p className="eyebrow">Contact</p>
            <h1 className="display mt-5 max-w-3xl text-balance text-[clamp(2.8rem,6vw,5rem)] text-ink">
              Tell us what you have in mind
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-smoke">
              Whether it is a wedding two years away or a portrait next Tuesday, we would love to hear
              about it. Every enquiry reaches Mara directly.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <Reveal>
            <h2 className="display text-2xl">Send a message</h2>
            <div className="mt-6">
              <ContactForm
                subjects={[
                  "Wedding enquiry",
                  "Portrait or family session",
                  "Brand / commercial project",
                  "Bespoke commission",
                  "General enquiry",
                ]}
              />
            </div>
          </Reveal>

          <Reveal delay={120} className="space-y-9">
            <div>
              <p className="eyebrow">Service area</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{settings.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-[10px] uppercase tracking-[0.22em] text-gold link-underline"
              >
                Open in maps →
              </a>
            </div>

            <div className="grid gap-6 border-t border-ink/10 pt-7 sm:grid-cols-2">
              <div>
                <p className="eyebrow">Email</p>
                <a href={`mailto:${settings.email}`} className="mt-2 block text-sm text-ink link-underline">
                  {settings.email}
                </a>
              </div>
              <div>
                <p className="eyebrow">Telephone</p>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="mt-2 block text-sm text-ink">
                  {settings.phone}
                </a>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-7">
              <p className="eyebrow">Hours</p>
              <div className="mt-3 space-y-1 text-sm text-smoke">
                <p className="flex justify-between"><span>Tuesday – Friday</span><span>09:00 – 18:00</span></p>
                <p className="flex justify-between"><span>Saturday – Sunday</span><span>09:00 – 17:00</span></p>
                <p className="flex justify-between text-smoke/60"><span>Monday</span><span>Closed</span></p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-7">
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="btn-dark"
              >
                WhatsApp
              </a>
              <a href={`mailto:${settings.email}`} className="btn-outline">
                Email Mara
              </a>
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="btn-outline">
                Instagram
              </a>
            </div>

            <div className="border border-ink/10 bg-white/60 p-6">
              <p className="font-serif text-lg italic text-ink">
                “If you are unsure what you need, just say hello. We will figure it out together.”
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-20 max-w-3xl">
          <h2 className="display text-3xl">Frequently asked</h2>
          <div className="mt-8">
            <Accordion items={settings.faqs} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
