import Link from "next/link";
import { notFound } from "next/navigation";
import { MasonryGallery } from "@/components/site/MasonryGallery";
import { Reveal } from "@/components/site/Reveal";
import { getCategories, getCategoryBySlug, getImages, likeCounts } from "@/lib/data";
import { sizedImage } from "@/lib/img";
import { currentSiteLocale } from "@/lib/current-site-locale";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mn = (await currentSiteLocale()) === "mn";
  const category = await getCategoryBySlug(slug);
  if (!category || !category.published) notFound();

  const [images, categories] = await Promise.all([getImages(category.id), getCategories()]);
  const counts = await likeCounts(images.map((i) => i.id));
  const index = categories.findIndex((c) => c.id === category.id);
  const next = categories[(index + 1) % categories.length];
  const prev = categories[(index - 1 + categories.length) % categories.length];
  const downloadsEnabled = Boolean(category.downloads);

  return (
    <>
      <section className="relative h-[62vh] min-h-[420px] w-full overflow-hidden bg-ink">
        <img
          src={sizedImage(category.cover_image, 2000)}
          alt={category.name}
          className="absolute inset-0 h-full w-full animate-kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/40" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1680px] flex-col justify-end px-6 pb-12 sm:px-10 lg:px-16">
          <Link href="/work" className="mb-6 text-[10px] uppercase tracking-[0.26em] text-cream/60 link-underline">
            {mn ? "← Бүх цуглуулга" : "← All collections"}
          </Link>
          <Reveal>
            <p className="eyebrow text-champagne/90">
              {String(category.image_count).padStart(2, "0")} {mn ? "зураг · Цуглуулга" : "frames · Collection"}
            </p>
            <h1 className="display mt-4 text-balance text-[clamp(2.6rem,6vw,4.8rem)] text-cream">
              {category.name}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cream/70">{category.description}</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
        <div className="mb-9 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-smoke">
            {images.length} {mn ? "зураг · " : "images · "}{downloadsEnabled ? (mn ? "Татах боломжтой" : "Downloads available") : (mn ? "Зөвхөн үзэх боломжтой" : "Viewing only")}
            {category.watermark ? (mn ? " · Усны тэмдэгтэй" : " · Watermarked") : ""}
          </p>
          <div className="flex gap-3">
            <Link href={`/book?category=${category.slug}`} className="btn-dark py-3">
              {mn ? "Энэ цуглуулгыг захиалах" : "Book this collection"}
            </Link>
          </div>
        </div>

        {images.length ? (
          <MasonryGallery
            images={images.map((image) => ({
              id: image.id,
              url: image.url,
              title: image.title || category.name,
              description: image.description,
              likes: counts[image.id] ?? 0,
            }))}
            categoryName={category.name}
            categorySlug={category.slug}
            watermark={Boolean(category.watermark)}
            downloadsEnabled={downloadsEnabled}
            likes={Object.fromEntries(
              images.map((i) => [i.id, { count: counts[i.id] ?? 0, liked: false }]),
            )}
          />
        ) : (
          <div className="border border-dashed border-ink/20 py-24 text-center">
            <p className="font-serif text-2xl">{mn ? "Энэ цуглуулгыг бэлтгэж байна." : "This collection is being prepared."}</p>
            <p className="mt-3 text-sm text-smoke">{mn ? "Сар бүр шинэ зураг нэмэгдэнэ." : "New frames arrive every month."}</p>
          </div>
        )}

        <div className="mt-16 grid gap-4 border-t border-ink/10 pt-10 sm:grid-cols-2">
          <Link href={`/work/${prev.slug}`} className="group flex items-center gap-5">
            <img src={sizedImage(prev.cover_image, 300)} alt={prev.name} className="h-20 w-16 object-cover" />
            <span>
              <span className="block text-[9px] uppercase tracking-[0.24em] text-smoke">{mn ? "Өмнөх" : "Previous"}</span>
              <span className="mt-1 block font-serif text-xl group-hover:italic">{prev.name}</span>
            </span>
          </Link>
          <Link href={`/work/${next.slug}`} className="group flex items-center justify-end gap-5 text-right">
            <span>
              <span className="block text-[9px] uppercase tracking-[0.24em] text-smoke">{mn ? "Дараах" : "Next"}</span>
              <span className="mt-1 block font-serif text-xl group-hover:italic">{next.name}</span>
            </span>
            <img src={sizedImage(next.cover_image, 300)} alt={next.name} className="h-20 w-16 object-cover" />
          </Link>
        </div>
      </section>
    </>
  );
}
