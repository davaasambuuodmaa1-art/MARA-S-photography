import { CategoryManager } from "@/components/admin/CategoryManager";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Portfolio categories</p>
        <h1 className="display mt-2 text-3xl">Categories</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Create the collections that organise your work, rename or reorder how they appear on the
          website, publish or hide a collection, and delete one you no longer use. Reordering here
          sets the order used across the site.
        </p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
