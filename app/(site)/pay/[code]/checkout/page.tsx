import { notFound, redirect } from "next/navigation";
import { SandboxCheckout } from "@/components/site/SandboxCheckout";
import { Reveal } from "@/components/site/Reveal";
import { getPaymentByOrder } from "@/lib/data";
import { stripeConfig } from "@/lib/payments";
import { currentSiteLocale } from "@/lib/current-site-locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function SandboxCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ order?: string; kind?: string }>;
}) {
  const { code } = await params;
  const { order, kind } = await searchParams;
  const mn = (await currentSiteLocale()) === "mn";
  if (!order) redirect(`/pay/${code}`);
  const payment = await getPaymentByOrder(order);
  if (!payment) notFound();
  if (stripeConfig().configured) redirect(`/pay/${code}`);

  return (
    <section className="mx-auto max-w-[1080px] px-6 pb-24 pt-32 sm:px-10 lg:pt-40">
      <Reveal>
        <p className="eyebrow">{mn ? "Төлбөр төлөх" : "Checkout"}</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,4.6vw,3.4rem)] text-ink">{mn ? "Төлбөрөө төлнө үү" : "Complete your payment"}</h1>
      </Reveal>
      <div className="mt-10">
        <SandboxCheckout
          orderId={payment.order_id}
          code={payment.booking_code}
          amount={payment.gross_amount}
          kind={payment.kind}
          customerName={payment.customer_name}
        />
      </div>
    </section>
  );
}
