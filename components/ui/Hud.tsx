"use client";

import { useEffect, useState } from "react";
import { subscribeScroll } from "@/lib/scroll";

export default function Hud() {
  const [progress, setProgress] = useState(0);
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => subscribeScroll(setProgress), []);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", { hour12: false })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(progress * 100);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* film grain + scanlines */}
      <div className="scanlines absolute inset-0 opacity-[0.35] mix-blend-overlay" />
      <div className="absolute inset-x-0 top-0 h-px animate-sweep bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />

      {/* corner brackets */}
      <span className="absolute left-4 top-4 h-5 w-5 border-l border-t border-cyan/40" />
      <span className="absolute right-4 top-4 h-5 w-5 border-r border-t border-cyan/40" />
      <span className="absolute bottom-4 left-4 h-5 w-5 border-b border-l border-cyan/40" />
      <span className="absolute bottom-4 right-4 h-5 w-5 border-b border-r border-cyan/40" />

      {/* left rail */}
      <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 lg:block">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan/45"
          style={{ writingMode: "vertical-rl" }}
        >
          NATIRUT.DUANGPAK &nbsp;//&nbsp; AI.SYSTEMS.PORTFOLIO
        </p>
      </div>

      {/* right rail — scroll telemetry */}
      <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 items-center gap-3 lg:flex lg:flex-col">
        <span className="font-mono text-[10px] tracking-widest text-cyan/60">
          {String(pct).padStart(3, "0")}%
        </span>
        <div className="h-40 w-px bg-cyan/15">
          <div
            className="w-px bg-gradient-to-b from-cyan to-violet"
            style={{ height: `${pct}%` }}
          />
        </div>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan/35"
          style={{ writingMode: "vertical-rl" }}
        >
          SCROLL DEPTH
        </span>
      </div>

      {/* bottom telemetry bar */}
      <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between px-10 pb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan/35 md:flex">
        <span>LAT 14.05 N / LON 101.37 E — PRACHINBURI</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          LINK STABLE · {clock}
        </span>
      </div>
    </div>
  );
}
