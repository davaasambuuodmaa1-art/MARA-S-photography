"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deletePackageAction,
  savePackageAction,
  togglePackageAction,
} from "@/app/actions/admin";
import { cn, formatAUD } from "@/lib/utils";

interface Pkg {
  id: string;
  name: string;
  tagline: string;
  price: number;
  deposit_percent: number;
  description: string;
  features: string[];
  duration_hours: number;
  edited_photos: number;
  discount_percent: number;
  badge: string | null;
  active: number;
  sort_order: number;
  extra_photo_price?: number;
  extra_hour_price?: number;
  addons?: { label: string; price: number }[];
  quote_only?: number;
}

const EMPTY: Omit<Pkg, "id"> = {
  name: "",
  tagline: "",
  price: 0,
  deposit_percent: 30,
  description: "",
  features: [],
  duration_hours: 1,
  edited_photos: 10,
  discount_percent: 0,
  badge: "",
  active: 1,
  sort_order: 99,
  extra_photo_price: 45,
  extra_hour_price: 150,
  addons: [],
  quote_only: 0,
};

export function PackagesManager({ packages }: { packages: Pkg[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<(Omit<Pkg, "id"> & { id?: string }) | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [addonsText, setAddonsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (pkg?: Pkg) => {
    setError(null);
    if (pkg) {
      setEditing({
        ...pkg,
        badge: pkg.badge ?? "",
        extra_photo_price: pkg.extra_photo_price ?? 0,
        extra_hour_price: pkg.extra_hour_price ?? 0,
        addons: pkg.addons ?? [],
        quote_only: pkg.quote_only ?? 0,
      });
      setFeaturesText(pkg.features.join("\n"));
      setAddonsText((pkg.addons ?? []).map((a) => `${a.label}: ${a.price}`).join("\n"));
    } else {
      setEditing({ ...EMPTY });
      setFeaturesText("1-hour session\n10 retouched images\nDigital delivery");
      setAddonsText("");
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    const result = await savePackageAction({
      id: editing.id,
      name: editing.name,
      tagline: editing.tagline,
      price: Number(editing.price) || 0,
      deposit_percent: Number(editing.deposit_percent) || 30,
      description: editing.description,
      features: featuresText.split("\n").map((line) => line.trim()).filter(Boolean),
      duration_hours: Number(editing.duration_hours) || 1,
      edited_photos: Number(editing.edited_photos) || 0,
      discount_percent: Number(editing.discount_percent) || 0,
      badge: editing.badge ?? "",
      active: Boolean(editing.active),
      sort_order: Number(editing.sort_order) || 0,
      extra_photo_price: Number(editing.extra_photo_price) || 0,
      extra_hour_price: Number(editing.extra_hour_price) || 0,
      addons: addonsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, price] = line.split(":");
          return { label: (label ?? "").trim(), price: Number(price) || 0 };
        })
        .filter((a) => a.label),
      quote_only: Boolean(editing.quote_only),
    });
    setBusy(false);
    if (result.ok) {
      setEditing(null);
      router.refresh();
    } else setError(result.error);
  };

  return (
    <div className="space-y-5">
      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p> : null}
      <div className="flex justify-end">
        <button type="button" onClick={() => open()} className="btn-dark py-2.5 text-[9px]">+ New package</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border border-ink/12 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-2xl">{pkg.name}</p>
                <p className="text-[11px] italic text-smoke">{pkg.tagline}</p>
              </div>
              <span className={cn("border px-2 py-1 text-[8px] uppercase tracking-[0.14em]", pkg.active ? "border-emerald-300 text-emerald-800" : "border-ink/20 text-smoke")}>
                {pkg.active ? "Live" : "Hidden"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="display text-2xl">{pkg.price ? formatAUD(pkg.price) : "Quote"}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-smoke">
                {pkg.duration_hours}h · {pkg.edited_photos || "custom"} images · {pkg.deposit_percent}% deposit
              </span>
              {pkg.discount_percent > 0 ? (
                <span className="border border-gold/40 px-2 py-0.5 text-[8px] uppercase tracking-[0.12em] text-gold">
                  {pkg.discount_percent}% off
                </span>
              ) : null}
            </div>
            <ul className="mt-3 space-y-1 text-[11px] text-smoke">
              {pkg.features.slice(0, 4).map((feature) => (
                <li key={feature}>— {feature}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 border-t border-ink/10 pt-3 text-[9px] uppercase tracking-[0.14em] text-smoke">
              <button type="button" onClick={() => open(pkg)} className="hover:text-ink">Edit</button>
              <button
                type="button"
                onClick={async () => {
                  await togglePackageAction(pkg.id, !pkg.active);
                  router.refresh();
                }}
                className="hover:text-ink"
              >
                {pkg.active ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const result = await deletePackageAction(pkg.id);
                  if (!result.ok) setError(result.error);
                  router.refresh();
                }}
                className="hover:text-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 py-10">
          <form onSubmit={save} className="w-full max-w-2xl border border-ink/12 bg-cream p-6">
            <p className="eyebrow">{editing.id ? "Edit package" : "New package"}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input required className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Tagline</label>
                <input className="field" value={editing.tagline} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} />
              </div>
              <div>
                <label className="label">Price (AUD)</label>
                <input type="number" min={0} className="field" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Deposit %</label>
                <input type="number" min={0} max={100} className="field" value={editing.deposit_percent} onChange={(e) => setEditing({ ...editing, deposit_percent: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Discount % (promo)</label>
                <input type="number" min={0} max={90} className="field" value={editing.discount_percent} onChange={(e) => setEditing({ ...editing, discount_percent: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Duration (hours)</label>
                <input type="number" min={1} max={24} className="field" value={editing.duration_hours} onChange={(e) => setEditing({ ...editing, duration_hours: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Edited photos</label>
                <input type="number" min={0} className="field" value={editing.edited_photos} onChange={(e) => setEditing({ ...editing, edited_photos: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Badge</label>
                <input className="field" placeholder="Most loved" value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} />
              </div>
              <div>
                <label className="label">Extra photo price (AUD)</label>
                <input type="number" min={0} className="field" value={editing.extra_photo_price ?? 0} onChange={(e) => setEditing({ ...editing, extra_photo_price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Extra hour price (AUD)</label>
                <input type="number" min={0} className="field" value={editing.extra_hour_price ?? 0} onChange={(e) => setEditing({ ...editing, extra_hour_price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="mt-4">
              <label className="label">Optional add-ons (one per line: "Label: price")</label>
              <textarea rows={3} className="field resize-none" value={addonsText} onChange={(e) => setAddonsText(e.target.value)} placeholder="Printed album: 120\nSecond shooter: 300" />
            </div>
            <label className="mt-4 flex items-center gap-2 text-xs text-smoke">
              <input type="checkbox" checked={Boolean(editing.quote_only)} onChange={(e) => setEditing({ ...editing, quote_only: e.target.checked ? 1 : 0 })} />
              Quote-only package (no instant price)
            </label>
            <div className="mt-4">
              <label className="label">What is included (one per line)</label>
              <textarea rows={5} className="field resize-none" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
            </div>
            <div className="mt-4">
              <label className="label">Short description</label>
              <input className="field" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <label className="mt-4 flex items-center gap-2 text-xs text-smoke">
              <input type="checkbox" checked={Boolean(editing.active)} onChange={(e) => setEditing({ ...editing, active: e.target.checked ? 1 : 0 })} />
              Visible on the website
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="text-[9px] uppercase tracking-[0.16em] text-smoke">Cancel</button>
              <button type="submit" disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
                {busy ? "Saving…" : "Save package"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
