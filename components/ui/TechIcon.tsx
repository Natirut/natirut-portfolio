import { Cloud, Layers, type LucideIcon } from "lucide-react";
import { TECH_ICONS } from "./techIcons";

/** Entries without a brand mark get a neutral glyph in a matching hue. */
const GENERIC: Record<string, { icon: LucideIcon; color: string }> = {
  "Cloud Essential": { icon: Cloud, color: "#2a86d8" },
};

export default function TechIcon({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "h-6 w-6 rounded-md p-[3px]", md: "h-8 w-8 rounded-lg p-[5px]", lg: "h-10 w-10 rounded-xl p-[6px]" }[size];
  const tile = `inline-flex flex-none items-center justify-center bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.45)] ring-1 ring-black/5 ${box} ${className}`;

  const brand = TECH_ICONS[name];
  if (brand) {
    return (
      <span
        aria-hidden
        className={`${tile} [&>svg]:h-full [&>svg]:w-full`}
        dangerouslySetInnerHTML={{ __html: brand.svg }}
      />
    );
  }

  const generic = GENERIC[name];
  const Icon = generic?.icon ?? Layers;
  return (
    <span aria-hidden className={tile}>
      <Icon className="h-full w-full" strokeWidth={2} color={generic?.color ?? "#0c1a30"} />
    </span>
  );
}
