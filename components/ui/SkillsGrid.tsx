import Reveal from "./Reveal";
import { skills } from "@/data/resume";

export default function SkillsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skills.map((group, i) => (
        <Reveal key={group.group} variant="up" delay={i * 90}>
          <div className="plate group h-full rounded-2xl p-6 transition-transform duration-700 hover:-translate-y-1">
            <div className="flex items-baseline justify-between gap-3 border-b border-line/20 pb-4">
              <h3 className="font-display text-[1.7rem] leading-tight">{group.group}</h3>
              <span className="eyebrow text-fg/45">M-{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line/25 px-3 py-1.5 text-[13px] text-fg/85 transition-colors duration-300 hover:border-accent hover:text-accent"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
