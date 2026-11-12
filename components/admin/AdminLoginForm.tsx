"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { AdminOAuthProvider } from "@/lib/admin-oauth";

const OAUTH_ERRORS: Record<string, string> = {
  social_login_failed: "Sign-in failed. Use the approved admin email and try again.",
  social_login_unavailable: "Social sign-in is not configured yet. Use email and password for now.",
};

export function AdminLoginForm({
  providers,
  oauthError,
}: {
  providers: AdminOAuthProvider[];
  oauthError?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(OAUTH_ERRORS[oauthError || ""] || null);
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
    <>
      {providers.length ? (
        <div className="mt-8 space-y-3">
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-smoke">
            Sign in with your admin account
          </p>
          {providers.includes("google") ? (
            <a
              href="/api/auth/admin/google"
              className="flex w-full items-center justify-center gap-3 border border-ink/15 bg-white px-4 py-3 text-xs font-medium text-ink transition hover:bg-cream"
            >
              <span aria-hidden="true" className="font-bold text-base text-[#4285f4]">G</span>
              Continue with Google
            </a>
          ) : null}
          {providers.includes("apple") ? (
            <a
              href="/api/auth/admin/apple"
              className="flex w-full items-center justify-center gap-3 bg-ink px-4 py-3 text-xs font-medium text-white transition hover:bg-ink/85"
            >
              Continue with Apple
            </a>
          ) : null}
          <p className="text-center text-[10px] leading-relaxed text-smoke/75">
            Only the two authorized administrator email addresses can access the dashboard.
          </p>
        </div>
      ) : null}

      <form onSubmit={submit} className={`${providers.length ? "mt-7 border-t border-ink/10 pt-6" : "mt-8"} space-y-4`}>
        {providers.length ? (
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-smoke">
            Or use email and password
          </p>
        ) : null}
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
          <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={cn("btn-dark w-full", busy && "opacity-60")}>
          {busy ? "Signing in…" : "Enter"}
        </button>
      </form>
    </>
  );
}
