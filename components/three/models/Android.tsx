"use client";

import { forwardRef, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { M } from "../materials";
import { Halo } from "../parts/Atmosphere";
import { isActive, stage } from "../stage";

/**
 * A porcelain-and-chrome android bust, built entirely from primitives.
 *
 * Local layout (units): neck base at y=0, head centre at y≈0.95,
 * shoulders at y≈-0.3, chest reaching down to y≈-1.8. Faces +Z.
 */

const HEAD_R = 0.62;
const HEAD_SCALE: [number, number, number] = [0.86, 1.1, 0.98];

/** A point on the (unscaled) head sphere, using three's sphere param convention. */
function onHead(phi: number, theta: number, r = HEAD_R) {
  return new THREE.Vector3(
    -r * Math.cos(phi) * Math.sin(theta),
    r * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

const Z = new THREE.Vector3(0, 0, 1);
/** Orientation whose local +Z points along the surface normal at `p`. */
const faceOut = (p: THREE.Vector3) =>
  new THREE.Quaternion().setFromUnitVectors(Z, p.clone().normalize());

function Arc({
  radius,
  tube,
  arc,
  material,
  rotation,
  position,
  center = Math.PI / 2,
}: {
  radius: number;
  tube: number;
  arc: number;
  material: THREE.Material;
  rotation?: [number, number, number];
  position?: [number, number, number];
  center?: number;
}) {
  return (
    <group rotation={rotation} position={position}>
      <mesh rotation={[0, 0, center - arc / 2]} material={material}>
        <torusGeometry args={[radius, tube, 10, 96, arc]} />
      </mesh>
    </group>
  );
}

function Cable({
  points,
  radius = 0.022,
  material = M.rubber,
}: {
  points: [number, number, number][];
  radius?: number;
  material?: THREE.Material;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 40, radius, 10, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <mesh geometry={geometry} material={material} />;
}

function Ear({ side }: { side: 1 | -1 }) {
  const fins = useMemo(() => Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2), []);
  return (
    <group position={[side * 0.545, 0.02, -0.02]} rotation={[0, 0, (side * Math.PI) / 2]}>
      <mesh material={M.ceramicWarm}>
        <cylinderGeometry args={[0.2, 0.22, 0.1, 48]} />
      </mesh>
      <mesh position={[0, side * -0.06, 0]} material={M.darkMetal} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 48]} />
      </mesh>
      <mesh position={[0, side * -0.09, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <torusGeometry args={[0.165, 0.014, 12, 64]} />
      </mesh>
      <mesh position={[0, side * -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.glowCyan}>
        <torusGeometry args={[0.09, 0.008, 8, 48]} />
      </mesh>
      <mesh position={[0, side * -0.1, 0]} material={M.chrome}>
        <cylinderGeometry args={[0.05, 0.06, 0.05, 32]} />
      </mesh>
      {fins.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.125, side * -0.085, Math.sin(a) * 0.125]}
          rotation={[0, -a, 0]}
          material={M.steel}
        >
          <boxGeometry args={[0.05, 0.012, 0.012]} />
        </mesh>
      ))}
      {/* antenna */}
      <group position={[0.05, side * -0.02, -0.12]} rotation={[0.5, 0, side * -0.35]}>
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.chrome}>
          <cylinderGeometry args={[0.008, 0.012, 0.44, 12]} />
        </mesh>
        <mesh position={[0.45, 0, 0]} material={M.glowGold}>
          <sphereGeometry args={[0.018, 16, 16]} />
        </mesh>
      </group>
    </group>
  );
}

type AndroidProps = JSX.IntrinsicElements["group"] & {
  index: number;
  /** extra head pitch (positive looks up) */
  lookUp?: number;
  /** register the left eye as this chapter's dive focus */
  eyeFocus?: boolean;
};

const Android = forwardRef<THREE.Group, AndroidProps>(function Android(
  { index, lookUp = 0, eyeFocus = false, ...props },
  ref
) {
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const eyeAnchor = useRef<THREE.Object3D>(null);
  const blink = useRef({ next: 2.5, t: 0 });

  const eyeL = useMemo(() => onHead(Math.PI / 2 + 0.3, 1.5, HEAD_R + 0.02), []);
  const eyeR = useMemo(() => onHead(Math.PI / 2 - 0.3, 1.5, HEAD_R + 0.02), []);
  const grille = useMemo(() => [0, 1, 2, 3, 4], []);
  const vents = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);
  const vertebrae = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);
  const coreTeeth = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);

  useFrame((_, delta) => {
    if (!isActive(index)) return;
    const t = stage.time;

    if (head.current) {
      const yaw = stage.px * 0.22 + Math.sin(t * 0.35) * 0.05;
      const pitch = -stage.py * 0.12 + Math.sin(t * 0.5) * 0.025 - lookUp;
      head.current.rotation.y += (yaw - head.current.rotation.y) * Math.min(1, delta * 2.5);
      head.current.rotation.x += (pitch - head.current.rotation.x) * Math.min(1, delta * 2.5);
      head.current.position.y = 0.95 + Math.sin(t * 0.9) * 0.008;
    }

    // occasional blink
    const b = blink.current;
    if (t > b.next) {
      b.t += delta;
      if (b.t > 0.16) {
        b.t = 0;
        b.next = t + 2.2 + Math.random() * 3.5;
      }
    }
    if (eyes.current) {
      const s = b.t > 0 ? Math.abs(Math.cos((b.t / 0.16) * Math.PI)) : 1;
      eyes.current.children.forEach((c) => {
        c.scale.y = Math.max(0.08, s);
      });
    }

    if (core.current) core.current.rotation.z = t * 0.6;

    if (eyeFocus && eyeAnchor.current) {
      eyeAnchor.current.getWorldPosition(stage.focus[index]);
    }
  });

  return (
    <group ref={ref} {...props}>
      {/* ------------------------------------------------ head */}
      <group ref={head} position={[0, 0.95, 0]}>
        <group scale={HEAD_SCALE}>
          <mesh material={M.ceramic}>
            <sphereGeometry args={[HEAD_R, 96, 64]} />
          </mesh>

          {/* visor band */}
          <mesh material={M.visor}>
            <sphereGeometry
              args={[HEAD_R + 0.012, 96, 32, Math.PI / 2 - 0.82, 1.64, 1.2, 0.56]}
            />
          </mesh>
          {/* visor trim */}
          <Arc radius={0.587} tube={0.012} arc={1.7} material={M.chrome} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <Arc radius={0.604} tube={0.01} arc={1.7} material={M.gold} position={[0, -0.155, 0]} rotation={[Math.PI / 2, 0, 0]} />

          {/* eyes */}
          <group ref={eyes}>
            {[eyeL, eyeR].map((p, i) => (
              <group key={i} position={p} quaternion={faceOut(p)}>
                <mesh rotation={[0, 0, Math.PI / 2]} material={M.eye}>
                  <capsuleGeometry args={[0.02, 0.11, 6, 16]} />
                </mesh>
              </group>
            ))}
          </group>
          <object3D ref={eyeAnchor} position={eyeL} />
          {/* faint display scanlines inside the visor */}
          {[0.1, 0.03, -0.04].map((y) => (
            <Arc key={y} radius={Math.sqrt(HEAD_R ** 2 - y * y) + 0.014} tube={0.0025} arc={1.2} material={M.scan} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />
          ))}

          {/* panel seams */}
          <mesh material={M.darkMetal} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[HEAD_R + 0.002, 0.004, 6, 128, Math.PI * 1.2]} />
          </mesh>
          <Arc radius={HEAD_R + 0.002} tube={0.004} arc={Math.PI * 0.95} material={M.darkMetal} rotation={[0, 0, 0]} />
          <mesh material={M.darkMetal} position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.sqrt(HEAD_R ** 2 - 0.36 ** 2) + 0.003, 0.005, 6, 96]} />
          </mesh>

          {/* crown ridge */}
          <group rotation={[0, Math.PI / 2, 0]}>
            <Arc radius={HEAD_R + 0.018} tube={0.024} arc={Math.PI * 0.62} material={M.chrome} center={Math.PI / 2 - 0.35} />
          </group>
          {vents.map((i) => {
            const theta = 0.55 + i * 0.1;
            const p = onHead(-Math.PI / 2, theta, HEAD_R + 0.01);
            return (
              <group key={i} position={p} quaternion={faceOut(p)}>
                <RoundedBox args={[0.22 - i * 0.012, 0.028, 0.03]} radius={0.01} material={M.darkMetal} />
              </group>
            );
          })}

          {/* mouth grille + chin */}
          <mesh material={M.ceramicWarm}>
            <sphereGeometry args={[HEAD_R + 0.006, 64, 16, Math.PI / 2 - 0.55, 1.1, 1.95, 0.42]} />
          </mesh>
          {grille.map((i) => {
            const p = onHead(Math.PI / 2, 2.02 + i * 0.065, HEAD_R + 0.014);
            return (
              <group key={i} position={p} quaternion={faceOut(p)}>
                <mesh material={i === 2 ? M.glowGold : M.darkMetal}>
                  <boxGeometry args={[0.2 - Math.abs(i - 2) * 0.03, 0.012, 0.01]} />
                </mesh>
              </group>
            );
          })}
        </group>

        {[eyeL, eyeR].map((p, i) => (
          <Halo key={i} color="#58ecff" size={0.32} intensity={0.55} position={[p.x * HEAD_SCALE[0], p.y * HEAD_SCALE[1], p.z * HEAD_SCALE[2] + 0.02]} />
        ))}
        <Ear side={1} />
        <Ear side={-1} />
      </group>

      {/* ------------------------------------------------ neck */}
      <group position={[0, 0.2, 0]}>
        <mesh material={M.darkMetal}>
          <cylinderGeometry args={[0.13, 0.17, 0.7, 32]} />
        </mesh>
        {vertebrae.map((i) => (
          <mesh key={i} position={[0, -0.28 + i * 0.105, 0]} rotation={[Math.PI / 2, 0, 0]} material={i % 2 ? M.chrome : M.steel}>
            <torusGeometry args={[0.165 - i * 0.004, 0.022, 12, 48]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.12, -0.05, 0.12]} rotation={[0.18, 0, s * 0.22]}>
            <mesh material={M.chrome}>
              <cylinderGeometry args={[0.018, 0.018, 0.62, 12]} />
            </mesh>
            <mesh position={[0, -0.18, 0]} material={M.goldBrushed}>
              <cylinderGeometry args={[0.032, 0.032, 0.26, 16]} />
            </mesh>
          </group>
        ))}
      </group>
      <Cable points={[[-0.08, 0.55, -0.22], [-0.2, 0.2, -0.28], [-0.36, -0.12, -0.2]]} />
      <Cable points={[[0.08, 0.55, -0.22], [0.2, 0.2, -0.28], [0.36, -0.12, -0.2]]} />
      <Cable points={[[0.0, 0.52, -0.26], [0.02, 0.15, -0.34], [0.0, -0.18, -0.3]]} radius={0.03} material={M.goldBrushed} />
      <Cable points={[[-0.18, 0.5, 0.05], [-0.28, 0.12, 0.06], [-0.5, -0.2, 0.12]]} radius={0.016} material={M.gold} />
      <Cable points={[[0.18, 0.5, 0.05], [0.28, 0.12, 0.06], [0.5, -0.2, 0.12]]} radius={0.016} material={M.gold} />

      {/* ------------------------------------------------ torso */}
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.gold}>
        <torusGeometry args={[0.3, 0.045, 16, 64]} />
      </mesh>
      <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.darkMetal}>
        <torusGeometry args={[0.36, 0.03, 12, 64]} />
      </mesh>

      {/* chest: dark under-structure, porcelain plates split at the sternum */}
      <mesh position={[0, -1.02, -0.08]} scale={[1.0, 0.92, 0.5]} material={M.darkMetal}>
        <sphereGeometry args={[0.94, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0, -1.02, -0.06]} scale={[1.03, 0.93, 0.54]} material={M.ceramic}>
            <sphereGeometry args={[0.94, 64, 48, s > 0 ? Math.PI / 2 + 0.045 : Math.PI / 2 - 1.3, 1.255, 0.2, 1.3]} />
          </mesh>
          <mesh position={[0, -1.02, -0.06]} scale={[1.02, 0.93, 0.54]} material={M.ceramicWarm}>
            <sphereGeometry args={[0.94, 48, 16, s > 0 ? Math.PI / 2 + 0.045 : Math.PI / 2 - 1.1, 1.055, 1.56, 0.42]} />
          </mesh>
          {/* collar strap */}
          <mesh position={[s * 0.46, -0.27, 0.04]} rotation={[0.1, 0, s * 1.3]} material={M.ceramicWarm}>
            <capsuleGeometry args={[0.05, 0.5, 8, 24]} />
          </mesh>

          {/* layered pauldron */}
          <group position={[s * 0.9, -0.36, -0.05]} rotation={[0, 0, -s * 0.22]}>
            <mesh material={M.darkMetal}>
              <sphereGeometry args={[0.27, 48, 32]} />
            </mesh>
            {[0, 1, 2].map((k) => {
              const r = 0.45 - k * 0.035;
              const th = Math.PI * 0.44;
              return (
                <group key={k} position={[s * k * 0.1, -k * 0.14, 0]} rotation={[0, 0, -s * k * 0.34]}>
                  <mesh scale={[1, 0.6, 0.92]} material={k === 1 ? M.ceramicWarm : M.ceramic}>
                    <sphereGeometry args={[r, 64, 32, 0, Math.PI * 2, 0, th]} />
                  </mesh>
                  <mesh position={[0, r * Math.cos(th) * 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.92, 1]} material={k === 0 ? M.gold : M.darkMetal}>
                    <torusGeometry args={[r * Math.sin(th), 0.009, 6, 72]} />
                  </mesh>
                </group>
              );
            })}
            {/* upper arm stub */}
            <group position={[s * 0.22, -0.34, 0]} rotation={[0, 0, s * 0.2]}>
              <mesh position={[0, -0.36, 0]} material={M.darkMetal}>
                <cylinderGeometry args={[0.15, 0.12, 0.72, 32]} />
              </mesh>
              {[0, 1, 2].map((k) => (
                <mesh key={k} position={[0, -0.14 - k * 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={k === 1 ? M.goldBrushed : M.steel}>
                  <torusGeometry args={[0.155 - k * 0.01, 0.02, 8, 40]} />
                </mesh>
              ))}
            </group>
          </group>

          {/* flank vents */}
          {vents.slice(0, 5).map((i) => (
            <mesh key={i} position={[s * 0.8, -0.86 - i * 0.065, 0.06]} rotation={[0, s * 1.25, 0]} material={M.steel}>
              <boxGeometry args={[0.14, 0.014, 0.02]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* sternum light */}
      <mesh position={[0, -0.52, 0.405]} rotation={[0.55, 0, 0]} material={M.glowCyan}>
        <boxGeometry args={[0.012, 0.26, 0.01]} />
      </mesh>

      {/* abdomen segments */}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, -1.62 - k * 0.12, -0.05]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]} material={k === 1 ? M.steel : M.darkMetal}>
          <torusGeometry args={[0.5 - k * 0.04, 0.05, 12, 64]} />
        </mesh>
      ))}

      {/* arc reactor core */}
      <group position={[0, -0.9, 0.48]} rotation={[-0.18, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.chrome}>
          <cylinderGeometry args={[0.2, 0.22, 0.06, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[0, 0, 0]} material={M.gold}>
          <torusGeometry args={[0.175, 0.018, 12, 64]} />
        </mesh>
        <mesh position={[0, 0, 0.035]} material={M.glowCyan}>
          <circleGeometry args={[0.07, 48]} />
        </mesh>
        <group ref={core} position={[0, 0, 0.04]}>
          {coreTeeth.map((a, i) => (
            <mesh key={i} position={[Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0]} rotation={[0, 0, a]} material={i % 3 === 0 ? M.glowCyan : M.darkMetal}>
              <boxGeometry args={[0.05, 0.022, 0.02]} />
            </mesh>
          ))}
        </group>
        <Halo color="#8ff8ff" size={0.9} intensity={0.8} position={[0, 0, 0.1]} />
      </group>

      {/* sternum plates */}
      {grille.map((i) => (
        <RoundedBox key={i} args={[0.34 - i * 0.04, 0.05, 0.05]} radius={0.015} position={[0, -1.18 - i * 0.085, 0.43 - i * 0.02]} material={i % 2 ? M.darkMetal : M.ceramicWarm} />
      ))}
    </group>
  );
});

export default Android;
