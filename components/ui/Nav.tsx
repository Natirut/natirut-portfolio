"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#about", label: "About", id: "about" },
  { href: "#experience", label: "Experience", id: "experience" },
  { href: "#skills", label: "Skills", id: "skills" },
  { href: "#education", label: "Credentials", id: "education" },
  { href: "#contact", label: "Contact", id: "contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    links.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4">
      <nav className="glass bracket mx-auto mt-4 flex max-w-4xl items-center justify-between rounded-xl px-5 py-3">
        <a
          href="#top"
          className="font-display text-sm font-bold tracking-[0.2em] text-ink"
        >
          ND<span className="text-cyan">_</span>
        </a>

        <ul className="hidden gap-7 font-mono text-[11px] uppercase tracking-[0.18em] md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`relative transition-colors ${
                  active === l.id
                    ? "text-cyan"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {l.label}
                {active === l.id && (
                  <span className="absolute -bottom-1.5 left-0 h-px w-full bg-cyan shadow-[0_0_8px_rgba(0,217,255,0.9)]" />
                )}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="hidden rounded-md border border-cyan/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan transition-all hover:bg-cyan/10 hover:shadow-[0_0_18px_-4px_rgba(0,217,255,0.9)] md:block"
        >
          Connect
        </a>

        <button
          className="text-ink md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <ul className="glass mx-auto mt-2 max-w-4xl rounded-xl p-3 font-mono text-xs uppercase tracking-widest md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-ink/70 hover:bg-cyan/10 hover:text-cyan"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
