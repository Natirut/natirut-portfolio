import { profile } from "@/data/resume";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-6 pb-14">
      <div className="hairline mb-6 h-px" />
      <div className="flex flex-col items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/30 sm:flex-row">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-cyan/60" />
          Built with Next.js · Three.js · WebGL
        </span>
      </div>
    </footer>
  );
}
