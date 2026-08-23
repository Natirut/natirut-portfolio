import { GraduationCap, Award, Languages as LangIcon, BadgeCheck } from "lucide-react";
import Reveal from "./Reveal";
import HoloCard from "./HoloCard";
import { education, certifications, languages } from "@/data/resume";

export default function Credentials() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Reveal variant="left">
        <HoloCard className="h-full p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-3 text-cyan">
            <GraduationCap size={17} />
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink">
              Education
            </h3>
          </div>
          {education.map((e) => (
            <div key={e.school}>
              <p className="text-base font-medium text-ink">{e.degree}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan/70">
                {e.school}
              </p>
              <div className="mt-4 flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] text-ink/40">
                <span className="rounded border border-white/10 px-2 py-1">
                  {e.period}
                </span>
                <span className="rounded border border-cyan/25 bg-cyan/5 px-2 py-1 text-cyan">
                  {e.detail}
                </span>
              </div>
            </div>
          ))}
        </HoloCard>
      </Reveal>

      <Reveal variant="right" delay={100}>
        <HoloCard className="h-full p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-3 text-cyan">
            <LangIcon size={17} />
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink">
              Languages
            </h3>
          </div>
          {languages.map((l) => (
            <div key={l.name}>
              <div className="flex items-baseline gap-3">
                <p className="text-base font-medium text-ink">{l.name}</p>
                <span className="rounded border border-cyan/25 bg-cyan/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-cyan">
                  {l.level}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">
                {l.detail}
              </p>
            </div>
          ))}
        </HoloCard>
      </Reveal>

      <Reveal variant="up" delay={160} className="md:col-span-2">
        <HoloCard className="p-6 sm:p-7">
          <div className="mb-6 flex items-center gap-3 text-cyan">
            <Award size={17} />
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink">
              Certifications
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {certifications.map((c) => (
              <div
                key={c}
                className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3 transition-colors hover:border-cyan/35"
              >
                <BadgeCheck size={15} className="flex-none text-cyan" />
                <span className="text-sm text-ink/75">{c}</span>
              </div>
            ))}
          </div>
        </HoloCard>
      </Reveal>
    </div>
  );
}
