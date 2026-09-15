import { Code2, Cog, Database, Sparkles, type LucideIcon } from "lucide-react";
import Reveal from "./Reveal";
import TechIcon from "./TechIcon";
import { skills } from "@/data/resume";

const GROUP_ICONS: Record<string, LucideIcon> = {
  code: Code2,
  database: Database,
  cog: Cog,
  sparkles: Sparkles,
};

export default function SkillsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skills.map((group, i) => {
        const GroupIcon = GROUP_ICONS[group.icon] ?? Code2;
        return (
          <Reveal key={group.group} variant="up" delay={i * 90}>
            <div className="plate group h-full rounded-2xl p-6 transition-transform duration-700 hover:-translate-y-1">
              <div className="flex items-center gap-3 border-b border-line/20 pb-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line/25 text-accent">
                  <GroupIcon size={16} />
                </span>
                <h3 className="font-display text-[1.2rem] font-semibold leading-tight tracking-[-0.03em]">{group.group}</h3>
                <span className="eyebrow ml-auto whitespace-nowrap text-fg/45">M-{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 rounded-full border border-line/20 bg-panel/20 py-1 pl-1 pr-3.5 text-[13px] font-medium text-fg/90 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/70"
                  >
                    <TechIcon name={item} size="sm" className="rounded-full" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
