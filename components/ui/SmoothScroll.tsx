"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { CHAPTER_IDS, publishScroll, setLenis } from "@/lib/scroll";

type Key = { y: number; g: number };

/**
 * Buttery wheel smoothing + the scroll → chapter mapping.
 *
 * Each chapter section gets two keys: when its top reaches 35% of the viewport
 * the chapter is fully arrived (g = i - 0.08), and when its bottom leaves 65%
 * it starts to lean toward the next dive (g = i + 0.25). The empty "dive"
 * spacers between sections carry g from i + 0.25 to i + 0.92, which is where
 * the camera plunges into the next scene.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.075,
      wheelMultiplier: 0.9,
      smoothWheel: !reduced,
    });
    setLenis(lenis);

    let keys: Key[] = [];

    const measure = () => {
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const next: Key[] = [];
      CHAPTER_IDS.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const bottom = top + el.offsetHeight;
        const start = i === 0 ? 0 : top - vh * 0.35;
        const end = Math.max(start + 1, bottom - vh * 0.65);
        next.push({ y: Math.min(start, max), g: i === 0 ? 0 : i - 0.08 });
        next.push({ y: Math.min(end, max), g: i + 0.25 });
      });
      // keep keys strictly increasing so interpolation never divides by zero
      for (let k = 1; k < next.length; k++) {
        if (next[k].y <= next[k - 1].y) next[k].y = next[k - 1].y + 0.5;
      }
      keys = next;
    };

    const chapterAt = (y: number) => {
      if (!keys.length) return 0;
      if (y <= keys[0].y) return keys[0].g;
      for (let k = 1; k < keys.length; k++) {
        if (y < keys[k].y) {
          const a = keys[k - 1];
          const b = keys[k];
          return a.g + ((y - a.y) / (b.y - a.y)) * (b.g - a.g);
        }
      }
      return keys[keys.length - 1].g;
    };

    lenis.on("scroll", (l: Lenis) => {
      publishScroll(l.progress || 0, chapterAt(l.scroll), l.velocity);
    });

    measure();
    publishScroll(0, chapterAt(window.scrollY), 0);

    const ro = new ResizeObserver(() => {
      measure();
      publishScroll(lenis.progress || 0, chapterAt(lenis.scroll), 0);
    });
    ro.observe(document.body);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // route in-page anchors through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { duration: 2.4 });
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("click", onClick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
