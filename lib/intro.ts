/**
 * Coordinates the opening sequence between the DOM preloader and the WebGL
 * hero: the preloader waits for the helmet model, then starts the clock the
 * hero uses for its materialise animation.
 */
export const intro = { startedAt: -1, modelReady: false };

export function startIntro() {
  if (intro.startedAt >= 0) return;
  intro.startedAt = performance.now();
  window.dispatchEvent(new Event("intro-start"));
}

/** Seconds since the intro started, or -1 before it has. */
export function introTime() {
  return intro.startedAt < 0 ? -1 : (performance.now() - intro.startedAt) / 1000;
}

export function markModelReady() {
  if (intro.modelReady) return;
  intro.modelReady = true;
  window.dispatchEvent(new Event("helmet-ready"));
}
