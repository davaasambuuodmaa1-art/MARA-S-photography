"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveSiteContentAction, sendTestEmailAction } from "@/app/actions/admin";
import type { SiteSettings } from "@/lib/types";

export function EmailSettings({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    emailSenderName: settings.emailSenderName,
    emailFrom: settings.emailFrom,
    notifyEmail: settings.notifyEmail,
    emailSignature: settings.emailSignature,
    emailBookingNotifications: settings.emailBookingNotifications,
    emailCustomerConfirmation: settings.emailCustomerConfirmation,
    emailPaymentConfirmation: settings.emailPaymentConfirmation,
    emailGalleryDelivery: settings.emailGalleryDelivery,
    templateBookingConfirmation: settings.templateBookingConfirmation,
    templateBookingNotification: settings.templateBookingNotification,
    templatePaymentConfirmation: settings.templatePaymentConfirmation,
    templateGalleryDelivery: settings.templateGalleryDelivery,
    templateReschedule: settings.templateReschedule,
  });
  const [testTo, setTestTo] = useState(settings.notifyEmail || "");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      emailSenderName: settings.emailSenderName,
      emailFrom: settings.emailFrom,
      notifyEmail: settings.notifyEmail,
      emailSignature: settings.emailSignature,
      emailBookingNotifications: settings.emailBookingNotifications,
      emailCustomerConfirmation: settings.emailCustomerConfirmation,
      emailPaymentConfirmation: settings.emailPaymentConfirmation,
      emailGalleryDelivery: settings.emailGalleryDelivery,
      templateBookingConfirmation: settings.templateBookingConfirmation,
      templateBookingNotification: settings.templateBookingNotification,
      templatePaymentConfirmation: settings.templatePaymentConfirmation,
      templateGalleryDelivery: settings.templateGalleryDelivery,
      templateReschedule: settings.templateReschedule,
    });
  }, [settings]);

  const save = async () => {
    setBusy(true);
    setError(null);
    const result = await saveSiteContentAction(draft);
    setBusy(false);
    if (result.ok) {
      setMessage("Email settings saved.");
      router.refresh();
    } else setError(result.error);
  };

  const sendTest = async () => {
    setTesting(true);
    setError(null);
    const result = await sendTestEmailAction(testTo);
    setTesting(false);
    if (result.ok) setMessage("Test message sent — check the recipient's inbox.");
    else setError(result.error);
  };

  const toggleLabels: Record<string, string> = {
    emailBookingNotifications: "Booking request notifications",
    emailCustomerConfirmation: "Customer confirmation emails",
    emailPaymentConfirmation: "Payment confirmation emails",
    emailGalleryDelivery: "Gallery delivery emails",
  };
  const toggle = (key: keyof typeof draft) => (
    <label className="flex items-center gap-2 text-[11px] text-smoke">
      <input
        type="checkbox"
        checked={Boolean(draft[key])}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })}
      />
      {toggleLabels[String(key)] ?? String(key)}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Sender</p>
          <div>
            <label className="label">Sender name</label>
            <input
              className="field"
              value={draft.emailSenderName}
              onChange={(event) => setDraft({ ...draft, emailSenderName: event.target.value })}
            />
          </div>
          <div>
            <label className="label">From address</label>
            <input
              className="field"
              type="email"
              value={draft.emailFrom}
              onChange={(event) => setDraft({ ...draft, emailFrom: event.target.value })}
            />
          </div>
          <div>
            <label className="label">Signature</label>
            <textarea
              rows={3}
              className="field resize-none text-sm"
              value={draft.emailSignature}
              onChange={(event) => setDraft({ ...draft, emailSignature: event.target.value })}
            />
          </div>
        </section>

        <section className="space-y-3 border border-ink/12 bg-white/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Recipients & notifications</p>
          <div>
            <label className="label">Admin notifications email</label>
            <input
              className="field"
              type="email"
              value={draft.notifyEmail}
              onChange={(event) => setDraft({ ...draft, notifyEmail: event.target.value })}
            />
          </div>
          <div className="space-y-2 pt-2">
            {toggle("emailBookingNotifications")}
            {toggle("emailCustomerConfirmation")}
            {toggle("emailPaymentConfirmation")}
            {toggle("emailGalleryDelivery")}
          </div>
        </section>
      </div>

      <section className="space-y-3 border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Templates</p>
        {(
          [
            ["templateBookingConfirmation", "Customer booking confirmation"],
            ["templateBookingNotification", "New booking request (admin)"],
            ["templatePaymentConfirmation", "Payment confirmation"],
            ["templateGalleryDelivery", "Gallery delivery"],
            ["templateReschedule", "Reschedule notice"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <textarea
              rows={2}
              className="field resize-none text-sm"
              value={draft[key]}
              onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
            />
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-50">
          {busy ? "Saving…" : "Save email settings"}
        </button>
        {message ? <span className="text-[10px] text-emerald-700">{message}</span> : null}
        {error ? <span className="text-[10px] text-rose-700">{error}</span> : null}
      </div>

      <section className="border border-ink/12 bg-cream/60 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Test delivery</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="label">Send to</label>
            <input type="email" className="field" value={testTo} onChange={(event) => setTestTo(event.target.value)} />
          </div>
          <button
            type="button"
            onClick={sendTest}
            disabled={testing}
            className="btn-dark py-2.5 text-[9px] disabled:opacity-50"
          >
            {testing ? "Sending…" : "Send test email"}
          </button>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-smoke/70">
          Required external configuration: set <code>RESEND_API_KEY</code> in the project secrets and
          verify the sender domain in Resend.
        </p>
      </section>
    </div>
  );
}
