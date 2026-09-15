import type Lenis from "lenis";

/**
 * Shared scroll store. The DOM (Lenis) writes it; the WebGL director reads it
 * every frame outside React, and the HUD subscribes to it as React state.
 *
 * `chapter` is a continuous value: 2.0 means chapter 2 is resting on screen,
 * 2.5 means we are halfway through the dive from chapter 2 into chapter 3.
 */
export const CHAPTER_IDS = [
  "top",
  "about",
  "experience",
  "skills",
  "education",
  "contact",
] as const;

export const CHAPTER_COUNT = CHAPTER_IDS.length;

/** Text tone per chapter, so copy stays legible on bright and dark scenes. */
export const CHAPTER_TONE: ("dark" | "light")[] = [
  "dark",
  "dark",
  "dark",
  "light",
  "dark",
  "dark",
];

export const scrollState = { progress: 0, chapter: 0, velocity: 0 };

type Sub = (state: typeof scrollState) => void;
const subs = new Set<Sub>();

export function subscribeScroll(fn: Sub) {
  subs.add(fn);
  fn(scrollState);
  return () => {
    subs.delete(fn);
  };
}

export function publishScroll(progress: number, chapter: number, velocity: number) {
  scrollState.progress = progress;
  scrollState.chapter = chapter;
  scrollState.velocity = velocity;
  subs.forEach((fn) => fn(scrollState));
}

let lenisRef: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenisRef = l;
};

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisRef) lenisRef.scrollTo(el, { offset: 0, duration: 2.2 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const damp = (
  current: number,
  target: number,
  lambda: number,
  dt: number
) => current + (target - current) * (1 - Math.exp(-lambda * dt));
