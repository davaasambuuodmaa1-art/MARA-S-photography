"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveSiteContentAction } from "@/app/actions/admin";
import type { SiteSettings } from "@/lib/types";

export function GeneralSettings({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    brandName: settings.brandName,
    address: settings.address,
    email: settings.email,
    phone: settings.phone,
    instagram: settings.instagram,
    currency: settings.currency,
    bankAccountName: settings.bankAccountName,
    bankBsb: settings.bankBsb,
    bankAccountNumber: settings.bankAccountNumber,
    payId: settings.payId,
    paymentReferenceNote: settings.paymentReferenceNote,
    cancellationPolicy: settings.cancellationPolicy,
    privacyPolicy: settings.privacyPolicy,
    termsPolicy: settings.termsPolicy,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      brandName: settings.brandName,
      address: settings.address,
      email: settings.email,
      phone: settings.phone,
      instagram: settings.instagram,
      currency: settings.currency,
      bankAccountName: settings.bankAccountName,
      bankBsb: settings.bankBsb,
      bankAccountNumber: settings.bankAccountNumber,
      payId: settings.payId,
      paymentReferenceNote: settings.paymentReferenceNote,
      cancellationPolicy: settings.cancellationPolicy,
      privacyPolicy: settings.privacyPolicy,
      termsPolicy: settings.termsPolicy,
    });
  }, [settings]);

  const save = async () => {
    setBusy(true);
    setError(null);
    const result = await saveSiteContentAction(draft);
    setBusy(false);
    if (result.ok) {
      setMessage("General settings saved.");
      router.refresh();
    } else setError(result.error);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Business</p>
          <div>
            <label className="label">Business name</label>
            <input className="field" value={draft.brandName} onChange={(e) => setDraft({ ...draft, brandName: e.target.value })} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="field" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} />
          </div>
          <div>
            <label className="label">Business email</label>
            <input type="email" className="field" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="field" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Address / service area</label>
            <input className="field" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input className="field" value={draft.instagram} onChange={(e) => setDraft({ ...draft, instagram: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3 border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Manual bank transfer</p>
          <p className="text-[10px] leading-relaxed text-smoke/70">
            Used to show payment instructions to customers after approval. Never enter passwords, OTPs or
            card details here.
          </p>
          <div>
            <label className="label">Account name</label>
            <input className="field" value={draft.bankAccountName} onChange={(e) => setDraft({ ...draft, bankAccountName: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">BSB</label>
              <input className="field" value={draft.bankBsb} onChange={(e) => setDraft({ ...draft, bankBsb: e.target.value })} />
            </div>
            <div>
              <label className="label">Account number</label>
              <input className="field" value={draft.bankAccountNumber} onChange={(e) => setDraft({ ...draft, bankAccountNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">PayID (optional)</label>
            <input className="field" value={draft.payId} onChange={(e) => setDraft({ ...draft, payId: e.target.value })} />
          </div>
          <div>
            <label className="label">Reference note</label>
            <input className="field" value={draft.paymentReferenceNote} onChange={(e) => setDraft({ ...draft, paymentReferenceNote: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="space-y-3 border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Policies</p>
        {(
          [
            ["cancellationPolicy", "Cancellation policy"],
            ["privacyPolicy", "Privacy policy"],
            ["termsPolicy", "Terms & conditions"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <textarea
              rows={5}
              className="field resize-none text-sm"
              value={draft[key]}
              onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
            />
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-50">
          {busy ? "Saving…" : "Save general settings"}
        </button>
        {message ? <span className="text-[10px] text-emerald-700">{message}</span> : null}
        {error ? <span className="text-[10px] text-rose-700">{error}</span> : null}
      </div>
    </div>
  );
}
