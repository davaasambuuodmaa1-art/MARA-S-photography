import { logoutAction } from "@/app/actions/auth";
import { currentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const admin = await currentAdmin();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Account &amp; security</p>
        <h1 className="display mt-2 text-3xl">Your admin account</h1>
      </div>
      <div className="max-w-xl space-y-4 border border-ink/12 bg-white/70 p-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Signed in as</p>
          <p className="mt-1 font-serif text-lg">{admin?.email ?? "—"}</p>
        </div>
        <p className="text-[12px] leading-relaxed text-smoke">
          Admin access is owner-only. There is no public registration. Passwords are stored hashed and
          sessions use secure cookies. To change your password, update the admin record directly in the
          database or add a reset flow — the current build does not expose self-service password change.
        </p>
        <form action={async () => { await logoutAction(); }}>
          <button type="submit" className="btn-dark py-2.5 text-[9px]">Log out</button>
        </form>
      </div>
    </div>
  );
}
