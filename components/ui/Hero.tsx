"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, MousePointer2, ScanLine } from "lucide-react";
import { profile } from "@/data/resume";
import { intro } from "@/lib/intro";

/** Chapter 00 — editorial title card beside the materialising helmet. */
export default function Hero() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (intro.startedAt >= 0) {
      setOn(true);
      return;
    }
    const start = () => setOn(true);
    window.addEventListener("intro-start", start);
    return () => window.removeEventListener("intro-start", start);
  }, []);

  // each line waits for the curtain, then rises in sequence with the build
  const rise = (delay: number) =>
    on ? { className: "animate-rise", style: { animationDelay: `${delay}s` } } : { className: "translate-y-[110%]", style: undefined };

  const line = (delay: number, extra = "") => {
    const r = rise(delay);
    return { className: `block ${r.className} ${extra}`, style: r.style };
  };

  return (
    <section
      id="top"
      className="tone-dark relative flex min-h-[100svh] flex-col justify-end px-9 pb-24 pt-28 text-fg sm:px-14 md:justify-center md:pb-28"
    >
      <div className="max-w-[40rem]">
        <p className="overflow-hidden">
          <span {...line(0.5, "eyebrow text-fg/80")}>
            <span className="mr-3 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-signal shadow-[0_0_12px_2px_rgba(143,248,255,0.8)]" />
            {profile.roles[0]} — {profile.location}
          </span>
        </p>

        <h1 className="text-shadow-soft mt-6 font-display text-[clamp(3rem,7vw,6.4rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
          <span className="block overflow-hidden pb-2">
            <span {...line(0.62)}>Natirut</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span {...line(0.74, "text-gradient pb-1")}>Duangpak.</span>
          </span>
        </h1>

        <p className="overflow-hidden">
          <span {...line(0.9, "text-shadow-soft mt-5 text-[clamp(1.1rem,1.8vw,1.45rem)] font-normal leading-snug tracking-[-0.02em] text-fg/80")}>
            I build the software a factory thinks with.
          </span>
        </p>

        <div className="overflow-hidden pb-2">
          <div {...line(1.05, "mt-10 flex flex-wrap items-center gap-3")}>
            <a href="#about" className="btn-solid">
              Read the profile <ArrowDown size={14} />
            </a>
            <a href={`mailto:${profile.contact.email}`} className="btn-ghost">
              Email me <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <div
          className={`mt-6 flex items-center gap-5 text-fg/60 transition-opacity delay-[2600ms] duration-1000 ${on ? "opacity-100" : "opacity-0"}`}
        >
          <span className="eyebrow flex items-center gap-2 [@media(hover:none)]:hidden">
            <MousePointer2 size={12} className="text-signal" /> Move to look
          </span>
          <span className="h-3 w-px bg-fg/25 [@media(hover:none)]:hidden" />
          <span className="eyebrow flex items-center gap-2">
            <ScanLine size={12} className="text-signal" />
            <span className="[@media(hover:none)]:hidden">Click to scan</span>
            <span className="hidden [@media(hover:none)]:inline">Tap to scan</span>
          </span>
        </div>
      </div>

      <div className="mt-12 grid max-w-[40rem] gap-6 border-t border-line/25 pt-6 sm:grid-cols-[auto_1fr] sm:gap-10">
        <p className="eyebrow text-fg/60">(00) Summary</p>
        <p className="text-[14px] leading-relaxed text-fg/80">{profile.summary}</p>
      </div>

      <a
        href="#about"
        aria-label="Scroll to profile"
        className="absolute bottom-20 right-10 hidden flex-col items-center gap-3 text-fg/70 md:flex sm:right-16"
      >
        <span className="eyebrow [writing-mode:vertical-rl]">Scroll to dive</span>
        <ArrowDown size={14} className="animate-nudge" />
      </a>
    </section>
  );
}
