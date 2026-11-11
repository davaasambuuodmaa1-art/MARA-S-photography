import { PaymentSettings } from "@/components/admin/PaymentSettings";
import { getSiteSettings } from "@/lib/data";
import { stripeConfig } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const config = stripeConfig();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Payments</p>
        <h1 className="display mt-2 text-3xl">Money, securely</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Deposits and full payments, verified server-side against the provider&apos;s signed
          notification. Receipts and transaction history are generated automatically.
        </p>
      </div>
      <PaymentSettings
        settings={settings}
        provider={{
          configured: config.configured,
          production: config.production,
          hasSecretKey: Boolean(config.secretKey),
          hasWebhookSecret: Boolean(config.webhookSecret),
        }}
      />
      <section className="border border-ink/12 bg-white/70 p-5 text-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Email notifications</p>
        <p className="mt-2 text-xs leading-relaxed text-smoke">
          Booking confirmations, payment receipts and admin alerts are sent through Resend when{" "}
          <code className="font-mono">RESEND_API_KEY</code> is present. Without it, every email is
          logged server-side and the in-dashboard notifications still work in full.
        </p>
      </section>
    </div>
  );
}
