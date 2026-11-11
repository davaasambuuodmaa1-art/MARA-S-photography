"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveSiteContentAction, uploadAssetAction } from "@/app/actions/admin";
import type { SiteSettings } from "@/lib/types";

export function FounderManager({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    founderName: settings.founderName,
    founderRole: settings.founderRole,
    founderIntro: settings.founderIntro,
    founderBio: settings.founderBio,
    founderExperience: settings.founderExperience,
    founderPortrait: settings.founderPortrait,
    founderVisible: settings.founderVisible,
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      founderName: settings.founderName,
      founderRole: settings.founderRole,
      founderIntro: settings.founderIntro,
      founderBio: settings.founderBio,
      founderExperience: settings.founderExperience,
      founderPortrait: settings.founderPortrait,
      founderVisible: settings.founderVisible,
    });
  }, [settings]);

  const save = async () => {
    setBusy(true);
    setError(null);
    const result = await saveSiteContentAction(draft);
    setBusy(false);
    if (result.ok) {
      setMessage("Founder section saved.");
      router.refresh();
    } else setError(result.error);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAssetAction(formData);
    setUploading(false);
    if (result.ok && result.url) {
      setDraft((current) => ({ ...current, founderPortrait: result.url }));
      setMessage("Portrait uploaded — save to publish it.");
    } else if (!result.ok) setError(result.error);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="space-y-3 border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Identity</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input
              className="field"
              value={draft.founderName}
              onChange={(event) => setDraft({ ...draft, founderName: event.target.value })}
            />
          </div>
          <div>
            <label className="label">Role</label>
            <input
              className="field"
              value={draft.founderRole}
              onChange={(event) => setDraft({ ...draft, founderRole: event.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Short introduction</label>
          <textarea
            rows={3}
            className="field resize-none text-sm"
            value={draft.founderIntro}
            onChange={(event) => setDraft({ ...draft, founderIntro: event.target.value })}
          />
        </div>

        <div>
          <label className="label">Biography</label>
          <textarea
            rows={7}
            className="field resize-none text-sm"
            value={draft.founderBio}
            onChange={(event) => setDraft({ ...draft, founderBio: event.target.value })}
          />
          <p className="mt-1 text-[10px] leading-relaxed text-smoke/70">
            Only describe experience, training, awards or clients that are genuinely yours. This text
            appears on the About page.
          </p>
        </div>

        <div>
          <label className="label">Experience & approach (optional)</label>
          <textarea
            rows={4}
            className="field resize-none text-sm"
            value={draft.founderExperience}
            onChange={(event) => setDraft({ ...draft, founderExperience: event.target.value })}
            placeholder="How you work on the day — direction, light, pacing."
          />
        </div>

        <label className="flex items-center gap-2 text-[11px] text-smoke">
          <input
            type="checkbox"
            checked={draft.founderVisible}
            onChange={(event) => setDraft({ ...draft, founderVisible: event.target.checked })}
          />
          Show the founder section on the public site
        </label>

        <div className="flex items-center gap-3 border-t border-ink/10 pt-4">
          <button type="button" onClick={save} disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-50">
            {busy ? "Saving…" : "Save founder section"}
          </button>
          {message ? <span className="text-[10px] text-emerald-700">{message}</span> : null}
          {error ? <span className="text-[10px] text-rose-700">{error}</span> : null}
        </div>
      </section>

      <section className="h-fit space-y-3 border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Portrait</p>
        <div className="aspect-[4/5] w-full max-w-xs overflow-hidden bg-sand">
          {draft.founderPortrait ? (
            <img src={draft.founderPortrait} alt="Founder portrait" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[11px] text-smoke">
              No portrait yet — upload a photograph of yourself. Until then the site uses a neutral
              placeholder and makes no claim about who took the images.
            </div>
          )}
        </div>
        <label className="block cursor-pointer border border-dashed border-ink/25 px-4 py-3 text-center text-[9px] uppercase tracking-[0.14em] text-smoke">
          {uploading ? "Uploading…" : "Upload portrait"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
        <p className="text-[10px] leading-relaxed text-smoke/70">
          Stored in R2 object storage and served through your own domain. Keep it under 10 MB.
        </p>
      </section>
    </div>
  );
}
