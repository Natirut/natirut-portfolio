import type { ReactNode } from "react";
import Reveal from "./Reveal";

export default function Section({
  id,
  index,
  title,
  eyebrow,
  children,
}: {
  id: string;
  index: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <Reveal variant="up">
        <div className="mb-3 flex items-center gap-4">
          <span className="font-mono text-[11px] tracking-[0.3em] text-cyan/70">
            [ {index} ]
          </span>
          <span className="hairline h-px flex-1" />
          {eyebrow && (
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/35">
              {eyebrow}
            </span>
          )}
        </div>
        <h2 className="mb-12 font-display text-3xl font-bold uppercase tracking-tight text-ink sm:text-5xl">
          <span className="grad-text">{title}</span>
        </h2>
      </Reveal>
      {children}
    </section>
  );
}
