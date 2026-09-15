"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clamp01, damp, scrollState } from "@/lib/scroll";
import { introTime, markModelReady } from "@/lib/intro";
import { isActive, stage, chapterTimeline } from "../stage";

/**
 * The Blender-built sci-fi helmet (tools/blender/build_helmet.py).
 *
 * Each instance clones the glTF materials and injects a small shader patch:
 *  - a materialise cut that builds the model bottom-up behind a glowing scan
 *    band with hologram lines,
 *  - a click-triggered scan wave that sweeps top to bottom.
 * On top of that the neon power-on flickers, the head tracks the cursor, and
 * the lenses flare when the pointer is near.
 *
 * Model space: +Z is the face, Y is up, head centre at the origin,
 * neck bottom at y = -1.62, crown at y ≈ 1.03.
 */

export const HELMET_URL = "/models/helmet.glb";
export const DRACO_URL = "/draco/";

const BOTTOM = -1.7;
const TOP = 1.12;

type RevealMode = "intro" | "arrive" | "none";

type Props = JSX.IntrinsicElements["group"] & {
  index: number;
  reveal?: RevealMode;
  /** follow the pointer and react to clicks */
  interactive?: boolean;
  /** extra pitch (negative looks up) */
  tilt?: number;
  /** register the left lens as this chapter's dive focus */
  eyeFocus?: boolean;
  /** 0..1 multiplier on neon brightness */
  glow?: number;
  /** model-space height below which the neck dissolves into a glowing cut */
  floor?: number;
};

type Patched = {
  uniforms: {
    uReveal: { value: number };
    uScanY: { value: number };
    uScanAmp: { value: number };
    uEdge: { value: THREE.Color };
    uFloor: { value: number };
  };
  neon: THREE.MeshStandardMaterial[];
  lamp: THREE.MeshStandardMaterial[];
  root: THREE.Group;
};

function patchMaterial(material: THREE.Material, uniforms: Patched["uniforms"]) {
  const m = material as THREE.MeshStandardMaterial;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vModelPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvModelPos = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vModelPos;
        uniform float uReveal;
        uniform float uScanY;
        uniform float uScanAmp;
        uniform float uFloor;
        uniform vec3 uEdge;`
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        float revealCut = vModelPos.y - uReveal;
        if (revealCut > 0.0) discard;
        float floorCut = uFloor - vModelPos.y;
        if (floorCut > 0.0) discard;`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float band = smoothstep(-0.22, 0.0, revealCut);
        float lines = step(0.86, fract(vModelPos.y * 90.0)) * band;
        totalEmissiveRadiance += uEdge * (band * band * 3.5 + lines * 5.0);
        float scan = exp(-pow((vModelPos.y - uScanY) * 18.0, 2.0)) * uScanAmp;
        float scanLines = step(0.7, fract(vModelPos.y * 140.0)) * exp(-pow((vModelPos.y - uScanY) * 5.0, 2.0)) * uScanAmp;
        totalEmissiveRadiance += uEdge * (scan * 2.5 + scanLines * 0.8);
        float floorBand = smoothstep(-0.25, 0.0, floorCut);
        float floorLines = step(0.8, fract(vModelPos.y * 70.0)) * floorBand;
        totalEmissiveRadiance += uEdge * (floorBand * floorBand * 1.6 + floorLines * 1.2);`
      );
  };
  m.customProgramCacheKey = () => "helmet-fx";
  m.needsUpdate = true;
}

const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

const Helmet = forwardRef<THREE.Group, Props>(function Helmet(
  { index, reveal = "none", interactive = false, tilt = 0, eyeFocus = false, glow = 1, floor = -10, ...props },
  ref
) {
  const { scene } = useGLTF(HELMET_URL, DRACO_URL);
  const look = useRef<THREE.Group>(null);
  const eye = useRef<THREE.Object3D>(null);
  const pulse = useRef({ at: -10, kick: 0 });
  const center = useMemo(() => new THREE.Vector3(), []);

  const patched = useMemo<Patched>(() => {
    const root = scene.clone(true) as THREE.Group;
    const uniforms: Patched["uniforms"] = {
      uReveal: { value: reveal === "none" ? 10 : BOTTOM },
      uScanY: { value: 10 },
      uScanAmp: { value: 0 },
      uEdge: { value: new THREE.Color("#6ff3ff").multiplyScalar(1.6) },
      uFloor: { value: floor },
    };
    const neon: THREE.MeshStandardMaterial[] = [];
    const lamp: THREE.MeshStandardMaterial[] = [];
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      mat.userData.baseEmissive = mat.emissiveIntensity;
      switch (mat.name) {
        case "Neon":
          neon.push(mat);
          break;
        case "Lamp":
          lamp.push(mat);
          break;
        case "Chrome":
          mat.envMapIntensity = 1.1;
          break;
        case "Armor":
        case "ArmorGrey":
          mat.envMapIntensity = 0.75;
          break;
        case "Glass":
          mat.envMapIntensity = 1.4;
          break;
        default:
          mat.envMapIntensity = 0.9;
      }
      patchMaterial(mat, uniforms);
      mesh.material = mat;
    });
    return { root, uniforms, neon, lamp };
  }, [scene, reveal, floor]);

  useEffect(() => {
    markModelReady();
  }, []);

  // click anywhere on the hero to fire a scan wave through the helmet
  useEffect(() => {
    if (!interactive) return;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest("a, button, input, textarea")) return;
      if (Math.abs(stage.g - index) > 0.35) return;
      pulse.current.at = stage.time;
      pulse.current.kick = 1;
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [interactive, index]);

  useFrame((state, delta) => {
    if (!isActive(index)) return;
    const dt = Math.min(delta, 0.05);
    const t = stage.time;
    const u = patched.uniforms;

    // ---- materialise
    let powered = 1;
    if (reveal === "intro") {
      const it = introTime();
      // skip the show if the visitor arrives mid-page
      const skip = scrollState.chapter > 0.6 || it > 12;
      const p = skip ? 1 : it < 0 ? 0 : clamp01((it - 0.15) / 2.3);
      const e = 1 - Math.pow(1 - p, 3);
      u.uReveal.value = p >= 1 ? 10 : BOTTOM + (TOP - BOTTOM) * e;
      // neon powers on with a stutter once the build passes the eyes
      const on = skip ? 1 : clamp01((it - 1.9) / 0.9);
      powered = on >= 1 ? 1 : on * (hash(Math.floor(t * 24)) > 0.35 ? 1 : 0.1);
    } else if (reveal === "arrive") {
      const { arrive } = chapterTimeline(index);
      u.uReveal.value = arrive >= 0.999 ? 10 : BOTTOM + (TOP - BOTTOM) * arrive;
    }

    // ---- scan wave
    const since = t - pulse.current.at;
    if (since >= 0 && since < 1.6) {
      u.uScanY.value = TOP - (since / 1.2) * (TOP - BOTTOM);
      u.uScanAmp.value = Math.sin(Math.min(1, since / 1.2) * Math.PI);
    } else {
      u.uScanAmp.value = 0;
    }
    pulse.current.kick = damp(pulse.current.kick, 0, 3, dt);

    // ---- neon: breathe, flare near the pointer, surge on scan
    let near = 0;
    if (interactive && look.current) {
      look.current.getWorldPosition(center);
      center.project(state.camera);
      const dx = (center.x - stage.px) * stage.aspect;
      const dy = center.y - stage.py;
      near = clamp01(1 - Math.hypot(dx, dy) / 0.9);
    }
    const breathe = 0.85 + 0.15 * Math.sin(t * 1.6);
    const neonLevel = 0.5 * powered * glow * (breathe + near * 0.9 + u.uScanAmp.value * 1.2);
    patched.neon.forEach((m) => (m.emissiveIntensity = m.userData.baseEmissive * neonLevel));
    patched.lamp.forEach((m) => (m.emissiveIntensity = m.userData.baseEmissive * 0.35 * powered * glow * (0.7 + near * 0.6)));

    // ---- head motion
    if (look.current) {
      const g = look.current;
      const yaw = interactive ? stage.px * 0.55 : Math.sin(t * 0.3) * 0.12;
      const pitch = (interactive ? -stage.py * 0.28 : 0) + tilt + Math.sin(t * 0.7) * 0.02;
      g.rotation.y = damp(g.rotation.y, yaw + pulse.current.kick * 0.08 * Math.sin(t * 30), 3.2, dt);
      g.rotation.x = damp(g.rotation.x, pitch - pulse.current.kick * 0.05, 3.2, dt);
      g.position.y = Math.sin(t * 0.9) * 0.03;
    }

    if (eyeFocus && eye.current) eye.current.getWorldPosition(stage.focus[index]);
  });

  return (
    <group ref={ref} {...props}>
      <group ref={look}>
        <primitive object={patched.root} />
        {/* the viewer-left main lens, used as the dive target */}
        <object3D ref={eye} position={[-0.27, 0.06, 0.86]} />
      </group>
    </group>
  );
});

useGLTF.preload(HELMET_URL, DRACO_URL);

export default Helmet;
