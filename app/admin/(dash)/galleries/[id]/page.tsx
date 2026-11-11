import Link from "next/link";
import { notFound } from "next/navigation";
import { CategorySettings } from "@/components/admin/CategorySettings";
import { ImagesManager } from "@/components/admin/ImagesManager";
import { getCategoryById, getImages } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminGalleryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();
  const images = await getImages(category.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/galleries" className="text-[9px] uppercase tracking-[0.18em] text-smoke hover:text-ink">
            ← All collections
          </Link>
          <h1 className="display mt-2 text-3xl">{category.name}</h1>
          <p className="mt-1 text-[11px] text-smoke">
            {images.length} images · {category.published ? "published" : "hidden"} ·{" "}
            <a href={`/work/${category.slug}`} target="_blank" rel="noreferrer" className="underline">
              view on website ↗
            </a>
          </p>
        </div>
      </div>

      <CategorySettings
        category={{
          id: category.id,
          name: category.name,
          description: category.description,
          published: category.published,
          watermark: category.watermark,
          downloads: category.downloads,
        }}
      />

      <ImagesManager
        categoryId={category.id}
        downloadsEnabled={Boolean(category.downloads)}
        images={images.map((image) => ({
          id: image.id,
          url: image.url,
          title: image.title,
          description: image.description,
          is_cover: image.is_cover,
          downloadable: image.downloadable,
          storage_key: image.storage_key,
          sort_order: image.sort_order,
        }))}
      />
    </div>
  );
}
