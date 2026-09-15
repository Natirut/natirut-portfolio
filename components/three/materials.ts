import * as THREE from "three";

/**
 * Shared materials. Created once (this module only ever loads on the client)
 * and reused across every chapter scene.
 */
const hdr = (hex: string, intensity: number) =>
  new THREE.Color(hex).multiplyScalar(intensity);

export const M = {
  ceramic: new THREE.MeshPhysicalMaterial({
    color: "#f4f0e8",
    roughness: 0.34,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    sheen: 0.4,
    sheenColor: new THREE.Color("#dfe9ff"),
  }),
  ceramicWarm: new THREE.MeshPhysicalMaterial({
    color: "#e6dccb",
    roughness: 0.42,
    clearcoat: 0.7,
    clearcoatRoughness: 0.3,
  }),
  chrome: new THREE.MeshStandardMaterial({
    color: "#eef2f8",
    metalness: 1,
    roughness: 0.1,
  }),
  steel: new THREE.MeshStandardMaterial({
    color: "#9aa4b4",
    metalness: 1,
    roughness: 0.32,
  }),
  darkMetal: new THREE.MeshStandardMaterial({
    color: "#1a212e",
    metalness: 0.85,
    roughness: 0.38,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: "#f0b54f",
    metalness: 1,
    roughness: 0.2,
  }),
  goldBrushed: new THREE.MeshStandardMaterial({
    color: "#d99a3c",
    metalness: 1,
    roughness: 0.42,
  }),
  visor: new THREE.MeshPhysicalMaterial({
    color: "#060d1c",
    metalness: 0.55,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
  }),
  rubber: new THREE.MeshStandardMaterial({
    color: "#12151b",
    roughness: 0.85,
    metalness: 0.1,
  }),
  pcb: new THREE.MeshStandardMaterial({
    color: "#0b1622",
    roughness: 0.55,
    metalness: 0.5,
  }),
  glowCyan: new THREE.MeshBasicMaterial({ color: hdr("#7ff4ff", 2.6) }),
  eye: new THREE.MeshBasicMaterial({ color: hdr("#58ecff", 2.2) }),
  scan: new THREE.MeshBasicMaterial({ color: hdr("#58d8ff", 0.9), transparent: true, opacity: 0.55 }),
  glowGold: new THREE.MeshBasicMaterial({ color: hdr("#ffbf66", 2.6) }),
  glowWhite: new THREE.MeshBasicMaterial({ color: hdr("#ffffff", 3) }),
};

let haloTexture: THREE.Texture | null = null;

/** Soft radial falloff used by every glow sprite. */
export function getHaloTexture() {
  if (haloTexture) return haloTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.45, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  haloTexture = new THREE.CanvasTexture(canvas);
  return haloTexture;
}
