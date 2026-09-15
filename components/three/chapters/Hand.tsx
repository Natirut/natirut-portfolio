"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import RobotHand from "../models/RobotHand";
import Chip from "../models/Chip";
import { Backdrop, Dust, Halo } from "../parts/Atmosphere";
import { M } from "../materials";
import { chapterTimeline, isActive, rigCamera, stage, type ChapterProps } from "../stage";

/** 03 — The toolkit: a robotic hand offering a processor, skill modules in orbit. */

function Glyph({ kind }: { kind: number }) {
  switch (kind) {
    case 0: // code brackets
      return (
        <group>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.09, 0, 0]}>
              <mesh position={[0, 0.045, 0]} rotation={[0, 0, s * 0.8]} material={M.glowGold}>
                <boxGeometry args={[0.018, 0.11, 0.02]} />
              </mesh>
              <mesh position={[0, -0.045, 0]} rotation={[0, 0, -s * 0.8]} material={M.glowGold}>
                <boxGeometry args={[0.018, 0.11, 0.02]} />
              </mesh>
            </group>
          ))}
          <mesh rotation={[0, 0, -0.35]} material={M.glowCyan}>
            <boxGeometry args={[0.016, 0.2, 0.02]} />
          </mesh>
        </group>
      );
    case 1: // database stack
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          {[-0.07, 0, 0.07].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={y === 0 ? M.glowCyan : M.glowGold}>
              <cylinderGeometry args={[0.09, 0.09, 0.035, 32]} />
            </mesh>
          ))}
        </group>
      );
    case 2: // gear
      return (
        <group>
          <mesh material={M.glowGold}>
            <torusGeometry args={[0.07, 0.022, 10, 32]} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[Math.cos((i * Math.PI) / 4) * 0.1, Math.sin((i * Math.PI) / 4) * 0.1, 0]} rotation={[0, 0, (i * Math.PI) / 4]} material={M.glowGold}>
              <boxGeometry args={[0.04, 0.03, 0.03]} />
            </mesh>
          ))}
          <mesh material={M.glowCyan}>
            <sphereGeometry args={[0.025, 12, 12]} />
          </mesh>
        </group>
      );
    default: // spark
      return (
        <group>
          <mesh scale={[0.6, 1.4, 0.4]} material={M.glowGold}>
            <octahedronGeometry args={[0.08]} />
          </mesh>
          <mesh scale={[1.4, 0.6, 0.4]} material={M.glowGold}>
            <octahedronGeometry args={[0.08]} />
          </mesh>
          <mesh position={[0.1, 0.1, 0]} material={M.glowCyan}>
            <octahedronGeometry args={[0.025]} />
          </mesh>
        </group>
      );
  }
}

function Module({ kind }: { kind: number }) {
  return (
    <group>
      <RoundedBox args={[0.46, 0.46, 0.08]} radius={0.05} smoothness={3} material={M.ceramic} />
      <RoundedBox args={[0.38, 0.38, 0.02]} radius={0.03} position={[0, 0, 0.04]} material={M.visor} />
      <mesh position={[0, 0, 0.045]} material={M.gold}>
        <torusGeometry args={[0.2, 0.006, 6, 48]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.235, 0, 0]} material={M.goldBrushed}>
          <boxGeometry args={[0.02, 0.3, 0.05]} />
        </mesh>
      ))}
      <group position={[0, 0, 0.06]}>
        <Glyph kind={kind} />
      </group>
    </group>
  );
}

export default function Hand({ index, camera }: ChapterProps) {
  const hand = useRef<THREE.Group>(null);
  const chipAnchor = useRef<THREE.Group>(null);
  const chip = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const chipWorld = useMemo(() => new THREE.Vector3(), []);

  const rest = useMemo(() => new THREE.Vector3(-0.3, 0.75, 5.6), []);
  const from = useMemo(() => new THREE.Vector3(-0.6, 1.2, 1.6), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time;
    const { arrive, drift } = chapterTimeline(index);

    if (hand.current) {
      hand.current.position.y = -1.05 + Math.sin(t * 0.7) * 0.04 - (1 - arrive) * 0.8;
      hand.current.rotation.z = 0.12 + Math.sin(t * 0.5) * 0.02;
    }
    if (chip.current) {
      chip.current.rotation.y = t * 0.45 + drift * 2;
      chip.current.rotation.x = 0.45 + Math.sin(t * 0.8) * 0.08;
      chip.current.position.y = Math.sin(t * 1.1) * 0.05;
    }
    if (chipAnchor.current) {
      chipAnchor.current.getWorldPosition(chipWorld);
      stage.focus[index].copy(chipWorld);
      stage.anchor[index].copy(chipWorld);
      look.copy(chipWorld);
      look.y -= 0.15;
    }
    if (orbit.current) {
      orbit.current.position.copy(chipWorld);
      orbit.current.children.forEach((m, i) => {
        const a = t * 0.35 + (i * Math.PI) / 2 + drift * 1.5;
        const r = 1.35 * (0.5 + arrive * 0.5);
        m.position.set(Math.cos(a) * r, Math.sin(a * 1.3 + i) * 0.22, Math.sin(a) * r * 0.55);
        m.updateMatrixWorld();
        // keep each module's glyph turned toward the viewer, with a gentle wobble
        m.lookAt(camera.position.x, camera.position.y, camera.position.z + 2);
        m.rotateZ(Math.sin(a * 1.7) * 0.15);
      });
    }
    if (rings.current) {
      rings.current.position.copy(chipWorld);
      rings.current.rotation.z = Math.sin(t * 0.3) * 0.04;
    }

    rigCamera(camera, index, rest, look, { from, parallax: 0.35, fov: 33, diveFov: 20 });
  });

  return (
    <>
      <Backdrop top="#f3ecdd" mid="#eadfc8" bottom="#d9c7a4" engrave={0.08} />
      <hemisphereLight args={["#fff8ea", "#a7916a", 1.2]} />
      <directionalLight position={[-3, 5, 4]} intensity={2.6} color="#fff1dc" />
      <directionalLight position={[4, 1, -3]} intensity={1.1} color="#9cc9ff" />

      <Dust index={index} count={220} radius={8} size={0.03} color="#caa46a" opacity={0.5} />

      <group ref={hand} position={[0.9, -1.05, 0.2]}>
        <group rotation={[0, -2.45, 0]}>
          <group rotation={[-0.28, 0, 0]}>
            <RobotHand index={index} curl={0.55} forearm={3} />
            <group ref={chipAnchor} position={[0, 0.78, 0.28]}>
              <group ref={chip}>
                <Chip scale={0.62} />
              </group>
              <Halo color="#ffcf8a" size={1.6} intensity={0.55} />
            </group>
          </group>
        </group>
      </group>

      <group ref={rings}>
        <group rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
          <mesh material={M.goldBrushed}>
            <torusGeometry args={[1.35, 0.006, 6, 200]} />
          </mesh>
          <mesh material={M.gold}>
            <torusGeometry args={[1.5, 0.003, 6, 200]} />
          </mesh>
        </group>
      </group>

      <group ref={orbit}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} scale={0.85}>
            <Module kind={k} />
          </group>
        ))}
      </group>
    </>
  );
}
