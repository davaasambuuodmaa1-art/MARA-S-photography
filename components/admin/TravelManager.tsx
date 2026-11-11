"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSiteContentAction } from "@/app/actions/admin";
import {
  deleteServiceAreaAction,
  saveServiceAreaAction,
  type ServiceAreaInput,
} from "@/app/actions/locations";
import { cn, formatAUD } from "@/lib/utils";

export interface AdminServiceArea {
  id: string;
  name: string;
  postcodes: string;
  baseFee: number;
  perKm: number;
  minSpend: number;
  freeWithinKm: number;
  notes: string;
  active: boolean;
}

const EMPTY: ServiceAreaInput = {
  name: "",
  postcodes: "",
  baseFee: 0,
  perKm: 0,
  minSpend: 0,
  freeWithinKm: 15,
  notes: "",
  active: true,
};

export function TravelManager({
  areas,
  travelPolicy,
  rainPolicy,
  permits,
}: {
  areas: AdminServiceArea[];
  travelPolicy: string;
  rainPolicy: string;
  permits: { id: string; name: string; permitStatus: string; requirements: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceAreaInput>(EMPTY);
  const [policies, setPolicies] = useState({ travelPolicy, rainPolicy });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startNew = () => {
    setEditing("new");
    setDraft(EMPTY);
  };

  const startEdit = (area: AdminServiceArea) => {
    setEditing(area.id);
    setDraft({
      id: area.id,
      name: area.name,
      postcodes: area.postcodes,
      baseFee: area.baseFee,
      perKm: area.perKm,
      minSpend: area.minSpend,
      freeWithinKm: area.freeWithinKm,
      notes: area.notes,
      active: area.active,
    });
  };

  const saveArea = async () => {
    setBusy(true);
    setError(null);
    const result = await saveServiceAreaAction(draft);
    setBusy(false);
    if (result.ok) {
      setEditing(null);
      setMessage("Service area saved.");
      router.refresh();
    } else setError(result.error);
  };

  const removeArea = async (id: string) => {
    if (!window.confirm("Delete this service area?")) return;
    setBusy(true);
    const result = await deleteServiceAreaAction(id);
    setBusy(false);
    if (result.ok) {
      setEditing(null);
      setMessage("Service area deleted.");
      router.refresh();
    } else setError(result.error);
  };

  const savePolicies = async () => {
    setBusy(true);
    setError(null);
    const result = await saveSiteContentAction(policies);
    setBusy(false);
    if (result?.ok === false) setError(result.error);
    else {
      setMessage("Policies updated.");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {message ? (
        <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="border border-ink/12 bg-white/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Service areas & fees</p>
            <button type="button" onClick={startNew} className="btn-dark py-2 text-[9px]">
              + New area
            </button>
          </div>

          <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => startEdit(area)}
                className={cn(
                  "flex w-full items-start justify-between gap-4 py-3 text-left hover:bg-cream",
                  editing === area.id && "bg-cream",
                )}
              >
                <span>
                  <span className="block text-sm text-ink">
                    {area.name} {!area.active ? <span className="text-[9px] text-smoke">· inactive</span> : null}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-smoke">
                    {area.postcodes || "All postcodes"} · free within {area.freeWithinKm} km
                    {area.minSpend ? ` · min ${formatAUD(area.minSpend)}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[11px] text-ink">
                  {area.baseFee > 0 ? formatAUD(area.baseFee) : "Included"}
                  {area.perKm > 0 ? <span className="block text-[9px] text-smoke">+{formatAUD(area.perKm)}/km</span> : null}
                </span>
              </button>
            ))}
          </div>

          {editing ? (
            <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Area name</label>
                  <input
                    className="field"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Postcode range</label>
                  <input
                    className="field"
                    value={draft.postcodes}
                    onChange={(event) => setDraft({ ...draft, postcodes: event.target.value })}
                    placeholder="2000–2050"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ["baseFee", "Base fee"],
                    ["perKm", "Per km"],
                    ["minSpend", "Min. session"],
                    ["freeWithinKm", "Free km"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input
                      type="number"
                      min={0}
                      className="field"
                      value={draft[key]}
                      onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Notes shown to clients</label>
                <input
                  className="field"
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
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
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveArea}
                  disabled={busy}
                  className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save area"}
                </button>
                {draft.id ? (
                  <button
                    type="button"
                    onClick={() => removeArea(draft.id!)}
                    className="text-[9px] uppercase tracking-[0.14em] text-rose-700"
                  >
                    Delete
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="text-[9px] uppercase tracking-[0.14em] text-smoke"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <div className="space-y-6">
          <section className="border border-ink/12 bg-white/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Policies</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">Travel policy</label>
                <textarea
                  rows={4}
                  className="field resize-none text-xs"
                  value={policies.travelPolicy}
                  onChange={(event) => setPolicies({ ...policies, travelPolicy: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Rain & bad weather policy</label>
                <textarea
                  rows={4}
                  className="field resize-none text-xs"
                  value={policies.rainPolicy}
                  onChange={(event) => setPolicies({ ...policies, rainPolicy: event.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={savePolicies}
                disabled={busy}
                className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save policies"}
              </button>
            </div>
          </section>

          <section className="border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-900">Permits to confirm</p>
            <p className="mt-2 text-[11px] leading-relaxed text-amber-900/80">
              These locations are not advertised as approved for commercial photography. Confirm the
              council or venue requirement, then update the location.
            </p>
            <div className="mt-3 space-y-2">
              {permits.length ? (
                permits.map((permit) => (
                  <div key={permit.id} className="border-t border-amber-900/10 pt-2">
                    <p className="text-[12px] text-amber-950">{permit.name}</p>
                    <p className="text-[10px] leading-relaxed text-amber-900/70">
                      {permit.requirements || "No requirements recorded yet."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-amber-900/70">Every location has been checked.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
