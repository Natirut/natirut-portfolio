"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { CHAPTER_TONE, subscribeScroll } from "@/lib/scroll";

const links = [
  { href: "#about", label: "Profile" },
  { href: "#experience", label: "Work" },
  { href: "#skills", label: "Toolkit" },
  { href: "#education", label: "Record" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<"dark" | "light">("dark");
  const [active, setActive] = useState(0);

  useEffect(
    () =>
      subscribeScroll((s) => {
        const i = Math.min(CHAPTER_TONE.length - 1, Math.round(s.chapter));
        setTone(CHAPTER_TONE[i]);
        setActive(i);
      }),
    []
  );

  return (
    <header className={`fixed inset-x-0 top-0 z-40 max-md:bg-gradient-to-b max-md:from-panel/80 max-md:to-transparent ${tone === "light" ? "tone-light" : "tone-dark"}`}>
      <nav className="flex h-[68px] items-center justify-between px-9 text-fg transition-colors duration-700 sm:px-14">
        <a href="#top" className="group flex items-center gap-3">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-fg/60">
            <span className="h-1.5 w-1.5 rounded-full bg-fg transition-transform duration-500 group-hover:scale-[2.2]" />
          </span>
          <span className="font-display text-xl leading-none">
            Natirut <span className="italic">D.</span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l, i) => (
            <li key={l.href}>
              <a href={l.href} className="eyebrow group flex items-center gap-2 text-fg/70 transition-colors hover:text-fg">
                <span className={`h-1 w-1 rounded-full bg-fg transition-opacity ${active === i + 1 ? "opacity-100" : "opacity-0"}`} />
                <span className="text-fg/40">0{i + 1}</span>
                <span className="link-draw">{l.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <a href="#contact" className="btn-solid hidden !py-2.5 md:inline-flex">
          Get in touch <ArrowUpRight size={14} />
        </a>

        <button
          className="text-fg md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="tone-dark mx-5 rounded-2xl bg-navy/90 p-3 backdrop-blur-xl md:hidden">
          {[...links, { href: "#contact", label: "Contact" }].map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline gap-4 rounded-xl px-4 py-3 text-white hover:bg-white/10"
            >
              <span className="eyebrow text-white/40">0{i + 1}</span>
              <span className="font-display text-2xl">{l.label}</span>
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
