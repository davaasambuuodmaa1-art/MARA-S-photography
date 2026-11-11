"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/actions/galleries";
import { cn, formatDate } from "@/lib/utils";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_image: string;
  image_count: number;
  published: number;
  watermark: number;
  downloads: number;
  created_at: string;
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", published: true });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", description: "" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy("create");
    setError(null);
    const result = await createCategoryAction(draft);
    setBusy(null);
    if (result.ok) {
      setDraft({ name: "", description: "", published: true });
      setCreating(false);
      router.push(`/admin/galleries/${result.id}`);
    } else setError(result.error);
  };

  const toggle = async (category: Category, patch: Record<string, number>) => {
    setBusy(category.id);
    await updateCategoryAction(category.id, patch as never);
    setBusy(null);
    router.refresh();
  };

  const saveEdit = async (category: Category) => {
    setBusy(category.id);
    await updateCategoryAction(category.id, {
      name: editDraft.name,
      description: editDraft.description,
    });
    setBusy(null);
    setEditing(null);
    router.refresh();
  };

  const remove = async (id: string) => {
    setBusy(id);
    const result = await deleteCategoryAction(id);
    setBusy(null);
    setConfirmDelete(null);
    if (!result.ok) setError(result.error);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {error ? <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p> : null}

      <div className="flex justify-end">
        <button type="button" onClick={() => setCreating((v) => !v)} className="btn-dark py-2.5 text-[9px]">
          {creating ? "Close" : "+ New collection"}
        </button>
      </div>

      {creating ? (
        <form onSubmit={create} className="space-y-4 border border-ink/12 bg-white/70 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cat-name">Collection name</label>
              <input
                id="cat-name"
                required
                className="field"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Elopement Photography"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-xs text-smoke">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
                />
                Publish immediately
              </label>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              rows={3}
              className="field resize-none"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="A short, evocative paragraph shown on the collection page."
            />
          </div>
          <button type="submit" disabled={busy === "create"} className={cn("btn-dark", busy === "create" && "opacity-60")}>
            {busy === "create" ? "Creating…" : "Create collection"}
          </button>
        </form>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="border border-ink/12 bg-white/70">
            <div className="relative aspect-[16/10] overflow-hidden bg-sand">
              {category.cover_image ? (
                <img src={category.cover_image} alt={category.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.18em] text-smoke/60">
                  No cover yet
                </div>
              )}
              <div className="absolute left-2 top-2 flex gap-1">
                <span
                  className={cn(
                    "border px-2 py-1 text-[8px] uppercase tracking-[0.14em]",
                    category.published ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-ink/20 bg-white text-smoke",
                  )}
                >
                  {category.published ? "Published" : "Hidden"}
                </span>
                {category.watermark ? (
                  <span className="border border-ink/20 bg-white px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-smoke">
                    Watermark
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-4">
              {editing === category.id ? (
                <div className="space-y-2">
                  <input
                    className="field py-2 text-sm"
                    value={editDraft.name}
                    onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                  />
                  <textarea
                    rows={3}
                    className="field resize-none text-xs"
                    value={editDraft.description}
                    onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveEdit(category)} className="btn-dark py-2 text-[8px]">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="text-[8px] uppercase tracking-[0.14em] text-smoke">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-xl leading-tight">{category.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-smoke">
                        {category.image_count} images · {formatDate(category.created_at, { month: "short" })}
                      </p>
                    </div>
                    <Link
                      href={`/admin/galleries/${category.id}`}
                      className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-ink link-underline"
                    >
                      Manage
                    </Link>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-smoke">
                    {category.description || "No description yet."}
                  </p>
                </>
              )}

              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-ink/10 pt-3 text-[9px] uppercase tracking-[0.12em] text-smoke">
                <button type="button" onClick={() => { setEditing(category.id); setEditDraft({ name: category.name, description: category.description }); }} className="hover:text-ink">
                  Rename
                </button>
                <button type="button" disabled={busy === category.id} onClick={() => toggle(category, { published: category.published ? 0 : 1 })} className="hover:text-ink">
                  {category.published ? "Hide" : "Publish"}
                </button>
                <button type="button" disabled={busy === category.id} onClick={() => toggle(category, { downloads: category.downloads ? 0 : 1 })} className="hover:text-ink">
                  Downloads {category.downloads ? "on" : "off"}
                </button>
                <button type="button" disabled={busy === category.id} onClick={() => toggle(category, { watermark: category.watermark ? 0 : 1 })} className="hover:text-ink">
                  Watermark {category.watermark ? "on" : "off"}
                </button>
                {confirmDelete === category.id ? (
                  <span className="flex items-center gap-2 text-rose-700">
                    Sure?
                    <button type="button" onClick={() => remove(category.id)} className="underline">Delete</button>
                    <button type="button" onClick={() => setConfirmDelete(null)}>No</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(category.id)} className="hover:text-rose-700">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
