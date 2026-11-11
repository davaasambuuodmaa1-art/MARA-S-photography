"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markNotificationsReadAction } from "@/app/actions/admin";
import { cn, formatDateTime } from "@/lib/utils";

interface Note {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: number;
  created_at: string;
}

export function NotificationsList({ notifications }: { notifications: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(notifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [busy, setBusy] = useState(false);

  const visible = filter === "all" ? notes : notes.filter((note) => !note.read);

  const markAll = async () => {
    setBusy(true);
    await markNotificationsReadAction();
    setNotes((prev) => prev.map((note) => ({ ...note, read: 1 })));
    setBusy(false);
    router.refresh();
  };

  const markOne = async (id: string) => {
    await markNotificationsReadAction(id);
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, read: 1 } : note)));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "border px-3 py-2 text-[9px] uppercase tracking-[0.16em] transition-colors",
                filter === value ? "border-ink bg-ink text-cream" : "border-ink/15 text-smoke hover:border-ink/40 hover:text-ink",
              )}
            >
              {value} {value === "unread" ? notes.filter((n) => !n.read).length : notes.length}
            </button>
          ))}
        </div>
        <button type="button" onClick={markAll} disabled={busy} className="text-[9px] uppercase tracking-[0.16em] text-gold hover:text-ink disabled:opacity-50">
          Mark everything read
        </button>
      </div>

      <div className="divide-y divide-ink/10 border border-ink/12 bg-white/70">
        {visible.map((note) => (
          <div key={note.id} className={cn("flex flex-wrap items-start justify-between gap-4 px-5 py-4", !note.read && "bg-champagne/5")}>
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <p className="text-sm text-ink">{note.title}</p>
                {!note.read ? <span className="h-1.5 w-1.5 rounded-full bg-champagne" /> : null}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-smoke">{note.body}</p>
              <p className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-smoke/50">
                {note.type} · {formatDateTime(note.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.14em]">
              {note.link ? (
                <Link href={note.link} className="text-ink link-underline">
                  Open
                </Link>
              ) : null}
              {!note.read ? (
                <button type="button" onClick={() => markOne(note.id)} className="text-smoke hover:text-ink">
                  Mark read
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {!visible.length ? <p className="px-5 py-14 text-center text-xs text-smoke">Nothing to show.</p> : null}
      </div>
    </div>
  );
}
