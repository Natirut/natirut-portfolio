import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import HoloCard from "./HoloCard";
import { profile } from "@/data/resume";

const channels = [
  {
    icon: Mail,
    label: "EMAIL",
    value: profile.contact.email,
    href: `mailto:${profile.contact.email}`,
  },
  {
    icon: Phone,
    label: "PHONE",
    value: profile.contact.phone,
    href: `tel:${profile.contact.phone.replace(/-/g, "")}`,
  },
  {
    icon: MapPin,
    label: "LOCATION",
    value: profile.location,
    href: null,
  },
];

export default function Contact() {
  return (
    <div className="space-y-5">
      <Reveal variant="up">
        <HoloCard className="overflow-hidden p-0">
          {/* terminal chrome */}
          <div className="flex items-center gap-2 border-b border-cyan/10 bg-white/[0.02] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-magenta/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
            <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">
              contact — bash — 80×24
            </span>
          </div>

          <div className="space-y-1.5 p-6 font-mono text-[12px] leading-relaxed sm:p-8 sm:text-[13px]">
            <p className="text-ink/45">
              <span className="text-cyan">visitor@portfolio</span>
              <span className="text-ink/30">:~$</span> whoami --contact
            </p>
            <p className="text-ink/75">name: {profile.name}</p>
            <p className="text-ink/75">role: {profile.title}</p>
            <p className="text-ink/75">status: open to opportunities</p>
            <p className="pt-3 text-ink/45">
              <span className="text-cyan">visitor@portfolio</span>
              <span className="text-ink/30">:~$</span>{" "}
              <span className="caret" />
            </p>
          </div>
        </HoloCard>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {channels.map((c, i) => {
          const Icon = c.icon;
          const inner = (
            <HoloCard className="group flex h-full items-center gap-4 p-5" tilt={9}>
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-cyan/25 bg-cyan/5 text-cyan">
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/35">
                  {c.label}
                </p>
                <p className="truncate text-[13px] text-ink/80">{c.value}</p>
              </div>
              {c.href && (
                <ArrowUpRight
                  size={15}
                  className="ml-auto flex-none text-ink/25 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan"
                />
              )}
            </HoloCard>
          );

          return (
            <Reveal key={c.label} variant="up" delay={i * 90}>
              {c.href ? (
                <a href={c.href} className="block h-full">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
