"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TestimonialCarousel({
  items,
}: {
  items: { id: string; name: string; role: string; quote: string; rating: number }[];
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  if (!items.length) return null;
  const current = items[active];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 text-[13px] tracking-[0.4em] text-champagne">
          {"★".repeat(current.rating)}
        </div>
        <blockquote
          key={current.id}
          className="display fade-enter text-balance text-[30px] leading-[1.25] text-cream sm:text-[40px]"
        >
          “{current.quote}”
        </blockquote>
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-cream">{current.name}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-cream/40">{current.role}</p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Testimonial ${i + 1}`}
            className={cn(
              "h-px transition-all duration-500",
              i === active ? "w-10 bg-champagne" : "w-5 bg-cream/25 hover:bg-cream/60",
            )}
          />
        ))}
      </div>
    </div>
  );
}
