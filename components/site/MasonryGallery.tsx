"use client";

import { useState } from "react";
import { Lightbox, type LightboxImage } from "./Lightbox";
import { sizedImage } from "@/lib/img";
import { cn } from "@/lib/utils";

export function MasonryGallery({
  images,
  categoryName,
  categorySlug,
  watermark,
  downloadsEnabled,
  likes,
  initialImageId,
}: {
  images: LightboxImage[];
  categoryName: string;
  categorySlug: string;
  watermark: boolean;
  downloadsEnabled: boolean;
  likes: Record<string, { count: number; liked: boolean }>;
  initialImageId?: string;
}) {
  const startIndex = initialImageId ? Math.max(0, images.findIndex((i) => i.id === initialImageId)) : -1;
  const [open, setOpen] = useState(startIndex >= 0);
  const [index, setIndex] = useState(startIndex >= 0 ? startIndex : 0);

  const enriched = images.map((image) => ({
    ...image,
    likes: likes[image.id]?.count ?? image.likes ?? 0,
    liked: likes[image.id]?.liked ?? image.liked ?? false,
  }));

  return (
    <>
      <div className="columns-2 gap-3 sm:gap-4 lg:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4">
        {enriched.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            className={cn(
              "group relative block w-full overflow-hidden bg-sand text-left",
              i % 7 === 0 ? "aspect-[3/4]" : i % 5 === 0 ? "aspect-square" : "aspect-[4/5]",
            )}
            aria-label={`Open ${image.title}`}
          >
            <img
              src={sizedImage(image.url, 900)}
              alt={image.title}
              loading={i < 4 ? "eager" : "lazy"}
              decoding="async"
              className="grade h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <span className="font-serif text-lg leading-tight text-cream">{image.title}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-cream/70">
                {String(i + 1).padStart(2, "0")}
              </span>
            </span>
          </button>
        ))}
      </div>

      {open ? (
        <Lightbox
          images={enriched}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setOpen(false)}
          categoryName={categoryName}
          watermark={watermark}
          downloadsEnabled={downloadsEnabled}
        />
      ) : null}
      <span className="hidden">{categorySlug}</span>
    </>
  );
}
