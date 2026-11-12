import Link from "next/link";
import { Accordion } from "@/components/site/Accordion";
import { HeroEditorial } from "@/components/site/HeroEditorial";
import { MasonryGallery } from "@/components/site/MasonryGallery";
import { Reveal } from "@/components/site/Reveal";
import { TestimonialCarousel } from "@/components/site/TestimonialCarousel";
import {
  curatedFrames,
  finalPrice,
  getCategories,
  getPackages,
  getSiteSettings,
  getTestimonials,
  likeCounts,
  packageFeatures,
} from "@/lib/data";
import { sizedImage } from "@/lib/img";
import { formatAUD } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Front-page collections chosen for tonal harmony with the studio palette.
const CURATED = [
  "portrait-photography",
  "fashion-photography",
  "wedding-photography",
  "couple-photography",
  "architecture-photography",
  "nature-photography",
];

export default async function HomePage() {
  const [settings, categories, packages, testimonials, images] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getPackages(),
    getTestimonials(),
    curatedFrames(CURATED, 12),
  ]);
  const counts = await likeCounts(images.map((i) => i.id));
  const curated = CURATED.map((slug) => categories.find((c) => c.slug === slug)).filter(
    (c): c is (typeof categories)[number] => Boolean(c),
  );
  const featured = curated.length ? curated : categories.slice(0, 6);
  const taglineWords = settings.tagline.trim().split(" ");
  const heroAccent = taglineWords.slice(-1)[0] ?? settings.tagline;
  const heroLead = taglineWords.slice(0, -1).join(" ") || settings.tagline;

  return (
    <>
      {/* ---------------------------------- hero --------------------------------- */}
      <HeroEditorial
        eyebrow={settings.heroEyebrow}
        issue="Nº 01 — Sydney"
        lead={heroLead}
        accent={heroAccent}
        subtitle={settings.heroSubtitle}
        image={sizedImage(settings.heroImage, 2000)}
        insetImage={sizedImage(settings.heroImage2, 900)}
        meta={[
          { label: "Established", value: "2010" },
          { label: "Stories told", value: "1,240" },
          { label: "Atelier", value: "Sydney" },
        ]}
      />

      {/* -------------------------------- marquee -------------------------------- */}
      <div className="overflow-hidden border-y border-burgundy/20 bg-burgundy py-4">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap pr-12 text-[9px] uppercase tracking-[0.4em] text-cream/60">
          {[...categories, ...categories].map((category, i) => (
            <span key={`${category.slug}-${i}`} className="flex items-center gap-12">
              {category.name.replace(" Photography", "")}
              <span className="text-champagne">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* --------------------------------- intro --------------------------------- */}
      <section className="mx-auto max-w-[1680px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-24">
          <Reveal className="relative">
            <div className="relative overflow-hidden frame-print">
              <img
                src={sizedImage(settings.founderPortrait || "/images/founder-portrait.png", 1200)}
                alt={
                  settings.founderName
                    ? `${settings.founderName}, photographer`
                    : "MARA DAVAASAMBUU, photographer"
                }
                className="aspect-[4/5] h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent px-6 pb-6 pt-20 sm:px-8 sm:pb-8">
                <p className="text-[9px] uppercase tracking-[0.24em] text-champagne/90">
                  The photographer
                </p>
                <p className="display mt-3 text-balance text-[clamp(1.5rem,2.6vw,2.2rem)] leading-tight text-cream">
                  {settings.aboutTitle}
                </p>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal delay={120}>
              {(settings.founderVisible && settings.founderBio.trim()
                ? settings.founderBio
                : settings.aboutBody
              )
                .split("\n\n")
                .filter(Boolean)
                .slice(0, 1)
                .map((paragraph, index) => (
                  <p key={`story-${index}`} className="mt-6 text-[15px] leading-[1.85] text-smoke first:mt-0">
                    {paragraph}
                  </p>
                ))}
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-ink/10 pt-8 sm:grid-cols-4">
                {settings.aboutStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="display text-3xl text-ink">{stat.value}</p>
                    <p className="mt-1 text-[9px] uppercase leading-relaxed tracking-[0.18em] text-smoke">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={260}>
              <Link href="/about" className="mt-9 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.26em] text-ink link-underline">
                Read Mara's story <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------- collections ------------------------------ */}
      <section id="featured-collections" className="bg-cream surface-grain py-24 lg:py-32">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 lg:px-16">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Featured collections</p>
              <h2 className="display mt-4 text-[clamp(2.2rem,4.2vw,3.4rem)] text-ink">
                Twenty-one ways of seeing
              </h2>
            </div>
            <Link href="/work" className="text-[10px] uppercase tracking-[0.26em] text-ink link-underline">
              All collections →
            </Link>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((category, i) => (
              <Reveal key={category.id} delay={i * 60}>
                <Link href={`/work/${category.slug}`} className="group relative block overflow-hidden bg-sand">
                  <div className={i === 0 ? "aspect-[4/3] lg:aspect-[3/2]" : "aspect-[4/5]"}>
                    <img
                      src={sizedImage(category.cover_image, 1100)}
                      alt={category.name}
                      loading="lazy"
                      className="grade h-full w-full object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.3em] text-cream/60">
                        {String(category.image_count).padStart(2, "0")} frames
                      </p>
                      <p className="mt-2 font-serif text-2xl text-cream">{category.name}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream/40 text-cream transition-all duration-500 group-hover:bg-cream group-hover:text-ink">
                      <svg width="13" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
                        <path d="M1 5h16M13 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ selected work ----------------------------- */}
      <section className="mx-auto max-w-[1680px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Selected frames</p>
            <h2 className="display mt-4 text-[clamp(2.2rem,4.2vw,3.4rem)] text-ink">
              A year in photographs
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-smoke">
            Click any frame to open the full-screen viewer — like the ones you love, share them, and
            download the images Mara has released.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <MasonryGallery
            images={images.map((image) => ({
              id: image.id,
              url: image.url,
              title: image.title || image.category_name,
              likes: counts[image.id] ?? 0,
            }))}
            categoryName="Mara's Photography"
            categorySlug="all"
            watermark={false}
            downloadsEnabled={false}
            likes={Object.fromEntries(
              images.map((i) => [i.id, { count: counts[i.id] ?? 0, liked: false }]),
            )}
          />
        </Reveal>
      </section>

      {/* -------------------------------- packages ------------------------------- */}
      <section className="bg-sand/50 py-24 lg:py-32">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 lg:px-16">
          <Reveal className="text-center">
            <p className="eyebrow">Sessions & packages</p>
            <h2 className="display mx-auto mt-4 max-w-2xl text-balance text-[clamp(2.2rem,4.2vw,3.4rem)] text-ink">
              Choose the time you need — we bring the rest
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {packages
              .filter((p) => p.price > 0)
              .slice(0, 3)
              .map((pkg, i) => {
                const features = packageFeatures(pkg).slice(0, 4);
                const price = finalPrice(pkg);
                const highlight = i === 1;
                return (
                  <Reveal key={pkg.id} delay={i * 80}>
                    <div
                      className={`relative flex h-full flex-col justify-between p-8 transition-all duration-500 ${
                        highlight
                          ? "bg-burgundy text-cream shadow-luxe lg:-translate-y-3"
                          : "border border-ink/12 bg-cream text-ink hover:border-ink/30"
                      }`}
                    >
                      {pkg.badge ? (
                        <span
                          className={`absolute right-6 top-6 text-[9px] uppercase tracking-[0.24em] ${
                            highlight ? "text-champagne" : "text-gold"
                          }`}
                        >
                          {pkg.badge}
                        </span>
                      ) : null}
                      <div>
                        <p className={`text-[10px] uppercase tracking-[0.28em] ${highlight ? "text-cream/50" : "text-smoke"}`}>
                          {pkg.duration_hours}h session
                        </p>
                        <h3 className="display mt-3 text-3xl">{pkg.name}</h3>
                        <p className={`mt-2 font-serif text-lg italic ${highlight ? "text-cream/70" : "text-smoke"}`}>
                          {pkg.tagline}
                        </p>
                        <div className="mt-6 flex items-end gap-3">
                          <span className="display text-4xl">{formatAUD(price)}</span>
                          {pkg.discount_percent > 0 ? (
                            <span className={`pb-1 text-xs line-through ${highlight ? "text-cream/40" : "text-smoke/60"}`}>
                              {formatAUD(pkg.price)}
                            </span>
                          ) : null}
                        </div>
                        <ul className={`mt-7 space-y-2.5 border-t pt-6 text-[13px] ${highlight ? "border-cream/15 text-cream/70" : "border-ink/10 text-smoke"}`}>
                          {features.map((feature) => (
                            <li key={feature} className="flex gap-2.5">
                              <span className={highlight ? "text-champagne" : "text-gold"}>—</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link
                        href={`/book?package=${pkg.slug}`}
                        className={`mt-8 inline-flex w-full items-center justify-center px-6 py-3.5 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                          highlight
                            ? "bg-cream text-ink hover:bg-champagne"
                            : "border border-ink/25 text-ink hover:bg-ink hover:text-cream"
                        }`}
                      >
                        Book {pkg.name}
                      </Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          <Reveal className="mt-10 text-center">
            <Link href="/packages" className="text-[10px] uppercase tracking-[0.26em] text-ink link-underline">
              Compare all sessions & pricing →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ testimonials ----------------------------- */}
      <section className="relative overflow-hidden bg-ink py-24 lg:py-32">
        <div className="absolute inset-0 opacity-20">
          <img
            src={sizedImage(settings.instagramImages[0], 1600)}
            alt=""
            className="h-full w-full object-cover"
            aria-hidden
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 sm:px-10">
          <p className="eyebrow mb-10 text-center text-champagne/80">Kind words</p>
          <TestimonialCarousel
            items={testimonials.map((t) => ({
              id: t.id,
              name: t.name,
              role: t.role,
              quote: t.quote,
              rating: t.rating,
            }))}
          />
        </div>
      </section>

      {/* ------------------------------- instagram ------------------------------- */}
      <section className="mx-auto max-w-[1680px] px-6 py-24 sm:px-10 lg:px-16">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Behind the scenes</p>
            <h2 className="display mt-4 text-[clamp(2rem,3.6vw,2.8rem)] text-ink">@marasphotography</h2>
          </div>
          <a
            href={settings.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] uppercase tracking-[0.26em] text-ink link-underline"
          >
            Follow on Instagram →
          </a>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {settings.instagramImages.map((image, i) => (
            <a
              key={`${image}-${i}`}
              href={settings.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden bg-sand"
            >
              <img
                src={sizedImage(image, 500)}
                alt="Instagram post"
                loading="lazy"
                className="grade h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-110"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-cream opacity-0 transition-all duration-500 group-hover:bg-ink/40 group-hover:opacity-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ---------------------------------- faq ---------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 pb-24 sm:px-10">
        <Reveal>
          <p className="eyebrow">Good to know</p>
          <h2 className="display mt-4 text-[clamp(2rem,3.6vw,2.8rem)] text-ink">Questions, answered</h2>
          <div className="mt-10">
            <Accordion items={settings.faqs.slice(0, 4)} />
          </div>
        </Reveal>
      </section>

      {/* ---------------------------------- cta ---------------------------------- */}
      <section className="relative overflow-hidden bg-burgundy py-24 text-cream lg:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <Reveal>
            <p className="eyebrow text-champagne">Let&apos;s begin</p>
            <h2 className="display mt-5 text-balance text-[clamp(2.4rem,5vw,4rem)] text-cream">
              Tell us the story you want to keep.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-cream/70">
              Choose a collection, pick a date, and we will confirm within one business day. A 30%
              deposit reserves your session.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/book" className="btn-champagne">Book a session</Link>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="btn-outline-light">
                WhatsApp Mara
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
