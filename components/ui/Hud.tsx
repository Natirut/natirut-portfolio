"use client";

import { useEffect, useState } from "react";
import { CHAPTER_COUNT, CHAPTER_TONE, subscribeScroll } from "@/lib/scroll";

const NAMES = ["The Sky", "The Mind", "The Work", "The Toolkit", "The Record", "The Reach"];

/**
 * Fixed chrome in the spirit of the reference: hairline guides, crosshair
 * marks, a chapter counter and a progress rail. It also owns the legibility
 * scrim (painted between the canvas and the copy), crossfading between a dark
 * and a light wash per chapter.
 */
export default function Hud() {
  const [chapter, setChapter] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(
    () =>
      subscribeScroll((s) => {
        // quantise so React only re-renders when something visible changes
        setChapter(Math.round(s.chapter * 200) / 200);
        setProgress(Math.round(s.progress * 500) / 500);
      }),
    []
  );

  const current = Math.min(CHAPTER_COUNT - 1, Math.round(chapter));
  const tone = CHAPTER_TONE[current];
  // fade the scrim out mid-dive so the transition reads full-bleed
  const f = chapter - Math.floor(chapter);
  const diving = f > 0.3 && f < 0.85 ? Math.sin(((f - 0.3) / 0.55) * Math.PI) : 0;
  const scrim = 1 - diving * 0.9;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden>
        <div
          className="scrim-dark absolute inset-0 transition-opacity duration-700"
          style={{ opacity: tone === "dark" ? scrim : 0 }}
        />
        <div
          className="scrim-light absolute inset-0 transition-opacity duration-700"
          style={{ opacity: tone === "light" ? scrim : 0 }}
        />
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-20 ${tone === "light" ? "tone-light" : "tone-dark"}`}
        aria-hidden
      >
        <div className="text-fg transition-colors duration-700">
          {/* guides */}
          <span className="hair absolute bottom-0 left-5 top-0 w-px sm:left-8" />
          <span className="hair absolute bottom-0 right-5 top-0 w-px sm:right-8" />
          <span className="hair absolute left-0 right-0 top-[68px] h-px" />
          <span className="hair absolute bottom-[52px] left-0 right-0 hidden h-px md:block" />

          {/* crosshairs at the guide intersections */}
          {[
            "left-5 top-[68px] sm:left-8",
            "right-5 top-[68px] sm:right-8",
            "left-5 bottom-[52px] hidden md:block sm:left-8",
            "right-5 bottom-[52px] hidden md:block sm:right-8",
          ].map((pos) => (
            <span key={pos} className={`absolute ${pos} -translate-x-1/2 translate-y-[-50%]`}>
              <span className="absolute left-1/2 top-1/2 h-[11px] w-px -translate-x-1/2 -translate-y-1/2 bg-fg/70" />
              <span className="absolute left-1/2 top-1/2 h-px w-[11px] -translate-x-1/2 -translate-y-1/2 bg-fg/70" />
            </span>
          ))}

          {/* chapter counter */}
          <div className="absolute bottom-[18px] left-10 hidden items-center gap-4 md:flex sm:left-14">
            <span className="eyebrow text-fg/85">
              {String(current + 1).padStart(2, "0")} / {String(CHAPTER_COUNT).padStart(2, "0")}
            </span>
            <span className="h-px w-8 bg-fg/40" />
            <span className="overflow-hidden">
              <span key={current} className="eyebrow block animate-rise text-fg/60">
                {NAMES[current]}
              </span>
            </span>
          </div>

          {/* progress rail */}
          <div className="absolute bottom-[22px] right-10 hidden items-center gap-4 md:flex sm:right-14">
            <span className="eyebrow text-fg/60">Scroll</span>
            <span className="relative h-px w-28 bg-fg/20">
              <span className="absolute inset-y-0 left-0 bg-fg" style={{ width: `${progress * 100}%` }} />
            </span>
            <span className="eyebrow w-9 text-right text-fg/85">
              {String(Math.round(progress * 100)).padStart(3, "0")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
