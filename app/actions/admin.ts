"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getEnv, first, run } from "@/lib/db";
import { getSiteSettings, saveSiteSettings } from "@/lib/data";
import type { ActionResult } from "./auth";
import type { Package, SiteSettings, Testimonial } from "@/lib/types";
import { newId, slugify } from "@/lib/utils";

/* ---------------------------------- content --------------------------------- */

export async function saveSiteContentAction(
  patch: Partial<SiteSettings>,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await saveSiteSettings(patch);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save content." };
  }
}

export async function sendTestEmailAction(to: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const address = to.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(address)) {
      return { ok: false, error: "Enter a valid email address." };
    }
    const { sendEmail } = await import("@/lib/notify");
    const result = await sendEmail({
      to: address,
      subject: "Mara's Photography — test message",
      text: "This is a test from your admin dashboard. If it arrived, email delivery is configured correctly.",
    });
    if (!result.sent) {
      return {
        ok: false,
        error:
          result.reason === "no-provider"
            ? "No email provider is configured. Add RESEND_API_KEY to the project's secrets, then redeploy."
            : `The provider refused the message (${result.reason}). Check the API key and verified sender domain.`,
      };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not send the test." };
  }
}

export async function uploadAssetAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();
    const env = await getEnv();
    if (!env.FILES) return { ok: false, error: "R2 storage binding (FILES) is not configured." };
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Choose an image." };
    if (!file.type.startsWith("image/")) return { ok: false, error: "Only image files are supported." };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Keep images under 10 MB." };
    const key = `assets/${newId("ast_")}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "image"}.${(
      file.name.split(".").pop() || "jpg"
    ).toLowerCase()}`;
    await env.FILES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000" },
    });
    return { ok: true, url: `/api/media/${key}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

/* ------------------------------- testimonials ------------------------------- */

export async function saveTestimonialAction(input: {
  id?: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  published: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!input.name.trim() || !input.quote.trim()) {
      return { ok: false, error: "A name and quote are required." };
    }
    if (input.id) {
      await run("UPDATE testimonials SET name = ?, role = ?, quote = ?, rating = ?, published = ? WHERE id = ?", [
        input.name.trim(),
        input.role.trim(),
        input.quote.trim(),
        Math.max(1, Math.min(5, input.rating)),
        input.published ? 1 : 0,
        input.id,
      ]);
    } else {
      const max = await first<{ max: number }>("SELECT COALESCE(MAX(sort_order), 0) AS max FROM testimonials");
      await run(
        "INSERT INTO testimonials (id, name, role, quote, image, rating, published, sort_order) VALUES (?, ?, ?, ?, NULL, ?, ?, ?)",
        [
          newId("tst_"),
          input.name.trim(),
          input.role.trim(),
          input.quote.trim(),
          Math.max(1, Math.min(5, input.rating)),
          input.published ? 1 : 0,
          Number(max?.max ?? 0) + 1,
        ],
      );
    }
    revalidatePath("/", "layout");
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save testimonial." };
  }
}

export async function deleteTestimonialAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("DELETE FROM testimonials WHERE id = ?", [id]);
    revalidatePath("/", "layout");
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete." };
  }
}

/* --------------------------------- enquiries -------------------------------- */

export async function updateInquiryAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("UPDATE inquiries SET status = ? WHERE id = ?", [status, id]);
    revalidatePath("/admin/inquiries");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update." };
  }
}

export async function deleteInquiryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("DELETE FROM inquiries WHERE id = ?", [id]);
    revalidatePath("/admin/inquiries");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete." };
  }
}

export async function createInquiryAction(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<ActionResult> {
  try {
    const name = input.name.trim();
    const message = input.message.trim();
    if (name.length < 2) return { ok: false, error: "Please share your name." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(input.email.trim())) {
      return { ok: false, error: "Please add a valid email address." };
    }
    if (message.length < 10) return { ok: false, error: "Tell us a little more about your plans." };
    const { notifyAdmin } = await import("@/lib/notify");
    await run(
      "INSERT INTO inquiries (id, name, email, phone, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'new', ?)",
      [
        newId("inq_"),
        name,
        input.email.trim().toLowerCase(),
        input.phone.trim(),
        input.subject.trim() || "General enquiry",
        message,
        new Date().toISOString(),
      ],
    );
    await notifyAdmin({
      type: "inquiry",
      title: `New enquiry — ${name}`,
      body: `${input.subject || "General enquiry"} · ${input.email.trim()}`,
      link: "/admin/inquiries",
      emailSubject: `New enquiry from ${name}`,
      emailBody: `${input.email}\n${input.phone}\n\n${message}`,
    });
    revalidatePath("/admin/inquiries");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not send your message." };
  }
}

/* ------------------------------- notifications ------------------------------ */

export async function markNotificationsReadAction(id?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (id) await run("UPDATE notifications SET read = 1 WHERE id = ?", [id]);
    else await run("UPDATE notifications SET read = 1");
    revalidatePath("/admin/notifications");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update." };
  }
}

/* -------------------------------- customers -------------------------------- */

export async function saveCustomerNotesAction(
  email: string,
  notes: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const user = await first<{ id: string }>("SELECT id FROM users WHERE email = ?", [email]);
    if (user) {
      await run("UPDATE users SET notes = ? WHERE id = ?", [notes, user.id]);
    } else {
      await run(
        "INSERT INTO users (id, email, password_hash, name, phone, role, notes, created_at) VALUES (?, ?, '', ?, '', 'customer', ?, ?)",
        [newId("u_"), email, email.split("@")[0], notes, new Date().toISOString()],
      );
    }
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save notes." };
  }
}

/* --------------------------------- packages -------------------------------- */

export async function savePackageAction(input: {
  id?: string;
  name: string;
  tagline: string;
  price: number;
  deposit_percent: number;
  description: string;
  features: string[];
  duration_hours: number;
  edited_photos: number;
  discount_percent: number;
  badge: string;
  active: boolean;
  sort_order: number;
  extra_photo_price?: number;
  extra_hour_price?: number;
  addons?: { label: string; price: number }[];
  quote_only?: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!input.name.trim()) return { ok: false, error: "Give the package a name." };
    if (input.price < 0) return { ok: false, error: "Price cannot be negative." };
    const features = JSON.stringify(input.features.filter((f) => f.trim()));
    if (input.id) {
      await run(
        `UPDATE packages SET name = ?, tagline = ?, price = ?, deposit_percent = ?, description = ?, features = ?,
         duration_hours = ?, edited_photos = ?, discount_percent = ?, badge = ?, active = ?, sort_order = ?,
         extra_photo_price = ?, extra_hour_price = ?, addons = ?, quote_only = ? WHERE id = ?`,
        [
          input.name.trim(),
          input.tagline.trim(),
          Math.round(input.price),
          Math.max(0, Math.min(100, input.deposit_percent)),
          input.description.trim(),
          features,
          input.duration_hours,
          input.edited_photos,
          Math.max(0, Math.min(90, input.discount_percent)),
          input.badge.trim() || null,
          input.active ? 1 : 0,
          input.sort_order,
          Math.max(0, Math.round(input.extra_photo_price ?? 0)),
          Math.max(0, Math.round(input.extra_hour_price ?? 0)),
          JSON.stringify((input.addons ?? []).filter((a) => a.label.trim())),
          input.quote_only ? 1 : 0,
          input.id,
        ],
      );
    } else {
      let slug = slugify(input.name);
      let attempt = 1;
      while (await first<{ id: string }>("SELECT id FROM packages WHERE slug = ?", [slug])) {
        slug = `${slugify(input.name)}-${attempt++}`;
      }
      await run(
        `INSERT INTO packages (id, name, slug, tagline, price, deposit_percent, description, features, duration_hours, edited_photos, discount_percent, badge, active, sort_order, extra_photo_price, extra_hour_price, addons, quote_only)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId("pkg_"),
          input.name.trim(),
          slug,
          input.tagline.trim(),
          Math.round(input.price),
          Math.max(0, Math.min(100, input.deposit_percent)),
          input.description.trim(),
          features,
          input.duration_hours,
          input.edited_photos,
          Math.max(0, Math.min(90, input.discount_percent)),
          input.badge.trim() || null,
          input.active ? 1 : 0,
          input.sort_order,
          Math.max(0, Math.round(input.extra_photo_price ?? 0)),
          Math.max(0, Math.round(input.extra_hour_price ?? 0)),
          JSON.stringify((input.addons ?? []).filter((a) => a.label.trim())),
          input.quote_only ? 1 : 0,
        ],
      );
    }
    revalidatePath("/packages");
    revalidatePath("/admin/packages");
    revalidatePath("/book");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save package." };
  }
}

export async function deletePackageAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const used = await first<{ count: number }>("SELECT COUNT(*) AS count FROM bookings WHERE package_id = ?", [id]);
    if (Number(used?.count ?? 0) > 0) {
      return { ok: false, error: "This package has bookings — disable it instead of deleting." };
    }
    await run("DELETE FROM packages WHERE id = ?", [id]);
    revalidatePath("/admin/packages");
    revalidatePath("/packages");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete package." };
  }
}

export async function togglePackageAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("UPDATE packages SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
    revalidatePath("/admin/packages");
    revalidatePath("/packages");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update." };
  }
}

/* ------------------------------- availability ------------------------------- */

export async function saveAvailabilityAction(input: {
  weekday: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  capacity: number;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (input.start_time >= input.end_time) return { ok: false, error: "Closing time must be after opening." };
    await run(
      `INSERT INTO availability (weekday, is_working, start_time, end_time, slot_minutes, capacity)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(weekday) DO UPDATE SET is_working = excluded.is_working, start_time = excluded.start_time,
       end_time = excluded.end_time, slot_minutes = excluded.slot_minutes, capacity = excluded.capacity`,
      [
        input.weekday,
        input.is_working ? 1 : 0,
        input.start_time,
        input.end_time,
        Math.max(30, Math.min(360, input.slot_minutes)),
        Math.max(1, Math.min(20, input.capacity)),
      ],
    );
    revalidatePath("/admin/availability");
    revalidatePath("/book");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save hours." };
  }
}

export async function addBlockedDateAction(date: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Choose a date." };
    await run(
      "INSERT INTO blocked_dates (date, reason) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET reason = excluded.reason",
      [date, reason.trim()],
    );
    revalidatePath("/admin/availability");
    revalidatePath("/book");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not block that date." };
  }
}

export async function removeBlockedDateAction(date: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("DELETE FROM blocked_dates WHERE date = ?", [date]);
    revalidatePath("/admin/availability");
    revalidatePath("/book");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not open that date." };
  }
}

/* -------------------------------- references -------------------------------- */

export async function uploadReferenceAction(formData: FormData): Promise<ActionResult<{ urls: string[] }>> {
  try {
    const env = await getEnv();
    if (!env.FILES) return { ok: false, error: "Reference uploads are unavailable right now." };
    const files = formData.getAll("files").filter((f): f is File => f instanceof File).slice(0, 6);
    if (!files.length) return { ok: false, error: "Choose images to upload." };
    const urls: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) continue;
      const key = `references/${newId("ref_")}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
      await env.FILES.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
      urls.push(`/api/media/${key}`);
    }
    return urls.length ? { ok: true, urls } : { ok: false, error: "Those files were not valid images." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

void getSiteSettings;
void slugify;
type _P = Package;
type _T = Testimonial;
