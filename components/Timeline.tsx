import { Briefcase } from "lucide-react";
import Reveal from "./Reveal";
import { experience } from "@/data/resume";

export default function Timeline() {
  return (
    <div className="space-y-8">
      {experience.map((job, i) => (
        <Reveal key={job.company} delay={i * 100}>
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Briefcase size={18} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {job.role}
                  </h3>
                  <p className="text-sm text-foreground/60">{job.company}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-foreground/60">
                {job.period}
              </span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-foreground/70">
              {job.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-accent" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
