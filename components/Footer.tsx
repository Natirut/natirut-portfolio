import { Mail, Phone, MapPin } from "lucide-react";
import { profile } from "@/data/resume";

export default function Footer() {
  return (
    <footer id="contact" className="mx-auto max-w-5xl px-6 pb-16">
      <div className="glass rounded-3xl p-10 text-center">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Let&apos;s work together
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-foreground/60">
          Open to new opportunities in software development, systems analysis
          and business process automation.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href={`mailto:${profile.contact.email}`}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 transition-colors hover:border-accent hover:text-accent"
          >
            <Mail size={16} /> {profile.contact.email}
          </a>
          <a
            href={`tel:${profile.contact.phone.replace(/-/g, "")}`}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 transition-colors hover:border-accent hover:text-accent"
          >
            <Phone size={16} /> {profile.contact.phone}
          </a>
          <span className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-foreground/60">
            <MapPin size={16} /> {profile.location}
          </span>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-foreground/30">
        © {new Date().getFullYear()} {profile.name}. Built with Next.js &amp;
        Three.js.
      </p>
    </footer>
  );
}
