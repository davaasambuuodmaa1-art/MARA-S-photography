"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeOwnerAccessSetupAction } from "@/app/actions/admin";
import { logoutAction } from "@/app/actions/auth";
import { OWNER_ADMIN, SECOND_ADMIN } from "@/lib/admin-access";

export function AdminAccessManager({ setupComplete }: { setupComplete: boolean }) {
  const router = useRouter();
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerPasswordConfirmation, setOwnerPasswordConfirmation] = useState("");
  const [secondAdminPassword, setSecondAdminPassword] = useState("");
  const [secondAdminPasswordConfirmation, setSecondAdminPasswordConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await completeOwnerAccessSetupAction({
      ownerPassword,
      ownerPasswordConfirmation,
      secondAdminPassword,
      secondAdminPasswordConfirmation,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await logoutAction();
    router.replace("/admin/login");
    router.refresh();
  };

  return setupComplete ? (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-smoke">
        Admin access is limited to these two separate accounts. Each person can change only their own
        password from Account &amp; security.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[{ ...OWNER_ADMIN, role: "Primary owner" }, { ...SECOND_ADMIN, role: "Second admin" }].map(
          (account) => (
            <div key={account.email} className="border border-ink/12 bg-white/70 p-4">
              <p className="text-[9px] uppercase tracking-[0.18em] text-smoke">{account.role}</p>
              <p className="mt-2 font-serif text-lg">{account.name}</p>
              <p className="mt-1 break-all text-xs text-smoke">{account.email}</p>
            </div>
          ),
        )}
      </div>
      <p className="border-l-2 border-champagne pl-4 text-[11px] leading-relaxed text-smoke">
        Passwords are individually salted and stored as hashes; they are never displayed or saved in
        plain text. There is no shared admin password.
      </p>
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm leading-relaxed text-smoke">
        Create separate passwords for the primary owner and the only other admin. Use at least 12
        characters for each; the two passwords must be different.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <fieldset className="space-y-3 border border-ink/12 bg-white/70 p-4">
          <legend className="px-2 font-serif text-lg">Primary owner · {OWNER_ADMIN.email}</legend>
          <label className="block">
            <span className="label">Owner password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className="field"
              value={ownerPassword}
              onChange={(event) => setOwnerPassword(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">Confirm owner password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className="field"
              value={ownerPasswordConfirmation}
              onChange={(event) => setOwnerPasswordConfirmation(event.target.value)}
            />
          </label>
        </fieldset>
        <fieldset className="space-y-3 border border-ink/12 bg-white/70 p-4">
          <legend className="px-2 font-serif text-lg">Second admin · {SECOND_ADMIN.email}</legend>
          <label className="block">
            <span className="label">Second admin password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className="field"
              value={secondAdminPassword}
              onChange={(event) => setSecondAdminPassword(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="label">Confirm second admin password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className="field"
              value={secondAdminPasswordConfirmation}
              onChange={(event) => setSecondAdminPasswordConfirmation(event.target.value)}
            />
          </label>
        </fieldset>
      </div>
      {error ? (
        <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
        {busy ? "Creating separate accounts…" : "Create the two admin accounts"}
      </button>
    </form>
  );
}
