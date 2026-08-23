"use client";

import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    let raf = 0;
    let hot = false;

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest("a, button, [data-cursor]");
      if (interactive !== hot) {
        hot = interactive;
        ringRef.current?.style.setProperty(
          "--ring-scale",
          interactive ? "1.9" : "1"
        );
        ringRef.current?.style.setProperty(
          "--ring-alpha",
          interactive ? "1" : "0.5"
        );
      }
    };

    const loop = () => {
      ring.x += (mouse.x - ring.x) * 0.16;
      ring.y += (mouse.y - ring.y) * 0.16;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(var(--ring-scale, 1))`;
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
    <div className="pointer-events-none fixed inset-0 z-[100] hidden [@media(hover:hover)and(pointer:fine)]:block">
      <div
        ref={ringRef}
        className="absolute h-8 w-8 rounded-full border border-cyan transition-[opacity] duration-200"
        style={{ opacity: "var(--ring-alpha, 0.5)" }}
      />
      <div
        ref={dotRef}
        className="absolute h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_rgba(0,217,255,0.8)]"
      />
    </div>
  );
}
