"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createLocationAction,
  deleteLocationAction,
  removeLocationImageAction,
  setLocationCoverAction,
  updateLocationAction,
  uploadLocationImagesAction,
  type LocationInput,
} from "@/app/actions/locations";
import { cn, formatAUD } from "@/lib/utils";

export interface AdminLocation {
  id: string;
  slug: string;
  name: string;
  area: string;
  description: string;
  styles: string[];
  coverImage: string;
  images: string[];
  mapsUrl: string;
  travelInfo: string;
  requirements: string;
  permitStatus: string;
  venueApproved: boolean;
  travelFee: number;
  minSpend: number;
  available: boolean;
  suggested: boolean;
}

const STYLE_OPTIONS = [
  "Portrait",
  "Couple",
  "Wedding",
  "Family",
  "Fashion",
  "Lifestyle",
  "Maternity",
  "Newborn",
  "Graduation",
  "Birthday",
  "Architecture",
  "Landscape",
  "Street",
  "Travel",
  "Event",
  "Concert",
  "Product",
  "Commercial",
  "Nature",
  "Football & Sports",
];

const PERMIT_OPTIONS = [
  { value: "unchecked", label: "To be confirmed" },
  { value: "required", label: "Permit required" },
  { value: "approved", label: "Permit approved" },
  { value: "not_required", label: "No permit required" },
];

const EMPTY: LocationInput = {
  name: "",
  area: "Sydney",
  description: "",
  styles: [],
  mapsUrl: "",
  travelInfo: "",
  requirements: "",
  permitStatus: "unchecked",
  venueApproved: false,
  travelFee: 0,
  minSpend: 0,
  available: true,
  suggested: true,
};

function toInput(location: AdminLocation): LocationInput {
  return {
    name: location.name,
    area: location.area,
    description: location.description,
    styles: location.styles,
    mapsUrl: location.mapsUrl,
    travelInfo: location.travelInfo,
    requirements: location.requirements,
    permitStatus: location.permitStatus,
    venueApproved: location.venueApproved,
    travelFee: location.travelFee,
    minSpend: location.minSpend,
    available: location.available,
    suggested: location.suggested,
  };
}

export function LocationsManager({ locations }: { locations: AdminLocation[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id | "new" | null
  const [draft, setDraft] = useState<LocationInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const active = locations.find((location) => location.id === editing) ?? null;

  const startNew = () => {
    setEditing("new");
    setDraft(EMPTY);
    setError(null);
    setMessage(null);
  };

  const startEdit = (location: AdminLocation) => {
    setEditing(location.id);
    setDraft(toInput(location));
    setError(null);
    setMessage(null);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    const result =
      editing === "new" ? await createLocationAction(draft) : await updateLocationAction(editing!, draft);
    setBusy(false);
    if (result.ok) {
      setMessage(editing === "new" ? "Location added." : "Location saved.");
      setEditing(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const remove = async () => {
    if (!active) return;
    if (!window.confirm(`Delete ${active.name}? Bookings keep their recorded location.`)) return;
    setBusy(true);
    const result = await deleteLocationAction(active.id);
    setBusy(false);
    if (result.ok) {
      setEditing(null);
      setMessage("Location deleted.");
      router.refresh();
    } else setError(result.error);
  };

  const upload = async (files: FileList | null) => {
    if (!files || !files.length || !active) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const result = await uploadLocationImagesAction(active.id, formData);
    setUploading(false);
    if (result.ok) {
      setMessage(`${result.uploaded} photo(s) uploaded.`);
      router.refresh();
    } else setError(result.error);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
            {locations.length} locations
          </p>
          <button type="button" onClick={startNew} className="btn-dark py-2.5 text-[9px]">
            + New location
          </button>
        </div>

        {message ? (
          <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p>
        ) : null}
        {error ? (
          <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
        ) : null}

        <div className="divide-y divide-ink/10 border border-ink/12 bg-white/70">
          {locations.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => startEdit(location)}
              className={cn(
                "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-cream",
                editing === location.id && "bg-cream",
              )}
            >
              <span className="h-14 w-14 shrink-0 overflow-hidden bg-sand">
                {location.coverImage ? (
                  <img src={location.coverImage} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-serif text-lg">{location.name}</span>
                  {!location.available ? (
                    <span className="border border-ink/15 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-smoke">
                      Hidden
                    </span>
                  ) : null}
                </span>
                <span className="block text-[10px] uppercase tracking-[0.14em] text-smoke">
                  {location.area} · {location.travelFee > 0 ? `+${formatAUD(location.travelFee)}` : "travel included"}
                </span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-smoke/60">
                  {PERMIT_OPTIONS.find((p) => p.value === location.permitStatus)?.label}
                  {location.minSpend ? ` · min ${formatAUD(location.minSpend)}` : ""}
                </span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.14em] text-gold">Edit</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-fit border border-ink/12 bg-white/70 p-5">
        {editing === null ? (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl">Select a location</p>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-smoke">
              Choose a spot on the left to edit its description, travel fee, permit status and photos —
              or add a new one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
                {editing === "new" ? "New location" : active?.name}
              </p>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-[9px] uppercase tracking-[0.14em] text-smoke hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input
                  className="field"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Area</label>
                <input
                  className="field"
                  value={draft.area}
                  onChange={(event) => setDraft({ ...draft, area: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                rows={3}
                className="field resize-none"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>

            <div>
              <p className="label">Photography styles</p>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_OPTIONS.map((style) => {
                  const on = draft.styles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          styles: on
                            ? draft.styles.filter((s) => s !== style)
                            : [...draft.styles, style],
                        })
                      }
                      className={cn(
                        "border px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] transition-colors",
                        on ? "border-ink bg-ink text-cream" : "border-ink/15 text-smoke hover:border-ink/40",
                      )}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Travel fee (AUD)</label>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={draft.travelFee}
                  onChange={(event) => setDraft({ ...draft, travelFee: Number(event.target.value) })}
                />
              </div>
              <div>
                <label className="label">Minimum session (AUD)</label>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={draft.minSpend}
                  onChange={(event) => setDraft({ ...draft, minSpend: Number(event.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Permit status</label>
                <select
                  className="field"
                  value={draft.permitStatus}
                  onChange={(event) => setDraft({ ...draft, permitStatus: event.target.value })}
                >
                  {PERMIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Venue approval</label>
                <label className="flex items-center gap-2 py-3 text-[11px] text-smoke">
                  <input
                    type="checkbox"
                    checked={draft.venueApproved}
                    onChange={(event) => setDraft({ ...draft, venueApproved: event.target.checked })}
                  />
                  Permission confirmed with the venue
                </label>
              </div>
            </div>
            {draft.permitStatus === "approved" && !draft.venueApproved ? (
              <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800">
                This location will show as “to be confirmed” until venue approval is checked — the site
                never advertises unconfirmed commercial access.
              </p>
            ) : null}

            <div>
              <label className="label">Google Maps link</label>
              <input
                className="field"
                value={draft.mapsUrl}
                onChange={(event) => setDraft({ ...draft, mapsUrl: event.target.value })}
                placeholder="https://maps.app.goo.gl/…"
              />
            </div>
            <div>
              <label className="label">Travel & access notes</label>
              <textarea
                rows={2}
                className="field resize-none"
                value={draft.travelInfo}
                onChange={(event) => setDraft({ ...draft, travelInfo: event.target.value })}
              />
            </div>
            <div>
              <label className="label">Permit / venue requirements</label>
              <textarea
                rows={2}
                className="field resize-none"
                value={draft.requirements}
                onChange={(event) => setDraft({ ...draft, requirements: event.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-[11px] text-smoke">
                <input
                  type="checkbox"
                  checked={draft.available}
                  onChange={(event) => setDraft({ ...draft, available: event.target.checked })}
                />
                Available to book
              </label>
              <label className="flex items-center gap-2 text-[11px] text-smoke">
                <input
                  type="checkbox"
                  checked={draft.suggested}
                  onChange={(event) => setDraft({ ...draft, suggested: event.target.checked })}
                />
                Offer as a suggested location
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
              >
                {busy ? "Saving…" : editing === "new" ? "Create location" : "Save changes"}
              </button>
              {active ? (
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="text-[9px] uppercase tracking-[0.14em] text-rose-700 hover:text-rose-900"
                >
                  Delete
                </button>
              ) : null}
            </div>

            {active ? (
              <div className="border-t border-ink/10 pt-4">
                <p className="label">Preview photographs</p>
                <div className="flex flex-wrap items-center gap-2">
                  {active.images.map((url) => (
                    <div key={url} className="relative">
                      <img src={url} alt="" className="h-20 w-20 object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await setLocationCoverAction(active.id, url);
                            router.refresh();
                          }}
                          className="text-[7px] uppercase tracking-[0.08em] text-cream"
                        >
                          Cover
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeLocationImageAction(active.id, url);
                            router.refresh();
                          }}
                          className="text-[7px] uppercase tracking-[0.08em] text-cream"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center border border-dashed border-ink/25 text-center text-[8px] uppercase tracking-[0.1em] text-smoke">
                    {uploading ? "…" : "+ Add"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => upload(event.target.files)}
                    />
                  </label>
                </div>
                <p className="mt-2 text-[10px] text-smoke/70">
                  Uploaded to secure storage (R2). The first image is used as the cover until you choose
                  another.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
