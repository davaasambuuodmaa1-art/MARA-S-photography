"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { all, first, getEnv, run } from "@/lib/db";
import { getLocationById } from "@/lib/data";
import { notifyAdmin } from "@/lib/notify";
import { newId, slugify } from "@/lib/utils";
import type { Location } from "@/lib/types";
import type { ActionResult } from "./auth";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function touchLocations() {
  revalidatePath("/locations");
  revalidatePath("/admin/locations");
  revalidatePath("/");
}

export type LocationInput = {
  name: string;
  area: string;
  description: string;
  styles: string[];
  mapsUrl: string;
  travelInfo: string;
  requirements: string;
  permitStatus: string;
  venueApproved: boolean;
  travelFee: number;
  minSpend: number;
  available: boolean;
  suggested: boolean;
};

function normalise(input: LocationInput) {
  return {
    name: input.name.trim(),
    area: input.area.trim() || "Sydney",
    description: input.description.trim(),
    styles: JSON.stringify(input.styles.map((s) => s.trim()).filter(Boolean)),
    mapsUrl: input.mapsUrl.trim(),
    travelInfo: input.travelInfo.trim(),
    requirements: input.requirements.trim(),
    permitStatus: ["unchecked", "required", "approved", "not_required"].includes(input.permitStatus)
      ? input.permitStatus
      : "unchecked",
    venueApproved: input.venueApproved ? 1 : 0,
    travelFee: Math.max(0, Math.round(Number(input.travelFee) || 0)),
    minSpend: Math.max(0, Math.round(Number(input.minSpend) || 0)),
    available: input.available ? 1 : 0,
    suggested: input.suggested ? 1 : 0,
  };
}

export async function createLocationAction(
  input: LocationInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const data = normalise(input);
    if (data.name.length < 2) return { ok: false, error: "Give the location a name." };

    let slug = slugify(data.name) || `location-${Date.now()}`;
    let attempt = 1;
    while (await first<{ id: string }>("SELECT id FROM locations WHERE slug = ?", [slug])) {
      slug = `${slugify(data.name)}-${attempt}`;
      attempt += 1;
    }
    const maxRow = await first<{ max: number }>(
      "SELECT COALESCE(MAX(sort_order), 0) AS max FROM locations",
    );
    const id = newId("loc_");
    await run(
      `INSERT INTO locations
        (id, slug, name, area, description, styles, cover_image, images, maps_url, travel_info, requirements, permit_status, venue_approved, travel_fee, min_spend, available, suggested, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, '', '[]', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        data.name,
        data.area,
        data.description,
        data.styles,
        data.mapsUrl,
        data.travelInfo,
        data.requirements,
        data.permitStatus,
        data.venueApproved,
        data.travelFee,
        data.minSpend,
        data.available,
        data.suggested,
        Number(maxRow?.max ?? 0) + 1,
        new Date().toISOString(),
      ],
    );
    touchLocations();
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create the location." };
  }
}

export async function updateLocationAction(
  id: string,
  input: LocationInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const current = await getLocationById(id);
    if (!current) return { ok: false, error: "Location not found." };
    const data = normalise(input);
    if (data.name.length < 2) return { ok: false, error: "Give the location a name." };
    await run(
      `UPDATE locations SET name = ?, area = ?, description = ?, styles = ?, maps_url = ?, travel_info = ?, requirements = ?, permit_status = ?, venue_approved = ?, travel_fee = ?, min_spend = ?, available = ?, suggested = ? WHERE id = ?`,
      [
        data.name,
        data.area,
        data.description,
        data.styles,
        data.mapsUrl,
        data.travelInfo,
        data.requirements,
        data.permitStatus,
        data.venueApproved,
        data.travelFee,
        data.minSpend,
        data.available,
        data.suggested,
        id,
      ],
    );
    touchLocations();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update the location." };
  }
}

export async function deleteLocationAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const location = await getLocationById(id);
    if (!location) return { ok: false, error: "Location not found." };
    const env = await getEnv();
    if (env.FILES) {
      try {
        const images = JSON.parse(location.images) as string[];
        for (const url of images) {
          const key = url.startsWith("/api/media/") ? url.replace("/api/media/", "") : null;
          if (key) await env.FILES.delete(key).catch(() => undefined);
        }
      } catch {
        // Nothing to clean up.
      }
    }
    await run("DELETE FROM locations WHERE id = ?", [id]);
    touchLocations();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete the location." };
  }
}

export async function uploadLocationImagesAction(
  locationId: string,
  formData: FormData,
): Promise<ActionResult<{ uploaded: number }>> {
  try {
    await requireAdmin();
    const location = await getLocationById(locationId);
    if (!location) return { ok: false, error: "Location not found." };
    const env = await getEnv();
    if (!env.FILES) {
      return {
        ok: false,
        error: "Image storage is not configured. Add an R2 bucket binding named FILES, then redeploy.",
      };
    }
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return { ok: false, error: "Choose at least one image." };

    let images: string[] = [];
    try {
      const parsed = JSON.parse(location.images);
      if (Array.isArray(parsed)) images = parsed.map(String);
    } catch {
      images = [];
    }

    let uploaded = 0;
    for (const file of files.slice(0, 8)) {
      if (!file.type.startsWith("image/") || file.size > MAX_FILE_BYTES) continue;
      const key = `locations/${locationId}/${newId("loc_img_")}-${
        slugify(file.name.replace(/\.[^.]+$/, "")) || "photo"
      }.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
      await env.FILES.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      });
      images.push(`/api/media/${key}`);
      uploaded += 1;
    }

    if (!uploaded) return { ok: false, error: "Those files were not valid images under 10 MB." };

    await run("UPDATE locations SET images = ?, cover_image = ? WHERE id = ?", [
      JSON.stringify(images),
      location.cover_image || images[0],
      locationId,
    ]);
    touchLocations();
    revalidatePath(`/locations/${location.slug}`);
    return { ok: true, uploaded };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function setLocationCoverAction(
  locationId: string,
  url: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("UPDATE locations SET cover_image = ? WHERE id = ?", [url, locationId]);
    touchLocations();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not set the cover." };
  }
}

export async function removeLocationImageAction(
  locationId: string,
  url: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const location = await getLocationById(locationId);
    if (!location) return { ok: false, error: "Location not found." };
    let images: string[] = [];
    try {
      images = (JSON.parse(location.images) as string[]).filter((item) => item !== url);
    } catch {
      images = [];
    }
    const env = await getEnv();
    if (env.FILES && url.startsWith("/api/media/")) {
      await env.FILES.delete(url.replace("/api/media/", "")).catch(() => undefined);
    }
    const cover = location.cover_image === url ? (images[0] ?? "") : location.cover_image;
    await run("UPDATE locations SET images = ?, cover_image = ? WHERE id = ?", [
      JSON.stringify(images),
      cover,
      locationId,
    ]);
    touchLocations();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove the image." };
  }
}

export type ServiceAreaInput = {
  id?: string;
  name: string;
  postcodes: string;
  baseFee: number;
  perKm: number;
  minSpend: number;
  freeWithinKm: number;
  notes: string;
  active: boolean;
};

export async function saveServiceAreaAction(input: ServiceAreaInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "Name the service area." };
    const params = [
      name,
      input.postcodes.trim(),
      Math.max(0, Math.round(Number(input.baseFee) || 0)),
      Math.max(0, Math.round(Number(input.perKm) || 0)),
      Math.max(0, Math.round(Number(input.minSpend) || 0)),
      Math.max(0, Math.round(Number(input.freeWithinKm) || 0)),
      input.notes.trim(),
      input.active ? 1 : 0,
    ];
    if (input.id) {
      await run(
        "UPDATE service_areas SET name = ?, postcodes = ?, base_fee = ?, per_km = ?, min_spend = ?, free_within_km = ?, notes = ?, active = ? WHERE id = ?",
        [...params, input.id],
      );
    } else {
      await run(
        "INSERT INTO service_areas (name, postcodes, base_fee, per_km, min_spend, free_within_km, notes, active, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [...params, newId("sva_")],
      );
    }
    revalidatePath("/admin/travel");
    revalidatePath("/locations");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save the service area." };
  }
}

export async function deleteServiceAreaAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("DELETE FROM service_areas WHERE id = ?", [id]);
    revalidatePath("/admin/travel");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete the service area." };
  }
}

/** Locations that still need a permit check, for the admin travel page. */
export async function locationsNeedingPermit(): Promise<Location[]> {
  await requireAdmin();
  return all<Location>(
    "SELECT * FROM locations WHERE permit_status IN ('unchecked','required') AND venue_approved = 0 ORDER BY name ASC",
  );
}

export async function notifyPermitConcern(locationId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const location = await getLocationById(locationId);
    if (!location) return { ok: false, error: "Location not found." };
    await notifyAdmin({
      type: "system",
      title: `Permit check needed — ${location.name}`,
      body: location.requirements || "Confirm venue permission before quoting this location.",
      link: "/admin/locations",
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not send the reminder." };
  }
}
