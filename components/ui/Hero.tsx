"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Mail, Terminal } from "lucide-react";
import { profile } from "@/data/resume";

function useTypedRole(roles: string[]) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = roles[index % roles.length];
    const complete = !deleting && text === word;
    const cleared = deleting && text === "";

    let delay = deleting ? 35 : 65;
    if (complete) delay = 1800;
    if (cleared) delay = 220;

    const timer = setTimeout(() => {
      if (complete) return setDeleting(true);
      if (cleared) {
        setDeleting(false);
        return setIndex((i) => i + 1);
      }
      setText((prev) =>
        deleting ? word.slice(0, prev.length - 1) : word.slice(0, prev.length + 1)
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, index, roles]);

  return text;
}

export default function Hero() {
  const role = useTypedRole(profile.roles);

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
    >
      {/* soft radial scrim so the type stays readable over the core */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,5,12,0.82)_0%,rgba(4,5,12,0.45)_45%,transparent_72%)]" />

      <div className="relative flex flex-col items-center">
        <p className="chip mb-8 animate-floaty">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_2px_rgba(0,217,255,0.9)]" />
          System Online — Portfolio v2.0
        </p>

        <h1 className="font-display text-[clamp(2.6rem,11vw,7.5rem)] font-black uppercase leading-[0.88] tracking-tight">
          <span
            className="glitch block grad-text"
            data-text={profile.first}
          >
            {profile.first}
          </span>
          <span
            className="glitch block grad-text"
            data-text={profile.last}
          >
            {profile.last}
          </span>
        </h1>

        <div className="mt-6 flex h-7 items-center justify-center">
          <p className="font-mono text-sm uppercase tracking-[0.35em] text-cyan sm:text-base">
            {role}
            <span className="animate-blink">▌</span>
          </p>
        </div>

        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-ink/60 sm:text-base">
          {profile.summary}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#about"
            className="group relative overflow-hidden rounded-md border border-cyan/50 bg-cyan/5 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-cyan transition-all hover:shadow-[0_0_28px_-6px_rgba(0,217,255,1)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Terminal size={14} /> Access Profile
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </a>
          <a
            href={`mailto:${profile.contact.email}`}
            className="flex items-center gap-2 rounded-md border border-white/10 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/70 transition-all hover:border-magenta/50 hover:text-magenta"
          >
            <Mail size={14} /> Transmit
          </a>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-16 flex flex-col items-center gap-2 text-ink/30 transition-colors hover:text-cyan md:bottom-14"
        aria-label="Scroll to content"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.35em]">
          Scroll
        </span>
        <ChevronDown size={16} className="animate-bounce" />
      </a>
    </section>
  );
}
