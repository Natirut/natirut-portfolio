import { profile } from "@/data/resume";

export default function Footer() {
  return (
    <footer className="tone-dark relative px-9 pb-8 pt-10 text-fg sm:px-14">
      <div className="flex flex-col justify-between gap-3 border-t border-line/25 pt-5 sm:flex-row">
        <span className="eyebrow text-fg/60">
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="eyebrow text-fg/60">Next.js · Three.js · WebGL — every model built in code</span>
      </div>
    </footer>
  );
}
