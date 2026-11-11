"use client";

import { useEffect, useRef } from "react";

/**
 * A restrained two-part cursor: a fine dot that tracks the pointer exactly and a
 * ring that trails it. Grows over links and buttons. Disabled for touch input
 * and for visitors who ask for reduced motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const root = document.documentElement;
    root.dataset.cursor = "on";

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let frame = 0;
    let shown = false;

    const reveal = () => {
      if (shown) return;
      shown = true;
      if (ring.current) ring.current.style.opacity = "1";
      if (dot.current) dot.current.style.opacity = "1";
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      reveal();
      const element = event.target as HTMLElement | null;
      const hot = Boolean(element?.closest("a, button, [data-cursor]"));
      ring.current?.classList.toggle("is-hot", hot);
    };

    const onLeave = () => {
      shown = false;
      if (ring.current) ring.current.style.opacity = "0";
      if (dot.current) dot.current.style.opacity = "0";
    };

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.16;
      pos.y += (target.y - pos.y) * 0.16;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (dot.current) {
        dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      delete root.dataset.cursor;
    };
  }, []);

  return (
    <>
      <div ref={ring} aria-hidden className="cursor-ring" />
      <div ref={dot} aria-hidden className="cursor-dot" />
    </>
  );
}
