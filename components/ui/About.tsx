import { MapPin } from "lucide-react";
import Reveal from "./Reveal";
import Counter from "./Counter";
import { profile, stats, softSkills } from "@/data/resume";

export default function About() {
  return (
    <div className="space-y-8">
      <Reveal variant="up" delay={80}>
        <p className="text-shadow-soft text-[clamp(1.15rem,1.7vw,1.4rem)] font-medium leading-[1.45] tracking-[-0.02em] text-fg/95">
          Six years turning factory processes into dependable software — from{" "}
          <span className="text-gradient">requirements</span> to <span className="text-gradient">databases</span>{" "}
          to the people who use them every day.
        </p>
      </Reveal>

      <Reveal variant="up" delay={160}>
        <div className="plate rounded-2xl p-6 sm:p-7">
          <p className="text-[14.5px] leading-relaxed text-fg/80">{profile.summary}</p>
          <div className="mt-5 flex items-center gap-2 text-fg/60">
            <MapPin size={13} />
            <span className="eyebrow">{profile.location}</span>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 border-t border-line/25 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} variant="up" delay={220 + i * 80}>
            <div className={`pt-5 ${i > 0 ? "sm:border-l sm:border-line/20 sm:pl-5" : ""} pb-2`}>
              <p className="font-display text-[2.6rem] font-semibold leading-none tracking-[-0.05em] tabular-nums">
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={"decimals" in stat ? (stat.decimals as number) : 0}
                />
              </p>
              <p className="eyebrow mt-3 text-fg/60">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal variant="up" delay={500}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="eyebrow text-fg/50">Core</span>
          {softSkills.map((s) => (
            <span key={s} className="flex items-center gap-2 text-[14px] text-fg/85">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {s}
            </span>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
