import { Code2, Database, Cog, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import HoloCard from "./HoloCard";
import { skills } from "@/data/resume";

const icons: Record<string, React.ReactNode> = {
  code: <Code2 size={17} />,
  database: <Database size={17} />,
  cog: <Cog size={17} />,
  sparkles: <Sparkles size={17} />,
};

export default function SkillsGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {skills.map((group, i) => (
        <Reveal key={group.group} variant="scale" delay={i * 100}>
          <HoloCard className="h-full p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/5 text-cyan">
                {icons[group.icon]}
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-ink">
                {group.group}
              </h3>
              <span className="ml-auto font-mono text-[10px] text-ink/30">
                {String(group.items.length).padStart(2, "0")}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {group.items.map((item, j) => (
                <span
                  key={item}
                  style={{ transitionDelay: `${j * 40}ms` }}
                  className="rounded-md border border-cyan/15 bg-gradient-to-b from-white/[0.06] to-transparent px-3 py-1.5 font-mono text-[11px] text-ink/75 transition-all hover:-translate-y-0.5 hover:border-cyan/50 hover:text-cyan hover:shadow-[0_0_16px_-4px_rgba(0,217,255,0.9)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </HoloCard>
        </Reveal>
      ))}
    </div>
  );
}
