"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSiteContentAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

export function PaymentSettings({
  settings,
  provider,
}: {
  settings: SiteSettings;
  provider: { configured: boolean; production: boolean; hasSecretKey: boolean; hasWebhookSecret: boolean };
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    depositPercent: settings.depositPercent,
    cardEnabled: settings.cardEnabled,
    walletEnabled: settings.walletEnabled,
    bankEnabled: settings.bankEnabled,
    bankDetails: settings.bankDetails,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    await saveSiteContentAction(draft);
    setBusy(false);
    setMessage("Payment settings saved.");
    setTimeout(() => setMessage(null), 2500);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <section
        className={cn(
          "border p-5",
          provider.configured ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50",
        )}
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Payment provider</p>
        <p className="mt-2 font-serif text-2xl">
          {provider.configured
            ? `Stripe connected · ${provider.production ? "live" : "test"} mode`
            : "Sandbox simulation mode"}
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-smoke">
          {provider.configured
            ? "Live checkout is active: clients are sent to Stripe Checkout for cards, Apple Pay and Google Pay in AUD, and bookings are only marked paid when Stripe sends a signature-verified event to /api/payments/stripe."
            : "No Stripe keys are configured yet, so checkout runs a clearly-labelled simulation that uses the same server-side settlement path. Add the keys below to go live — no code changes needed."}
        </p>
        <div className="mt-4 grid gap-2 text-[11px] text-smoke sm:grid-cols-3">
          <span>{provider.hasSecretKey ? "✓" : "○"} STRIPE_SECRET_KEY</span>
          <span>{provider.hasWebhookSecret ? "✓" : "○"} STRIPE_WEBHOOK_SECRET</span>
          <span>{provider.production ? "✓ live" : "○ test"}</span>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-smoke/80">
          Set these in Sites → Secrets (never in code). Webhook URL for the Stripe dashboard:{" "}
          <code className="font-mono">https://your-domain/api/payments/stripe</code>
        </p>
      </section>

      <form onSubmit={save} className="space-y-5 border border-ink/12 bg-white/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Checkout options</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["cardEnabled", "Credit / debit cards (Visa, Mastercard, Amex)"],
              ["walletEnabled", "Apple Pay / Google Pay"],
              ["bankEnabled", "Bank transfer, BSB and PayID"],
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Default deposit percentage</label>
            <input
              type="number"
              min={0}
              max={100}
              className="field"
              value={draft.depositPercent}
              onChange={(event) => setDraft({ ...draft, depositPercent: Number(event.target.value) })}
            />
          </div>
          <div>
            <label className="label">Bank details shown at checkout</label>
            <input
              className="field"
              value={draft.bankDetails}
              onChange={(event) => setDraft({ ...draft, bankDetails: event.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
            {busy ? "Saving…" : "Save payment settings"}
          </button>
          {message ? <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-700">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}
