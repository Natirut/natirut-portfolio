import { Award, GraduationCap, Languages, type LucideIcon } from "lucide-react";
import Reveal from "./Reveal";
import TechIcon from "./TechIcon";
import { education, certifications, languages } from "@/data/resume";

function Row({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-line/25 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
      <p className="eyebrow flex items-center gap-2 pt-1 text-fg/55">
        <Icon size={13} className="text-accent" />
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

export default function Credentials() {
  return (
    <div className="plate rounded-2xl px-6 sm:px-8">
      <Reveal variant="up">
        <div className="border-t-0 [&>div]:border-t-0">
          <Row label="Education" icon={GraduationCap}>
            {education.map((e) => (
              <div key={e.school}>
                <p className="font-display text-[1.4rem] font-semibold leading-tight tracking-[-0.035em]">{e.degree}</p>
                <p className="mt-2 text-[14px] text-fg/75">{e.school}</p>
                <div className="mt-3 flex gap-4">
                  <span className="eyebrow text-fg/60">{e.period}</span>
                  <span className="eyebrow text-accent">{e.detail}</span>
                </div>
              </div>
            ))}
          </Row>
        </div>
      </Reveal>

      <Reveal variant="up" delay={100}>
        <Row label="Certified" icon={Award}>
          <ul className="space-y-3">
            {certifications.map((c, i) => (
              <li key={c} className="flex items-center gap-4">
                <TechIcon name={c} size="md" />
                <span className="font-display text-[1.1rem] font-medium leading-tight tracking-[-0.02em]">{c}</span>
                <span className="eyebrow ml-auto whitespace-nowrap text-fg/40">C-{String(i + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
        </Row>
      </Reveal>

      <Reveal variant="up" delay={180}>
        <Row label="Languages" icon={Languages}>
          {languages.map((l) => (
            <div key={l.name}>
              <p className="flex items-baseline gap-3">
                <span className="font-display text-[1.1rem] font-medium tracking-[-0.02em]">{l.name}</span>
                <span className="eyebrow text-accent">{l.level}</span>
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-fg/75">{l.detail}</p>
            </div>
          ))}
        </Row>
      </Reveal>
    </div>
  );
}
