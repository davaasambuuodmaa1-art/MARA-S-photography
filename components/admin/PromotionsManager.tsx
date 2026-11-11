"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createPromotionAction,
  deletePromotionAction,
  togglePromotionAction,
  updatePromotionAction,
  type PromotionInput,
} from "@/app/actions/promotions";
import { cn, formatAUD } from "@/lib/utils";

export interface AdminPromotion {
  id: string;
  code: string;
  label: string;
  kind: "percent" | "fixed";
  value: number;
  minSpend: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  note: string;
  state: string;
}

const EMPTY: PromotionInput = {
  code: "",
  label: "",
  kind: "percent",
  value: 10,
  minSpend: 0,
  startsAt: "",
  endsAt: "",
  usageLimit: 0,
  active: true,
  note: "",
};

const STATE_COLORS: Record<string, string> = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-800",
  scheduled: "border-amber-200 bg-amber-50 text-amber-800",
  expired: "border-ink/15 bg-cream text-smoke",
  exhausted: "border-ink/15 bg-cream text-smoke",
  inactive: "border-ink/15 bg-white text-smoke",
};

export function PromotionsManager({ promotions }: { promotions: AdminPromotion[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromotionInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startNew = () => {
    setEditing("new");
    setDraft(EMPTY);
    setError(null);
  };

  const startEdit = (promo: AdminPromotion) => {
    setEditing(promo.id);
    setDraft({
      id: promo.id,
      code: promo.code,
      label: promo.label,
      kind: promo.kind,
      value: promo.value,
      minSpend: promo.minSpend,
      startsAt: promo.startsAt,
      endsAt: promo.endsAt,
      usageLimit: promo.usageLimit,
      active: promo.active,
      note: promo.note,
    });
    setError(null);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    const result =
      editing === "new" ? await createPromotionAction(draft) : await updatePromotionAction(editing!, draft);
    setBusy(false);
    if (result.ok) {
      setMessage("Code saved.");
      setEditing(null);
      router.refresh();
    } else setError(result.error);
  };

  const toggle = async (promo: AdminPromotion) => {
    setBusy(true);
    const result = await togglePromotionAction(promo.id, !promo.active);
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  };

  const remove = async (promo: AdminPromotion) => {
    if (!window.confirm(`Delete the code ${promo.code}? Past bookings keep their discount.`)) return;
    setBusy(true);
    const result = await deletePromotionAction(promo.id);
    setBusy(false);
    if (result.ok) {
      setEditing(null);
      router.refresh();
    } else setError(result.error);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
            {promotions.length} code{promotions.length === 1 ? "" : "s"}
          </p>
          <button type="button" onClick={startNew} className="btn-dark py-2.5 text-[9px]">
            + New code
          </button>
        </div>

        {message ? (
          <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p>
        ) : null}
        {error && editing === null ? (
          <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
        ) : null}

        {promotions.length === 0 ? (
          <div className="border border-ink/12 bg-white/70 p-8 text-center">
            <p className="font-serif text-xl">No promotion codes yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-smoke">
              Create a student discount, a first-session offer or a seasonal code. Nothing is applied
              automatically — clients enter the code at checkout.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink/10 border border-ink/12 bg-white/70">
            {promotions.map((promo) => (
              <div key={promo.id} className="flex items-start gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => startEdit(promo)}
                  className={cn("min-w-0 flex-1 text-left", editing === promo.id && "text-burgundy")}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] tracking-wide text-ink">{promo.code}</span>
                    <span
                      className={cn(
                        "border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em]",
                        STATE_COLORS[promo.state] ?? STATE_COLORS.inactive,
                      )}
                    >
                      {promo.state}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] text-smoke">
                    {promo.kind === "percent" ? `${promo.value}% off` : `${formatAUD(promo.value)} off`}
                    {promo.minSpend ? ` · from ${formatAUD(promo.minSpend)}` : ""}
                    {promo.usageLimit ? ` · ${promo.usedCount}/${promo.usageLimit} used` : ` · ${promo.usedCount} used`}
                  </span>
                  {promo.label ? <span className="block text-[10px] text-smoke/70">{promo.label}</span> : null}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(promo)}
                  disabled={busy}
                  className="text-[9px] uppercase tracking-[0.12em] text-smoke hover:text-ink"
                >
                  {promo.active ? "Pause" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-fit border border-ink/12 bg-white/70 p-5">
        {editing === null ? (
          <div className="py-14 text-center">
            <p className="font-serif text-2xl">Select a code</p>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-smoke">
              Codes are validated on the server when a client submits a booking, so a discount can never
              be invented in the browser.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
                {editing === "new" ? "New code" : draft.code}
              </p>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-[9px] uppercase tracking-[0.14em] text-smoke hover:text-ink"
              >
                Close
              </button>
            </div>

            {error ? (
              <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">{error}</p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Code</label>
                <input
                  className="field uppercase"
                  value={draft.code}
                  onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
                  placeholder="STUDENT15"
                />
              </div>
              <div>
                <label className="label">Label (optional)</label>
                <input
                  className="field"
                  value={draft.label}
                  onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                  placeholder="Student discount"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Type</label>
                <select
                  className="field"
                  value={draft.kind}
                  onChange={(event) => setDraft({ ...draft, kind: event.target.value as "percent" | "fixed" })}
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div>
                <label className="label">{draft.kind === "percent" ? "Percent off" : "AUD off"}</label>
                <input
                  type="number"
                  min={1}
                  className="field"
                  value={draft.value}
                  onChange={(event) => setDraft({ ...draft, value: Number(event.target.value) })}
                />
              </div>
              <div>
                <label className="label">Minimum spend</label>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={draft.minSpend}
                  onChange={(event) => setDraft({ ...draft, minSpend: Number(event.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Starts</label>
                <input
                  type="date"
                  className="field"
                  value={draft.startsAt}
                  onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Ends</label>
                <input
                  type="date"
                  className="field"
                  value={draft.endsAt}
                  onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Usage limit</label>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={draft.usageLimit}
                  onChange={(event) => setDraft({ ...draft, usageLimit: Number(event.target.value) })}
                  placeholder="0 = unlimited"
                />
              </div>
            </div>

            <div>
              <label className="label">Private note</label>
              <input
                className="field"
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                placeholder="Where this code is promoted"
              />
            </div>

            <label className="flex items-center gap-2 text-[11px] text-smoke">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Active
            </label>

            <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
              >
                {busy ? "Saving…" : editing === "new" ? "Create code" : "Save code"}
              </button>
              {editing !== "new" ? (
                <button
                  type="button"
                  onClick={() => {
                    const promo = promotions.find((item) => item.id === editing);
                    if (promo) remove(promo);
                  }}
                  disabled={busy}
                  className="text-[9px] uppercase tracking-[0.14em] text-rose-700"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
