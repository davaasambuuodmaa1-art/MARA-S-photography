"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  addImageByUrlAction,
  deleteImageAction,
  reorderImagesAction,
  setCoverAction,
  updateImageAction,
  uploadImagesAction,
} from "@/app/actions/galleries";
import { cn } from "@/lib/utils";

interface ImageRow {
  id: string;
  url: string;
  title: string;
  description: string;
  is_cover: number;
  downloadable: number | null;
  storage_key: string | null;
  sort_order: number;
}

export function ImagesManager({
  categoryId,
  images,
  downloadsEnabled,
}: {
  categoryId: string;
  images: ImageRow[];
  downloadsEnabled: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(images);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [edit, setEdit] = useState<ImageRow | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", description: "" });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragIndex = useRef<number | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    setError(null);
    setProgress(`Uploading ${files.length} image${files.length === 1 ? "" : "s"}…`);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const result = await uploadImagesAction(categoryId, formData);
    setBusy(false);
    setProgress(null);
    if (result.ok) router.refresh();
    else setError(result.error);
  };

  const persistOrder = async (next: ImageRow[]) => {
    setRows(next);
    setBusy(true);
    await reorderImagesAction(categoryId, next.map((row) => row.id));
    setBusy(false);
    router.refresh();
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...rows];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  };

  const drop = (index: number) => {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...rows];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    dragIndex.current = null;
    persistOrder(next);
  };

  const remove = async (id: string) => {
    setBusy(true);
    const result = await deleteImageAction(id);
    setBusy(false);
    if (result.ok) {
      setRows((prev) => prev.filter((row) => row.id !== id));
      router.refresh();
    } else setError(result.error);
  };

  const makeCover = async (id: string) => {
    setBusy(true);
    await setCoverAction(categoryId, id);
    setBusy(false);
    setRows((prev) => prev.map((row) => ({ ...row, is_cover: row.id === id ? 1 : 0 })));
    router.refresh();
  };

  const saveMeta = async () => {
    if (!edit) return;
    setBusy(true);
    await updateImageAction(edit.id, { title: editDraft.title, description: editDraft.description });
    setBusy(false);
    setEdit(null);
    router.refresh();
  };

  const addByUrl = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!urlInput.trim()) return;
    setBusy(true);
    const result = await addImageByUrlAction(categoryId, urlInput.trim());
    setBusy(false);
    if (result.ok) {
      setUrlInput("");
      router.refresh();
    } else setError(result.error);
  };

  return (
    <div className="space-y-5">
      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p> : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          upload(event.dataTransfer.files);
        }}
        className={cn(
          "border border-dashed p-8 text-center transition-colors",
          dragging ? "border-ink bg-sand/70" : "border-ink/25 bg-white/50",
        )}
      >
        <p className="font-serif text-2xl">Drag photographs here</p>
        <p className="mt-2 text-xs text-smoke">JPG, PNG or WebP · up to 10 MB each · 20 at a time</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-dark mt-5 py-2.5 text-[9px] disabled:opacity-60"
        >
          {progress ?? "Select files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => upload(event.target.files)}
        />
        <p className="mt-4 text-[10px] text-smoke/60">
          Stored in your studio&apos;s cloud bucket — uploads persist across restarts and redeploys.
        </p>
      </div>

      <form onSubmit={addByUrl} className="flex flex-wrap gap-2">
        <input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="…or paste an https:// image URL"
          className="field flex-1 py-2.5 text-xs"
        />
        <button type="submit" disabled={busy} className="btn-outline py-2.5 text-[9px]">
          Add by URL
        </button>
      </form>

      {rows.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              draggable
              onDragStart={() => (dragIndex.current = index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => drop(index)}
              className="group border border-ink/12 bg-white/70"
            >
              <div className="relative aspect-square overflow-hidden bg-sand">
                <img src={row.url} alt={row.title} className="h-full w-full object-cover" draggable={false} />
                <div className="absolute left-1.5 top-1.5 flex gap-1">
                  {row.is_cover ? (
                    <span className="bg-ink px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-cream">Cover</span>
                  ) : null}
                  <span className="bg-white/90 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-smoke">
                    {index + 1}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-ink/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(index, -1)} className="bg-white/90 px-1.5 py-1 text-[9px]">←</button>
                    <button type="button" onClick={() => move(index, 1)} className="bg-white/90 px-1.5 py-1 text-[9px]">→</button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEdit(row);
                        setEditDraft({ title: row.title, description: row.description });
                      }}
                      className="bg-white/90 px-1.5 py-1 text-[8px] uppercase tracking-[0.1em]"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(row.id)} className="bg-rose-600 px-1.5 py-1 text-[8px] uppercase tracking-[0.1em] text-white">
                      Del
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-[11px] text-ink">{row.title || "Untitled"}</p>
                {row.is_cover ? (
                  <span className="shrink-0 text-[8px] uppercase tracking-[0.12em] text-smoke">Cover</span>
                ) : (
                  <button type="button" onClick={() => makeCover(row.id)} className="shrink-0 text-[8px] uppercase tracking-[0.12em] text-gold hover:text-ink">
                    Set cover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="border border-ink/12 bg-white/50 px-5 py-12 text-center text-xs text-smoke">
          This collection has no images yet. Upload your first frames above.
        </p>
      )}

      <p className="text-[10px] uppercase tracking-[0.16em] text-smoke/60">
        Drag cards to reorder · downloads are {downloadsEnabled ? "enabled" : "disabled"} for this collection
      </p>

      {edit ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-md border border-ink/12 bg-cream p-6">
            <p className="eyebrow">Image details</p>
            <img src={edit.url} alt="" className="mt-4 h-40 w-full object-cover" />
            <div className="mt-4 space-y-3">
              <div>
                <label className="label" htmlFor="img-title">Title</label>
                <input id="img-title" className="field" value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="img-desc">Description</label>
                <textarea id="img-desc" rows={3} className="field resize-none" value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setEdit(null)} className="text-[9px] uppercase tracking-[0.16em] text-smoke">Cancel</button>
              <button type="button" onClick={saveMeta} disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
