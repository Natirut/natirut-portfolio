"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SPAN = 20;

/** Vertical light streaks rising through the scene, like data on a bus. */
export default function DataStreams({ count = 26 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const streams = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 26,
        z: -2 - Math.random() * 20,
        length: 0.8 + Math.random() * 3.2,
        speed: 1.6 + Math.random() * 3.4,
        offset: Math.random() * SPAN,
        color: i % 3 === 0 ? "#ff3ea5" : i % 3 === 1 ? "#7b5cff" : "#00d9ff",
        opacity: 0.25 + Math.random() * 0.5,
      })),
    [count]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const s = streams[i];
      if (!s) return;
      child.position.y = ((t * s.speed + s.offset) % SPAN) - SPAN * 0.45;
    });
  });

  return (
    <group ref={groupRef}>
      {streams.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]}>
          <boxGeometry args={[0.018, s.length, 0.018]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={s.opacity}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
