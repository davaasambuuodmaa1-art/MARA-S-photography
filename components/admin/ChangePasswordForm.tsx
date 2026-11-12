"use client";

import { useState } from "react";
import { changePasswordAction } from "@/app/actions/auth";

export function ChangePasswordForm({ isAdmin }: { isAdmin: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (next !== confirmation) {
      setError("The new password confirmations do not match.");
      return;
    }
    setBusy(true);
    const result = await changePasswordAction({ current, next });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirmation("");
    setMessage("Password updated.");
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 border border-ink/12 bg-white/70 p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Change your password</p>
      <label className="block">
        <span className="label">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          className="field"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="label">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={isAdmin ? 12 : 8}
          className="field"
          value={next}
          onChange={(event) => setNext(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="label">Confirm new password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={isAdmin ? 12 : 8}
          className="field"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </label>
      {message ? <p role="status" className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p role="alert" className="text-xs text-rose-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-dark py-2.5 text-[9px] disabled:opacity-60">
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
