"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Android from "../models/Android";
import Chip from "../models/Chip";
import Blueprint from "../models/Blueprint";
import { Backdrop } from "../parts/Atmosphere";
import { chapterTimeline, isActive, rigCamera, stage, type ChapterProps } from "../stage";

/** 04 — On the record: the android, drawn up as an engineering blueprint. */

const LINE = "#eaf4ff";
const FILL = "#1552aa";

/** Drafting marks that ink themselves in, stroke by stroke. */
function Drafting({ index }: { index: number }) {
  const { geometry, material } = useMemo(() => {
    const pos: number[] = [];
    const ord: number[] = [];
    let n = 0;
    const seg = (a: THREE.Vector3, b: THREE.Vector3, o: number) => {
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      ord.push(o, o);
      n++;
    };
    const circle = (r: number, y: number, o0: number, o1: number, steps = 160, dashed = false) => {
      for (let i = 0; i < steps; i++) {
        if (dashed && i % 2) continue;
        const a0 = (i / steps) * Math.PI * 2;
        const a1 = ((i + 1) / steps) * Math.PI * 2;
        seg(
          new THREE.Vector3(Math.cos(a0) * r, y, Math.sin(a0) * r),
          new THREE.Vector3(Math.cos(a1) * r, y, Math.sin(a1) * r),
          o0 + (o1 - o0) * (i / steps)
        );
      }
    };
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    circle(2.2, -1.8, 0.0, 0.25);
    circle(3.1, -1.8, 0.1, 0.4, 220, true);
    circle(4.2, -1.8, 0.2, 0.55, 260);
    // tick marks on the outer circle
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const l = i % 6 === 0 ? 0.35 : 0.15;
      seg(v(Math.cos(a) * 4.2, -1.8, Math.sin(a) * 4.2), v(Math.cos(a) * (4.2 + l), -1.8, Math.sin(a) * (4.2 + l)), 0.3 + (i / 72) * 0.3);
    }
    // crosshair + construction lines
    seg(v(-5.2, -1.8, 0), v(5.2, -1.8, 0), 0.05);
    seg(v(0, -1.8, -5.2), v(0, -1.8, 5.2), 0.08);
    seg(v(-3.8, -1.8, -3.8), v(3.8, -1.8, 3.8), 0.35);
    seg(v(-3.8, -1.8, 3.8), v(3.8, -1.8, -3.8), 0.38);
    // vertical dimension line beside the figure
    seg(v(1.9, -1.8, 0.6), v(1.9, 1.6, 0.6), 0.45);
    for (const y of [-1.8, -0.3, 0.95, 1.6]) seg(v(1.78, y, 0.6), v(2.1, y, 0.6), 0.5);
    // leader lines out to callouts
    seg(v(0.35, 1.1, 0.4), v(2.8, 2.2, 0.6), 0.6);
    seg(v(2.8, 2.2, 0.6), v(3.9, 2.2, 0.6), 0.65);
    seg(v(-0.2, -0.9, 0.5), v(-2.6, 0.2, 0.9), 0.62);
    seg(v(-2.6, 0.2, 0.9), v(-3.8, 0.2, 0.9), 0.68);
    // callout boxes
    const box = (cx: number, cy: number, cz: number, w: number, h: number, o: number) => {
      seg(v(cx, cy, cz), v(cx + w, cy, cz), o);
      seg(v(cx + w, cy, cz), v(cx + w, cy + h, cz), o + 0.01);
      seg(v(cx + w, cy + h, cz), v(cx, cy + h, cz), o + 0.02);
      seg(v(cx, cy + h, cz), v(cx, cy, cz), o + 0.03);
    };
    box(3.9, 2.0, 0.6, 1.4, 0.4, 0.7);
    box(-5.2, 0.0, 0.9, 1.4, 0.4, 0.72);
    for (let k = 0; k < 3; k++) {
      seg(v(4.0, 2.28 - k * 0.09, 0.6), v(4.0 + 1.1 - k * 0.3, 2.28 - k * 0.09, 0.6), 0.76 + k * 0.02);
      seg(v(-5.1, 0.28 - k * 0.09, 0.9), v(-5.1 + 1.0 - k * 0.25, 0.28 - k * 0.09, 0.9), 0.78 + k * 0.02);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometry.setAttribute("aOrder", new THREE.Float32BufferAttribute(ord, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uReveal: { value: 0 }, uColor: { value: new THREE.Color(LINE) } },
      vertexShader: /* glsl */ `
        attribute float aOrder; varying float vOrder;
        void main() { vOrder = aOrder; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uReveal; uniform vec3 uColor; varying float vOrder;
        void main() {
          float a = smoothstep(vOrder, vOrder - 0.04, uReveal * 1.1 - 0.05);
          a = 1.0 - a;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a * 0.75);
        }
      `,
    });
    void n;
    return { geometry, material };
  }, []);

  useFrame(() => {
    if (!isActive(index)) return;
    const { arrive, drift } = chapterTimeline(index);
    material.uniforms.uReveal.value = Math.min(1, arrive * 0.85 + Math.max(0, drift) * 1.2);
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}

function Sheet() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uBase: { value: new THREE.Color("#0f428f") } },
        vertexShader: /* glsl */ `
          varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uBase; varying vec2 vP;
          float grid(vec2 p, float s, float w) {
            vec2 q = p / s; vec2 f = abs(fract(q) - 0.5); vec2 fw = fwidth(q);
            return 1.0 - min(smoothstep(0.0, fw.x * w, 0.5 - f.x), smoothstep(0.0, fw.y * w, 0.5 - f.y));
          }
          void main() {
            float minor = grid(vP, 0.25, 1.0);
            float major = grid(vP, 2.0, 1.4);
            float fade = 1.0 - smoothstep(6.0, 22.0, length(vP));
            vec3 col = uBase + vec3(0.55, 0.75, 1.0) * (minor * 0.05 + major * 0.14) * fade;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    []
  );
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.82, 0]} material={material}>
      <planeGeometry args={[80, 80]} />
    </mesh>
  );
}

export default function Schematic({ index, camera }: ChapterProps) {
  const turntable = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), -2), []);

  const rest = useMemo(() => new THREE.Vector3(0.4, 4.4, 8.4), []);
  const from = useMemo(() => new THREE.Vector3(0, 11, 2.5), []);
  const look = useMemo(() => new THREE.Vector3(0, 0.1, 0), []);

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time;
    const { arrive, drift } = chapterTimeline(index);
    stage.focus[index].set(0, 1.0, 0.45);
    stage.anchor[index].set(0, 0.2, 0);

    // the drawing prints from the base upward
    const h = -1.9 + Math.min(1, arrive * 1.05) * 3.9;
    clip.constant = h;
    if (scan.current) {
      scan.current.position.y = h;
      (scan.current.material as THREE.MeshBasicMaterial).opacity = h < 1.95 ? 0.5 : 0;
    }
    if (turntable.current) turntable.current.rotation.y = -0.5 + t * 0.12 + drift * 1.5;

    rigCamera(camera, index, rest, look, { from, parallax: 0.5, fov: 36, diveFov: 16 });
  });

  return (
    <>
      <Backdrop top="#0a2e6c" mid="#0f428f" bottom="#0f428f" grid={0.02} />
      <Sheet />
      <Drafting index={index} />

      <group ref={turntable}>
        <Blueprint clip={clip} line={LINE} fill={FILL}>
          <Android index={index} position={[0, -0.05, 0]} />
          <Chip position={[-1.35, -1.45, 1.2]} scale={0.9} glow={false} />
        </Blueprint>
      </group>

      <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.24, 128]} />
        <meshBasicMaterial color={new THREE.Color("#9ff6ff").multiplyScalar(3)} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </>
  );
}
