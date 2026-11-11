"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { first, run } from "@/lib/db";
import { getPromotions, promotionState, quotePromotion } from "@/lib/data";
import { newId } from "@/lib/utils";
import type { ActionResult } from "./auth";

export interface PromotionInput {
  id?: string;
  code: string;
  label: string;
  kind: "percent" | "fixed";
  value: number;
  minSpend: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  active: boolean;
  note: string;
}

function normalise(input: PromotionInput) {
  const code = String(input.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const kind = input.kind === "fixed" ? "fixed" : "percent";
  const value = Math.max(0, Math.round(Number(input.value) || 0));
  const minSpend = Math.max(0, Math.round(Number(input.minSpend) || 0));
  const usageLimit = Math.max(0, Math.round(Number(input.usageLimit) || 0));
  const startsAt = /^\d{4}-\d{2}-\d{2}$/.test(input.startsAt) ? input.startsAt : "";
  const endsAt = /^\d{4}-\d{2}-\d{2}$/.test(input.endsAt) ? input.endsAt : "";
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return { error: "Use 3–24 letters, numbers or dashes for the code." as const };
  if (kind === "percent" && (value < 1 || value > 90)) return { error: "A percentage discount must be between 1% and 90%." as const };
  if (kind === "fixed" && value < 1) return { error: "Enter the amount to take off." as const };
  if (startsAt && endsAt && endsAt < startsAt) return { error: "The end date is before the start date." as const };
  return {
    data: {
      code,
      kind,
      value,
      minSpend,
      usageLimit,
      startsAt,
      endsAt,
      label: input.label.trim(),
      note: input.note.trim(),
      active: input.active ? 1 : 0,
    },
  };
}

function touch() {
  revalidatePath("/admin/promotions");
  revalidatePath("/packages");
  revalidatePath("/book");
}

export async function createPromotionAction(input: PromotionInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const result = normalise(input);
    if ("error" in result) return { ok: false, error: result.error as string };
    const existing = await first<{ id: string }>("SELECT id FROM promotions WHERE code = ?", [result.data.code]);
    if (existing) return { ok: false, error: "That code already exists." };
    await run(
      `INSERT INTO promotions (id, code, label, kind, value, min_spend, starts_at, ends_at, usage_limit, used_count, active, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        newId("promo_"),
        result.data.code,
        result.data.label,
        result.data.kind,
        result.data.value,
        result.data.minSpend,
        result.data.startsAt,
        result.data.endsAt,
        result.data.usageLimit,
        result.data.active,
        result.data.note,
        new Date().toISOString(),
      ],
    );
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create the code." };
  }
}

export async function updatePromotionAction(id: string, input: PromotionInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const result = normalise(input);
    if ("error" in result) return { ok: false, error: result.error as string };
    const clash = await first<{ id: string }>(
      "SELECT id FROM promotions WHERE code = ? AND id != ?",
      [result.data.code, id],
    );
    if (clash) return { ok: false, error: "Another code already uses that name." };
    await run(
      `UPDATE promotions SET code = ?, label = ?, kind = ?, value = ?, min_spend = ?, starts_at = ?, ends_at = ?, usage_limit = ?, active = ?, note = ? WHERE id = ?`,
      [
        result.data.code,
        result.data.label,
        result.data.kind,
        result.data.value,
        result.data.minSpend,
        result.data.startsAt,
        result.data.endsAt,
        result.data.usageLimit,
        result.data.active,
        result.data.note,
        id,
      ],
    );
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save the code." };
  }
}

export async function togglePromotionAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("UPDATE promotions SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update the code." };
  }
}

export async function deletePromotionAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await run("DELETE FROM promotions WHERE id = ?", [id]);
    touch();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete the code." };
  }
}

/** Used by the booking wizard to preview a code before the customer submits. */
export async function checkPromotionAction(
  code: string,
  subtotal: number,
): Promise<ActionResult<{ discount: number; label: string; code: string }>> {
  try {
    const quote = await quotePromotion(code, Math.max(0, Math.round(subtotal) || 0));
    if (!quote.ok) return { ok: false, error: quote.error };
    return {
      ok: true,
      discount: quote.discount,
      label: quote.label,
      code: quote.promo.code,
    };
  } catch {
    return { ok: false, error: "Could not check that code." };
  }
}

export async function listPromotionsAction() {
  await requireAdmin();
  const rows = await getPromotions();
  return rows.map((promo) => ({ ...promo, state: promotionState(promo) }));
}
