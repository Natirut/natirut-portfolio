import { Building2, ChevronRight } from "lucide-react";
import Reveal from "./Reveal";
import HoloCard from "./HoloCard";
import { experience } from "@/data/resume";

export default function Timeline() {
  return (
    <div className="relative space-y-8 pl-6 sm:pl-10">
      {/* spine */}
      <span className="absolute left-0 top-2 h-full w-px bg-gradient-to-b from-cyan via-violet to-transparent sm:left-3" />

      {experience.map((job, i) => (
        <Reveal key={job.company} variant="right" delay={i * 120}>
          <div className="relative">
            <span className="absolute -left-6 top-7 h-3 w-3 -translate-x-1/2 rounded-full border border-cyan bg-void shadow-[0_0_14px_2px_rgba(0,217,255,0.8)] sm:-left-7" />
            <span className="absolute -left-6 top-7 h-3 w-3 -translate-x-1/2 animate-pulseRing rounded-full border border-cyan sm:-left-7" />

            <HoloCard className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/5 text-cyan">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-ink">
                      {job.role}
                    </h3>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan/70">
                      {job.company}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-md border border-white/10 px-3 py-1 font-mono text-[10px] tracking-[0.15em] text-ink/50">
                    {job.period}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/80">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    {job.status}
                  </span>
                </div>
              </div>

              <ul className="mt-7 space-y-3">
                {job.highlights.map((h) => (
                  <li
                    key={h}
                    className="group flex gap-3 text-sm leading-relaxed text-ink/65"
                  >
                    <ChevronRight
                      size={15}
                      className="mt-0.5 flex-none text-cyan/50 transition-transform group-hover:translate-x-1"
                    />
                    {h}
                  </li>
                ))}
              </ul>
            </HoloCard>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
