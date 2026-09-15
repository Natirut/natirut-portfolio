import * as THREE from "three";
import { CHAPTER_COUNT, clamp01 } from "@/lib/scroll";

/**
 * Per-frame state the director shares with every chapter scene.
 * Plain mutable object: read inside useFrame, never through React.
 */
export const stage = {
  /** smoothed chapter position (see lib/scroll) */
  g: 0,
  time: 0,
  /** smoothed pointer, -1..1 */
  px: 0,
  py: 0,
  aspect: 1,
  high: true,
  /** where each chapter's camera dives into (world space, that chapter's scene) */
  focus: Array.from({ length: CHAPTER_COUNT }, () => new THREE.Vector3()),
  /** the subject each chapter grows out of when it arrives */
  anchor: Array.from({ length: CHAPTER_COUNT }, () => new THREE.Vector3()),
};

export type ChapterProps = {
  index: number;
  camera: THREE.PerspectiveCamera;
};

/** Is chapter `index` close enough to the viewport to be worth animating? */
export const isActive = (index: number) => Math.abs(stage.g - index) < 1.25;

/**
 * Timeline helpers for one chapter.
 *  - `arrive`: 0 while far away, 1 once the chapter has settled.
 *  - `dive`:   0 at rest, 1 when the camera has plunged into the focus point.
 *  - `drift`:  small scalar that keeps moving while the chapter rests.
 */
export function chapterTimeline(index: number) {
  const u = stage.g - index;
  const a = clamp01((u + 0.78) / 0.78);
  const arrive = 1 - Math.pow(1 - a, 3);
  const d = clamp01((u - 0.26) / 0.54);
  const dive = d * d * d;
  return { u, arrive, dive, drift: Math.max(-0.1, Math.min(u, 0.3)) };
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

/**
 * Standard camera move: arrive from a pulled-back pose, rest with pointer
 * parallax, then accelerate into the focus point.
 */
export function rigCamera(
  camera: THREE.PerspectiveCamera,
  index: number,
  rest: THREE.Vector3,
  look: THREE.Vector3,
  opts: {
    from?: THREE.Vector3;
    parallax?: number;
    fov?: number;
    diveFov?: number;
  } = {}
) {
  const { arrive, dive } = chapterTimeline(index);
  const parallax = opts.parallax ?? 0.3;
  const focus = stage.focus[index];

  tmpA.copy(rest);
  if (opts.from) tmpA.lerp(opts.from, 1 - arrive);
  // portrait screens: back the camera off so the subject sits behind the copy, not on it
  if (stage.aspect < 1) tmpA.sub(look).multiplyScalar(1 + (1 - stage.aspect) * 1.1).add(look);
  tmpA.x += stage.px * parallax;
  tmpA.y += stage.py * parallax * 0.6;

  // dive: slide along the ray toward the focus, stopping just short of it
  tmpB.copy(focus).sub(tmpA).multiplyScalar(dive * 0.985);
  camera.position.copy(tmpA).add(tmpB);

  tmpB.copy(look).lerp(focus, Math.min(1, dive * 2.2));
  camera.lookAt(tmpB);

  const fov = opts.fov ?? 34;
  const target = fov + (opts.diveFov ?? 18) * dive - 6 * (1 - arrive);
  if (Math.abs(camera.fov - target) > 0.01) {
    camera.fov = target;
    camera.updateProjectionMatrix();
  }
}
