import { marquee } from "@/data/resume";

export default function Marquee() {
  const row = [...marquee, ...marquee];

  return (
    <div className="relative overflow-hidden border-y border-cyan/10 py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-void to-transparent" />
      <div className="flex w-max animate-marquee gap-10">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-mono text-xs uppercase tracking-[0.3em] text-ink/40"
          >
            {item}
            <span className="h-1 w-1 rounded-full bg-cyan/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
