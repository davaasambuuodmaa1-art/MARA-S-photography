import { BookingWizard } from "@/components/site/BookingWizard";
import { Reveal } from "@/components/site/Reveal";
import { currentUser } from "@/lib/auth";
import {
  finalPrice,
  getCategories,
  getPackages,
  getSiteSettings,
  getSuggestedLocations,
  locationImages,
  locationStyles,
  packageFeatures,
  packageAddons,
} from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book a session" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; package?: string; location?: string }>;
}) {
  const { category, package: packageSlug, location } = await searchParams;
  const [categories, packages, locations, settings, user] = await Promise.all([
    getCategories(),
    getPackages(),
    getSuggestedLocations(),
    getSiteSettings(),
    currentUser(),
  ]);

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">Booking</p>
        <h1 className="display mt-4 max-w-3xl text-balance text-[clamp(2.6rem,5.5vw,4.4rem)] text-ink">
          Reserve your session
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-smoke">
          Five short steps, entirely on location. Requests are reviewed personally — Mara confirms the
          date and checks your location before any deposit is due.
        </p>
      </Reveal>

      <div className="mt-12">
        <BookingWizard
          categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
          packages={packages.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: finalPrice(p),
            depositPercent: p.deposit_percent,
            durationHours: p.duration_hours,
            editedPhotos: p.edited_photos,
            tagline: p.tagline,
            features: packageFeatures(p),
            badge: p.badge,
            extraPhotoPrice: p.extra_photo_price ?? 0,
            extraHourPrice: p.extra_hour_price ?? 0,
            addons: packageAddons(p).map((a) => ({ id: a.id, name: a.name, price: a.price })),
            quoteOnly: Boolean(p.quote_only),
          }))}
          locations={locations.map((l) => ({
            id: l.id,
            slug: l.slug,
            name: l.name,
            area: l.area,
            coverImage: locationImages(l)[0] ?? l.cover_image,
            styles: locationStyles(l),
            travelFee: l.travel_fee,
            minSpend: l.min_spend,
            permitStatus: l.permit_status,
            requirements: l.requirements,
            mapsUrl: l.maps_url,
          }))}
          travelPolicy={settings.travelPolicy}
          user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
          initialCategory={category}
          initialPackage={packageSlug}
          initialLocation={location}
        />
      </div>
    </section>
  );
}
