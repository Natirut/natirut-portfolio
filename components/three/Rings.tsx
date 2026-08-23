"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RINGS = [
  { radius: 2.35, tilt: [1.2, 0.2, 0.4], speed: 0.35, color: "#00d9ff" },
  { radius: 2.75, tilt: [0.4, 1.1, -0.3], speed: -0.26, color: "#7b5cff" },
  { radius: 3.15, tilt: [-0.8, 0.5, 1.0], speed: 0.19, color: "#ff3ea5" },
] as const;

/** Gyroscopic orbit rings, each carrying a travelling data node. */
export default function Rings() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    RINGS.forEach((ring, i) => {
      const g = groups.current[i];
      if (g) g.rotation.z += delta * ring.speed;

      const node = nodes.current[i];
      if (node) {
        const a = t * (ring.speed * 3 + 0.6) + i * 2.1;
        node.position.set(
          Math.cos(a) * ring.radius,
          Math.sin(a) * ring.radius,
          0
        );
      }
    });
  });

  return (
    <>
      {RINGS.map((ring, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          rotation={ring.tilt as unknown as [number, number, number]}
        >
          <mesh>
            <torusGeometry args={[ring.radius, 0.0085, 8, 220]} />
            <meshBasicMaterial color={ring.color} toneMapped={false} />
          </mesh>
          <mesh
            ref={(el) => {
              nodes.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}
