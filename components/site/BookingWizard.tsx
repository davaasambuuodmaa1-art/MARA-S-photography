"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { slotsAction, submitBookingAction } from "@/app/actions/bookings";
import { checkPromotionAction } from "@/app/actions/promotions";
import { uploadReferenceAction } from "@/app/actions/admin";
import { formatAUD } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  slug: string;
  name: string;
  price: number;
  depositPercent: number;
  durationHours: number;
  editedPhotos: number;
  tagline: string;
  features: string[];
  badge: string | null;
  extraPhotoPrice: number;
  extraHourPrice: number;
  addons: { id: string; name: string; price: number }[];
  quoteOnly: boolean;
}

export interface LocationOption {
  id: string;
  slug: string;
  name: string;
  area: string;
  coverImage: string;
  styles: string[];
  travelFee: number;
  minSpend: number;
  permitStatus: string;
  requirements: string;
  mapsUrl: string;
}

const STEPS = ["Session", "Date & time", "Location", "Your details", "Review"];

export function BookingWizard({
  categories,
  packages,
  locations,
  travelPolicy,
  user,
  initialCategory,
  initialPackage,
  initialLocation,
}: {
  categories: { id: string; slug: string; name: string }[];
  packages: Option[];
  locations: LocationOption[];
  travelPolicy: string;
  user: { name: string; email: string; phone: string | null } | null;
  initialCategory?: string;
  initialPackage?: string;
  initialLocation?: string;
}) {
  const startPkg = packages.find((p) => p.slug === initialPackage) ?? packages[0];
  const startCat = categories.find((c) => c.slug === initialCategory);
  const startLoc = locations.find((l) => l.slug === initialLocation);

  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState(startCat?.id ?? categories[0]?.id ?? "");
  const [packageId, setPackageId] = useState(startPkg?.id ?? "");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotNote, setSlotNote] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [locationMode, setLocationMode] = useState<"suggested" | "custom">(
    startLoc ? "suggested" : "suggested",
  );
  const [locationId, setLocationId] = useState(startLoc?.id ?? "");
  const [customAddress, setCustomAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [wantsRecommendations, setWantsRecommendations] = useState(false);
  const [details, setDetails] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    people: 1,
    notes: "",
  });
  const [references, setReferences] = useState<string[]>([]);
  const [extraPhotos, setExtraPhotos] = useState(0);
  const [extraHours, setExtraHours] = useState(0);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ code: string; amount: number; depositAmount: number } | null>(null);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? packages[0],
    [packageId, packages],
  );
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedLocation = locations.find((l) => l.id === locationId) ?? null;
  const today = new Date().toISOString().slice(0, 10);

  const travelFee = locationMode === "suggested" ? (selectedLocation?.travelFee ?? 0) : 0;
  const basePrice = selectedPackage?.price ?? 0;
  const extraPhotoTotal = extraPhotos * (selectedPackage?.extraPhotoPrice ?? 0);
  const extraHourTotal = Math.round(extraHours * (selectedPackage?.extraHourPrice ?? 0));
  const addonTotal = (selectedPackage?.addons ?? [])
    .filter((addon) => selectedAddonIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);
  const extrasTotal = extraPhotoTotal + extraHourTotal + addonTotal;
  const subtotal = basePrice + travelFee + extrasTotal;
  const discountAmount = appliedPromo?.discount ?? 0;
  const total = Math.max(0, subtotal - discountAmount);
  const deposit = basePrice ? Math.round((total * (selectedPackage?.depositPercent || 30)) / 100) : 0;
  const minSpendBlocked = Boolean(
    locationMode === "suggested" &&
      selectedLocation &&
      selectedLocation.minSpend > 0 &&
      basePrice > 0 &&
      basePrice < selectedLocation.minSpend,
  );

  // Suggested spots that suit the chosen collection come first.
  const orderedLocations = useMemo(() => {
    const style = (selectedCategory?.name ?? "").replace(" Photography", "");
    return [...locations].sort((a, b) => {
      const score = (location: LocationOption) => (location.styles.includes(style) ? 1 : 0);
      return score(b) - score(a);
    });
  }, [locations, selectedCategory]);

  useEffect(() => {
    if (step !== 1 || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlot("");
    slotsAction(date)
      .then((result) => {
        if (cancelled) return;
        setSlots(result.slots.filter((s) => s.available).map((s) => ({ time: s.time, available: s.available })));
        setSlotNote(
          result.slots.length
            ? result.slots.some((s) => s.available)
              ? null
              : "Every slot on this date is taken. Try another day."
            : result.reason ?? "No availability on this date.",
        );
      })
      .catch(() => setSlotNote("Could not load availability — refresh and try again."))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [date, step]);

  const canContinue = () => {
    if (step === 0) return Boolean(categoryId && packageId);
    if (step === 1) return Boolean(date && slot);
    if (step === 2) {
      if (minSpendBlocked) return false;
      if (locationMode === "suggested") return Boolean(locationId);
      return customAddress.trim().length >= 4;
    }
    if (step === 3) {
      return (
        details.name.trim().length > 1 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(details.email) &&
        details.phone.replace(/\D/g, "").length >= 8
      );
    }
    return true;
  };

  const uploadReferences = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files)
      .slice(0, 6)
      .forEach((file) => formData.append("files", file));
    const result = await uploadReferenceAction(formData);
    setUploading(false);
    if (result.ok) setReferences((prev) => [...prev, ...result.urls].slice(0, 6));
    else setError(result.error);
  };

  const locationLabel =
    locationMode === "suggested"
      ? selectedLocation
        ? `${selectedLocation.name}, ${selectedLocation.area}`
        : "To be chosen"
      : customAddress.trim() || "Custom location";

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await submitBookingAction({
      categoryId,
      packageId,
      customerName: details.name,
      email: details.email,
      phone: details.phone,
      location: locationMode === "custom" ? customAddress.trim() : "",
      locationId: locationMode === "suggested" ? locationId : null,
      mapsUrl: locationMode === "custom" ? mapsUrl.trim() : "",
      wantsRecommendations: locationMode === "custom" ? wantsRecommendations : false,
      people: Number(details.people) || 1,
      date,
      timeSlot: slot,
      notes: details.notes,
      referenceImages: references,
      extras: { photos: extraPhotos, hours: extraHours, addonIds: selectedAddonIds },
      promoCode: appliedPromo?.code ?? (promoCode.trim() || undefined),
    });
    setSubmitting(false);
    if (result.ok) setDone({ code: result.code, amount: result.amount, depositAmount: result.depositAmount });
    else {
      setError(result.error);
      if (result.error.toLowerCase().includes("slot")) setStep(1);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl border border-ink/12 bg-white/70 p-8 text-center sm:p-12">
        <p className="eyebrow">Request received</p>
        <h2 className="display mt-4 text-4xl">Thank you, {details.name.split(" ")[0]}.</h2>
        <p className="mt-4 text-sm leading-relaxed text-smoke">
          Your booking reference is{" "}
          <span className="mx-1 border border-ink/20 bg-sand px-2 py-1 font-mono text-sm tracking-widest text-ink">
            {done.code}
          </span>
          . Mara reviews every request personally — including the location — and will confirm within
          one business day.
        </p>

        <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10 text-left text-sm">
          {[
            ["Session", selectedCategory?.name ?? "—"],
            ["Package", selectedPackage?.name ?? "—"],
            ["Date", date],
            ["Time", slot],
            ["Location", `${locationLabel} · awaiting approval`],
            ["Travel", travelFee ? formatAUD(travelFee) : "Included"],
            ["Total", formatAUD(done.amount)],
            ["Deposit to reserve", formatAUD(done.depositAmount)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3">
              <span className="text-smoke">{label}</span>
              <span className="text-right text-ink">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {done.amount > 0 ? (
            <Link href={`/pay/${done.code}`} className="btn-dark">
              Pay the deposit
            </Link>
          ) : null}
          <Link href={`/booking/${done.code}`} className="btn-outline">
            View my booking
          </Link>
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-smoke/70">
          Save your reference — you can check status any time at{" "}
          <Link href="/booking/lookup" className="underline">
            booking lookup
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-10 grid grid-cols-5 gap-2 border-b border-ink/10 pb-5">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-col gap-2">
            <span
              className={cn(
                "h-px w-full transition-colors duration-500",
                index <= step ? "bg-ink" : "bg-ink/15",
              )}
            />
            <span
              className={cn(
                "text-[8px] uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.2em]",
                index === step ? "text-ink" : index < step ? "text-smoke" : "text-smoke/40",
              )}
            >
              {String(index + 1).padStart(2, "0")} {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="space-y-10">
          <div>
            <p className="eyebrow">Step one · the session</p>
            <h2 className="display mt-3 text-3xl">What are we photographing?</h2>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "border px-4 py-3 text-left text-[12px] transition-all duration-300",
                    categoryId === category.id
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/15 text-ink/70 hover:border-ink/50",
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">Step one · the package</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => {
                    setPackageId(pkg.id);
                    setExtraPhotos(0);
                    setExtraHours(0);
                    setSelectedAddonIds([]);
                    setAppliedPromo(null);
                    setPromoError(null);
                  }}
                  className={cn(
                    "border p-6 text-left transition-all duration-300",
                    packageId === pkg.id
                      ? "border-ink bg-white shadow-card"
                      : "border-ink/15 bg-white/40 hover:border-ink/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-2xl">{pkg.name}</p>
                      <p className="mt-1 text-xs text-smoke">
                        {pkg.durationHours}h · {pkg.editedPhotos ? `${pkg.editedPhotos} images` : "custom scope"}
                      </p>
                    </div>
                    <span className="text-right">
                      <span className="block font-serif text-xl">
                        {pkg.price === 0 ? "Quote" : formatAUD(pkg.price)}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.16em] text-smoke">
                        {pkg.depositPercent}% deposit
                      </span>
                    </span>
                  </div>
                  <p className="mt-4 text-[13px] leading-relaxed text-smoke">{pkg.tagline}</p>
                  <ul className="mt-4 space-y-1.5 text-[12px] text-smoke">
                    {pkg.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="text-gold">—</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <span
                    className={cn(
                      "mt-5 inline-block text-[9px] uppercase tracking-[0.22em]",
                      packageId === pkg.id ? "text-gold" : "text-smoke/50",
                    )}
                  >
                    {packageId === pkg.id ? "✓ Selected" : "Select"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedPackage && !selectedPackage.quoteOnly ? (
            <div className="mt-8 border border-ink/10 bg-white/60 p-5">
              <p className="eyebrow">Optional extras</p>
              <p className="mt-2 text-[12px] leading-relaxed text-smoke">
                Add more edited photographs or hours. Prices come from the package you selected.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Extra edited photos ({formatAUD(selectedPackage.extraPhotoPrice)} each)</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    className="field"
                    value={extraPhotos}
                    onChange={(event) => setExtraPhotos(Math.max(0, Number(event.target.value) || 0))}
                  />
                </div>
                <div>
                  <label className="label">Additional hours ({formatAUD(selectedPackage.extraHourPrice)} each)</label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    step={0.5}
                    className="field"
                    value={extraHours}
                    onChange={(event) => setExtraHours(Math.max(0, Number(event.target.value) || 0))}
                  />
                </div>
              </div>
              {selectedPackage.addons.length ? (
                <div className="mt-4">
                  <p className="label">Add-ons</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedPackage.addons.map((addon) => (
                      <label key={addon.id} className="flex items-center gap-2 border border-ink/12 bg-white/70 px-3 py-2 text-[12px]">
                        <input
                          type="checkbox"
                          checked={selectedAddonIds.includes(addon.id)}
                          onChange={(event) =>
                            setSelectedAddonIds((prev) =>
                              event.target.checked ? [...prev, addon.id] : prev.filter((id) => id !== addon.id),
                            )
                          }
                        />
                        <span className="flex-1">{addon.name}</span>
                        <span className="text-smoke">{formatAUD(addon.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-8">
          <div>
            <p className="eyebrow">Step two · date & time</p>
            <h2 className="display mt-3 text-3xl">When would you like us?</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-smoke">
              Sessions run Tuesday to Sunday, 09:00–18:00, at your chosen location. Only genuinely
              available times are shown, and Mara confirms the exact window with you.
            </p>
          </div>
          <div className="max-w-xs">
            <label className="label" htmlFor="booking-date">Choose a date</label>
            <input
              id="booking-date"
              type="date"
              min={today}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="field"
            />
          </div>

          {date ? (
            <div>
              <p className="label">Available times</p>
              {loadingSlots ? (
                <p className="text-sm text-smoke">Checking the calendar…</p>
              ) : slots.length ? (
                <div className="grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
                  {slots.map((option) => (
                    <button
                      key={option.time}
                      type="button"
                      onClick={() => setSlot(option.time)}
                      className={cn(
                        "border px-3 py-3 text-sm transition-colors",
                        slot === option.time
                          ? "border-ink bg-ink text-cream"
                          : "border-ink/15 text-ink/75 hover:border-ink/50",
                      )}
                    >
                      {option.time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {slotNote ?? "No times available on this date."}
                </p>
              )}
              {slotNote && slots.length ? <p className="mt-3 text-xs text-amber-700">{slotNote}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-8">
          <div>
            <p className="eyebrow">Step three · the location</p>
            <h2 className="display mt-3 text-3xl">Where shall we meet?</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-smoke">
              Mara comes to you. Choose one of the Sydney locations she knows well, or send your own
              address or map pin. Every location is reviewed before it is confirmed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLocationMode("suggested")}
              className={cn(
                "border px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors",
                locationMode === "suggested" ? "border-ink bg-ink text-cream" : "border-ink/20 text-smoke hover:border-ink/50",
              )}
            >
              Suggested locations
            </button>
            <button
              type="button"
              onClick={() => setLocationMode("custom")}
              className={cn(
                "border px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors",
                locationMode === "custom" ? "border-ink bg-ink text-cream" : "border-ink/20 text-smoke hover:border-ink/50",
              )}
            >
              My own location
            </button>
          </div>

          {locationMode === "suggested" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orderedLocations.map((location) => {
                const blocked =
                  location.minSpend > 0 && basePrice > 0 && basePrice < location.minSpend;
                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => setLocationId(location.id)}
                    className={cn(
                      "group relative overflow-hidden border text-left transition-all duration-300",
                      locationId === location.id
                        ? "border-ink ring-1 ring-ink"
                        : "border-ink/12 hover:border-ink/40",
                    )}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                      {location.coverImage ? (
                        <img
                          src={location.coverImage}
                          alt={location.name}
                          className="grade h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-smoke">
                          No preview yet
                        </div>
                      )}
                      {location.travelFee > 0 ? (
                        <span className="absolute right-3 top-3 bg-cream/95 px-2 py-1 text-[8px] uppercase tracking-[0.16em] text-ink">
                          +{formatAUD(location.travelFee)} travel
                        </span>
                      ) : (
                        <span className="absolute right-3 top-3 bg-cream/95 px-2 py-1 text-[8px] uppercase tracking-[0.16em] text-ink">
                          Travel included
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-serif text-xl">{location.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-smoke">{location.area}</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-smoke/80">
                        {location.styles.join(" · ")}
                      </p>
                      {blocked ? (
                        <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-burgundy">
                          Needs a session over {formatAUD(location.minSpend)}
                        </p>
                      ) : null}
                      {locationId === location.id ? (
                        <p className="mt-3 text-[9px] uppercase tracking-[0.22em] text-gold">✓ Selected</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-w-xl space-y-5">
              <div>
                <label className="label" htmlFor="b-address">Address or place *</label>
                <input
                  id="b-address"
                  className="field"
                  value={customAddress}
                  onChange={(event) => setCustomAddress(event.target.value)}
                  placeholder="e.g. 12 Notts Avenue, Bondi Beach NSW"
                />
              </div>
              <div>
                <label className="label" htmlFor="b-maps">Google Maps link (optional)</label>
                <input
                  id="b-maps"
                  className="field"
                  value={mapsUrl}
                  onChange={(event) => setMapsUrl(event.target.value)}
                  placeholder="https://maps.app.goo.gl/…"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-smoke/70">
                  A pin helps Mara check access, parking and light. Custom locations are quoted
                  individually and never confirmed automatically.
                </p>
              </div>
              <label className="flex items-start gap-3 border border-ink/12 bg-white/60 p-4 text-[12px] leading-relaxed text-smoke">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={wantsRecommendations}
                  onChange={(event) => setWantsRecommendations(event.target.checked)}
                />
                I would also like location recommendations for this session.
              </label>
            </div>
          )}

          <div className="border border-ink/10 bg-white/50 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Travel</p>
            <p className="mt-2 text-[12px] leading-relaxed text-smoke">{travelPolicy}</p>
            {travelFee > 0 ? (
              <p className="mt-3 text-[12px] text-ink">
                Travel fee for this location: <span className="font-medium">{formatAUD(travelFee)}</span>{" "}
                — included in your total.
              </p>
            ) : null}
            {minSpendBlocked && selectedLocation ? (
              <p className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
                {selectedLocation.name} requires a minimum session of {formatAUD(selectedLocation.minSpend)}.
                Choose a larger package, or pick another location.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <div>
            <p className="eyebrow">Step four · your details</p>
            <h2 className="display mt-3 text-3xl">So we know who we are meeting</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="b-name">Full name *</label>
              <input id="b-name" className="field" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} placeholder="Alya Putri" />
            </div>
            <div>
              <label className="label" htmlFor="b-email">Email *</label>
              <input id="b-email" type="email" className="field" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="b-phone">Phone / WhatsApp *</label>
              <input id="b-phone" className="field" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="+61 412 000 000" />
            </div>
            <div>
              <label className="label" htmlFor="b-people">Number of people</label>
              <input id="b-people" type="number" min={1} max={500} className="field" value={details.people} onChange={(e) => setDetails({ ...details, people: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="b-notes">Anything we should know?</label>
              <textarea id="b-notes" rows={4} className="field resize-none" value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} placeholder="Timings, accessibility needs, mood references, a backup plan for weather…" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Inspiration images (optional)</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer border border-dashed border-ink/25 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-smoke transition-colors hover:border-ink/60 hover:text-ink">
                  {uploading ? "Uploading…" : "Choose images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => uploadReferences(event.target.files)}
                  />
                </label>
                {references.map((url) => (
                  <span key={url} className="relative">
                    <img src={url} alt="Reference" className="h-16 w-16 object-cover" />
                    <button
                      type="button"
                      onClick={() => setReferences((prev) => prev.filter((r) => r !== url))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-cream"
                      aria-label="Remove reference"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-smoke/70">Up to 6 images, 8 MB each. Mood, poses, places — anything that helps.</p>
            </div>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow">Step five · review</p>
            <h2 className="display mt-3 text-3xl">One last look</h2>
            <dl className="mt-7 divide-y divide-ink/10 border-y border-ink/10 text-sm">
              {[
                ["Collection", selectedCategory?.name ?? "—"],
                ["Package", `${selectedPackage?.name} · ${selectedPackage?.durationHours}h`],
                ["Date", date],
                ["Time", slot],
                ["Location", locationLabel],
                ["Travel", travelFee ? formatAUD(travelFee) : "Included"],
                ["Name", details.name],
                ["Email", details.email],
                ["Phone", details.phone],
                ["People", String(details.people)],
                ["Notes", details.notes || "—"],
                ["Inspiration", references.length ? `${references.length} image(s) attached` : "None"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3">
                  <dt className="shrink-0 text-smoke">{label}</dt>
                  <dd className="text-right text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[11px] leading-relaxed text-smoke/70">
              Submitting a request does not charge you. Mara confirms the date and checks the location —
              including permits — before you pay a {selectedPackage?.depositPercent}% deposit.
            </p>
          </div>

          <aside className="h-fit border border-ink/12 bg-white/70 p-6">
            <p className="eyebrow">Summary</p>
            <p className="mt-4 font-serif text-3xl">{selectedPackage?.name}</p>
            <p className="mt-1 text-xs text-smoke">{selectedCategory?.name}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-smoke/80">{locationLabel}</p>
            <div className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-smoke">Session</span>
                <span>{basePrice ? formatAUD(basePrice) : "Quoted separately"}</span>
              </div>
              {extrasTotal > 0 ? (
                <div className="flex justify-between">
                  <span className="text-smoke">Extras</span>
                  <span>{formatAUD(extrasTotal)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-smoke">Travel</span>
                <span>{travelFee ? formatAUD(travelFee) : "Included"}</span>
              </div>
              {discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo discount</span>
                  <span>−{formatAUD(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-ink/10 pt-2">
                <span className="text-smoke">Total</span>
                <span>{total ? formatAUD(total) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoke">Deposit ({selectedPackage?.depositPercent}%)</span>
                <span>{basePrice ? formatAUD(deposit) : "—"}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Promo code (optional)</label>
              <div className="flex gap-2">
                <input
                  className="field"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="STUDENT2026"
                />
                <button
                  type="button"
                  disabled={checkingPromo || !promoCode.trim()}
                  onClick={async () => {
                    setCheckingPromo(true);
                    setPromoError(null);
                    const result = await checkPromotionAction(promoCode.trim(), subtotal);
                    setCheckingPromo(false);
                    if (result.ok) {
                      setAppliedPromo({ code: result.code, discount: result.discount });
                      setPromoCode(result.code);
                    } else {
                      setAppliedPromo(null);
                      setPromoError(result.error);
                    }
                  }}
                  className="btn-dark px-4 py-2 text-[9px] disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {appliedPromo ? (
                <p className="mt-2 text-[11px] text-emerald-700">
                  {appliedPromo.code} applied — {formatAUD(appliedPromo.discount)} off.
                </p>
              ) : null}
              {promoError ? <p className="mt-2 text-[11px] text-rose-700">{promoError}</p> : null}
            </div>
            {error ? (
              <p className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
            ) : null}
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className={cn("btn-dark mt-6 w-full", submitting && "opacity-60")}
            >
              {submitting ? "Sending request…" : "Submit booking request"}
            </button>
          </aside>
        </div>
      ) : null}

      {error && step !== 4 ? (
        <p className="mt-6 border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-ink/10 pt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={cn(
            "text-[10px] uppercase tracking-[0.22em] text-smoke transition-colors hover:text-ink",
            step === 0 && "invisible",
          )}
        >
          ← Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            disabled={!canContinue()}
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            className={cn("btn-dark", !canContinue() && "cursor-not-allowed opacity-40")}
          >
            Continue
          </button>
        ) : null}
      </div>
    </div>
  );
}
