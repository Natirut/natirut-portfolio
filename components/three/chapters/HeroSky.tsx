"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Android from "../models/Android";
import { Backdrop, Clouds, Dust } from "../parts/Atmosphere";
import { M } from "../materials";
import { chapterTimeline, isActive, rigCamera, stage, type ChapterProps } from "../stage";

/** 00 — A porcelain android under an engraved halo, adrift in a halftone sky. */

function EngravedHalo({ index }: { index: number }) {
  const ring = useRef<THREE.Group>(null);
  const ticks = useRef<THREE.InstancedMesh>(null);
  const COUNT = 120;

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const major = i % 10 === 0;
      o.position.set(Math.cos(a) * 1.72, Math.sin(a) * 1.72, 0);
      o.rotation.set(0, 0, a);
      o.scale.set(major ? 2.4 : 1, 1, 1);
      o.updateMatrix();
      ticks.current?.setMatrixAt(i, o.matrix);
    }
    if (ticks.current) ticks.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (!isActive(index) || !ring.current) return;
    ring.current.rotation.z = stage.time * 0.04;
  });

  return (
    <group position={[0, 0.95, -0.9]}>
      <group ref={ring}>
        <mesh material={M.gold}>
          <torusGeometry args={[1.6, 0.018, 12, 200]} />
        </mesh>
        <mesh material={M.goldBrushed}>
          <torusGeometry args={[1.85, 0.008, 8, 200]} />
        </mesh>
        <mesh material={M.gold}>
          <torusGeometry args={[1.95, 0.004, 6, 200]} />
        </mesh>
        <instancedMesh ref={ticks} args={[undefined, undefined, COUNT]} material={M.goldBrushed}>
          <boxGeometry args={[0.06, 0.008, 0.008]} />
        </instancedMesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 1.6, Math.sin((i * Math.PI) / 2) * 1.6, 0]} material={M.glowGold}>
            <octahedronGeometry args={[0.045]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const CLOUDS = [
  { position: [-7, 3.6, -16], scale: [9, 4.5], seed: 1.2 },
  { position: [8, 4.8, -22], scale: [11, 5], seed: 2.7 },
  { position: [4.2, -2.6, -9], scale: [6, 3], seed: 4.1 },
  { position: [-5.5, -3.8, -12], scale: [8, 3.6], seed: 5.3 },
  { position: [-1.5, 6.5, -30], scale: [16, 6], seed: 6.6 },
  { position: [12, -1, -28], scale: [12, 5], seed: 7.9 },
  { position: [2.6, 1.9, -5], scale: [2.6, 1.3], seed: 8.4 },
] as { position: [number, number, number]; scale: [number, number]; seed: number }[];

export default function HeroSky({ index, camera }: ChapterProps) {
  const bust = useRef<THREE.Group>(null);
  const rest = useMemo(() => new THREE.Vector3(0.1, 0.35, 6.6), []);
  const look = useMemo(() => new THREE.Vector3(0, 0.25, 0), []);

  useFrame(() => {
    if (!isActive(index)) return;
    const { drift } = chapterTimeline(index);
    stage.anchor[index].set(0, 0.9, 0);
    if (bust.current) {
      bust.current.rotation.y = -0.38 + drift * 0.3;
      bust.current.position.y = -0.2 + Math.sin(stage.time * 0.6) * 0.03;
    }
    rigCamera(camera, index, rest, look, { parallax: 0.35, fov: 34, diveFov: 10 });
  });

  return (
    <>
      <Backdrop top="#0759c2" mid="#1b8fe3" bottom="#9fdcfa" />
      <hemisphereLight args={["#dff3ff", "#1d6fc0", 1.1]} />
      <directionalLight position={[-4, 6, 5]} intensity={2.2} color="#fff4e2" />
      <directionalLight position={[5, -1, -4]} intensity={1.2} color="#7cc8ff" />

      <Clouds index={index} items={CLOUDS} shade="#5aa4e4" />
      <Dust index={index} count={260} radius={10} size={0.03} opacity={0.6} />
      <EngravedHalo index={index} />
      <Android ref={bust} index={index} eyeFocus position={[0, -0.2, 0]} />
    </>
  );
}
