import Reveal from "./Reveal";
import { experience } from "@/data/resume";

export default function Timeline() {
  return (
    <div className="space-y-6">
      {experience.map((job) => (
        <div key={job.company}>
          <Reveal variant="up">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line/25 pb-5">
              <div>
                <h3 className="text-shadow-soft font-display text-[clamp(2rem,3vw,2.6rem)] leading-none">{job.role}</h3>
                <p className="eyebrow mt-3 text-fg/70">{job.company}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="eyebrow text-fg/80">{job.period}</span>
                <span className="eyebrow flex items-center gap-2 text-fg/60">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
                  </span>
                  {job.status}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal variant="up" delay={120}>
            <ol className="plate mt-6 divide-y divide-line/15 rounded-2xl px-6 sm:px-7">
              {job.highlights.map((h, i) => (
                <li key={h} className="group flex gap-5 py-4 text-[14.5px] leading-relaxed text-fg/85">
                  <span className="eyebrow mt-[5px] w-6 flex-none text-fg/45 transition-colors group-hover:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="transition-transform duration-500 group-hover:translate-x-1">{h}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      ))}
    </div>
  );
}
