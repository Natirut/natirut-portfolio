"use client";

import { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { M } from "../materials";

/**
 * A gold-capped processor: substrate, heat spreader, die window, rows of pins,
 * glowing traces and SMD components. Centre at origin, top face +Y, 1 unit wide.
 */
const Chip = forwardRef<THREE.Group, JSX.IntrinsicElements["group"] & { glow?: boolean }>(
  function Chip({ glow = true, ...props }, ref) {
    const pins = useRef<THREE.InstancedMesh>(null);
    const traces = useRef<THREE.InstancedMesh>(null);
    const smd = useRef<THREE.InstancedMesh>(null);

    const PER_EDGE = 16;
    const layout = useMemo(() => {
      const pinM: THREE.Matrix4[] = [];
      const traceM: THREE.Matrix4[] = [];
      const q = new THREE.Quaternion();
      const o = new THREE.Object3D();
      for (let e = 0; e < 4; e++) {
        const angle = (e * Math.PI) / 2;
        for (let i = 0; i < PER_EDGE; i++) {
          const t = (i / (PER_EDGE - 1) - 0.5) * 0.82;
          // pins stick out past the substrate edge
          o.position.set(t, -0.02, 0.56).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          o.rotation.set(0, angle, 0);
          o.scale.set(1, 1, 1);
          o.updateMatrix();
          pinM.push(o.matrix.clone());

          // traces run inward from each pin, alternating lengths
          const len = 0.1 + ((i * 7) % 5) * 0.025;
          o.position.set(t, 0.062, 0.47 - len / 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          o.rotation.set(0, angle, 0);
          o.scale.set(1, 1, len / 0.1);
          o.updateMatrix();
          traceM.push(o.matrix.clone());
        }
      }
      q.identity();
      return { pinM, traceM };
    }, []);

    useLayoutEffect(() => {
      layout.pinM.forEach((m, i) => pins.current?.setMatrixAt(i, m));
      layout.traceM.forEach((m, i) => traces.current?.setMatrixAt(i, m));
      const o = new THREE.Object3D();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.2;
        o.position.set(Math.cos(a) * 0.36, 0.075, Math.sin(a) * 0.36);
        o.rotation.set(0, -a, 0);
        o.updateMatrix();
        smd.current?.setMatrixAt(i, o.matrix);
      }
      [pins, traces, smd].forEach((r) => r.current && (r.current.instanceMatrix.needsUpdate = true));
    }, [layout]);

    return (
      <group ref={ref} {...props}>
        {/* substrate */}
        <RoundedBox args={[1.06, 0.1, 1.06]} radius={0.025} smoothness={3} material={M.pcb} />
        <RoundedBox args={[1.0, 0.02, 1.0]} radius={0.01} position={[0, 0.05, 0]} material={M.darkMetal} />

        {/* heat spreader */}
        <RoundedBox args={[0.6, 0.08, 0.6]} radius={0.02} smoothness={3} position={[0, 0.1, 0]} material={M.gold} />
        <RoundedBox args={[0.5, 0.02, 0.5]} radius={0.01} position={[0, 0.145, 0]} material={M.goldBrushed} />
        <mesh position={[0, 0.158, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.visor}>
          <planeGeometry args={[0.28, 0.28]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glow ? M.glowGold : M.gold}>
          <ringGeometry args={[0.1, 0.112, 64]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glow ? M.glowCyan : M.chrome}>
          <ringGeometry args={[0.04, 0.05, 6]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.19, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.darkMetal}>
            <planeGeometry args={[0.012, 0.3]} />
          </mesh>
        ))}

        <instancedMesh ref={pins} args={[undefined, undefined, PER_EDGE * 4]} material={M.gold}>
          <boxGeometry args={[0.028, 0.018, 0.12]} />
        </instancedMesh>
        <instancedMesh ref={traces} args={[undefined, undefined, PER_EDGE * 4]} material={glow ? M.glowCyan : M.goldBrushed}>
          <boxGeometry args={[0.008, 0.004, 0.1]} />
        </instancedMesh>
        <instancedMesh ref={smd} args={[undefined, undefined, 12]} material={M.steel}>
          <boxGeometry args={[0.04, 0.03, 0.022]} />
        </instancedMesh>
      </group>
    );
  }
);

export default Chip;
