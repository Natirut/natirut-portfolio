"use client";

import { useEffect, useRef } from "react";

/** Difference-blended reticle that inverts over whatever is beneath it. */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y, s: 1 };
    let target = 1;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const el = e.target as HTMLElement | null;
      target = el?.closest("a, button, [data-cursor]") ? 2.4 : 1;
    };

    const loop = () => {
      ring.x += (mouse.x - ring.x) * 0.14;
      ring.y += (mouse.y - ring.y) * 0.14;
      ring.s += (target - ring.s) * 0.12;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${ring.s})`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[150] hidden mix-blend-difference [@media(hover:hover)and(pointer:fine)]:block">
      <div ref={ringRef} className="absolute h-9 w-9 rounded-full border border-white/80" />
      <div ref={dotRef} className="absolute h-1 w-1 rounded-full bg-white" />
    </div>
  );
}
