"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import RobotArm from "../models/RobotArm";
import Chip from "../models/Chip";
import { Backdrop, Clouds, Halo } from "../parts/Atmosphere";
import { M } from "../materials";
import { chapterTimeline, isActive, rigCamera, stage, type ChapterProps } from "../stage";

/** 02 — The work: robot arms welding a gilded compute monolith inside scaffolding. */

const LAYERS = 9;
const LAYER_H = 0.34;

function Scaffold() {
  const poles = useRef<THREE.InstancedMesh>(null);
  const clamps = useRef<THREE.InstancedMesh>(null);

  const bars = useMemo(() => {
    const list: [THREE.Vector3, THREE.Vector3][] = [];
    const S = 1.75;
    const H = LAYERS * LAYER_H + 0.9;
    const cols = [-S, -S / 3, S / 3, S];
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    // verticals on the perimeter
    for (const x of cols) for (const z of [-S, S]) list.push([v(x, 0, z), v(x, H, z)]);
    for (const z of cols.slice(1, 3)) for (const x of [-S, S]) list.push([v(x, 0, z), v(x, H, z)]);
    // ledgers every level
    for (let y = 0.8; y <= H; y += 0.8) {
      list.push([v(-S, y, -S), v(S, y, -S)], [v(-S, y, S), v(S, y, S)]);
      list.push([v(-S, y, -S), v(-S, y, S)], [v(S, y, -S), v(S, y, S)]);
    }
    // diagonal braces on the back and sides
    for (let y = 0; y + 0.8 <= H; y += 1.6) {
      list.push([v(-S, y, -S), v(-S / 3, y + 0.8, -S)], [v(S / 3, y + 0.8, -S), v(S, y, -S)]);
      list.push([v(S, y, -S), v(S, y + 0.8, -S / 3)], [v(-S, y + 0.8, -S / 3), v(-S, y, -S)]);
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    let c = 0;
    bars.forEach(([a, b], i) => {
      const d = b.clone().sub(a);
      o.position.copy(a).add(b).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(up, d.clone().normalize());
      o.scale.set(1, d.length(), 1);
      o.updateMatrix();
      poles.current?.setMatrixAt(i, o.matrix);
      [a, b].forEach((p) => {
        o.position.copy(p);
        o.quaternion.identity();
        o.scale.setScalar(1);
        o.updateMatrix();
        clamps.current?.setMatrixAt(c++, o.matrix);
      });
    });
    [poles, clamps].forEach((r) => r.current && (r.current.instanceMatrix.needsUpdate = true));
  }, [bars]);

  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, bars.length]} material={M.steel}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
      </instancedMesh>
      <instancedMesh ref={clamps} args={[undefined, undefined, bars.length * 2]} material={M.goldBrushed}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
      </instancedMesh>
    </group>
  );
}

/** Welding sparks: short-lived additive points thrown from each torch tip. */
function Sparks({ tips, index }: { tips: THREE.Vector3[]; index: number }) {
  const PER = stage.high ? 90 : 40;
  const total = PER * tips.length;
  const state = useMemo(() => {
    const pos = new Float32Array(total * 3);
    const vel = new Float32Array(total * 3);
    const life = new Float32Array(total).map(() => Math.random());
    return { pos, vel, life };
  }, [total]);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(state.pos, 3));
    g.setAttribute("aLife", new THREE.BufferAttribute(state.life, 1));
    return g;
  }, [state]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aLife; varying float vLife;
          void main() {
            vLife = aLife;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (1.0 - aLife) * (1.0 - aLife) * 420.0 / -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vLife;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * (1.0 - vLife);
            vec3 col = mix(vec3(1.0, 0.95, 0.8) * 5.0, vec3(1.0, 0.55, 0.15) * 2.0, vLife);
            gl_FragColor = vec4(col * a, a);
          }
        `,
      }),
    []
  );

  useFrame((_, delta) => {
    if (!isActive(index)) return;
    const dt = Math.min(delta, 0.05);
    const { pos, vel, life } = state;
    for (let i = 0; i < total; i++) {
      life[i] += dt * (1.4 + (i % 7) * 0.12);
      if (life[i] >= 1) {
        const tip = tips[Math.floor(i / PER)];
        life[i] = 0;
        pos[i * 3] = tip.x;
        pos[i * 3 + 1] = tip.y;
        pos[i * 3 + 2] = tip.z;
        vel[i * 3] = (Math.random() - 0.5) * 3.2;
        vel[i * 3 + 1] = 0.5 + Math.random() * 2.4;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
      }
      vel[i * 3 + 1] -= 6 * dt;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aLife.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/** Engraved turntable floor. */
function Plinth() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vP;
          void main() {
            float r = length(vP);
            float a = atan(vP.y, vP.x);
            vec3 base = mix(vec3(0.93, 0.9, 0.84), vec3(0.72, 0.8, 0.9), smoothstep(2.0, 7.0, r));
            float rings = abs(fract(r * 2.0) - 0.5); float fr = fwidth(r * 2.0);
            float ring = 1.0 - smoothstep(0.0, fr * 1.2, 0.5 - rings);
            float spokes = abs(fract(a / 6.28318 * 48.0) - 0.5); float fs = fwidth(a / 6.28318 * 48.0);
            float spoke = (1.0 - smoothstep(0.0, fs * 1.2, 0.5 - spokes)) * step(2.4, r) * step(r, 4.0);
            float ink = max(ring * 0.35, spoke * 0.25);
            gl_FragColor = vec4(base * (1.0 - ink * 0.5) * (1.0 - smoothstep(4.5, 7.5, r) * 0.25), 1.0);
          }
        `,
      }),
    []
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={material}>
        <circleGeometry args={[7.5, 128]} />
      </mesh>
      <mesh position={[0, -0.25, 0]} material={M.ceramicWarm}>
        <cylinderGeometry args={[7.5, 7.7, 0.5, 128, 1, true]} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.gold}>
        <ringGeometry args={[2.3, 2.36, 128]} />
      </mesh>
    </group>
  );
}

/**
 * One slab of the compute monolith. Three alternating kinds:
 *  0 — porcelain cap with a recessed seam
 *  1 — gold heat-sink with dense vertical fins
 *  2 — dark glass blade with light strips and status LEDs
 */
function Layer({ kind, width: w }: { kind: number; width: number }) {
  const fins = useRef<THREE.InstancedMesh>(null);
  const FINS = 22;
  useLayoutEffect(() => {
    if (kind !== 1 || !fins.current) return;
    const o = new THREE.Object3D();
    let n = 0;
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < FINS; k++) {
        const x = (k / (FINS - 1) - 0.5) * (w - 0.16);
        o.position.set(x, 0, w / 2 + 0.02).applyAxisAngle(new THREE.Vector3(0, 1, 0), (side * Math.PI) / 2);
        o.rotation.set(0, (side * Math.PI) / 2, 0);
        o.updateMatrix();
        fins.current.setMatrixAt(n++, o.matrix);
      }
    }
    fins.current.instanceMatrix.needsUpdate = true;
  }, [kind, w]);

  const h = LAYER_H * 0.86;
  if (kind === 0)
    return (
      <group>
        <RoundedBox args={[w, h, w]} radius={0.05} smoothness={3} material={M.ceramic} />
        <mesh material={M.darkMetal}>
          <boxGeometry args={[w + 0.004, 0.02, w + 0.004]} />
        </mesh>
      </group>
    );
  if (kind === 1)
    return (
      <group>
        <RoundedBox args={[w - 0.08, h, w - 0.08]} radius={0.03} smoothness={2} material={M.goldBrushed} />
        <instancedMesh ref={fins} args={[undefined, undefined, FINS * 4]} material={M.gold}>
          <boxGeometry args={[0.018, h * 0.92, 0.06]} />
        </instancedMesh>
      </group>
    );
  return (
    <group>
      <RoundedBox args={[w - 0.02, h, w - 0.02]} radius={0.03} smoothness={2} material={M.visor} />
      {[0, 1, 2, 3].map((side) => (
        <group key={side} rotation={[0, (side * Math.PI) / 2, 0]}>
          <mesh position={[0, 0.03, w / 2 - 0.005]} material={M.glowCyan}>
            <boxGeometry args={[w * 0.72, 0.012, 0.012]} />
          </mesh>
          <mesh position={[0, -0.05, w / 2 - 0.005]} material={M.steel}>
            <boxGeometry args={[w * 0.8, 0.006, 0.01]} />
          </mesh>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[-w * 0.42 + k * 0.05, -0.02, w / 2]} material={k === 2 ? M.glowGold : M.glowCyan}>
              <boxGeometry args={[0.018, 0.018, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function Assembly({ index, camera }: ChapterProps) {
  const layers = useRef<THREE.Group>(null);
  const crane = useRef<THREE.Group>(null);
  const floating = useRef<THREE.Group>(null);
  const tips = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], []);
  const topY = LAYERS * LAYER_H;

  const rest = useMemo(() => new THREE.Vector3(6.2, 3.2, 8.4), []);
  const from = useMemo(() => new THREE.Vector3(1.2, 9, 3.5), []);
  const look = useMemo(() => new THREE.Vector3(0, 1.8, 0), []);
  const orbit = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time;
    const { arrive, drift } = chapterTimeline(index);
    stage.focus[index].set(0, topY + 0.55, 0);
    stage.anchor[index].set(0, 1.6, 0);

    // monolith assembles itself while the chapter arrives
    const build = arrive * LAYERS + drift * 6;
    layers.current?.children.forEach((layer, i) => {
      const k = THREE.MathUtils.clamp(build - i, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      layer.visible = k > 0.001;
      layer.position.y = i * LAYER_H + LAYER_H / 2 + (1 - e) * 2.2;
      layer.rotation.y = (1 - e) * 0.8 * (i % 2 ? 1 : -1);
    });

    if (floating.current) {
      floating.current.position.y = topY + 0.55 + Math.sin(t * 1.2) * 0.06;
      floating.current.rotation.y = t * 0.4;
    }
    if (crane.current) crane.current.rotation.y = Math.sin(t * 0.25) * 0.5;

    // slow orbit around the build while resting
    const ang = 0.64 + drift * 0.9 + Math.sin(t * 0.08) * 0.05;
    orbit.set(Math.sin(ang) * 10.4, rest.y, Math.cos(ang) * 10.4);
    rigCamera(camera, index, orbit, look, { from, parallax: 0.5, fov: 36, diveFov: 16 });
  });

  return (
    <>
      <Backdrop top="#1167c9" mid="#56aee8" bottom="#e9e4d6" sun="#fff1d0" sunDir={[-0.6, 0.35, -0.7]} />
      <hemisphereLight args={["#e6f4ff", "#b7a58a", 1.0]} />
      <directionalLight position={[-6, 9, 4]} intensity={2.4} color="#fff0d8" />
      <directionalLight position={[6, 2, -6]} intensity={0.9} color="#8cc8ff" />

      <Clouds
        index={index}
        shade="#78b0e0"
        items={[
          { position: [-14, 7, -26], scale: [16, 6], seed: 11.2 },
          { position: [16, 9, -30], scale: [18, 7], seed: 12.7 },
          { position: [2, 12, -40], scale: [26, 8], seed: 13.9 },
          { position: [-22, 3, -18], scale: [12, 5], seed: 14.4 },
        ]}
      />

      <Plinth />
      <Scaffold />

      <group ref={layers}>
        {Array.from({ length: LAYERS }, (_, i) => (
          <group key={i}>
            <Layer kind={i % 3} width={2.3 - i * 0.04} />
          </group>
        ))}
      </group>

      {/* the finished processor hovering above the build */}
      <group ref={floating}>
        <Chip scale={1.25} />
        <Halo color="#ffd08a" size={2.2} intensity={0.7} position={[0, 0.15, 0]} />
      </group>

      {/* gantry crane */}
      <group ref={crane} position={[0, 0, 0]}>
        <mesh position={[-2.6, 2.6, 0]} material={M.darkMetal}>
          <boxGeometry args={[0.16, 5.2, 0.16]} />
        </mesh>
        <mesh position={[-1.2, 5.2, 0]} material={M.ceramic}>
          <boxGeometry args={[3.2, 0.18, 0.24]} />
        </mesh>
        <mesh position={[-0.2, 4.7, 0]} material={M.chrome}>
          <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
        </mesh>
      </group>

      <RobotArm index={index} tip={tips[0]} phase={0} position={[2.9, 0, 1.4]} rotation={[0, Math.PI * 0.85, 0]} />
      <RobotArm index={index} tip={tips[1]} phase={2.1} position={[-2.9, 0, 1.8]} rotation={[0, Math.PI * 0.12, 0]} scale={0.9} />
      <RobotArm index={index} tip={tips[2]} phase={4.2} position={[0.4, 0, -3.1]} rotation={[0, -Math.PI * 0.5, 0]} scale={1.1} />
      <Sparks tips={tips} index={index} />
    </>
  );
}
