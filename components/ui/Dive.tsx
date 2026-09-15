"use client";

import { useEffect, useRef } from "react";
import { subscribeScroll } from "@/lib/scroll";

/**
 * The empty stretch between chapters where the camera plunges into the next
 * scene. A single serif line surfaces and dissolves as it passes the centre.
 */
export default function Dive({
  line,
  label,
  tone = "dark",
}: {
  line: string;
  label: string;
  /** "light" when the scene behind the line is bright (dark ink) */
  tone?: "dark" | "light";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribeScroll(() => {
        const el = ref.current;
        const text = textRef.current;
        if (!el || !text) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // -1 when the spacer's centre is at the bottom edge, +1 at the top edge
        const t = ((vh / 2 - (r.top + r.height / 2)) / (r.height / 2 + vh / 2)) * 1.6;
        const a = Math.max(0, 1 - Math.abs(t) * 1.25);
        const eased = a * a * (3 - 2 * a);
        text.style.opacity = String(eased);
        text.style.transform = `translate3d(0, ${-t * 40}px, 0) scale(${0.94 + eased * 0.06})`;
        text.style.filter = `blur(${(1 - eased) * 10}px)`;
        text.style.letterSpacing = `${(1 - eased) * 0.06}em`;
      }),
    []
  );

  return (
    <div ref={ref} className={`relative h-[115vh] ${tone === "light" ? "tone-light" : "tone-dark"}`}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center px-8">
        <div ref={textRef} className="text-center text-fg opacity-0 will-change-[opacity,transform,filter]">
          <p className="eyebrow mb-5 text-fg/75">{label}</p>
          <p className="text-shadow-soft font-display text-[clamp(2.4rem,6.5vw,6rem)] leading-[0.95]">
            {line}
          </p>
        </div>
      </div>
    </div>
  );
}
