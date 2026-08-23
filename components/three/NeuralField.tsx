"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A shell of nodes distributed with a Fibonacci sphere, wired together
 * wherever two nodes fall within `LINK_DIST` of each other — reads as a
 * neural network wrapped around the core.
 */
export default function NeuralField({ count = 130 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const { pointGeo, lineGeo } = useMemo(() => {
    const golden = Math.PI * (1 + Math.sqrt(5));
    const pts: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const radius = 4.1 + (Math.sin(i * 12.9898) * 0.5 + 0.5) * 0.9;
      pts.push(
        new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(
          radius
        )
      );
    }

    const pointGeo = new THREE.BufferGeometry().setFromPoints(pts);

    const LINK_DIST = 1.55;
    const MAX_LINKS = 420;
    const segments: number[] = [];
    let links = 0;

    for (let i = 0; i < pts.length && links < MAX_LINKS; i++) {
      for (let j = i + 1; j < pts.length && links < MAX_LINKS; j++) {
        if (pts[i].distanceTo(pts[j]) < LINK_DIST) {
          segments.push(
            pts[i].x,
            pts[i].y,
            pts[i].z,
            pts[j].x,
            pts[j].y,
            pts[j].z
          );
          links++;
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(segments, 3)
    );

    return { pointGeo, lineGeo };
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.045;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
  });

  return (
    <group ref={groupRef}>
      <points geometry={pointGeo}>
        <pointsMaterial
          size={0.055}
          color="#7ceaff"
          transparent
          opacity={0.9}
          sizeAttenuation
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color="#2f6fff"
          transparent
          opacity={0.22}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
