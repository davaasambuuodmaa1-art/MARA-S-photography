"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await loginAction({ ...form, admin: true });
    setBusy(false);
    if (result.ok && result.role === "admin") {
      router.replace("/admin");
      router.refresh();
    } else {
      setError(result.ok ? "This account does not have studio access." : result.error);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img
          src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=1600"
          alt=""
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-cream">
          <p className="display text-3xl tracking-[0.1em]">MARA&apos;S</p>
          <div>
            <p className="eyebrow text-champagne/90">Studio manager</p>
            <p className="display mt-4 max-w-md text-4xl leading-tight">
              Every booking, gallery and payment in one quiet place.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Administration</p>
          <h1 className="display mt-3 text-4xl">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            This area is for Mara and her studio admin team. Clients should use the{" "}
            <a href="/account" className="underline">client account</a> page.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                className="field"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>
            {error ? (
              <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
            ) : null}
            <button type="submit" disabled={busy} className={cn("btn-dark w-full", busy && "opacity-60")}>
              {busy ? "Signing in…" : "Enter"}
            </button>
          </form>

          <p className="mt-6 border-t border-ink/10 pt-5 text-[11px] leading-relaxed text-smoke/70">
            First sign-in uses the credentials set by <code className="font-mono">SEED_ADMIN_EMAIL</code> and{" "}
            <code className="font-mono">SEED_ADMIN_PASSWORD</code> (defaults in{" "}
            <code className="font-mono">.env.example</code>). Change the password from your account page
            after signing in.
          </p>
          <a href="/" className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-smoke hover:text-ink">
            ← Back to the website
          </a>
        </div>
      </div>
    </div>
  );
}
