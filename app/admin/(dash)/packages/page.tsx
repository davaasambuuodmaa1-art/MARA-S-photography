import { PackagesManager } from "@/components/admin/PackagesManager";
import { getPackages, packageFeatures, packageAddons } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await getPackages(false);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Pricing</p>
        <h1 className="display mt-2 text-3xl">Packages & promotions</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Every price, deposit percentage, discount and inclusion on the website and booking form comes
          from here.
        </p>
      </div>
      <PackagesManager
        packages={packages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          tagline: pkg.tagline,
          price: pkg.price,
          deposit_percent: pkg.deposit_percent,
          description: pkg.description,
          features: packageFeatures(pkg),
          duration_hours: pkg.duration_hours,
          edited_photos: pkg.edited_photos,
          discount_percent: pkg.discount_percent,
          badge: pkg.badge,
          active: pkg.active,
          sort_order: pkg.sort_order,
          extra_photo_price: pkg.extra_photo_price,
          extra_hour_price: pkg.extra_hour_price,
          addons: packageAddons(pkg).map((a) => ({ label: a.name, price: a.price })),
          quote_only: pkg.quote_only,
        }))}
      />
    </div>
  );
}
