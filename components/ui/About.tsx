import { MapPin } from "lucide-react";
import Reveal from "./Reveal";
import HoloCard from "./HoloCard";
import Counter from "./Counter";
import { profile, stats, softSkills } from "@/data/resume";

export default function About() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <Reveal variant="left">
        <HoloCard className="h-full p-7 sm:p-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan/60">
            {"// profile.summary"}
</p>
          <p className="mt-5 text-[15px] leading-relaxed text-ink/75">
            {profile.summary}
          </p>

          <div className="mt-7 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/40">
            <MapPin size={13} className="text-cyan" />
            {profile.location}
          </div>

          <div className="mt-7 border-t border-cyan/10 pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan/60">
              {"// core.competencies"}
</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {softSkills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-ink/70"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </HoloCard>
      </Reveal>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} variant="scale" delay={i * 90}>
            <HoloCard className="flex h-full flex-col justify-center p-5 text-center" tilt={10}>
              <p className="font-display text-3xl font-black text-cyan sm:text-4xl">
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={"decimals" in stat ? (stat.decimals as number) : 0}
                />
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-ink/45">
                {stat.label}
              </p>
            </HoloCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
