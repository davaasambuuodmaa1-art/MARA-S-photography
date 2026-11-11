import { Cursor } from "@/components/site/Cursor";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { currentUser } from "@/lib/auth";
import { getCategories, getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, user] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    currentUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Cursor />
      <SiteHeader
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, image_count: c.image_count }))}
        brandName={settings.brandName}
        logoImage={settings.logoImage}
        announcement={settings.announcementActive ? settings.announcement : undefined}
        user={user ? { name: user.name, role: user.role } : null}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} categories={categories} />
    </div>
  );
}
