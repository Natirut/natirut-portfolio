"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Helmet from "../models/Helmet";
import { Backdrop, Clouds, Dust, Halo } from "../parts/Atmosphere";
import { M } from "../materials";
import { chapterTimeline, isActive, rigCamera, stage, type ChapterProps } from "../stage";

/** 05 — Reach: the helmet on a classical plinth at golden hour, gazing at what comes next. */

function Column() {
  const flutes = useMemo(() => Array.from({ length: 20 }, (_, i) => (i / 20) * Math.PI * 2), []);
  return (
    <group position={[0, -2.35, 0]}>
      {/* capital */}
      <mesh position={[0, 0.12, 0]} material={M.ceramic}>
        <boxGeometry args={[1.9, 0.22, 1.9]} />
      </mesh>
      <mesh position={[0, -0.06, 0]} material={M.ceramicWarm}>
        <cylinderGeometry args={[0.95, 0.78, 0.18, 64]} />
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <torusGeometry args={[0.76, 0.03, 12, 96]} />
      </mesh>
      {/* shaft */}
      <mesh position={[0, -2.6, 0]} material={M.ceramic}>
        <cylinderGeometry args={[0.7, 0.78, 4.8, 64]} />
      </mesh>
      {flutes.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.72, -2.6, Math.sin(a) * 0.72]} material={M.ceramicWarm}>
          <cylinderGeometry args={[0.035, 0.04, 4.6, 8]} />
        </mesh>
      ))}
      {/* hologram emitter on the capital */}
      <mesh position={[0, 0.235, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.glowCyan}>
        <torusGeometry args={[0.42, 0.012, 8, 96]} />
      </mesh>
      <mesh position={[0, 0.232, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.darkMetal}>
        <circleGeometry args={[0.4, 64]} />
      </mesh>
      <Halo color="#6ff3ff" size={1.6} intensity={0.5} position={[0, 0.3, 0]} />
      {/* inlaid light channel */}
      <mesh position={[0, -1.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.glowCyan}>
        <torusGeometry args={[0.745, 0.008, 6, 96]} />
      </mesh>
    </group>
  );
}

export default function Reach({ index, camera }: ChapterProps) {
  const orb = useRef<THREE.Group>(null);
  const orbRings = useRef<THREE.Group>(null);

  const rest = useMemo(() => new THREE.Vector3(-0.7, -0.55, 7.6), []);
  const from = useMemo(() => new THREE.Vector3(0.2, 3.5, 3), []);
  const look = useMemo(() => new THREE.Vector3(-0.3, -0.55, 0), []);

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time;
    const { arrive } = chapterTimeline(index);
    const rise = 1 - arrive;
    stage.focus[index].set(-1.3, 0.95, 0.8);
    stage.anchor[index].set(0.2, -0.8, 0);

    if (orb.current) {
      orb.current.position.set(-1.3 + Math.sin(t * 0.4) * 0.06, 0.95 + Math.sin(t * 0.9) * 0.08 - rise * 1.5, 0.8);
      orb.current.scale.setScalar(0.4 + arrive * 0.6);
    }
    if (orbRings.current) {
      orbRings.current.children.forEach((c, i) => {
        c.rotation.x = t * (0.5 + i * 0.2);
        c.rotation.y = t * (0.3 - i * 0.15);
      });
    }
    rigCamera(camera, index, rest, look, { from, parallax: 0.4, fov: 36, diveFov: 0 });
  });

  return (
    <>
      <Backdrop top="#1554b8" mid="#6aa9e2" bottom="#f7cf96" sun="#ffd9a0" sunDir={[-0.35, 0.18, -1]} />
      <hemisphereLight args={["#ffe9cc", "#5f7fb0", 1.0]} />
      <directionalLight position={[-5, 4, -2]} intensity={2.6} color="#ffcf92" />
      <directionalLight position={[4, 3, 6]} intensity={1.3} color="#cfe6ff" />

      <Clouds
        index={index}
        light="#fff4e6"
        shade="#d9a58c"
        items={[
          { position: [8, 2.2, -16], scale: [12, 4.5], seed: 22.5 },
          { position: [4, 6.5, -28], scale: [16, 5], seed: 23.8 },
          { position: [5.5, -3.2, -9], scale: [8, 3], seed: 24.2 },
          { position: [14, -1, -24], scale: [12, 5], seed: 25.6 },
        ]}
      />
      <Dust index={index} count={260} radius={10} size={0.03} color="#ffd9a0" opacity={0.6} />

      <group position={[0.4, -0.2, 0]} rotation={[0, -0.45, 0]}>
        <Suspense fallback={null}>
          <Helmet index={index} reveal="arrive" tilt={-0.28} floor={-1.15} scale={1.1} position={[0, -0.65, 0]} />
        </Suspense>
        <Column />
      </group>

      <group ref={orb}>
        <mesh material={M.glowGold}>
          <icosahedronGeometry args={[0.13, 4]} />
        </mesh>
        <Halo color="#ffd08a" size={2.4} intensity={1} />
        <Halo color="#9ff6ff" size={0.8} intensity={0.8} />
        <group ref={orbRings}>
          {[0.3, 0.42, 0.56].map((r, i) => (
            <mesh key={r} material={i === 1 ? M.chrome : M.gold}>
              <torusGeometry args={[r, 0.006, 8, 96]} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}
