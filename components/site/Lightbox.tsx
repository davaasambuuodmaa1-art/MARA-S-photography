"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toggleLikeAction } from "@/app/actions/galleries";
import { sizedImage } from "@/lib/img";
import { cn } from "@/lib/utils";
import { useSiteLocale } from "@/lib/use-site-locale";

export interface LightboxImage {
  id: string;
  url: string;
  title: string;
  description?: string;
  likes?: number;
  liked?: boolean;
}

export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
  categoryName,
  watermark,
  downloadsEnabled,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  categoryName: string;
  watermark: boolean;
  downloadsEnabled: boolean;
}) {
  const mn = useSiteLocale() === "mn";
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = images[index];
  const touchStart = useRef<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      const next = (index + delta + images.length) % images.length;
      onIndexChange(next);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

  useEffect(() => {
    setLikes((prev) => ({
      ...prev,
      [current.id]: prev[current.id] ?? { count: current.likes ?? 0, liked: Boolean(current.liked) },
    }));
  }, [current]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const like = async () => {
    const state = likes[current.id] ?? { count: 0, liked: false };
    setLikes((prev) => ({
      ...prev,
      [current.id]: { count: state.count + (state.liked ? -1 : 1), liked: !state.liked },
    }));
    const result = await toggleLikeAction(current.id);
    if (result.ok) {
      setLikes((prev) => ({ ...prev, [current.id]: { count: result.count, liked: result.liked } }));
    } else {
      setLikes((prev) => ({ ...prev, [current.id]: state }));
      setToast(result.error);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/work?image=${current.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${current.title} — ${categoryName}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast(mn ? "Холбоос хууллаа" : "Link copied to clipboard");
      }
    } catch {
      setToast(mn ? "Зургийг хуваалцаж чадсангүй" : "Could not share this image");
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const source = sizedImage(current.url, 2400);
      const response = await fetch(source, { mode: "cors" });
      const blob = await response.blob();
      let output: Blob = blob;
      if (watermark) {
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0);
          const size = Math.max(28, Math.round(bitmap.width / 26));
          ctx.font = `600 ${size}px Jost, sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.42)";
          ctx.textAlign = "center";
          const text = "MARA'S PHOTOGRAPHY";
          for (let y = bitmap.height * 0.2; y < bitmap.height; y += bitmap.height * 0.22) {
            ctx.save();
            ctx.translate(bitmap.width / 2, y);
            ctx.rotate(-Math.PI / 8);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
          output = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b ?? blob), "image/jpeg", 0.92),
          );
        }
      }
      const href = URL.createObjectURL(output);
      const anchor = document.createElement("a");
      const name = `${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(index + 1).padStart(2, "0")}.jpg`;
      anchor.href = href;
      anchor.download = name;
      anchor.click();
      URL.revokeObjectURL(href);
      setToast(watermark ? (mn ? "Усны тэмдэгтэй татлаа" : "Downloaded with watermark") : (mn ? "Татаж эхэллээ" : "Download started"));
    } catch {
      setToast(mn ? "Татаж чадсангүй — дахин оролдоно уу" : "Download failed — try again");
    } finally {
      setBusy(false);
    }
  };

  const state = likes[current.id] ?? { count: current.likes ?? 0, liked: Boolean(current.liked) };

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-ink/97 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={mn ? `${current.title} — бүтэн дэлгэцээр харах` : `${current.title} — full screen preview`}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 60) step(delta > 0 ? -1 : 1);
        touchStart.current = null;
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 text-cream/70 sm:px-8">
        <div className="flex items-baseline gap-3">
          <span className="text-[10px] tracking-[0.28em]">{String(index + 1).padStart(2, "0")}</span>
          <span className="text-[10px] tracking-[0.28em] text-cream/35">/ {String(images.length).padStart(2, "0")}</span>
          <span className="ml-4 hidden font-serif text-lg italic text-cream/80 sm:inline">{current.title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={mn ? "Хаах" : "Close"}
          className="flex h-10 w-10 items-center justify-center border border-cream/20 text-cream transition-colors hover:border-champagne hover:text-champagne"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-3 pb-4 sm:px-16">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={mn ? "Өмнөх зураг" : "Previous image"}
          className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center border border-cream/15 text-cream/70 transition-colors hover:border-champagne hover:text-champagne sm:left-6"
        >
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
            <path d="M17 5H1M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <div className="relative max-h-full">
          <img
            key={current.id}
            src={sizedImage(current.url, 2000)}
            alt={current.title}
            className="mx-auto max-h-[76vh] w-auto max-w-full select-none object-contain animate-fadeIn"
            draggable={false}
          />
          {watermark ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="-rotate-[24deg] font-sans text-[clamp(14px,2.2vw,30px)] font-medium uppercase tracking-[0.5em] text-white/20">
                Mara&apos;s Photography
              </span>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={mn ? "Дараагийн зураг" : "Next image"}
          className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center border border-cream/15 text-cream/70 transition-colors hover:border-champagne hover:text-champagne sm:right-6"
        >
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
            <path d="M1 5h16M13 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 px-5 py-4 sm:px-8">
        <div className="max-w-md">
          <p className="font-serif text-xl text-cream">{current.title}</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-cream/40">{categoryName}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={like}
            className={cn(
              "flex items-center gap-2 border px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors",
              state.liked
                ? "border-champagne text-champagne"
                : "border-cream/20 text-cream/70 hover:border-cream/60 hover:text-cream",
            )}
          >
            <svg width="13" height="12" viewBox="0 0 16 15" fill={state.liked ? "currentColor" : "none"} aria-hidden>
              <path d="M8 13.5S1 9.6 1 5.3A3.9 3.9 0 018 3.1a3.9 3.9 0 017 2.2c0 4.3-7 8.2-7 8.2z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {state.count}
          </button>
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-2 border border-cream/20 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-cream/70 transition-colors hover:border-cream/60 hover:text-cream"
          >
            {mn ? "Хуваалцах" : "Share"}
          </button>
          {downloadsEnabled ? (
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className="flex items-center gap-2 bg-cream px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-champagne disabled:opacity-60"
            >
              {busy ? (mn ? "Бэлтгэж байна…" : "Preparing…") : (mn ? "Татах" : "Download")}
            </button>
          ) : (
            <span className="border border-cream/10 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-cream/30">
              {mn ? "Татах боломжгүй" : "Downloads off"}
            </span>
          )}
        </div>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[95] -translate-x-1/2 bg-cream px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-ink shadow-luxe">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
