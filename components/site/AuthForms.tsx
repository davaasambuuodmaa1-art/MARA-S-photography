"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function AuthForms() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result =
      mode === "login"
        ? await loginAction({ email: form.email, password: form.password })
        : await registerAction({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
          });
    setBusy(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex gap-6 border-b border-ink/10">
        {(["login", "register"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={cn(
              "pb-3 text-[10px] uppercase tracking-[0.22em] transition-colors",
              mode === value ? "border-b border-ink text-ink" : "text-smoke hover:text-ink",
            )}
          >
            {value === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-5">
        {mode === "register" ? (
          <>
            <div>
              <label className="label" htmlFor="auth-name">Full name</label>
              <input id="auth-name" className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="auth-phone">Phone / WhatsApp</label>
              <input id="auth-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </>
        ) : null}
        <div>
          <label className="label" htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" className="field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            className="field"
            required
            minLength={mode === "register" ? 8 : 1}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {mode === "register" ? (
            <p className="mt-2 text-[11px] text-smoke/70">At least 8 characters.</p>
          ) : null}
        </div>
        {error ? (
          <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
        ) : null}
        <button type="submit" disabled={busy} className={cn("btn-dark w-full", busy && "opacity-60")}>
          {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create my account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-smoke/70">
        Your account keeps every booking, payment and receipt in one place. You can always book as a
        guest and look the booking up later.
      </p>
    </div>
  );
}
