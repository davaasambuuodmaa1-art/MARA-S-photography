"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

export function HeroEditorial({
  eyebrow,
  issue,
  lead,
  accent,
  subtitle,
  image,
  insetImage,
  meta,
}: {
  eyebrow: string;
  issue: string;
  lead: string;
  accent: string;
  subtitle: string;
  image: string;
  insetImage: string;
  meta: { label: string; value: string }[];
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const setScroll = () => {
      frame = 0;
      const offset = Math.min(window.scrollY, 900);
      node.style.setProperty("--sy", String(offset));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(setScroll);
    };
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--mx", String((event.clientX - rect.width / 2) / rect.width));
      node.style.setProperty("--my", String((event.clientY - rect.height / 2) / rect.height));
    };

    node.style.setProperty("--sy", String(Math.min(window.scrollY, 900)));
    window.addEventListener("scroll", onScroll, { passive: true });
    node.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      node.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-cream"
      style={{ "--mx": 0, "--my": 0, "--sy": 0 } as CSSProperties}
    >
      <div className="mx-auto grid min-h-[100svh] max-w-[1720px] grid-cols-1 lg:grid-cols-[1.04fr_0.96fr]">
        {/* ------------------------------ editorial type ----------------------------- */}
        <div className="order-2 flex flex-col justify-between px-6 pb-12 pt-12 sm:px-10 lg:order-1 lg:pb-14 lg:pl-14 lg:pr-16 lg:pt-36">
          <div className="flex items-center justify-between gap-4 text-[9px] uppercase tracking-[0.34em] text-smoke">
            <span className="flex items-center gap-3">
              <span className="hero-rule inline-block h-px w-10 bg-gold" />
              {eyebrow}
            </span>
            <span className="hidden sm:inline">{issue}</span>
          </div>

          <div className="mt-14 lg:my-10 lg:mt-0">
            <h1 className="display text-[clamp(3.1rem,8.6vw,8.9rem)] text-ink">
              <span className="block overflow-hidden pb-[0.06em]">
                <span
                  className="hero-line block"
                  style={{ animationDelay: "160ms" }}
                >
                  {lead}
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <span
                  className="hero-line editorial block text-burgundy"
                  style={{ animationDelay: "300ms" }}
                >
                  {accent}
                </span>
              </span>
            </h1>

            <div
              className="hero-fade mt-9 flex max-w-md gap-5 border-t border-ink/10 pt-6"
              style={{ animationDelay: "620ms" }}
            >
              <span className="num shrink-0 pt-1">01</span>
              <p className="text-[13px] leading-[1.95] text-smoke">{subtitle}</p>
            </div>

            <div
              className="hero-fade mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
              style={{ animationDelay: "760ms" }}
            >
              <Link href="/book" className="btn-dark">
                Book a session
              </Link>
              <Link
                href="/work"
                className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink link-underline"
              >
                Explore the work
                <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>

          <dl className="hero-fade mt-14 grid grid-cols-3 gap-4 border-t border-ink/10 pt-6 lg:mt-0" style={{ animationDelay: "900ms" }}>
            {meta.map((item) => (
              <div key={item.label}>
                <dt className="text-[8px] uppercase tracking-[0.26em] text-smoke/70">{item.label}</dt>
                <dd className="display mt-2 text-lg text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ------------------------------- image column ------------------------------ */}
        <div className="order-1 relative min-h-[62vh] overflow-hidden bg-sand lg:order-2 lg:min-h-[100svh]">
          <div
            className="absolute inset-[-5%]"
            style={{ transform: "translate3d(calc(var(--mx) * 12px), calc(var(--sy) * 0.055px), 0)" }}
          >
            <img
              src={image}
              alt="Featured work by Mara's Photography"
              className="hero-photo h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/10 via-40% to-ink/35" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cream/20 to-transparent" />

          <figure
            className="hero-fade absolute bottom-5 left-4 w-[44%] max-w-[230px] bg-cream p-2 shadow-luxe sm:left-8 sm:bottom-8"
            style={{ animationDelay: "1000ms" }}
          >
            <img src={insetImage} alt="" className="aspect-[4/5] w-full object-cover" />
            <figcaption className="mt-2 px-1 pb-1 text-[7px] uppercase tracking-[0.24em] text-smoke">
              Nº 01 — Sydney
            </figcaption>
          </figure>

          <span className="absolute right-5 top-1/2 hidden -translate-y-1/2 rotate-90 text-[8px] uppercase tracking-[0.5em] text-cream/75 lg:block">
            Mara&apos;s Photography — Sydney
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-ink/10" />
    </section>
  );
}
