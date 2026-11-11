import { ContentManager } from "@/components/admin/ContentManager";
import { getCategories, getSiteSettings, getTestimonials } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const [settings, categories, testimonials] = await Promise.all([
    getSiteSettings(),
    getCategories(false),
    getTestimonials(false),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Website content</p>
        <h1 className="display mt-2 text-3xl">Edit the site without touching code</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Headlines, images, contact details, testimonials, FAQs and the announcement bar are all
          editable here and publish immediately.
        </p>
      </div>
      <ContentManager
        settings={settings}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          cover_image: category.cover_image,
        }))}
        testimonials={testimonials.map((item) => ({
          id: item.id,
          name: item.name,
          role: item.role,
          quote: item.quote,
          rating: item.rating,
          published: item.published,
        }))}
      />
    </div>
  );
}
