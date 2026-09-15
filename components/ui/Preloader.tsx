"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data/resume";
import { intro, startIntro } from "@/lib/intro";

const MIN_MS = 1500;
const MAX_WAIT_MS = 9000;

/**
 * Serif counter over a halftone night sky. It holds at 90 until the helmet
 * model is decoded, then lifts like a curtain and starts the hero's
 * materialise sequence.
 */
export default function Preloader() {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      startIntro();
      setGone(true);
      return;
    }

    const start = performance.now();
    let ready = intro.modelReady;
    let shown = 0;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    const onReady = () => {
      ready = true;
    };
    window.addEventListener("helmet-ready", onReady);

    const tick = (now: number) => {
      const elapsed = now - start;
      const canFinish = (ready || elapsed > MAX_WAIT_MS) && elapsed > MIN_MS;
      const target = canFinish ? 100 : Math.min(90, (elapsed / MIN_MS) * 90);
      shown += (target - shown) * (canFinish ? 0.18 : 0.08);
      if (canFinish && shown > 99.5) shown = 100;
      setCount(Math.round(shown));
      if (shown < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setLeaving(true);
        startIntro();
        timer = setTimeout(() => setGone(true), 1100);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("helmet-ready", onReady);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#030b22] text-white transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
      style={{ clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }}
    >
      <div className="halftone absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(64,170,255,0.28),transparent_60%)]" />

      <div className="absolute left-6 top-6 eyebrow text-white/70 sm:left-10 sm:top-8">
        {profile.name} — Resume
      </div>
      <div className="absolute right-6 top-6 eyebrow flex items-center gap-2 text-white/70 sm:right-10 sm:top-8">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal shadow-[0_0_10px_2px_rgba(143,248,255,0.8)]" />
        {count < 90 ? "Initialising" : "Calibrating optics"}
      </div>

      <div className="absolute bottom-8 left-6 right-6 flex items-end justify-between sm:bottom-10 sm:left-10 sm:right-10">
        <p className="max-w-xs font-display text-xl font-medium leading-tight tracking-[-0.03em] text-white/85 sm:text-2xl">
          Waking the machine.
        </p>
        <p className="font-display text-[24vw] font-semibold leading-[0.8] tracking-[-0.06em] tabular-nums sm:text-[14vw]">
          {String(count).padStart(3, "0")}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 h-[2px] bg-signal/90 shadow-[0_0_12px_rgba(143,248,255,0.9)]" style={{ width: `${count}%` }} />
    </div>
  );
}
