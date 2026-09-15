import Reveal from "./Reveal";
import { education, certifications, languages } from "@/data/resume";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-line/25 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
      <p className="eyebrow pt-1 text-fg/55">{label}</p>
      <div>{children}</div>
    </div>
  );
}

export default function Credentials() {
  return (
    <div className="plate rounded-2xl px-6 sm:px-8">
      <Reveal variant="up">
        <div className="border-t-0 [&>div]:border-t-0">
          <Row label="Education">
            {education.map((e) => (
              <div key={e.school}>
                <p className="font-display text-[1.9rem] leading-tight">{e.degree}</p>
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
        <Row label="Certified">
          <ul className="space-y-3">
            {certifications.map((c, i) => (
              <li key={c} className="flex items-baseline gap-4">
                <span className="eyebrow text-fg/40">C-{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-[1.5rem] leading-tight">{c}</span>
              </li>
            ))}
          </ul>
        </Row>
      </Reveal>

      <Reveal variant="up" delay={180}>
        <Row label="Languages">
          {languages.map((l) => (
            <div key={l.name}>
              <p className="flex items-baseline gap-3">
                <span className="font-display text-[1.5rem]">{l.name}</span>
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
