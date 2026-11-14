"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { sizedImage } from "@/lib/img";
import { cn } from "@/lib/utils";
import { localizeSiteContent } from "@/lib/site-locale";
import { useSiteLocale } from "@/lib/use-site-locale";

interface WorkCategory {
  id: string;
  slug: string;
  name: string;
  cover_image: string;
  image_count: number;
  description: string;
}

export function WorkGrid({ categories }: { categories: WorkCategory[] }) {
  const mn = useSiteLocale() === "mn";
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return categories.filter((c) => {
      const matchesQuery =
        !term ||
        c.name.toLowerCase().includes(term) ||
        localizeSiteContent(c.name, "mn").toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        localizeSiteContent(c.description, "mn").toLowerCase().includes(term);
      const matchesActive = active === "all" || c.slug === active;
      return matchesQuery && matchesActive;
    });
  }, [categories, query, active]);

  const chips = [
    { slug: "all", label: mn ? "Бүх цуглуулга" : "All collections" },
    ...categories.slice(0, 8).map((c) => ({
      slug: c.slug,
      label: mn
        ? localizeSiteContent(c.name, "mn").replace(" гэрэл зураг", "")
        : c.name.replace(" Photography", ""),
    })),
  ];

  return (
    <div>
      <div className="sticky top-[76px] z-30 -mx-6 mb-10 border-y border-ink/10 bg-cream/90 px-6 py-4 backdrop-blur-lg sm:-mx-10 sm:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {chips.map((chip) => (
              <button
                key={chip.slug}
                type="button"
                onClick={() => setActive(chip.slug)}
                className={cn("chip shrink-0", active === chip.slug && "chip-active")}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-64">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={mn ? "Цуглуулга хайх" : "Search collections"}
              aria-label={mn ? "Цуглуулга хайх" : "Search collections"}
              className="field py-2.5 pl-9 text-xs"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke/60"
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-ink/10 bg-white/60 px-8 py-20 text-center">
          <p className="font-serif text-2xl text-ink">{mn ? "Хайлтад тохирох зүйл олдсонгүй." : "Nothing matches that search."}</p>
          <p className="mt-3 text-sm text-smoke">{mn ? "Өөр цуглуулгын нэрээр хайх эсвэл бүгдийг үзнэ үү." : "Try another collection name, or browse everything."}</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive("all");
            }}
            className="mt-6 text-[10px] uppercase tracking-[0.24em] text-ink link-underline"
          >
            {mn ? "Шүүлтүүр арилгах" : "Reset filters"}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((category, i) => (
            <Link
              key={category.id}
              href={`/work/${category.slug}`}
              className={cn(
                "group relative block overflow-hidden bg-sand",
                i % 5 === 1 ? "sm:aspect-[3/4] aspect-[4/5]" : "aspect-[4/5]",
              )}
            >
              <img
                src={sizedImage(category.cover_image, 1000)}
                alt={category.name}
                loading={i < 3 ? "eager" : "lazy"}
                className="grade h-full w-full object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[9px] uppercase tracking-[0.28em] text-cream/55">
                  {String(category.image_count).padStart(2, "0")} {mn ? "зураг" : "frames"}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-cream">{localizeSiteContent(category.name, mn ? "mn" : "en")}</h2>
                <p className="mt-2 max-h-0 overflow-hidden text-xs leading-relaxed text-cream/65 transition-all duration-500 group-hover:max-h-24">
                  {localizeSiteContent(category.description, mn ? "mn" : "en")}
                </p>
              </div>
              <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-cream/40 text-cream opacity-0 transition-all duration-500 group-hover:opacity-100">
                <svg width="12" height="9" viewBox="0 0 18 10" fill="none" aria-hidden>
                  <path d="M1 5h16M13 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
