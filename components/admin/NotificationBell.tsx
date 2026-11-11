"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

const TYPE_LABEL: Record<string, string> = {
  booking: "Booking",
  payment: "Payment",
  status: "Update",
  inquiry: "Enquiry",
  cancellation: "Cancellation",
  gallery: "Gallery",
  customer: "Client",
  system: "System",
};

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const load = async (announce = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: Note[]; unread: number };
      const fresh = data.notifications.filter((n) => !knownIds.current.has(n.id));
      data.notifications.forEach((n) => knownIds.current.add(n.id));
      if (initialized.current && announce && fresh.length) {
        setToast(fresh[0].title);
        router.refresh();
      }
      initialized.current = true;
      setNotes(data.notifications);
      setUnread(data.unread);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 10000);
    const onVisible = () => document.visibilityState === "visible" && load(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const markAll = async () => {
    await markNotificationsReadAction();
    setNotes((prev) => prev.map((n) => ({ ...n, read: 1 })));
    setUnread(0);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load(false);
        }}
        className="relative flex h-9 w-9 items-center justify-center border border-ink/15 text-ink transition-colors hover:border-ink/50"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 004 0" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {unread ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[9px] font-medium text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[330px] max-w-[92vw] border border-ink/12 bg-white shadow-luxe">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">
                Notifications {loading ? "· syncing" : ""}
              </p>
              {unread ? (
                <button type="button" onClick={markAll} className="text-[9px] uppercase tracking-[0.16em] text-gold hover:text-ink">
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notes.length ? (
                notes.slice(0, 12).map((note) => (
                  <Link
                    key={note.id}
                    href={note.link ?? "/admin/notifications"}
                    onClick={async () => {
                      setOpen(false);
                      if (!note.read) {
                        await markNotificationsReadAction(note.id);
                        setUnread((u) => Math.max(0, u - 1));
                        router.refresh();
                      }
                    }}
                    className={cn(
                      "block border-b border-ink/5 px-4 py-3 transition-colors hover:bg-sand/60",
                      !note.read && "bg-champagne/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] text-ink">{note.title}</p>
                      {!note.read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" /> : null}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-smoke">{note.body}</p>
                    <p className="mt-1.5 text-[9px] uppercase tracking-[0.16em] text-smoke/50">
                      {TYPE_LABEL[note.type] ?? note.type} · {formatDateTime(note.created_at)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-8 text-center text-xs text-smoke">Nothing yet.</p>
              )}
            </div>
            <Link href="/admin/notifications" onClick={() => setOpen(false)} className="block border-t border-ink/10 px-4 py-3 text-center text-[9px] uppercase tracking-[0.2em] text-ink hover:bg-sand/60">
              Full history
            </Link>
          </div>
        </>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[60] max-w-xs border border-champagne/50 bg-ink px-5 py-4 text-cream shadow-luxe">
          <p className="text-[9px] uppercase tracking-[0.2em] text-champagne">New activity</p>
          <p className="mt-1 text-sm">{toast}</p>
        </div>
      ) : null}
    </div>
  );
}
