import { all, run } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories] = await Promise.all([
    all(
      "SELECT * FROM categories ORDER BY sort_order ASC, name ASC",
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Portfolio categories</p>
        <h1 className="display mt-2 text-3xl">Manage portfolio categories</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Organise your photography categories. Each category can have its own cover image and
          appears on the public website under the work section.
        </p>
      </div>

      <div className="border border-ink/12 bg-white/70 p-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => window.location.href = "/admin/categories/new"}
            className="btn-dark py-2.5 text-[9px]"
          >
            + New category
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-smoke/60">
            No categories yet. Create one to organise your photography work.
          </p>
        ) : null}

        <div className="divide-y divide-ink/10 mt-5">
          {categories.map((cat) => (
            <div
              key={String(cat.id)}
              className="border border-ink/12 bg-white/70 p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[15px]">{String(cat.name)}</p>
                {(() => {
                  const hasDesc = String(cat.description);
                  return hasDesc && (
                    <p className="text-[10px] text-smoke/60 mt-1">
                      {hasDesc}
                    </p>
                  );
                })()}
              </div>
              <div className="text-right text-[10px] text-smoke/60">
                Sort: {String(cat.sort_order)}
              </div>
              <div className="text-right gap-2">
                <a
                  href={`/admin/categories/${cat.id}/edit`}
                  className="text-gold hover:text-cream"
                >
                  Edit
                </a>
                <button
                  onClick={() => {
                    window.confirm(
                      `Delete category "${String(cat.name)}"? This will unassign any images in this category.`
                    );
                  }}
                  className="text-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}