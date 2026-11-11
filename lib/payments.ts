import { getEnv, envValue } from "./db";

/**
 * Stripe configuration. Card, Apple Pay and Google Pay are all handled by the
 * Stripe Checkout Session when a secret key is present.
 */
export function stripeConfig() {
  const secretKey = (envValue("STRIPE_SECRET_KEY") || "").trim();
  const webhookSecret = (envValue("STRIPE_WEBHOOK_SECRET") || "").trim();
  const publishableKey = (envValue("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") || "").trim();
  return {
    secretKey,
    webhookSecret,
    publishableKey,
    configured: Boolean(secretKey),
    production: secretKey.startsWith("sk_live"),
  };
}

export async function siteOrigin() {
  const env = await getEnv();
  const fromEnv =
    env.NEXT_PUBLIC_SITE_URL || envValue("NEXT_PUBLIC_SITE_URL") || process.env.NEXT_PUBLIC_SITE_URL;
  return (fromEnv || "http://localhost:3000").replace(/\/$/, "");
}

/** Creates a Stripe Checkout Session in AUD, or returns a local sandbox checkout URL. */
export async function createPaymentIntent(input: {
  bookingCode: string;
  kind: "deposit" | "full";
  amount: number;
  customerName: string;
  email: string;
  phone: string;
  description: string;
}) {
  const orderId = `${input.bookingCode}-${input.kind === "deposit" ? "DP" : "FULL"}-${Date.now()
    .toString()
    .slice(-5)}`;
  const config = stripeConfig();

  if (!config.configured) {
    return {
      provider: "sandbox",
      orderId,
      redirectUrl: `/pay/${input.bookingCode}/checkout?order=${orderId}&kind=${input.kind}`,
      simulated: true as const,
    };
  }

  const origin = await siteOrigin();
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/booking/${input.bookingCode}?paid=1`);
  body.set("cancel_url", `${origin}/pay/${input.bookingCode}`);
  body.set("customer_email", input.email);
  body.set("client_reference_id", orderId);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "aud");
  body.set("line_items[0][price_data][unit_amount]", String(Math.round(input.amount * 100)));
  body.set("line_items[0][price_data][product_data][name]", input.description.slice(0, 120));
  body.set("metadata[order_id]", orderId);
  body.set("metadata[booking_code]", input.bookingCode);
  body.set("payment_intent_data[metadata][order_id]", orderId);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${config.secretKey}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe rejected the checkout session (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id?: string; url?: string };
  return {
    provider: "stripe",
    orderId,
    token: data.id,
    redirectUrl: data.url || `${origin}/pay/${input.bookingCode}`,
    simulated: false as const,
  };
}

/**
 * Verifies a Stripe webhook signature: HMAC-SHA256 of "timestamp.rawBody"
 * compared against the v1 signature, with a replay window.
 */
export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  toleranceSeconds = 300,
) {
  const { webhookSecret } = stripeConfig();
  if (!webhookSecret || !header) return false;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2).map((s) => s?.trim());
    if (key === "t") timestamp = value ?? "";
    if (key === "v1" && value) signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signatures.some((signature) => signature === hex);
}

export function isSettledStatus(status: string) {
  return status === "checkout.session.completed" || status === "payment_intent.succeeded";
}

export function isFailedStatus(status: string) {
  return [
    "payment_intent.payment_failed",
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ].includes(status);
}
