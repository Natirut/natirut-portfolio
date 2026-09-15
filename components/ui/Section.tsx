import type { ReactNode } from "react";
import Reveal from "./Reveal";

/** A resting chapter: copy on the left, the 3D subject framed on the right. */
export default function Section({
  id,
  index,
  kicker,
  title,
  italic,
  tone = "dark",
  wide = false,
  children,
}: {
  id: string;
  index: string;
  kicker: string;
  title: string;
  italic?: string;
  tone?: "dark" | "light";
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${tone === "light" ? "tone-light" : "tone-dark"} relative flex min-h-[100svh] items-center px-9 py-28 text-fg sm:px-14`}
    >
      <div className={`w-full ${wide ? "lg:max-w-[52%]" : "lg:max-w-[46%]"}`}>
        <Reveal variant="up">
          <div className="mb-6 flex items-center gap-4">
            <span className="eyebrow text-fg/85">({index})</span>
            <span className="h-px w-10 bg-fg/40" />
            <span className="eyebrow text-fg/60">{kicker}</span>
          </div>
          <h2 className="text-shadow-soft mb-10 font-display text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.015em]">
            {title} {italic && <span className="italic">{italic}</span>}
          </h2>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
