"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { changePasswordAction, logoutAction, updateProfileAction } from "@/app/actions/auth";
import { BOOKING_STATUS, PAYMENT_STATUS_LABEL, cn, formatDate, formatDateTime, formatAUD } from "@/lib/utils";
import { useSiteLocale } from "@/lib/use-site-locale";
import { localizeStatus } from "@/lib/site-locale";

interface BookingRow {
  id: string;
  code: string;
  date: string;
  time_slot: string;
  status: string;
  payment_status: string;
  amount: number;
  deposit_amount: number;
  category_name: string | null;
  package_name: string | null;
}

interface PaymentRow {
  id: string;
  code: string;
  gross_amount: number;
  kind: string;
  status: string;
  created_at: string;
}

export function AccountPanel({
  user,
  bookings,
  payments,
}: {
  user: { name: string; email: string; phone: string | null; created_at: string };
  bookings: BookingRow[];
  payments: PaymentRow[];
}) {
  const mn = useSiteLocale() === "mn";
  const router = useRouter();
  const [tab, setTab] = useState<"bookings" | "payments" | "profile">("bookings");
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone ?? "" });
  const [password, setPassword] = useState({ current: "", next: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await updateProfileAction(profile);
    setBusy(false);
    if (result.ok) {
      setMessage(mn ? "Профайл шинэчлэгдлээ." : "Profile updated.");
      router.refresh();
    } else setError(result.error);
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await changePasswordAction(password);
    setBusy(false);
    if (result.ok) {
      setPassword({ current: "", next: "" });
      setMessage(mn ? "Нууц үг солигдлоо." : "Password changed.");
    } else setError(result.error);
  };

  const signOut = async () => {
    await logoutAction();
    router.refresh();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <aside>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">{mn ? "Нэвтэрсэн хэрэглэгч" : "Signed in as"}</p>
        <p className="mt-2 font-serif text-2xl">{user.name}</p>
        <p className="text-xs text-smoke">{user.email}</p>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          {(
            [
              ["bookings", `${mn ? "Захиалга" : "Bookings"} (${bookings.length})`],
              ["payments", `${mn ? "Төлбөр" : "Payments"} (${payments.length})`],
              ["profile", mn ? "Профайл ба аюулгүй байдал" : "Profile & security"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setMessage(null);
                setError(null);
              }}
              className={cn(
                "border-l py-2 pl-3 text-left transition-colors",
                tab === value ? "border-ink text-ink" : "border-ink/15 text-smoke hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-8 flex flex-col gap-3 border-t border-ink/10 pt-6">
          <Link href="/book" className="btn-dark text-center">{mn ? "Зураг авуулах" : "Book a session"}</Link>
          <button type="button" onClick={signOut} className="text-left text-[10px] uppercase tracking-[0.2em] text-smoke hover:text-ink">
            {mn ? "Гарах" : "Sign out"}
          </button>
        </div>
      </aside>

      <div>
        {message ? (
          <p className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p>
        ) : null}
        {error ? (
          <p className="mb-5 border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
        ) : null}

        {tab === "bookings" ? (
          bookings.length ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/booking/${booking.code}`}
                  className="flex flex-wrap items-center justify-between gap-4 border border-ink/12 bg-white/60 p-5 transition-colors hover:border-ink/35"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">{booking.code}</p>
                    <p className="mt-1 font-serif text-xl">{booking.category_name ?? (mn ? "Зураг авалт" : "Session")}</p>
                    <p className="text-xs text-smoke">
                      {formatDate(booking.date)} · {booking.time_slot} · {booking.package_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm">{formatAUD(booking.amount)}</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">
                        {localizeStatus(PAYMENT_STATUS_LABEL[booking.payment_status], mn ? "mn" : "en")}
                      </p>
                    </div>
                    <span className={cn("border px-2.5 py-1 text-[9px] uppercase tracking-[0.16em]", BOOKING_STATUS[booking.status]?.className)}>
                      {localizeStatus(BOOKING_STATUS[booking.status]?.label ?? booking.status, mn ? "mn" : "en")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-ink/20 p-12 text-center">
              <p className="font-serif text-2xl">{mn ? "Одоогоор захиалга алга." : "No bookings yet."}</p>
              <p className="mt-2 text-sm text-smoke">{mn ? "Эхний зураг авалт тань ярилцлагаас эхэлнэ." : "Your first session starts with a conversation."}</p>
              <Link href="/book" className="btn-dark mt-6">{mn ? "Зураг авуулах" : "Book a session"}</Link>
            </div>
          )
        ) : null}

        {tab === "payments" ? (
          payments.length ? (
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm">
                      {payment.kind === "deposit" ? (mn ? "Урьдчилгаа" : "Deposit") : (mn ? "Бүрэн төлбөр" : "Full payment")} · {payment.code}
                    </p>
                    <p className="text-[11px] text-smoke">{formatDateTime(payment.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{formatAUD(payment.gross_amount)}</span>
                    <span
                      className={cn(
                        "border px-2.5 py-1 text-[9px] uppercase tracking-[0.16em]",
                        ["settlement", "capture"].includes(payment.status)
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-ink/15 text-smoke",
                      )}
                    >
                      {localizeStatus(payment.status, mn ? "mn" : "en")}
                    </span>
                    <Link href={`/receipt/${payment.code}`} className="text-[10px] uppercase tracking-[0.18em] text-ink link-underline">
                      {mn ? "Баримт" : "Receipt"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-smoke">{mn ? "Одоогоор төлбөрийн бүртгэл алга." : "No payments recorded yet."}</p>
          )
        ) : null}

        {tab === "profile" ? (
          <div className="space-y-10">
            <form onSubmit={saveProfile} className="max-w-md space-y-4">
              <p className="eyebrow">{mn ? "Таны мэдээлэл" : "Your details"}</p>
              <div>
                <label className="label" htmlFor="p-name">{mn ? "Нэр" : "Name"}</label>
                <input id="p-name" className="field" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="p-phone">{mn ? "Утас / WhatsApp" : "Phone / WhatsApp"}</label>
                <input id="p-phone" className="field" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">{mn ? "Имэйл" : "Email"}</label>
                <input className="field bg-sand/50" value={user.email} readOnly />
              </div>
              <button type="submit" disabled={busy} className={cn("btn-dark", busy && "opacity-60")}>
                {mn ? "Мэдээлэл хадгалах" : "Save details"}
              </button>
            </form>

            <form onSubmit={savePassword} className="max-w-md space-y-4 border-t border-ink/10 pt-8">
              <p className="eyebrow">{mn ? "Нууц үг солих" : "Change password"}</p>
              <div>
                <label className="label" htmlFor="p-current">{mn ? "Одоогийн нууц үг" : "Current password"}</label>
                <input id="p-current" type="password" className="field" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="p-next">{mn ? "Шинэ нууц үг" : "New password"}</label>
                <input id="p-next" type="password" className="field" minLength={8} value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} required />
              </div>
              <button type="submit" disabled={busy} className={cn("btn-outline", busy && "opacity-60")}>
                {mn ? "Нууц үг шинэчлэх" : "Update password"}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
