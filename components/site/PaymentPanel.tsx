"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startPaymentAction } from "@/app/actions/payments";
import { formatAUD, cn } from "@/lib/utils";
import { useSiteLocale } from "@/lib/use-site-locale";

export function PaymentPanel({
  code,
  amount,
  depositAmount,
  paymentStatus,
  status,
  methods,
}: {
  code: string;
  amount: number;
  depositAmount: number;
  paymentStatus: string;
  status: string;
  methods: { card: boolean; wallet: boolean; bank: boolean; bankDetails: string };
}) {
  const mn = useSiteLocale() === "mn";
  const router = useRouter();
  const [busy, setBusy] = useState<"deposit" | "full" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const settled = paymentStatus === "paid";
  const depositPaid = paymentStatus === "deposit_paid";

  const start = async (kind: "deposit" | "full") => {
    setBusy(kind);
    setError(null);
    const result = await startPaymentAction(code, kind);
    setBusy(null);
    if (result.ok) router.push(result.redirectUrl);
    else setError(result.error);
  };

  if (settled) {
    return (
      <div className="border border-emerald-200 bg-emerald-50/70 p-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-800">{mn ? "Бүрэн төлөгдсөн" : "Paid in full"}</p>
        <p className="mt-2 font-serif text-2xl text-emerald-900">{mn ? "Төлөх үлдэгдэлгүй." : "Nothing outstanding."}</p>
        <p className="mt-2 text-sm text-emerald-800/80">
          {mn ? `${formatAUD(amount)} хүлээн авч баталгаажуулсан. Таны зураг авалт баталгаажлаа.` : `${formatAUD(amount)} received and verified. Your session is confirmed.`}
        </p>
        <Link href={`/receipt/${code}`} className="btn-outline mt-5">
          {mn ? "Төлбөрийн баримт харах" : "View payment receipt"}
        </Link>
      </div>
    );
  }

  if (["cancelled", "rejected"].includes(status)) {
    return (
      <div className="border border-ink/12 bg-white/60 p-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-smoke">{mn ? "Төлбөр" : "Payment"}</p>
        <p className="mt-2 font-serif text-2xl">{mn ? "Энэ захиалга хаагдсан." : "This booking is closed."}</p>
        <p className="mt-2 text-sm text-smoke">
          {mn ? "Төлбөр төлөх шаардлагагүй. Дахин захиалах бол шинэ хүсэлт илгээнэ үү." : "No payment is required. If you would like to book again, start a new request."}
        </p>
        <Link href="/book" className="btn-outline mt-5">{mn ? "Дахин зураг авуулах" : "Book another session"}</Link>
      </div>
    );
  }

  if (amount === 0) {
    return (
      <div className="border border-ink/12 bg-white/60 p-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-smoke">{mn ? "Төлбөр" : "Payment"}</p>
        <p className="mt-2 font-serif text-2xl">{mn ? "Энэ бол тусгай захиалга." : "This is a bespoke commission."}</p>
        <p className="mt-2 text-sm text-smoke">
          {mn ? "Мара 48 цагийн дотор танд тохирсон санал болон төлбөрийн холбоосыг бэлтгэнэ. Одоогоор төлбөр төлөхгүй." : "Mara prepares a tailored proposal and payment link within 48 hours. Nothing to pay yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-ink/12 bg-white/70 p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-smoke">{mn ? "Төлбөр" : "Payment"}</p>
      <p className="mt-2 font-serif text-2xl">
        {depositPaid ? (mn ? `${formatAUD(amount - depositAmount)} үлдэгдэл` : `${formatAUD(amount - depositAmount)} remaining`) : (mn ? `${formatAUD(depositAmount)} төлснөөр тов хадгалагдана` : `${formatAUD(depositAmount)} reserves your date`)}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-smoke">
        {mn ? `Нийт үнэ ${formatAUD(amount)}. ` : `Total session ${formatAUD(amount)}. `}
        {depositPaid
          ? (mn ? `${formatAUD(depositAmount)} урьдчилгаа хүлээн авсан. Үлдэгдлийг зураг авалтаас долоо хоногийн өмнө төлнө.` : `Deposit of ${formatAUD(depositAmount)} received. The balance is due seven days before your session.`)
          : (mn ? `Одоо ${Math.round((depositAmount / amount) * 100)}% урьдчилгаа төлөх эсвэл нийт дүнг нэг дор төлнө үү.` : `Pay a ${Math.round((depositAmount / amount) * 100)}% deposit now, or settle the full amount at once.`)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.16em] text-smoke">
        {methods.card ? <span className="border border-ink/15 px-2.5 py-1">{mn ? "Карт" : "Card"}</span> : null}
        {methods.wallet ? <span className="border border-ink/15 px-2.5 py-1">Apple Pay / Google Pay</span> : null}
        {methods.bank ? <span className="border border-ink/15 px-2.5 py-1">{mn ? "Банкны шилжүүлэг · PayID" : "Bank transfer · PayID"}</span> : null}
      </div>

      {error ? (
        <p className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {!depositPaid ? (
          <button
            type="button"
            onClick={() => start("deposit")}
            disabled={busy !== null}
            className={cn("btn-dark flex-1", busy && "opacity-60")}
          >
            {busy === "deposit" ? (mn ? "Аюулгүй төлбөрийн цонх нээж байна…" : "Opening secure checkout…") : (mn ? `${formatAUD(depositAmount)} урьдчилгаа төлөх` : `Pay ${formatAUD(depositAmount)} deposit`)}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => start("full")}
          disabled={busy !== null}
          className={cn("btn-outline flex-1", busy && "opacity-60")}
        >
          {busy === "full" ? (mn ? "Аюулгүй төлбөрийн цонх нээж байна…" : "Opening secure checkout…") : (mn ? "Бүрэн төлөх" : "Pay in full")}
        </button>
      </div>
      <p className="mt-4 border-t border-ink/10 pt-3 text-[10px] leading-relaxed text-smoke/70">
        {mn
          ? `Төлбөрийг Stripe-ээр австрали доллараар боловсруулж, сервер талд баталгаажуулна. Үйлчилгээ үзүүлэгч төлбөрийг баталгаажуулсны дараа захиалгыг төлөгдсөн гэж тэмдэглэнэ. ${methods.bankDetails}`
          : `Payments are processed by Stripe in Australian dollars and verified server-side. A booking is only marked paid after the provider confirms settlement. ${methods.bankDetails}`}
      </p>
    </div>
  );
}
