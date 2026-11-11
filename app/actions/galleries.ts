"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, visitorId } from "@/lib/auth";
import { all, first, getEnv, run } from "@/lib/db";
import { getCategoryById, likeState } from "@/lib/data";
import { notifyAdmin } from "@/lib/notify";
import { newId, slugify } from "@/lib/utils";
import type { Category, GalleryImage } from "@/lib/types";
import type { ActionResult } from "./auth";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function touch() {
  revalidatePath("/work");
  revalidatePath("/");
  revalidatePath("/admin/galleries");
}

export async function createCategoryAction(input: {
  name: string;
  description: string;
  published: boolean;
}): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "Give the collection a name." };
    let slug = slugify(name) || `series-${Date.now()}`;
    let attempt = 1;
    while (await first<{ id: string }>("SELECT id FROM categories WHERE slug = ?", [slug])) {
      slug = `${slugify(name)}-${attempt}`;
      attempt += 1;
    }
    const maxRow = await first<{ max: number }>("SELECT COALESCE(MAX(sort_order), 0) AS max FROM categories");
    const id = newId("cat_");
    await run(
      "INSERT INTO categories (id, slug, name, description, cover_image, sort_order, published, watermark, downloads, created_at) VALUES (?, ?, ?, ?, '', ?, ?, 0, 1, ?)",
      [id, slug, name, input.description.trim(), Number(maxRow?.max ?? 0) + 1, input.published ? 1 : 0, new Date().toISOString()],
    );
    touch();
    return { ok: true, id, slug };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create collection." };
  }
}

export async function updateCategoryAction(
  id: string,
  patch: Partial<Pick<Category, "name" | "description" | "published" | "watermark" | "downloads" | "sort_order">>,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const current = await getCategoryById(id);
    if (!current) return { ok: false, error: "Collection not found." };
    await run(
      "UPDATE categories SET name = ?, description = ?, published = ?, watermark = ?, downloads = ?, sort_order = ? WHERE id = ?",
      [
        patch.name?.trim() || current.name,
        patch.description ?? current.description,
        patch.published ?? current.published,
        patch.watermark ?? current.watermark,
        patch.downloads ?? current.downloads,
        patch.sort_order ?? current.sort_order,
        id,
      ],
    );
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update." };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const images = await all<GalleryImage>("SELECT * FROM images WHERE category_id = ?", [id]);
    const env = await getEnv();
    for (const image of images) {
      if (image.storage_key && env.FILES) {
        await env.FILES.delete(image.storage_key).catch(() => undefined);
      }
    }
    await run("DELETE FROM images WHERE category_id = ?", [id]);
    await run("DELETE FROM likes WHERE image_id NOT IN (SELECT id FROM images)");
    await run("DELETE FROM categories WHERE id = ?", [id]);
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete collection." };
  }
}

export async function uploadImagesAction(
  categoryId: string,
  formData: FormData,
): Promise<ActionResult<{ uploaded: number }>> {
  try {
    await requireAdmin();
    const category = await getCategoryById(categoryId);
    if (!category) return { ok: false, error: "Collection not found." };
    const env = await getEnv();
    if (!env.FILES) {
      return {
        ok: false,
        error:
          "Image storage is not configured. Add an R2 bucket binding named FILES, then redeploy.",
      };
    }
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return { ok: false, error: "Choose at least one image." };
    if (files.length > 20) return { ok: false, error: "Upload up to 20 images at a time." };

    const maxRow = await first<{ max: number }>(
      "SELECT COALESCE(MAX(sort_order), -1) AS max FROM images WHERE category_id = ?",
      [categoryId],
    );
    let order = Number(maxRow?.max ?? -1);
    let uploaded = 0;
    let coverUrl = category.cover_image;

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_FILE_BYTES) continue;
      const key = `gallery/${categoryId}/${newId("img_")}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "photo"}.${(
        file.name.split(".").pop() || "jpg"
      ).toLowerCase()}`;
      const buffer = await file.arrayBuffer();
      await env.FILES.put(key, buffer, {
        httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      });
      order += 1;
      const url = `/api/media/${key}`;
      const isFirst = !coverUrl && uploaded === 0;
      if (isFirst) coverUrl = url;
      await run(
        "INSERT INTO images (id, category_id, url, storage_key, title, description, sort_order, is_cover, downloadable, created_at) VALUES (?, ?, ?, ?, ?, '', ?, ?, NULL, ?)",
        [
          newId("img_"),
          categoryId,
          url,
          key,
          file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").slice(0, 80),
          order,
          isFirst ? 1 : 0,
          new Date().toISOString(),
        ],
      );
      uploaded += 1;
    }

    if (coverUrl && coverUrl !== category.cover_image) {
      await run("UPDATE categories SET cover_image = ? WHERE id = ?", [coverUrl, categoryId]);
    }
    if (uploaded) {
      await notifyAdmin({
        type: "gallery",
        title: `${uploaded} image${uploaded === 1 ? "" : "s"} added`,
        body: category.name,
        link: `/admin/galleries/${categoryId}`,
      });
    }
    touch();
    revalidatePath(`/admin/galleries/${categoryId}`);
    revalidatePath(`/work/${category.slug}`);
    return uploaded
      ? { ok: true, uploaded }
      : { ok: false, error: "Those files were not valid images under 10 MB." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function addImageByUrlAction(
  categoryId: string,
  url: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!/^https?:\/\//.test(url) && !url.startsWith("/api/media/")) {
      return { ok: false, error: "Enter a full https:// image URL." };
    }
    const category = await getCategoryById(categoryId);
    if (!category) return { ok: false, error: "Collection not found." };
    const maxRow = await first<{ max: number }>(
      "SELECT COALESCE(MAX(sort_order), -1) AS max FROM images WHERE category_id = ?",
      [categoryId],
    );
    const order = Number(maxRow?.max ?? -1) + 1;
    await run(
      "INSERT INTO images (id, category_id, url, storage_key, title, description, sort_order, is_cover, downloadable, created_at) VALUES (?, ?, ?, NULL, '', '', ?, 0, NULL, ?)",
      [newId("img_"), categoryId, url.trim(), order, new Date().toISOString()],
    );
    if (!category.cover_image) {
      await run("UPDATE categories SET cover_image = ? WHERE id = ?", [url.trim(), categoryId]);
    }
    touch();
    revalidatePath(`/admin/galleries/${categoryId}`);
    revalidatePath(`/work/${category.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not add image." };
  }
}

export async function updateImageAction(
  id: string,
  patch: { title?: string; description?: string; downloadable?: number | null },
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const image = await first<GalleryImage>("SELECT * FROM images WHERE id = ?", [id]);
    if (!image) return { ok: false, error: "Image not found." };
    await run("UPDATE images SET title = ?, description = ?, downloadable = ? WHERE id = ?", [
      patch.title ?? image.title,
      patch.description ?? image.description,
      patch.downloadable === undefined ? image.downloadable : patch.downloadable,
      id,
    ]);
    revalidatePath(`/admin/galleries/${image.category_id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save image." };
  }
}

export async function deleteImageAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const image = await first<GalleryImage>("SELECT * FROM images WHERE id = ?", [id]);
    if (!image) return { ok: false, error: "Image not found." };
    const env = await getEnv();
    if (image.storage_key && env.FILES) {
      await env.FILES.delete(image.storage_key).catch(() => undefined);
    }
    await run("DELETE FROM images WHERE id = ?", [id]);
    await run("DELETE FROM likes WHERE image_id = ?", [id]);
    const category = await getCategoryById(image.category_id);
    if (category && category.cover_image === image.url) {
      const next = await first<GalleryImage>(
        "SELECT * FROM images WHERE category_id = ? ORDER BY sort_order ASC LIMIT 1",
        [image.category_id],
      );
      await run("UPDATE categories SET cover_image = ? WHERE id = ?", [next?.url ?? "", image.category_id]);
    }
    touch();
    revalidatePath(`/admin/galleries/${image.category_id}`);
    if (category) revalidatePath(`/work/${category.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete image." };
  }
}

export async function setCoverAction(categoryId: string, imageId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const image = await first<GalleryImage>("SELECT * FROM images WHERE id = ? AND category_id = ?", [
      imageId,
      categoryId,
    ]);
    if (!image) return { ok: false, error: "Image not found." };
    await run("UPDATE images SET is_cover = 0 WHERE category_id = ?", [categoryId]);
    await run("UPDATE images SET is_cover = 1 WHERE id = ?", [imageId]);
    await run("UPDATE categories SET cover_image = ? WHERE id = ?", [image.url, categoryId]);
    revalidatePath(`/admin/galleries/${categoryId}`);
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not set cover." };
  }
}

export async function reorderImagesAction(
  categoryId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    await requireAdmin();
    for (let i = 0; i < orderedIds.length; i += 1) {
      await run("UPDATE images SET sort_order = ? WHERE id = ? AND category_id = ?", [
        i,
        orderedIds[i],
        categoryId,
      ]);
    }
    revalidatePath(`/admin/galleries/${categoryId}`);
    const category = await getCategoryById(categoryId);
    if (category) revalidatePath(`/work/${category.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reorder." };
  }
}

export async function toggleLikeAction(imageId: string): Promise<ActionResult<{ liked: boolean; count: number }>> {
  try {
    const visitor = await visitorId();
    const existing = await first<{ id: string }>(
      "SELECT id FROM likes WHERE image_id = ? AND visitor = ?",
      [imageId, visitor],
    );
    if (existing) {
      await run("DELETE FROM likes WHERE id = ?", [existing.id]);
    } else {
      await run(
        "INSERT INTO likes (id, image_id, visitor, created_at) VALUES (?, ?, ?, ?)",
        [newId("lik_"), imageId, visitor, new Date().toISOString()],
      );
    }
    const state = await likeState(imageId, visitor);
    return { ok: true, ...state };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save that." };
  }
}
