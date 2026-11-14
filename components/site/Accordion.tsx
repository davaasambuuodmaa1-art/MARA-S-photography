"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { localizeSiteContent } from "@/lib/site-locale";
import { useSiteLocale } from "@/lib/use-site-locale";

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const locale = useSiteLocale();
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-baseline justify-between gap-6 py-6 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-serif text-xl text-ink sm:text-2xl">{localizeSiteContent(item.question, locale)}</span>
              <span
                className={cn(
                  "mt-1 text-lg text-gold transition-transform duration-500",
                  isOpen && "rotate-45",
                )}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-500 ease-luxe",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-7 text-sm leading-relaxed text-smoke">{localizeSiteContent(item.answer, locale)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
