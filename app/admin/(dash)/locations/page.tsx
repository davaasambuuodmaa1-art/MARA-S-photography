import { LocationsManager, type AdminLocation } from "@/components/admin/LocationsManager";
import { getAllLocations, locationImages, locationStyles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const rows = await getAllLocations();
  const locations: AdminLocation[] = rows.map((location) => ({
    id: location.id,
    slug: location.slug,
    name: location.name,
    area: location.area,
    description: location.description,
    styles: locationStyles(location),
    coverImage: location.cover_image || locationImages(location)[0] || "",
    images: locationImages(location),
    mapsUrl: location.maps_url,
    travelInfo: location.travel_info,
    requirements: location.requirements,
    permitStatus: location.permit_status,
    venueApproved: Boolean(location.venue_approved),
    travelFee: location.travel_fee,
    minSpend: location.min_spend,
    available: Boolean(location.available),
    suggested: Boolean(location.suggested),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Locations</p>
        <h1 className="display mt-2 text-3xl">Where we shoot</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Every shoot happens on location. Manage the Sydney spots you recommend, their travel fees,
          access notes and permit status. A location is never advertised as approved until its permit
          and venue permission are confirmed here.
        </p>
      </div>
      <LocationsManager locations={locations} />
    </div>
  );
}
