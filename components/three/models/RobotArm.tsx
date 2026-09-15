"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { M } from "../materials";
import { isActive, stage } from "../stage";

/**
 * Six-axis industrial arm with a welding torch. Base sits on y=0.
 * `tip` receives the torch tip world position every frame (for sparks).
 */
export default function RobotArm({
  index,
  phase = 0,
  tip,
  ...props
}: JSX.IntrinsicElements["group"] & {
  index: number;
  phase?: number;
  tip?: THREE.Vector3;
}) {
  const turret = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const roll = useRef<THREE.Group>(null);
  const tipRef = useRef<THREE.Object3D>(null);
  const bolts = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time * 0.8 + phase;
    if (turret.current) turret.current.rotation.y = Math.sin(t * 0.45) * 0.35;
    if (shoulder.current) shoulder.current.rotation.z = -0.35 + Math.sin(t * 0.6) * 0.16;
    if (elbow.current) elbow.current.rotation.z = -1.25 + Math.sin(t * 0.6 + 1.1) * 0.22;
    if (wrist.current) wrist.current.rotation.z = -0.5 + Math.sin(t * 1.3) * 0.25;
    if (roll.current) roll.current.rotation.y = t * 1.5;
    if (tip && tipRef.current) tipRef.current.getWorldPosition(tip);
  });

  return (
    <group {...props}>
      {/* base */}
      <mesh position={[0, 0.08, 0]} material={M.darkMetal}>
        <cylinderGeometry args={[0.55, 0.62, 0.16, 48]} />
      </mesh>
      {bolts.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.5, 0.17, Math.sin(a) * 0.5]} material={M.chrome}>
          <cylinderGeometry args={[0.025, 0.025, 0.03, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <torusGeometry args={[0.42, 0.02, 10, 64]} />
      </mesh>

      <group ref={turret} position={[0, 0.16, 0]}>
        <mesh position={[0, 0.22, 0]} material={M.ceramic}>
          <cylinderGeometry args={[0.36, 0.42, 0.44, 48]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} material={M.steel}>
          <cylinderGeometry args={[0.3, 0.3, 0.06, 48]} />
        </mesh>

        {/* shoulder joint */}
        <group ref={shoulder} position={[0, 0.66, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={M.chrome}>
            <cylinderGeometry args={[0.24, 0.24, 0.52, 40]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={M.goldBrushed}>
            <cylinderGeometry args={[0.16, 0.16, 0.56, 32]} />
          </mesh>
          {/* upper arm */}
          <group rotation={[0, 0, 0]}>
            <RoundedBox args={[0.3, 1.6, 0.36]} radius={0.1} smoothness={4} position={[0, 0.8, 0]} material={M.ceramic} />
            <mesh position={[0.17, 0.8, 0]} material={M.darkMetal}>
              <boxGeometry args={[0.02, 1.2, 0.18]} />
            </mesh>
            <mesh position={[-0.2, 0.75, 0]} material={M.chrome}>
              <cylinderGeometry args={[0.03, 0.03, 1.1, 12]} />
            </mesh>
            <mesh position={[-0.2, 0.45, 0]} material={M.darkMetal}>
              <cylinderGeometry args={[0.05, 0.05, 0.45, 12]} />
            </mesh>

            {/* elbow */}
            <group ref={elbow} position={[0, 1.6, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={M.chrome}>
                <cylinderGeometry args={[0.18, 0.18, 0.44, 32]} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
                <torusGeometry args={[0.19, 0.015, 8, 48]} />
              </mesh>
              <RoundedBox args={[0.24, 1.25, 0.28]} radius={0.08} smoothness={4} position={[0, 0.62, 0]} material={M.ceramic} />
              <mesh position={[0, 0.62, 0.15]} material={M.rubber}>
                <cylinderGeometry args={[0.035, 0.035, 1.1, 10]} />
              </mesh>

              {/* wrist */}
              <group ref={wrist} position={[0, 1.25, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={M.chrome}>
                  <cylinderGeometry args={[0.13, 0.13, 0.3, 28]} />
                </mesh>
                <group ref={roll}>
                  <mesh position={[0, 0.16, 0]} material={M.darkMetal}>
                    <cylinderGeometry args={[0.1, 0.12, 0.22, 24]} />
                  </mesh>
                  <mesh position={[0, 0.3, 0]} material={M.gold}>
                    <cylinderGeometry args={[0.08, 0.08, 0.06, 24]} />
                  </mesh>
                  {/* torch */}
                  <mesh position={[0, 0.5, 0]} material={M.steel}>
                    <cylinderGeometry args={[0.03, 0.06, 0.36, 16]} />
                  </mesh>
                  <mesh position={[0, 0.7, 0]} material={M.glowCyan}>
                    <sphereGeometry args={[0.03, 12, 12]} />
                  </mesh>
                  <object3D ref={tipRef} position={[0, 0.72, 0]} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
