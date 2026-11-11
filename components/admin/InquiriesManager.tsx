"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteInquiryAction, updateInquiryAction } from "@/app/actions/admin";
import { cn, formatDateTime } from "@/lib/utils";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const FILTERS = ["all", "new", "read", "replied", "archived"];

export function InquiriesManager({ inquiries }: { inquiries: Inquiry[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(inquiries[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = inquiries.filter((inquiry) => filter === "all" || inquiry.status === filter);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    await updateInquiryAction(id, status);
    setBusy(null);
    router.refresh();
  };

  const remove = async (id: string) => {
    setBusy(id);
    await deleteInquiryAction(id);
    setBusy(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "border px-3 py-2 text-[9px] uppercase tracking-[0.16em] transition-colors",
              filter === value ? "border-ink bg-ink text-cream" : "border-ink/15 text-smoke hover:border-ink/40 hover:text-ink",
            )}
          >
            {value} {value !== "all" ? inquiries.filter((i) => i.status === value).length : ""}
          </button>
        ))}
      </div>

      <div className="divide-y divide-ink/10 border border-ink/12 bg-white/70">
        {filtered.map((inquiry) => (
          <div key={inquiry.id}>
            <button
              type="button"
              onClick={() => setExpanded(expanded === inquiry.id ? null : inquiry.id)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-sand/40"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-ink">{inquiry.name}</p>
                  {inquiry.status === "new" ? (
                    <span className="bg-champagne/25 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-ink">New</span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[11px] text-smoke">{inquiry.subject} · {inquiry.email}</p>
              </div>
              <p className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-smoke/60">{formatDateTime(inquiry.created_at)}</p>
            </button>

            {expanded === inquiry.id ? (
              <div className="border-t border-ink/5 bg-cream/60 px-5 py-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-smoke">{inquiry.message}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-3 text-[9px] uppercase tracking-[0.14em]">
                  <a href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`} className="btn-dark py-2 text-[8px]">
                    Reply by email
                  </a>
                  {inquiry.phone ? (
                    <a href={`https://wa.me/${inquiry.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-outline py-2 text-[8px]">
                      WhatsApp
                    </a>
                  ) : null}
                  {["read", "replied", "archived"].map((status) => (
                    <button key={status} type="button" disabled={busy === inquiry.id} onClick={() => setStatus(inquiry.id, status)} className="text-smoke hover:text-ink">
                      Mark {status}
                    </button>
                  ))}
                  <button type="button" disabled={busy === inquiry.id} onClick={() => remove(inquiry.id)} className="ml-auto text-rose-700 hover:text-rose-900">
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        {!filtered.length ? <p className="px-5 py-12 text-center text-xs text-smoke">No enquiries in this view.</p> : null}
      </div>
    </div>
  );
}
