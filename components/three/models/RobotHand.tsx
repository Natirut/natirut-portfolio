"use client";

import { forwardRef, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { M } from "../materials";
import { Halo } from "../parts/Atmosphere";
import { isActive, stage } from "../stage";

/**
 * Articulated robotic hand + forearm. Palm faces +Y, fingers extend toward +Z,
 * thumb on the +X side. Every phalanx is its own pivot so the fingers can curl.
 */

type FingerSpec = { x: number; scale: number; splay: number; base: number };

const FINGERS: FingerSpec[] = [
  { x: -0.33, scale: 0.78, splay: -0.12, base: 0.36 },
  { x: -0.11, scale: 0.97, splay: -0.04, base: 0.42 },
  { x: 0.11, scale: 1.04, splay: 0.03, base: 0.44 },
  { x: 0.33, scale: 0.94, splay: 0.1, base: 0.41 },
];

const SEGMENTS = [0.3, 0.22, 0.17];

function Phalanx({
  length,
  width,
  tip,
  children,
  jointRef,
}: {
  length: number;
  width: number;
  tip?: boolean;
  children?: React.ReactNode;
  jointRef: (g: THREE.Group | null) => void;
}) {
  return (
    <group ref={jointRef}>
      {/* joint */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={M.darkMetal}>
        <cylinderGeometry args={[width * 0.3, width * 0.3, width * 0.9, 24]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * width * 0.47, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.chrome}>
          <cylinderGeometry args={[width * 0.24, width * 0.24, width * 0.08, 24]} />
        </mesh>
      ))}
      {/* shell */}
      <RoundedBox
        args={[width * 0.92, width * 0.74, length * 0.84]}
        radius={width * 0.34}
        smoothness={5}
        position={[0, 0, length * 0.5]}
        material={M.ceramic}
      />
      {/* grip pad */}
      <RoundedBox
        args={[width * 0.72, width * 0.16, length * 0.6]}
        radius={width * 0.07}
        smoothness={2}
        position={[0, width * 0.38, length * 0.5]}
        material={M.rubber}
      />
      {/* tendon */}
      <mesh position={[0, -width * 0.4, length * 0.5]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <cylinderGeometry args={[width * 0.07, width * 0.07, length * 0.9, 8]} />
      </mesh>
      {tip && (
        <mesh position={[0, width * 0.2, length * 0.94]} material={M.glowCyan}>
          <boxGeometry args={[width * 0.5, width * 0.08, width * 0.08]} />
        </mesh>
      )}
      <group position={[0, 0, length]}>{children}</group>
    </group>
  );
}

type HandProps = JSX.IntrinsicElements["group"] & {
  index: number;
  /** 0 = flat, 1 = cradling */
  curl?: number;
  forearm?: number;
};

const RobotHand = forwardRef<THREE.Group, HandProps>(function RobotHand(
  { index, curl = 0.45, forearm = 2.4, ...props },
  ref
) {
  // joints[finger][segment]
  const joints = useRef<(THREE.Group | null)[][]>(FINGERS.map(() => [null, null, null]));
  const thumb = useRef<(THREE.Group | null)[]>([null, null, null]);
  const palmGlow = useRef<THREE.Mesh>(null);

  const rings = useMemo(() => [0.25, 0.55, 1.1, 1.7], []);

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time;
    FINGERS.forEach((_, f) => {
      const breathe = Math.sin(t * 0.9 + f * 0.6) * 0.06;
      joints.current[f].forEach((j, s) => {
        if (!j) return;
        j.rotation.x = -(curl * (0.45 + s * 0.22) + breathe * (s + 1) * 0.5);
      });
    });
    thumb.current.forEach((j, s) => {
      if (!j) return;
      j.rotation.x = -(curl * 0.5 + Math.sin(t * 0.7) * 0.05) * (s === 0 ? 0.4 : 1);
    });
    if (palmGlow.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.08;
      palmGlow.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={ref} {...props}>
      {/* palm */}
      <RoundedBox args={[0.9, 0.22, 0.84]} radius={0.1} smoothness={6} material={M.ceramic} />
      <RoundedBox args={[0.62, 0.04, 0.54]} radius={0.018} position={[0, 0.105, 0.02]} material={M.visor} />
      <group position={[0, 0.16, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh material={M.gold}>
          <torusGeometry args={[0.17, 0.014, 12, 64]} />
        </mesh>
        <mesh ref={palmGlow} material={M.glowCyan}>
          <torusGeometry args={[0.1, 0.01, 8, 48]} />
        </mesh>
        <mesh position={[0, 0, -0.005]} material={M.visor}>
          <circleGeometry args={[0.15, 48]} />
        </mesh>
      </group>
      <Halo color="#8ff8ff" size={0.7} intensity={0.5} position={[0, 0.22, 0.02]} />
      {/* back plate seams */}
      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={x} position={[x, -0.125, 0]} material={M.darkMetal}>
          <boxGeometry args={[0.012, 0.01, 0.7]} />
        </mesh>
      ))}
      {/* knuckle bar */}
      {FINGERS.map((f) => (
        <mesh key={f.x} position={[f.x, 0, f.base - 0.02]} material={M.chrome}>
          <sphereGeometry args={[0.075, 24, 16]} />
        </mesh>
      ))}

      {FINGERS.map((f, i) => {
        const w = 0.145 * (0.85 + f.scale * 0.15);
        const set = (s: number) => (g: THREE.Group | null) => {
          joints.current[i][s] = g;
        };
        return (
          <group key={i} position={[f.x, 0, f.base]} rotation={[0, f.splay, 0]}>
            <Phalanx length={SEGMENTS[0] * f.scale} width={w} jointRef={set(0)}>
              <Phalanx length={SEGMENTS[1] * f.scale} width={w * 0.94} jointRef={set(1)}>
                <Phalanx length={SEGMENTS[2] * f.scale} width={w * 0.88} jointRef={set(2)} tip />
              </Phalanx>
            </Phalanx>
          </group>
        );
      })}

      {/* thumb */}
      <group position={[0.46, -0.02, -0.12]} rotation={[0.2, 0.95, -0.35]}>
        <mesh material={M.chrome}>
          <sphereGeometry args={[0.1, 24, 24]} />
        </mesh>
        <Phalanx length={0.26} width={0.17} jointRef={(g) => (thumb.current[0] = g)}>
          <Phalanx length={0.2} width={0.16} jointRef={(g) => (thumb.current[1] = g)}>
            <Phalanx length={0.16} width={0.15} jointRef={(g) => (thumb.current[2] = g)} tip />
          </Phalanx>
        </Phalanx>
      </group>

      {/* wrist */}
      <group position={[0, -0.02, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={M.chrome}>
          <cylinderGeometry args={[0.26, 0.26, 0.2, 48]} />
        </mesh>
        {[-0.07, 0.07].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.darkMetal}>
            <torusGeometry args={[0.27, 0.018, 8, 48]} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.265, 0.012, 8, 64]} />
        </mesh>
      </group>

      {/* forearm */}
      <group position={[0, -0.02, -0.6 - forearm / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={M.ceramic}>
          <cylinderGeometry args={[0.24, 0.32, forearm, 64]} />
        </mesh>
        {rings.map((r) => (
          <mesh key={r} position={[0, forearm / 2 - r, 0]} rotation={[Math.PI / 2, 0, 0]} material={r === 0.55 ? M.gold : M.darkMetal}>
            <torusGeometry args={[0.245 + (r / forearm) * 0.08, r === 0.55 ? 0.02 : 0.008, 8, 64]} />
          </mesh>
        ))}
        {/* pistons */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.3, 0.1, -0.12]}>
            <mesh material={M.chrome}>
              <cylinderGeometry args={[0.025, 0.025, forearm * 0.7, 12]} />
            </mesh>
            <mesh position={[0, -forearm * 0.2, 0]} material={M.darkMetal}>
              <cylinderGeometry args={[0.045, 0.045, forearm * 0.35, 16]} />
            </mesh>
          </group>
        ))}
        {/* exposed cable bundle */}
        {[-0.08, 0, 0.08].map((x, k) => (
          <mesh key={x} position={[x, 0, 0.27]} material={k === 1 ? M.goldBrushed : M.rubber}>
            <cylinderGeometry args={[0.028, 0.028, forearm * 0.85, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  );
});

export default RobotHand;
