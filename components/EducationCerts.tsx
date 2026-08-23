import {
  GraduationCap,
  Award,
  Users,
  Languages as LanguagesIcon,
} from "lucide-react";
import Reveal from "./Reveal";
import { education, certifications, softSkills, languages } from "@/data/resume";

export default function EducationCerts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Reveal>
        <div className="glass h-full rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2 text-accent">
            <GraduationCap size={18} />
            <h3 className="font-semibold text-foreground">Education</h3>
          </div>
          {education.map((e) => (
            <div key={e.school}>
              <p className="font-medium text-foreground">{e.degree}</p>
              <p className="text-sm text-foreground/60">{e.school}</p>
              <p className="mt-1 text-xs text-foreground/50">
                {e.period} · {e.detail}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="glass h-full rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2 text-accent">
            <LanguagesIcon size={18} />
            <h3 className="font-semibold text-foreground">Languages</h3>
          </div>
          {languages.map((l) => (
            <div key={l.name}>
              <p className="font-medium text-foreground">
                {l.name} — {l.level}
              </p>
              <p className="mt-1 text-sm text-foreground/60">{l.detail}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={200}>
        <div className="glass h-full rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2 text-accent">
            <Award size={18} />
            <h3 className="font-semibold text-foreground">Certifications</h3>
          </div>
          <ul className="space-y-2 text-sm text-foreground/70">
            {certifications.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-2 h-1 w-1 flex-none rounded-full bg-accent" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={300}>
        <div className="glass h-full rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2 text-accent">
            <Users size={18} />
            <h3 className="font-semibold text-foreground">Soft Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {softSkills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/80"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
