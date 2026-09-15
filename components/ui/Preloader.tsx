"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/resume";

/** Serif counter over a halftone sky, then a curtain lift into the scene. */
export default function Preloader() {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGone(true);
      return;
    }
    const start = performance.now();
    const DURATION = 1700;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setLeaving(true);
        timer = setTimeout(() => setGone(true), 1100);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#0759c2] text-white transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
      style={{ clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }}
    >
      <div className="halftone absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#9fdcfa]/40" />

      <div className="absolute left-6 top-6 eyebrow text-white/70 sm:left-10 sm:top-8">
        {profile.name} — Resume
      </div>
      <div className="absolute right-6 top-6 eyebrow text-white/70 sm:right-10 sm:top-8">
        Initialising
      </div>

      <div className="absolute bottom-8 left-6 right-6 flex items-end justify-between sm:bottom-10 sm:left-10 sm:right-10">
        <p className="max-w-xs font-display text-2xl italic leading-tight text-white/85 sm:text-3xl">
          Warming up the machines.
        </p>
        <p className="font-display text-[26vw] leading-[0.8] tracking-tight sm:text-[16vw]">
          {String(count).padStart(3, "0")}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 h-[2px] bg-white/80" style={{ width: `${count}%` }} />
    </div>
  );
}
