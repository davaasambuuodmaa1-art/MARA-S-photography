import { PromotionsManager, type AdminPromotion } from "@/components/admin/PromotionsManager";
import { getPromotions, promotionState } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const rows = await getPromotions();
  const promotions: AdminPromotion[] = rows.map((promo) => ({
    id: promo.id,
    code: promo.code,
    label: promo.label,
    kind: promo.kind,
    value: promo.value,
    minSpend: promo.min_spend,
    startsAt: promo.starts_at,
    endsAt: promo.ends_at,
    usageLimit: promo.usage_limit,
    usedCount: promo.used_count,
    active: Boolean(promo.active),
    note: promo.note,
    state: promotionState(promo),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-smoke">Promotions</p>
        <h1 className="display mt-2 text-3xl">Discount codes</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Student discounts, seasonal offers and first-session codes. Codes are checked on the server
          when a client books, apply to the package, extras and travel subtotal, and can be paused at
          any time without affecting bookings that already used them.
        </p>
      </div>
      <PromotionsManager promotions={promotions} />
    </div>
  );
}
