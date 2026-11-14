"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmSandboxPaymentAction } from "@/app/actions/payments";
import { cn, formatAUD } from "@/lib/utils";
import { useSiteLocale } from "@/lib/use-site-locale";

const METHODS = [
  { id: "card", label: "Credit / debit card", detail: "Visa, Mastercard, American Express" },
  { id: "wallet", label: "Apple Pay / Google Pay", detail: "One-tap checkout from your phone" },
  { id: "payid", label: "PayID", detail: "Instant bank transfer to Mara's PayID" },
  { id: "bank_transfer", label: "Bank transfer (BSB)", detail: "Direct deposit, cleared in 1–2 business days" },
];

export function SandboxCheckout({
  orderId,
  code,
  amount,
  kind,
  customerName,
}: {
  orderId: string;
  code: string;
  amount: number;
  kind: string;
  customerName: string;
}) {
  const mn = useSiteLocale() === "mn";
  const router = useRouter();
  const [method, setMethod] = useState(METHODS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    const result = await confirmSandboxPaymentAction(orderId, method);
    setBusy(false);
    if (result.ok) {
      router.push(`/booking/${code}?paid=1`);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="border border-ink/12 bg-white/70 p-7">
        <p className="eyebrow">{mn ? "Төлбөрийн хэлбэр сонгох" : "Choose a payment method"}</p>
        <div className="mt-5 space-y-2">
          {METHODS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMethod(option.id)}
              className={cn(
                "flex w-full items-center justify-between gap-4 border p-4 text-left transition-colors",
                method === option.id ? "border-ink bg-cream" : "border-ink/12 hover:border-ink/40",
              )}
            >
              <span>
                <span className="block text-sm text-ink">
                  {mn && option.id === "card" ? "Кредит / дебит карт" : option.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-smoke">
                  {mn
                    ? option.id === "card"
                      ? "Visa, Mastercard, American Express"
                      : option.id === "wallet"
                        ? "Утаснаасаа нэг товшилтоор төлөх"
                        : option.id === "payid"
                          ? "Марагийн PayID руу шууд банкны шилжүүлэг"
                          : "Шууд шилжүүлэг, ажлын 1–2 өдөрт баталгаажна"
                    : option.detail}
                </span>
              </span>
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  method === option.id ? "border-ink bg-ink" : "border-ink/30",
                )}
              >
                {method === option.id ? <span className="h-1.5 w-1.5 rounded-full bg-cream" /> : null}
              </span>
            </button>
          ))}
        </div>
      </div>

      <aside className="h-fit space-y-5">
        <div className="border border-ink/12 bg-white/60 p-6">
          <p className="eyebrow">{mn ? "Төлөх дүн" : "Amount due"}</p>
          <p className="display mt-3 text-4xl">{formatAUD(amount)}</p>
          <p className="mt-1 text-xs text-smoke">
            {kind === "deposit" ? (mn ? "Урьдчилгаа" : "Deposit") : (mn ? "Бүрэн төлбөр" : "Full payment")} · {mn ? "захиалга" : "booking"} {code}
          </p>
          <p className="mt-4 border-t border-ink/10 pt-4 text-xs text-smoke">
            {mn ? `${customerName} нэрээр төлнө.` : `Paying as ${customerName}.`}
          </p>
          {error ? (
            <p className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
          ) : null}
          <button type="button" onClick={pay} disabled={busy} className={cn("btn-dark mt-5 w-full", busy && "opacity-60")}>
            {busy ? (mn ? "Баталгаажуулж байна…" : "Confirming…") : (mn ? `${formatAUD(amount)} төлөх` : `Pay ${formatAUD(amount)}`)}
          </button>
        </div>
        <div className="border border-amber-200 bg-amber-50 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-800">{mn ? "Туршилтын орчин" : "Sandbox simulation"}</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-900/80">
            {mn
              ? "Энэ орчинд Stripe-ийн түлхүүр тохируулаагүй тул бодит мөнгө шилжихгүй. Төлөх товчийг дарснаар төлбөрийн туршилтын баталгаажуулалт ажиллана."
              : "This environment has no Stripe keys yet, so no real money moves. Pressing pay runs the same verified settlement path your production webhook will use, and marks the booking as paid exactly like a successful provider callback."}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-900/70">
            {mn ? "Бодит карт / wallet / PayID төлбөрийг идэвхжүүлэхийн тулд Sites → Secrets хэсэгт " : "Add "}
            <code className="font-mono">STRIPE_SECRET_KEY</code>{mn ? " болон " : " and "}
            <code className="font-mono">STRIPE_WEBHOOK_SECRET</code>
            {mn ? " тохируулна уу. Төлбөр австрали доллараар хийгдэнэ." : " in Sites → Secrets to switch to the real card / wallet / PayID flow. Charges are in AUD."}
          </p>
        </div>
      </aside>
    </div>
  );
}
