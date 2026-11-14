import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { WorkGrid } from "@/components/site/WorkGrid";
import { getCategories } from "@/lib/data";
import { currentSiteLocale } from "@/lib/current-site-locale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Work",
  description: "Browse twenty-one photography collections — weddings, portraits, families, sport, fashion and more.",
};

export default async function WorkPage() {
  const [categories, locale] = await Promise.all([getCategories(), currentSiteLocale()]);
  const mn = locale === "mn";
  const total = categories.reduce((sum, c) => sum + c.image_count, 0);

  return (
    <>
      <section className="border-b border-ink/10 bg-sand/40 pb-16 pt-36 lg:pb-20 lg:pt-44">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 lg:px-16">
          <Reveal>
            <p className="eyebrow">{mn ? "Цуглуулга" : "The collection"}</p>
            <h1 className="display mt-5 max-w-3xl text-balance text-[clamp(3rem,7vw,5.6rem)] text-ink">
              {mn ? "Бүтээлүүдийн олон өнгө аяс" : "The work, in all its quiet variety"}
            </h1>
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-[10px] uppercase tracking-[0.22em] text-smoke">
              <span>{categories.length} {mn ? "цуглуулга" : "collections"}</span>
              <span>{total} {mn ? "зураг" : "frames"}</span>
              <span>Sydney · Australia · Worldwide</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <WorkGrid
          categories={categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            cover_image: c.cover_image,
            image_count: c.image_count,
            description: c.description,
          }))}
        />

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-ink/10 pt-10 sm:flex-row">
          <p className="max-w-md text-sm leading-relaxed text-smoke">
            {mn
              ? "Цуглуулга бүр таны түүхийг өгүүлэх боломжтой — нэг мэдрэмж, таны нандин мөчүүд."
              : "Every collection can be commissioned for your own story — same eye, your moments."}
          </p>
          <div className="flex gap-3">
            <Link href="/packages" className="btn-outline">{mn ? "Сешнүүдийг үзэх" : "View sessions"}</Link>
            <Link href="/book" className="btn-dark">{mn ? "Зураг авуулах" : "Book a session"}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
