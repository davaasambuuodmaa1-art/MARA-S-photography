"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createPrivateGalleryAction,
  deletePrivateGalleryAction,
  publishPrivateGalleryAction,
  removePrivateGalleryImageAction,
  resetPrivateGalleryLinkAction,
  updatePrivateGalleryAction,
  uploadPrivateGalleryImagesAction,
  type PrivateGalleryInput,
} from "@/app/actions/private-galleries";
import { cn } from "@/lib/utils";

export interface AdminGallery {
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  bookingId: string | null;
  note: string;
  expiresAt: string;
  downloads: boolean;
  published: boolean;
  images: string[];
  token: string;
  createdAt: string;
}

export interface GalleryBookingOption {
  id: string;
  code: string;
  name: string;
  email: string;
  date: string;
}

const EMPTY: PrivateGalleryInput = {
  title: "",
  customerName: "",
  customerEmail: "",
  bookingId: "",
  note: "",
  expiresAt: "",
  downloads: true,
};

export function PrivateGalleriesManager({
  galleries,
  bookings,
}: {
  galleries: AdminGallery[];
  bookings: GalleryBookingOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<PrivateGalleryInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = galleries.find((gallery) => gallery.id === editing) ?? null;

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const linkFor = (gallery: AdminGallery) => `${origin}/gallery/${gallery.token}`;

  const startNew = () => {
    setEditing("new");
    setDraft(EMPTY);
    setMessage(null);
    setError(null);
  };

  const startEdit = (gallery: AdminGallery) => {
    setEditing(gallery.id);
    setDraft({
      title: gallery.title,
      customerName: gallery.customerName,
      customerEmail: gallery.customerEmail,
      bookingId: gallery.bookingId ?? "",
      note: gallery.note,
      expiresAt: gallery.expiresAt,
      downloads: gallery.downloads,
    });
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    const result =
      editing === "new"
        ? await createPrivateGalleryAction(draft)
        : await updatePrivateGalleryAction(editing!, draft);
    setBusy(false);
    if (result.ok) {
      setMessage(editing === "new" ? "Gallery created. Upload photographs, then publish." : "Gallery saved.");
      if (editing === "new" && result.ok && "id" in result && result.id) setEditing(String(result.id));
      else setEditing(null);
      router.refresh();
    } else setError(result.error);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length || !active) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const result = await uploadPrivateGalleryImagesAction(active.id, formData);
    setUploading(false);
    if (result.ok) {
      setMessage(`${result.uploaded} photograph(s) uploaded.`);
      router.refresh();
    } else setError(result.error);
  };

  const publish = async (gallery: AdminGallery, next: boolean) => {
    setBusy(true);
    setError(null);
    const result = await publishPrivateGalleryAction(gallery.id, next);
    setBusy(false);
    if (result.ok) {
      setMessage(
        next
          ? "Gallery is live. Send the private link to your client — her email is on the gallery."
          : "Gallery unpublished. The link stops working immediately.",
      );
      router.refresh();
    } else setError(result.error);
  };

  const resetLink = async (gallery: AdminGallery) => {
    if (!window.confirm("Re-issue the private link? The old link stops working.")) return;
    setBusy(true);
    const result = await resetPrivateGalleryLinkAction(gallery.id);
    setBusy(false);
    if (result.ok) {
      setMessage("New private link created.");
      router.refresh();
    } else setError(result.error);
  };

  const remove = async (gallery: AdminGallery) => {
    if (!window.confirm(`Delete "${gallery.title}"? The photographs stay in storage; the gallery and link are removed.`)) {
      return;
    }
    setBusy(true);
    const result = await deletePrivateGalleryAction(gallery.id);
    setBusy(false);
    if (result.ok) {
      setEditing(null);
      router.refresh();
    } else setError(result.error);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
            {galleries.length} galler{galleries.length === 1 ? "y" : "ies"}
          </p>
          <button type="button" onClick={startNew} className="btn-dark py-2.5 text-[9px]">
            + New gallery
          </button>
        </div>

        {message ? (
          <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p>
        ) : null}

        <div className="divide-y divide-ink/10 border border-ink/12 bg-white/70">
          {galleries.length === 0 ? (
            <p className="p-6 text-center text-[12px] leading-relaxed text-smoke">
              No private galleries yet. Create one for a finished session, upload the edited photographs
              and publish it — the client gets a private link only they can open.
            </p>
          ) : null}
          {galleries.map((gallery) => (
            <button
              key={gallery.id}
              type="button"
              onClick={() => startEdit(gallery)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-cream",
                editing === gallery.id && "bg-cream",
              )}
            >
              <span className="h-12 w-12 shrink-0 overflow-hidden bg-sand">
                {gallery.images[0] ? (
                  <img src={gallery.images[0]} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-serif text-[15px]">{gallery.title}</span>
                  <span
                    className={cn(
                      "border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em]",
                      gallery.published
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-ink/15 bg-white text-smoke",
                    )}
                  >
                    {gallery.published ? "live" : "draft"}
                  </span>
                </span>
                <span className="block truncate text-[10px] text-smoke">
                  {gallery.customerEmail} · {gallery.images.length} photo{gallery.images.length === 1 ? "" : "s"}
                  {gallery.expiresAt ? ` · expires ${gallery.expiresAt}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-fit border border-ink/12 bg-white/70 p-5">
        {editing === null ? (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl">Select a gallery</p>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-smoke">
              Galleries are matched to the client&apos;s email address, so only that account — or anyone
              holding the private link — can open them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
                {editing === "new" ? "New private gallery" : "Gallery"}
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

            <div>
              <label className="label">Title</label>
              <input
                className="field"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Bondi Beach — Sarah & Tom"
              />
            </div>

            <div>
              <label className="label">Link to a booking (optional)</label>
              <select
                className="field"
                value={draft.bookingId ?? ""}
                onChange={(event) => {
                  const booking = bookings.find((item) => item.id === event.target.value);
                  setDraft({
                    ...draft,
                    bookingId: event.target.value,
                    customerName: booking && !draft.customerName ? booking.name : draft.customerName,
                    customerEmail: booking && !draft.customerEmail ? booking.email : draft.customerEmail,
                    title:
                      booking && !draft.title
                        ? `${booking.name} — ${booking.code}`
                        : draft.title,
                  });
                }}
              >
                <option value="">No booking</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.code} · {booking.name} · {booking.date}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Client name</label>
                <input
                  className="field"
                  value={draft.customerName}
                  onChange={(event) => setDraft({ ...draft, customerName: event.target.value })}
                />
              </div>
              <div>
                <label className="label">Client email</label>
                <input
                  className="field"
                  type="email"
                  value={draft.customerEmail}
                  onChange={(event) => setDraft({ ...draft, customerEmail: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Expires</label>
                <input
                  type="date"
                  className="field"
                  value={draft.expiresAt}
                  onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })}
                />
                <p className="mt-1 text-[10px] text-smoke/70">Leave empty to keep it online.</p>
              </div>
              <label className="flex items-center gap-2 pt-6 text-[11px] text-smoke">
                <input
                  type="checkbox"
                  checked={draft.downloads}
                  onChange={(event) => setDraft({ ...draft, downloads: event.target.checked })}
                />
                Allow downloads
              </label>
            </div>

            <div>
              <label className="label">Note to the client</label>
              <textarea
                rows={2}
                className="field resize-none"
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                placeholder="Thank you for a beautiful morning…"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
              >
                {busy ? "Saving…" : editing === "new" ? "Create gallery" : "Save details"}
              </button>
              {active ? (
                <button
                  type="button"
                  onClick={() => remove(active)}
                  disabled={busy}
                  className="text-[9px] uppercase tracking-[0.14em] text-rose-700"
                >
                  Delete
                </button>
              ) : null}
            </div>

            {active ? (
              <div className="space-y-3 border-t border-ink/10 pt-4">
                <div>
                  <p className="label">Photographs</p>
                  <div className="flex flex-wrap gap-2">
                    {active.images.map((url) => (
                      <div key={url} className="relative">
                        <img src={url} alt="" className="h-20 w-20 object-cover" />
                        <button
                          type="button"
                          onClick={async () => {
                            await removePrivateGalleryImageAction(active.id, url);
                            router.refresh();
                          }}
                          className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-[7px] uppercase tracking-[0.08em] text-cream"
                        >
                          Remove
                        </button>
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
                </div>

                <div className="border border-ink/12 bg-cream/60 p-3">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-smoke">Private link</p>
                  <p className="mt-1 break-all font-mono text-[10px] text-ink">{linkFor(active)}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[9px] uppercase tracking-[0.12em]">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(linkFor(active));
                          setMessage("Link copied.");
                        } catch {
                          setError("Copy failed — select the link above.");
                        }
                      }}
                      className="text-gold"
                    >
                      Copy link
                    </button>
                    <a href={linkFor(active)} target="_blank" rel="noreferrer" className="text-gold">
                      Preview
                    </a>
                    <button type="button" onClick={() => resetLink(active)} className="text-smoke">
                      Re-issue link
                    </button>
                    <a
                      href={`mailto:${active.customerEmail}?subject=${encodeURIComponent(
                        `Your gallery — ${active.title}`,
                      )}&body=${encodeURIComponent(
                        `Your photographs are ready:\n${linkFor(active)}\n\n${active.note}`,
                      )}`}
                      className="text-gold"
                    >
                      Email client
                    </a>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-smoke/70">
                    Emails are only delivered when an email provider is configured (Admin → Email).
                    The link above always works.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => publish(active, !active.published)}
                  disabled={busy}
                  className={cn(
                    "w-full py-2.5 text-[9px] uppercase tracking-[0.16em] disabled:opacity-50",
                    active.published ? "border border-ink/20 text-ink" : "btn-dark",
                  )}
                >
                  {active.published ? "Unpublish gallery" : "Publish for client"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
