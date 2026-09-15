import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import { profile } from "@/data/resume";

export default function Contact() {
  return (
    <div className="space-y-10">
      <Reveal variant="up">
        <p className="text-shadow-soft max-w-md text-[16px] leading-relaxed text-fg/85">
          Open to new roles and collaborations in business software, data and automation.
          The fastest way to reach me is email.
        </p>
      </Reveal>

      <Reveal variant="up" delay={120}>
        <a
          href={`mailto:${profile.contact.email}`}
          className="group block border-y border-line/30 py-6"
        >
          <span className="eyebrow text-fg/55">Email</span>
          <span className="mt-3 flex items-center justify-between gap-4">
            <span className="text-shadow-soft break-all font-display text-[clamp(1.3rem,2.4vw,2.1rem)] font-semibold leading-tight tracking-[-0.04em]">
              <span className="link-draw">{profile.contact.email}</span>
            </span>
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-line/40 transition-all duration-500 group-hover:rotate-45 group-hover:bg-fg group-hover:text-navy">
              <ArrowUpRight size={18} />
            </span>
          </span>
        </a>
      </Reveal>

      <Reveal variant="up" delay={200}>
        <div className="grid gap-6 sm:grid-cols-2">
          <a href={`tel:${profile.contact.phone.replace(/-/g, "")}`} className="group">
            <span className="eyebrow text-fg/55">Phone</span>
            <span className="mt-2 block font-display text-[1.25rem] font-medium tracking-[-0.03em]">
              <span className="link-draw">{profile.contact.phone}</span>
            </span>
          </a>
          <div>
            <span className="eyebrow text-fg/55">Based in</span>
            <span className="mt-2 block font-display text-[1.25rem] font-medium tracking-[-0.03em]">{profile.location}</span>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
