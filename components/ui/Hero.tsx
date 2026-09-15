import { ArrowDown, ArrowUpRight } from "lucide-react";
import { profile } from "@/data/resume";

/** Chapter 00 — editorial title card over the android in the sky. */
export default function Hero() {
  return (
    <section
      id="top"
      className="tone-dark relative flex min-h-[100svh] flex-col justify-end px-9 pb-24 pt-28 text-fg sm:px-14 md:justify-center md:pb-28"
    >
      <div className="max-w-[40rem]">
        <p className="overflow-hidden">
          <span className="eyebrow block animate-rise text-fg/80 [animation-delay:1.9s]">
            <span className="mr-3 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-signal shadow-[0_0_12px_2px_rgba(143,248,255,0.8)]" />
            {profile.roles[0]} — {profile.location}
          </span>
        </p>

        <h1 className="text-shadow-soft mt-6 font-display text-[clamp(3.4rem,9vw,8.2rem)] leading-[0.9] tracking-[-0.02em]">
          <span className="block overflow-hidden pb-2">
            <span className="block animate-rise [animation-delay:2.0s]">Natirut</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span className="block animate-rise italic [animation-delay:2.1s]">Duangpak.</span>
          </span>
        </h1>

        <p className="overflow-hidden">
          <span className="text-shadow-soft mt-5 block animate-rise font-display text-[clamp(1.35rem,2.4vw,2rem)] leading-snug text-fg/90 [animation-delay:2.25s]">
            I build the software a factory thinks with.
          </span>
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3 animate-rise [animation-delay:2.4s]">
          <a href="#about" className="btn-solid">
            Read the profile <ArrowDown size={14} />
          </a>
          <a href={`mailto:${profile.contact.email}`} className="btn-ghost">
            Email me <ArrowUpRight size={14} />
          </a>
        </div>
      </div>

      <div className="mt-14 grid max-w-[40rem] gap-6 border-t border-line/25 pt-6 sm:grid-cols-[auto_1fr] sm:gap-10">
        <p className="eyebrow text-fg/60">(00) Summary</p>
        <p className="text-[14px] leading-relaxed text-fg/80">{profile.summary}</p>
      </div>

      <a
        href="#about"
        aria-label="Scroll to profile"
        className="absolute bottom-20 right-10 hidden flex-col items-center gap-3 text-fg/70 md:flex sm:right-16"
      >
        <span className="eyebrow [writing-mode:vertical-rl]">Scroll to dive</span>
        <ArrowDown size={14} className="animate-nudge" />
      </a>
    </section>
  );
}
