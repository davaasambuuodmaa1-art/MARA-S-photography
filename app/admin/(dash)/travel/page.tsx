import { TravelManager, type AdminServiceArea } from "@/components/admin/TravelManager";
import { getAllLocations, getServiceAreas, getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminTravelPage() {
  const [areas, settings, locations] = await Promise.all([
    getServiceAreas(),
    getSiteSettings(),
    getAllLocations(),
  ]);

  const serviceAreas: AdminServiceArea[] = areas.map((area) => ({
    id: area.id,
    name: area.name,
    postcodes: area.postcodes,
    baseFee: area.base_fee,
    perKm: area.per_km,
    minSpend: area.min_spend,
    freeWithinKm: area.free_within_km,
    notes: area.notes,
    active: Boolean(area.active),
  }));

  const permits = locations
    .filter((location) => location.permit_status !== "approved" && location.permit_status !== "not_required")
    .map((location) => ({
      id: location.id,
      name: location.name,
      permitStatus: location.permit_status,
      requirements: location.requirements,
    }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Travel</p>
        <h1 className="display mt-2 text-3xl">Fees, areas & weather</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Set the radius that is included, the fee for each service area and the minimum session value
          for distant locations. These values feed straight into client quotes at checkout.
        </p>
      </div>
      <TravelManager
        areas={serviceAreas}
        travelPolicy={settings.travelPolicy}
        rainPolicy={settings.rainPolicy}
        permits={permits}
      />
    </div>
  );
}
