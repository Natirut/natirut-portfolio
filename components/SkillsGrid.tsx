import { Code2, Database, Cog } from "lucide-react";
import Reveal from "./Reveal";
import { skills } from "@/data/resume";

const icons: Record<string, React.ReactNode> = {
  Development: <Code2 size={18} />,
  Database: <Database size={18} />,
  Automation: <Cog size={18} />,
};

export default function SkillsGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {Object.entries(skills).map(([group, items], i) => (
        <Reveal key={group} delay={i * 100}>
          <div className="glass h-full rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2 text-accent">
              {icons[group]}
              <h3 className="font-semibold text-foreground">{group}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/80"
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
