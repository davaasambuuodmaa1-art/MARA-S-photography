"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { first, getEnv, run } from "@/lib/db";
import { getPrivateGalleryById } from "@/lib/data";
import { notifyAdmin } from "@/lib/notify";
import { newId, slugify } from "@/lib/utils";
import type { PrivateGallery } from "@/lib/types";
import type { ActionResult } from "./auth";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function images(gallery: PrivateGallery): string[] {
  try {
    const parsed = JSON.parse(gallery.images);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function touch(secret?: string) {
  revalidatePath("/admin/private-galleries");
  if (secret) revalidatePath(`/gallery/${secret}`);
}

export interface PrivateGalleryInput {
  title: string;
  customerName: string;
  customerEmail: string;
  bookingId?: string | null;
  note: string;
  expiresAt: string;
  downloads: boolean;
}

export async function createPrivateGalleryAction(input: PrivateGalleryInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const title = input.title.trim();
    const email = input.customerEmail.trim().toLowerCase();
    if (title.length < 2) return { ok: false, error: "Give the gallery a title." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      return { ok: false, error: "Enter the customer's email — that is how they are matched to the gallery." };
    }
    const expires = /^\d{4}-\d{2}-\d{2}$/.test(input.expiresAt) ? input.expiresAt : "";
    const id = newId("pgal_");
    await run(
      `INSERT INTO private_galleries (id, booking_id, customer_name, customer_email, title, token, images, cover_image, note, expires_at, downloads, published, created_at)
       VALUES (?, ?, ?, ?, ?, ?, '[]', '', ?, ?, ?, 0, ?)`,
      [
        id,
        input.bookingId || null,
        input.customerName.trim(),
        email,
        title,
        token(),
        input.note.trim(),
        expires,
        input.downloads ? 1 : 0,
        new Date().toISOString(),
      ],
    );
    touch();
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create the gallery." };
  }
}

export async function updatePrivateGalleryAction(id: string, input: PrivateGalleryInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const gallery = await getPrivateGalleryById(id);
    if (!gallery) return { ok: false, error: "Gallery not found." };
    const email = input.customerEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return { ok: false, error: "Enter a valid email." };
    await run(
      `UPDATE private_galleries SET title = ?, customer_name = ?, customer_email = ?, booking_id = ?, note = ?, expires_at = ?, downloads = ? WHERE id = ?`,
      [
        input.title.trim() || gallery.title,
        input.customerName.trim(),
        email,
        input.bookingId || null,
        input.note.trim(),
        /^\d{4}-\d{2}-\d{2}$/.test(input.expiresAt) ? input.expiresAt : "",
        input.downloads ? 1 : 0,
        id,
      ],
    );
    touch(gallery.token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save the gallery." };
  }
}

export async function uploadPrivateGalleryImagesAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ uploaded: number }>> {
  try {
    await requireAdmin();
    const gallery = await getPrivateGalleryById(id);
    if (!gallery) return { ok: false, error: "Gallery not found." };
    const env = await getEnv();
    if (!env.FILES) {
      return { ok: false, error: "Image storage is not configured. Add the FILES R2 binding and redeploy." };
    }
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    if (!files.length) return { ok: false, error: "Choose at least one photograph." };

    const existing = images(gallery);
    let uploaded = 0;
    for (const file of files.slice(0, 40)) {
      if (!file.type.startsWith("image/") || file.size > MAX_FILE_BYTES) continue;
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
      const key = `private/${id}/${newId("pimg_")}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "photo"}.${extension}`;
      await env.FILES.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type, cacheControl: "private, max-age=0" },
      });
      existing.push(`/api/media/${key}`);
      uploaded += 1;
    }
    if (!uploaded) return { ok: false, error: "Those files were not valid images under 15 MB." };

    await run("UPDATE private_galleries SET images = ?, cover_image = ? WHERE id = ?", [
      JSON.stringify(existing),
      gallery.cover_image || existing[0],
      id,
    ]);
    touch(gallery.token);
    return { ok: true, uploaded };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function removePrivateGalleryImageAction(id: string, url: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const gallery = await getPrivateGalleryById(id);
    if (!gallery) return { ok: false, error: "Gallery not found." };
    const remaining = images(gallery).filter((image) => image !== url);
    await run("UPDATE private_galleries SET images = ?, cover_image = ? WHERE id = ?", [
      JSON.stringify(remaining),
      remaining.includes(gallery.cover_image) ? gallery.cover_image : remaining[0] || "",
      id,
    ]);
    touch(gallery.token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove that photograph." };
  }
}

export async function publishPrivateGalleryAction(id: string, published: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const gallery = await getPrivateGalleryById(id);
    if (!gallery) return { ok: false, error: "Gallery not found." };
    if (published && !images(gallery).length) {
      return { ok: false, error: "Upload photographs before publishing." };
    }
    await run("UPDATE private_galleries SET published = ? WHERE id = ?", [published ? 1 : 0, id]);
    if (published) {
      await notifyAdmin({
        type: "gallery",
        title: `Private gallery published — ${gallery.title}`,
        body: `${gallery.customer_email} · ${images(gallery).length} photographs`,
        link: `/admin/private-galleries`,
      });
    }
    touch(gallery.token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update the gallery." };
  }
}

export async function deletePrivateGalleryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("DELETE FROM private_galleries WHERE id = ?", [id]);
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete the gallery." };
  }
}

/** Re-issue the private link (invalidates the old one). */
export async function resetPrivateGalleryLinkAction(id: string): Promise<ActionResult<{ token: string }>> {
  try {
    await requireAdmin();
    const gallery = await getPrivateGalleryById(id);
    if (!gallery) return { ok: false, error: "Gallery not found." };
    const next = token();
    await run("UPDATE private_galleries SET token = ? WHERE id = ?", [next, id]);
    touch(gallery.token);
    return { ok: true, token: next };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reset the link." };
  }
}

export async function findBookingForGalleryAction(bookingId: string) {
  await requireAdmin();
  return first<{ id: string; customer_name: string; email: string; title: string }>(
    `SELECT b.id, b.customer_name, b.email, p.name AS title FROM bookings b LEFT JOIN packages p ON p.id = b.package_id WHERE b.id = ?`,
    [bookingId],
  );
}
