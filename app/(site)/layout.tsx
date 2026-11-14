import { cookies } from "next/headers";
import { Cursor } from "@/components/site/Cursor";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { currentUser } from "@/lib/auth";
import { getCategories, getSiteSettings } from "@/lib/data";
import { SITE_LOCALE_COOKIE, getSiteLocale } from "@/lib/site-locale";
import { localizeSiteContent } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, user, cookieStore] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    currentUser(),
    cookies(),
  ]);
  const locale = getSiteLocale(cookieStore.get(SITE_LOCALE_COOKIE)?.value);

  return (
    <div className="flex min-h-screen flex-col">
      <Cursor />
      <SiteHeader
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, image_count: c.image_count }))}
        brandName={settings.brandName}
        logoImage={settings.logoImage}
        announcement={settings.announcementActive ? localizeSiteContent(settings.announcement, locale) : undefined}
        user={user ? { name: user.name, role: user.role } : null}
        locale={locale}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} categories={categories} locale={locale} />
    </div>
  );
}
