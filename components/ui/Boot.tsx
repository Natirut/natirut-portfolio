"use client";

import { useEffect, useState } from "react";

const LINES = [
  "> ESTABLISHING SECURE UPLINK ......... OK",
  "> MOUNTING NEURAL MODULES ............ OK",
  "> DECRYPTING PROFILE DATA ............ OK",
  "> IDENTITY CONFIRMED: NATIRUT DUANGPAK",
  "> CLEARANCE: SENIOR PROGRAMMER",
  "> ALL SYSTEMS ONLINE",
];

const CHAR_MS = 12;
const LINE_PAUSE = 90;

export default function Boot() {
  const [typed, setTyped] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) {
      setHidden(true);
      return;
    }

    document.body.style.overflow = "hidden";
    let line = 0;
    let char = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (cancelled) return;
      if (line >= LINES.length) {
        setDone(true);
        timer = setTimeout(() => setHidden(true), 620);
        return;
      }
      char++;
      const current = LINES[line].slice(0, char);
      setTyped((prev) => {
        const next = [...prev];
        next[line] = current;
        return next;
      });

      if (char >= LINES[line].length) {
        line++;
        char = 0;
        timer = setTimeout(step, LINE_PAUSE);
      } else {
        timer = setTimeout(step, CHAR_MS);
      }
    };

    timer = setTimeout(step, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (hidden) document.body.style.overflow = "";
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-void px-6 transition-opacity duration-500 ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="scanlines pointer-events-none absolute inset-0 opacity-30" />
      <div className="w-full max-w-lg font-mono text-[11px] leading-relaxed text-cyan sm:text-xs">
        {typed.map((line, i) => (
          <p key={i} className="whitespace-pre">
            {line}
            {i === typed.length - 1 && !done && (
              <span className="animate-blink">▌</span>
            )}
          </p>
        ))}
      </div>
      <div className="mt-6 h-[2px] w-full max-w-lg overflow-hidden bg-cyan/10">
        <div
          className="h-full bg-gradient-to-r from-cyan via-violet to-magenta transition-[width] duration-200"
          style={{ width: `${(typed.length / LINES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
