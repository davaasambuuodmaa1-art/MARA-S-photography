import { CategoryManager } from "@/components/admin/CategoryManager";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminGalleriesPage() {
  const merged = await getCategories(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Galleries</p>
        <h1 className="display mt-2 text-3xl">Your portfolio</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Create collections, upload photography, set covers, reorder frames and control downloads
          and watermarks. Everything shown on the website is managed here.
        </p>
      </div>
      <CategoryManager
        categories={merged.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          cover_image: category.cover_image,
          image_count: category.image_count,
          published: category.published,
          watermark: category.watermark,
          downloads: category.downloads,
          created_at: category.created_at,
        }))}
      />
    </div>
  );
}
