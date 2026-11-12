import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { adminOAuthIsConfigured, isAdminOAuthProvider } from "@/lib/admin-oauth";
import { getEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [env, query] = await Promise.all([getEnv(), searchParams]);
  const providers = (["google", "apple"] as const).filter(
    (provider) => isAdminOAuthProvider(provider) && adminOAuthIsConfigured(provider, env),
  );

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

          <AdminLoginForm providers={providers} oauthError={query.error} />

          <p className="mt-6 border-t border-ink/10 pt-5 text-[11px] leading-relaxed text-smoke/70">
            Before owner setup, sign in using the one-time bootstrap credentials configured in{" "}
            <code className="font-mono">SEED_ADMIN_EMAIL</code> and{" "}
            <code className="font-mono">SEED_ADMIN_PASSWORD</code>. Then open Owner setup to create the
            two separate administrator accounts.
          </p>
          <a href="/" className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-smoke hover:text-ink">
            ← Back to the website
          </a>
        </div>
      </div>
    </div>
  );
}
