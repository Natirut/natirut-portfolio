"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { simplexNoise } from "@/lib/glsl";
import { AstroRing, Backdrop, Dust, Halo } from "../parts/Atmosphere";
import { M } from "../materials";
import { chapterTimeline, isActive, rigCamera, stage, type ChapterProps } from "../stage";

/** 01 — Inside the android's mind: a gilded neural lattice inside an astrolabe. */

/** Icosahedral lattice made of real gold struts and chrome nodes. */
function Lattice({ radius = 1.25 }: { radius?: number }) {
  const struts = useRef<THREE.InstancedMesh>(null);
  const nodes = useRef<THREE.InstancedMesh>(null);

  const { edges, verts } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    const pos = geo.attributes.position;
    const key = (v: THREE.Vector3) => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    const vmap = new Map<string, THREE.Vector3>();
    const emap = new Map<string, [THREE.Vector3, THREE.Vector3]>();
    for (let i = 0; i < pos.count; i += 3) {
      const tri = [0, 1, 2].map((k) => {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i + k);
        const id = key(v);
        if (!vmap.has(id)) vmap.set(id, v);
        return id;
      });
      for (let k = 0; k < 3; k++) {
        const a = tri[k];
        const b = tri[(k + 1) % 3];
        const id = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (!emap.has(id)) emap.set(id, [vmap.get(a)!, vmap.get(b)!]);
      }
    }
    geo.dispose();
    return { edges: [...emap.values()], verts: [...vmap.values()] };
  }, [radius]);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    edges.forEach(([a, b], i) => {
      const dir = b.clone().sub(a);
      o.position.copy(a).add(b).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      o.scale.set(1, dir.length(), 1);
      o.updateMatrix();
      struts.current?.setMatrixAt(i, o.matrix);
    });
    verts.forEach((v, i) => {
      o.position.copy(v);
      o.quaternion.identity();
      o.scale.setScalar(1);
      o.updateMatrix();
      nodes.current?.setMatrixAt(i, o.matrix);
    });
    [struts, nodes].forEach((r) => r.current && (r.current.instanceMatrix.needsUpdate = true));
  }, [edges, verts]);

  return (
    <group>
      <instancedMesh ref={struts} args={[undefined, undefined, edges.length]} material={M.gold}>
        <cylinderGeometry args={[0.012, 0.012, 1, 8]} />
      </instancedMesh>
      <instancedMesh ref={nodes} args={[undefined, undefined, verts.length]} material={M.chrome}>
        <icosahedronGeometry args={[0.045, 1]} />
      </instancedMesh>
    </group>
  );
}

/** Molten plasma heart. */
function Plasma() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          ${simplexNoise}
          uniform float uTime;
          varying vec3 vN; varying vec3 vP; varying float vD;
          void main() {
            float d = snoise(normal * 1.6 + uTime * 0.3);
            vD = d;
            vec3 p = position + normal * d * 0.022;
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vP = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vN; varying vec3 vP; varying float vD;
          void main() {
            float f = 1.0 - abs(dot(normalize(vN), normalize(vP)));
            vec3 core = vec3(1.0, 0.62, 0.22);
            vec3 edge = vec3(0.45, 0.95, 1.0);
            vec3 col = mix(core * 0.95, edge * 1.6, pow(f, 2.2));
            col += vec3(1.0, 0.7, 0.35) * smoothstep(0.25, 0.7, vD) * 0.5;
            // fine engraved latitude lines across the plasma
            float lat = abs(fract(vN.y * 14.0 + uTime * 0.2) - 0.5);
            col *= 0.82 + 0.18 * smoothstep(0.0, 0.12, lat);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    []
  );
  useFrame(() => {
    material.uniforms.uTime.value = stage.time;
  });
  return (
    <mesh material={material}>
      <icosahedronGeometry args={[0.42, 24]} />
    </mesh>
  );
}

/** Synapse web: nodes on a shell, linked to neighbours, with travelling pulses. */
function Synapses({ count = 150 }: { count?: number }) {
  const { lineGeo, pointGeo } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(2.3 + Math.random() * 2.6);
      pts.push(v);
    }
    const lp: number[] = [];
    const la: number[] = [];
    pts.forEach((p, i) => {
      let links = 0;
      for (let j = i + 1; j < pts.length && links < 3; j++) {
        if (p.distanceTo(pts[j]) < 1.6) {
          lp.push(p.x, p.y, p.z, pts[j].x, pts[j].y, pts[j].z);
          const ph = Math.random();
          la.push(ph, 0, ph, 1);
          links++;
        }
      }
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
    const attr = new Float32Array(la.length / 2);
    const along = new Float32Array(la.length / 2);
    for (let k = 0; k < la.length / 2; k++) {
      attr[k] = la[k * 2];
      along[k] = la[k * 2 + 1];
    }
    lineGeo.setAttribute("aPhase", new THREE.BufferAttribute(attr, 1));
    lineGeo.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
    const pointGeo = new THREE.BufferGeometry().setFromPoints(pts);
    return { lineGeo, pointGeo };
  }, [count]);

  const lineMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float aPhase; attribute float aAlong;
          varying float vPhase; varying float vAlong;
          void main() { vPhase = aPhase; vAlong = aAlong; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; varying float vPhase; varying float vAlong;
          void main() {
            float head = fract(uTime * 0.35 + vPhase * 7.0);
            float pulse = smoothstep(0.12, 0.0, abs(vAlong - head));
            vec3 base = vec3(0.35, 0.6, 1.0) * 0.12;
            vec3 hot = vec3(1.0, 0.78, 0.42) * 1.6;
            gl_FragColor = vec4(base + hot * pulse, 0.3 + pulse * 0.6);
          }
        `,
      }),
    []
  );
  const pointMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.05,
        color: new THREE.Color("#bfe8ff").multiplyScalar(0.9),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(() => {
    lineMat.uniforms.uTime.value = stage.time;
  });

  return (
    <group>
      <lineSegments geometry={lineGeo} material={lineMat} />
      <points geometry={pointGeo} material={pointMat} />
    </group>
  );
}

export default function Mind({ index, camera }: ChapterProps) {
  const rig = useRef<THREE.Group>(null);
  const gyro = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const rest = useMemo(() => new THREE.Vector3(0, 0.3, 7.4), []);
  const from = useMemo(() => new THREE.Vector3(0, 0.1, 2.2), []);
  const look = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const high = stage.high;

  useFrame(() => {
    if (!isActive(index)) return;
    const t = stage.time;
    const { drift, arrive } = chapterTimeline(index);
    stage.focus[index].set(0, 0, 0);
    stage.anchor[index].set(0, 0, 0);

    if (rig.current) {
      rig.current.rotation.y = t * 0.08 + drift * 1.2;
      rig.current.scale.setScalar(0.6 + arrive * 0.4);
    }
    if (shell.current) {
      shell.current.rotation.x = t * 0.05;
      shell.current.rotation.z = t * 0.03;
    }
    if (gyro.current) {
      gyro.current.children.forEach((c, i) => {
        c.rotation.x = t * (0.3 + i * 0.15);
        c.rotation.y = t * (0.2 - i * 0.1);
      });
    }
    rigCamera(camera, index, rest, look, { from, parallax: 0.6, fov: 36, diveFov: 24 });
  });

  return (
    <>
      <Backdrop top="#030b24" mid="#08225e" bottom="#0e3d8c" grid={0.018} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={10} distance={8} color="#ffc16b" />
      <directionalLight position={[3, 5, 4]} intensity={1.4} color="#bfe0ff" />

      <Dust index={index} count={high ? 700 : 300} radius={14} size={0.025} color="#9fd4ff" />
      <Synapses count={high ? 170 : 90} />

      <group ref={rig}>
        <Plasma />
        <Halo color="#ffb35a" size={3.2} intensity={0.45} />
        <group ref={gyro}>
          {[0.62, 0.74, 0.86].map((r, i) => (
            <group key={r}>
              <mesh material={i === 1 ? M.gold : M.chrome}>
                <torusGeometry args={[r, 0.012, 10, 128]} />
              </mesh>
              <mesh position={[r, 0, 0]} material={M.glowCyan}>
                <sphereGeometry args={[0.02, 12, 12]} />
              </mesh>
            </group>
          ))}
        </group>
        <group ref={shell}>
          <Lattice radius={1.35} />
        </group>
        <group rotation={[1.2, 0.2, 0]}>
          <AstroRing radius={2.25} width={0.42} speed={0.04} seed={1} />
        </group>
        <group rotation={[-0.5, 0.9, 0.3]}>
          <AstroRing radius={2.95} width={0.24} speed={-0.03} seed={4} color="#8fdcff" />
        </group>
        <group rotation={[0.15, -0.6, 1.1]}>
          <mesh material={M.goldBrushed}>
            <torusGeometry args={[1.9, 0.02, 10, 200]} />
          </mesh>
        </group>
      </group>
    </>
  );
}
