"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateCategoryAction } from "@/app/actions/galleries";
import { cn } from "@/lib/utils";

export function CategorySettings({
  category,
}: {
  category: {
    id: string;
    name: string;
    description: string;
    published: number;
    watermark: number;
    downloads: number;
  };
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: category.name,
    description: category.description,
    published: Boolean(category.published),
    watermark: Boolean(category.watermark),
    downloads: Boolean(category.downloads),
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await updateCategoryAction(category.id, {
      name: draft.name,
      description: draft.description,
      published: draft.published ? 1 : 0,
      watermark: draft.watermark ? 1 : 0,
      downloads: draft.downloads ? 1 : 0,
    });
    setBusy(false);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  };

  return (
    <form onSubmit={save} className="border border-ink/12 bg-white/70 p-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <label className="label" htmlFor="cs-name">Collection name</label>
          <input id="cs-name" className="field" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </div>
        <div className="flex flex-wrap items-end gap-4 pb-1">
          {(
            [
              ["published", "Published"],
              ["downloads", "Allow downloads"],
              ["watermark", "Watermark previews"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs text-smoke">
              <input
                type="checkbox"
                checked={draft[key]}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="cs-desc">Description</label>
        <textarea
          id="cs-desc"
          rows={3}
          className="field resize-none"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button type="submit" disabled={busy} className={cn("btn-dark py-2.5 text-[9px]", busy && "opacity-60")}>
          {busy ? "Saving…" : "Save collection"}
        </button>
        {saved ? <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-700">Saved</span> : null}
      </div>
    </form>
  );
}
