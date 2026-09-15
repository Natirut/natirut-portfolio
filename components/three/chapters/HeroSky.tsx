"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Helmet from "../models/Helmet";
import { AstroRing, Backdrop, Clouds, Dust, Halo } from "../parts/Atmosphere";
import { M } from "../materials";
import { chapterTimeline, isActive, rigCamera, stage, type ChapterProps } from "../stage";
import { clamp01, scrollState } from "@/lib/scroll";
import { introTime } from "@/lib/intro";

/**
 * 00 — Night sky. The Blender-built helmet materialises out of a halftone
 * cloud bank under a gilded engraved halo, ringed by hologram orbits. It
 * tracks the cursor, a key light follows the pointer across its armour, and
 * a click fires a scan wave.
 */

/** Intro growth is skipped when the page is opened mid-scroll. */
const introSkipped = () => scrollState.chapter > 0.6;

function EngravedHalo({ index }: { index: number }) {
  const ring = useRef<THREE.Group>(null);
  const ticks = useRef<THREE.InstancedMesh>(null);
  const COUNT = 144;

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const major = i % 12 === 0;
      o.position.set(Math.cos(a) * 2.02, Math.sin(a) * 2.02, 0);
      o.rotation.set(0, 0, a);
      o.scale.set(major ? 2.6 : 1, 1, 1);
      o.updateMatrix();
      ticks.current?.setMatrixAt(i, o.matrix);
    }
    if (ticks.current) ticks.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (!isActive(index) || !ring.current) return;
    ring.current.rotation.z = stage.time * 0.03;
    const it = introTime();
    const s = it < 0 ? 0.001 : 0.6 + 0.4 * (1 - Math.pow(1 - clamp01((it - 0.6) / 1.8), 3));
    ring.current.scale.setScalar(introSkipped() ? 1 : s);
  });

  return (
    <group position={[0, 0.1, -1.4]}>
      <group ref={ring}>
        <mesh material={M.gold}>
          <torusGeometry args={[1.9, 0.02, 12, 256]} />
        </mesh>
        <mesh material={M.goldBrushed}>
          <torusGeometry args={[2.18, 0.008, 8, 256]} />
        </mesh>
        <mesh material={M.gold}>
          <torusGeometry args={[2.3, 0.004, 6, 256]} />
        </mesh>
        <instancedMesh ref={ticks} args={[undefined, undefined, COUNT]} material={M.goldBrushed}>
          <boxGeometry args={[0.07, 0.009, 0.009]} />
        </instancedMesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 1.9, Math.sin((i * Math.PI) / 2) * 1.9, 0]} material={M.glowGold}>
            <octahedronGeometry args={[0.05]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Soft additive light shafts falling from the upper left. */
function LightShafts({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#7fc4ff") } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
          void main() {
            float across = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
            float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
            float flicker = 0.75 + 0.25 * sin(uTime * 0.6 + vUv.x * 6.0);
            gl_FragColor = vec4(uColor * across * along * flicker * 0.22, 1.0);
          }
        `,
      }),
    []
  );
  useFrame(() => {
    if (!isActive(index)) return;
    material.uniforms.uTime.value = stage.time;
  });
  return (
    <group ref={group} position={[-2.2, 3.4, -3]} rotation={[0, 0, -0.55]}>
      {[
        [0, 1.6, 9],
        [0.9, 0.9, 8],
        [-0.8, 1.1, 10],
      ].map(([x, w, h], i) => (
        <mesh key={i} position={[x, -h / 2, -i * 0.5]} material={material}>
          <planeGeometry args={[w, h]} />
        </mesh>
      ))}
    </group>
  );
}

const FAR_CLOUDS = [
  { position: [-9, 3.8, -22], scale: [14, 5], seed: 1.2 },
  { position: [10, 5.2, -26], scale: [16, 5.5], seed: 2.7 },
  { position: [-3, 7.5, -34], scale: [20, 6], seed: 6.6 },
  { position: [14, -0.5, -30], scale: [14, 5], seed: 7.9 },
] as { position: [number, number, number]; scale: [number, number]; seed: number }[];

const BANK = [
  { position: [-1.9, -1.75, 1.2], scale: [5.4, 2.1], seed: 3.1 },
  { position: [2.2, -1.95, 1.8], scale: [5.8, 2.2], seed: 4.4 },
  { position: [0.1, -2.3, 2.6], scale: [6.8, 2.4], seed: 5.8 },
  { position: [-4.8, -1.4, -0.4], scale: [5.5, 2.2], seed: 8.9 },
  { position: [4.9, -1.3, -0.8], scale: [5.5, 2.3], seed: 9.7 },
] as { position: [number, number, number]; scale: [number, number]; seed: number }[];

export default function HeroSky({ index, camera }: ChapterProps) {
  const cursorLight = useRef<THREE.PointLight>(null);
  const orbits = useRef<THREE.Group>(null);
  const rest = useMemo(() => new THREE.Vector3(0.15, 0.2, 6.3), []);
  const look = useMemo(() => new THREE.Vector3(0, -0.05, 0), []);

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time;
    const { drift } = chapterTimeline(index);
    stage.anchor[index].set(0, 0.1, 0);

    if (cursorLight.current) {
      // the light hovers just in front of the face, following the pointer
      cursorLight.current.position.set(stage.px * 2.6, stage.py * 1.6 + 0.2, 2.0);
    }
    if (orbits.current) {
      orbits.current.rotation.y = t * 0.12 + drift * 1.5;
      orbits.current.rotation.x = 0.18 + Math.sin(t * 0.25) * 0.05;
      const it = introTime();
      const s = introSkipped() ? 1 : it < 0 ? 0.001 : 0.7 + 0.3 * clamp01((it - 1.2) / 1.5);
      orbits.current.scale.setScalar(s);
    }

    rigCamera(camera, index, rest, look, { parallax: 0.3, fov: 32, diveFov: 10 });
  });

  return (
    <>
      <Backdrop top="#010614" mid="#06205a" bottom="#1d62b6" sun="#6fb8ff" sunDir={[-0.45, 0.55, -1]} />
      <hemisphereLight args={["#9ec9ff", "#0a1f45", 0.25]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.1} color="#e9f3ff" />
      <directionalLight position={[4, 1.5, -4]} intensity={2.2} color="#43d6ff" />
      <directionalLight position={[-4, 0.5, -3]} intensity={1.6} color="#4a7dff" />
      <pointLight ref={cursorLight} intensity={3.5} distance={6} decay={1.8} color="#d8f6ff" />

      <Dust index={index} count={900} radius={40} size={0.05} color="#cfe6ff" opacity={0.9} />
      <Dust index={index} count={240} radius={8} size={0.028} color="#9fdcff" opacity={0.7} />
      <Clouds index={index} items={FAR_CLOUDS} light="#6f98d6" shade="#13336d" />
      <LightShafts index={index} />

      <EngravedHalo index={index} />
      <Halo color="#3fa8ff" size={6.5} intensity={0.35} position={[0, 0.2, -1.6]} />

      <group ref={orbits} position={[0, 0.05, 0]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <AstroRing radius={1.55} width={0.16} color="#7fe9ff" speed={0.08} seed={3} intensity={0.9} />
        </group>
        <group rotation={[Math.PI / 2 + 0.35, 0.25, 0]}>
          <AstroRing radius={1.95} width={0.07} color="#ffd79a" speed={-0.05} seed={9} intensity={0.55} />
        </group>
      </group>

      <Suspense fallback={null}>
        <Helmet index={index} reveal="intro" interactive eyeFocus floor={-1.18} scale={1.18} position={[0, 0.12, 0]} />
      </Suspense>

      <Clouds index={index} items={BANK} light="#a9c8f2" shade="#1b4486" drift={0.03} />
    </>
  );
}
