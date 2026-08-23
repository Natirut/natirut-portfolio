import { Mail, Phone, ArrowDown } from "lucide-react";
import { profile } from "@/data/resume";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <p className="mb-4 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-accent">
        Portfolio
      </p>
      <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-6xl">
        {profile.name}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/70 sm:text-xl">
        {profile.title}
      </p>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-foreground/60 sm:text-base">
        {profile.summary}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <a
          href={`mailto:${profile.contact.email}`}
          className="glass flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-foreground transition-transform hover:scale-105"
        >
          <Mail size={16} /> {profile.contact.email}
        </a>
        <a
          href={`tel:${profile.contact.phone.replace(/-/g, "")}`}
          className="glass flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-foreground transition-transform hover:scale-105"
        >
          <Phone size={16} /> {profile.contact.phone}
        </a>
      </div>
      <a
        href="#about"
        className="absolute bottom-10 flex flex-col items-center gap-2 text-foreground/40 transition-colors hover:text-accent"
        aria-label="Scroll down"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <ArrowDown size={18} className="animate-bounce" />
      </a>
    </section>
  );
}
