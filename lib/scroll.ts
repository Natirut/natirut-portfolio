/**
 * A tiny scroll store shared between the WebGL scene (which reads it every
 * frame, outside React) and the HUD (which subscribes to it as React state).
 */
export const scrollState = { progress: 0, velocity: 0 };

type Sub = (progress: number) => void;
const subs = new Set<Sub>();

export function subscribeScroll(fn: Sub) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function publishScroll(progress: number) {
  scrollState.velocity = progress - scrollState.progress;
  scrollState.progress = progress;
  subs.forEach((fn) => fn(progress));
}

export const damp = (
  current: number,
  target: number,
  lambda: number,
  dt: number
) => current + (target - current) * (1 - Math.exp(-lambda * dt));
