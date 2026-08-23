import type { ReactNode } from "react";

export default function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-6 py-24">
      {eyebrow && (
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mb-12 text-3xl font-bold text-foreground sm:text-4xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
