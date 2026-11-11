import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/lib/data";
import { sizedImage } from "@/lib/img";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About",
  description: "About Mara's Photography — on-location photography in Sydney, NSW.",
};

const PROCESS = [
  {
    step: "01",
    title: "Conversation",
    body: "We begin with a call or a coffee. What is this for, who is in it, and what do you want to feel when you look at the photographs in ten years?",
  },
  {
    step: "02",
    title: "The plan",
    body: "A moodboard, a loose shot list, timings and locations. Enough structure to keep the day calm, enough freedom to let it be real.",
  },
  {
    step: "03",
    title: "The day",
    body: "We arrive early, shoot quietly, and direct only when it helps. Most clients tell us they forgot the camera was there by the second hour.",
  },
  {
    step: "04",
    title: "The edit",
    body: "Hand-retouched with restraint — no heavy smoothing, no borrowed trends. A sneak peek in 72 hours, the full gallery in 10 working days.",
  },
];

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <section className="relative h-[70vh] min-h-[460px] overflow-hidden bg-ink">
        <img
          src={sizedImage(settings.heroImage2, 2000)}
          alt="A wedding photographed on location in Sydney"
          className="absolute inset-0 h-full w-full animate-kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/50" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1680px] flex-col justify-end px-6 pb-14 sm:px-10 lg:px-16">
          <Reveal>
            <p className="eyebrow text-champagne/90">The photographer</p>
            <h1 className="display mt-5 max-w-3xl text-balance text-[clamp(2.8rem,6vw,5rem)] text-cream">
              Founded on patience, not trends
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
          <Reveal>
            <h2 className="display text-balance text-[clamp(2rem,3.8vw,3rem)] text-ink">
              {settings.aboutTitle}
            </h2>
            {settings.aboutBody.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 20)} className="mt-6 text-[15px] leading-[1.85] text-smoke">
                {paragraph}
              </p>
            ))}
            {settings.founderVisible
              ? settings.founderBio
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={`bio-${index}`} className="mt-6 text-[15px] leading-[1.85] text-smoke">
                      {paragraph}
                    </p>
                  ))
              : null}
            {settings.founderVisible
              ? settings.founderExperience
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={`exp-${index}`} className="mt-6 text-[15px] leading-[1.85] text-smoke">
                      {paragraph}
                    </p>
                  ))
              : null}
            {settings.aboutStats.length ? (
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-ink/10 pt-8 sm:grid-cols-4">
                {settings.aboutStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="display text-3xl">{stat.value}</p>
                    <p className="mt-1 text-[9px] uppercase leading-relaxed tracking-[0.18em] text-smoke">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Reveal>
          <Reveal delay={120} className="relative">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={sizedImage(settings.founderPortrait || settings.aboutImage, 1200)}
                alt={settings.founderName || "Founder portrait"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            {settings.founderVisible ? (
              <div className="mt-4 border-l-2 border-champagne pl-4">
                <p className="font-serif text-lg italic text-ink">
                  {settings.founderIntro || "“Photography is mostly listening.”"}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-smoke">
                  {settings.founderName || "Founder"}, {settings.founderRole}
                </p>
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      <section className="bg-ink py-20 text-cream lg:py-28">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 lg:px-16">
          <Reveal>
            <p className="eyebrow text-champagne/80">How we work</p>
            <h2 className="display mt-4 max-w-2xl text-[clamp(2rem,4vw,3rem)]">
              A quiet, four-part process
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item, i) => (
              <Reveal key={item.step} delay={i * 80}>
                <p className="font-serif text-5xl text-champagne/40">{item.step}</p>
                <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-20 sm:px-10 lg:px-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            {
              title: "Equipment",
              body: "Professional camera bodies and prime lenses, with lighting brought when a location needs it. Files are backed up before leaving a venue.",
            },
            {
              title: "Days & hours",
              body: "There is no studio to visit — Mara comes to you. Sessions run seven days around light, with golden-hour slots scheduled to the sunset and the exact window confirmed before the day.",
            },
            {
              title: "Where we work",
              body: "Based in Sydney, NSW. Sessions take place on location anywhere across Sydney; further travel is quoted individually.",
            },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <p className="eyebrow">{item.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-smoke">{item.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 flex flex-col items-center gap-6 border-t border-ink/10 pt-14 text-center">
          <h2 className="display max-w-xl text-balance text-3xl sm:text-4xl">
            Come and make something worth keeping.
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/book" className="btn-dark">Book a session</Link>
            <Link href="/work" className="btn-outline">See the work</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
