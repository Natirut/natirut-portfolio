"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { simplexNoise } from "@/lib/glsl";
import { getHaloTexture } from "../materials";
import { isActive, stage } from "../stage";

/* ------------------------------------------------------------------ */
/* Backdrop: a huge inverted sphere with a painted vertical gradient,  */
/* an optional halftone sun and a faint engraved line texture.         */
/* ------------------------------------------------------------------ */

export function Backdrop({
  top,
  mid,
  bottom,
  sun,
  sunDir = [0.4, 0.25, -1],
  engrave = 0,
  grid = 0,
}: {
  top: string;
  mid: string;
  bottom: string;
  sun?: string;
  sunDir?: [number, number, number];
  engrave?: number;
  grid?: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(top) },
          uMid: { value: new THREE.Color(mid) },
          uBottom: { value: new THREE.Color(bottom) },
          uSun: { value: new THREE.Color(sun ?? "#000000") },
          uSunOn: { value: sun ? 1 : 0 },
          uSunDir: { value: new THREE.Vector3(...sunDir).normalize() },
          uEngrave: { value: engrave },
          uGrid: { value: grid },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop, uMid, uBottom, uSun, uSunDir;
          uniform float uSunOn, uEngrave, uGrid;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col = mix(uMid, uTop, smoothstep(0.0, 0.75, h));
            col = mix(col, uBottom, smoothstep(0.05, -0.45, h));

            if (uSunOn > 0.5) {
              float d = max(dot(vDir, uSunDir), 0.0);
              col += uSun * pow(d, 60.0) * 1.6 + uSun * pow(d, 6.0) * 0.28;
            }

            // engraved hatching, like an old etching plate
            if (uEngrave > 0.0) {
              float lines = abs(fract((vDir.x * 0.7 + vDir.y) * 180.0) - 0.5);
              float w = fwidth((vDir.x * 0.7 + vDir.y) * 180.0);
              float hatch = 1.0 - smoothstep(0.0, w * 1.4, lines - 0.28);
              col *= 1.0 - hatch * uEngrave * smoothstep(0.2, -0.6, h + 0.3);
            }

            if (uGrid > 0.0) {
              vec2 q = vec2(atan(vDir.z, vDir.x) * 12.0, vDir.y * 24.0);
              vec2 fq = abs(fract(q) - 0.5);
              vec2 wq = fwidth(q);
              float g = 1.0 - min(smoothstep(0.0, wq.x * 1.2, 0.5 - fq.x),
                                  smoothstep(0.0, wq.y * 1.2, 0.5 - fq.y));
              col += g * uGrid;
            }

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[180, 48, 32]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Halftone clouds: soft billboards shaded with a screen-space dot     */
/* screen, the signature look of the reference piece.                  */
/* ------------------------------------------------------------------ */

const cloudVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFragment = /* glsl */ `
  ${simplexNoise}
  uniform float uSeed, uTime, uOpacity, uDot;
  uniform vec3 uLight, uShade;
  uniform vec4 uBlobs;
  varying vec2 vUv;

  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 3; i++) { s += a * snoise(p); p *= 2.03; a *= 0.5; }
    return s;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = 0.0;
    d += smoothstep(1.0, 0.15, length((p - vec2(0.0, -0.18)) * vec2(1.05, 2.6)));
    d += smoothstep(0.52, 0.0, length(p - vec2(-0.32 + uBlobs.x, 0.0)));
    d += smoothstep(0.46, 0.0, length(p - vec2(0.28 + uBlobs.y, 0.04)));
    d += smoothstep(0.40, 0.0, length(p - vec2(uBlobs.z, 0.24 + uBlobs.w)));
    d += smoothstep(0.30, 0.0, length(p - vec2(0.55, -0.12)));
    // skip the noise entirely where no cloud can form
    if (d < 0.08) discard;
    float n = fbm(vec3(p * 2.2, uSeed + uTime * 0.025));
    float dens = d + n * 0.42 - 0.5;
    float alpha = smoothstep(0.0, 0.22, dens) * smoothstep(1.0, 0.8, length(p));
    if (alpha < 0.01) discard;

    float light = clamp(0.35 + p.y * 1.1 + n * 0.45 + dens * 0.2, 0.0, 1.0);

    // rotated screen-space dot grid
    vec2 fc = gl_FragCoord.xy / uDot;
    fc = mat2(0.866, -0.5, 0.5, 0.866) * fc;
    vec2 cell = fract(fc) - 0.5;
    float r = (1.0 - light) * 0.62;
    float dotm = 1.0 - smoothstep(r - 0.12, r + 0.12, length(cell));

    vec3 col = mix(uLight, uShade, dotm * 0.9);
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

type CloudSpec = {
  position: [number, number, number];
  scale: [number, number];
  seed: number;
};

export function Clouds({
  items,
  light = "#ffffff",
  shade = "#7fb6e6",
  drift = 0.08,
  index,
}: {
  items: CloudSpec[];
  light?: string;
  shade?: string;
  drift?: number;
  index: number;
}) {
  const group = useRef<THREE.Group>(null);

  const materials = useMemo(
    () =>
      items.map((c) => {
        const rnd = (k: number) => Math.sin(c.seed * 91.7 + k * 12.9) * 0.12;
        return new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: {
            uSeed: { value: c.seed },
            uTime: { value: 0 },
            uOpacity: { value: 1 },
            uDot: { value: 4.5 * Math.min(window.devicePixelRatio, 2) },
            uLight: { value: new THREE.Color(light).multiplyScalar(1.05) },
            uShade: { value: new THREE.Color(shade) },
            uBlobs: { value: new THREE.Vector4(rnd(1), rnd(2), rnd(3), rnd(4)) },
          },
          vertexShader: cloudVertex,
          fragmentShader: cloudFragment,
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(({ camera }) => {
    if (!isActive(index) || !group.current) return;
    group.current.children.forEach((child, i) => {
      const spec = items[i];
      child.position.x = spec.position[0] + Math.sin(stage.time * 0.05 + spec.seed) * drift * 6;
      child.quaternion.copy(camera.quaternion);
      materials[i].uniforms.uTime.value = stage.time;
    });
  });

  return (
    <group ref={group}>
      {items.map((c, i) => (
        <mesh
          key={i}
          position={c.position}
          scale={[c.scale[0], c.scale[1], 1]}
          material={materials[i]}
          renderOrder={-5}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Glow sprite                                                          */
/* ------------------------------------------------------------------ */

export function Halo({
  color = "#8ff8ff",
  size = 1,
  intensity = 1,
  position,
}: {
  color?: string;
  size?: number;
  intensity?: number;
  position?: [number, number, number];
}) {
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: getHaloTexture(),
        color: new THREE.Color(color).multiplyScalar(intensity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    [color, intensity]
  );
  return <sprite material={material} scale={[size, size, size]} position={position} />;
}

/* ------------------------------------------------------------------ */
/* Dust: slow floating motes catching the light                         */
/* ------------------------------------------------------------------ */

export function Dust({
  count = 400,
  radius = 12,
  color = "#ffffff",
  size = 0.035,
  index,
  opacity = 0.8,
}: {
  count?: number;
  radius?: number;
  color?: string;
  size?: number;
  index: number;
  opacity?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count, radius]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size * 900 },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
        },
        vertexShader: /* glsl */ `
          uniform float uTime, uSize;
          attribute float aSeed;
          varying float vA;
          void main() {
            vec3 p = position;
            p.y += sin(uTime * 0.3 + aSeed * 40.0) * 0.35;
            p.x += cos(uTime * 0.2 + aSeed * 23.0) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = uSize * (0.4 + aSeed) / -mv.z;
            vA = 0.35 + 0.65 * sin(uTime * 1.3 + aSeed * 60.0) * 0.5 + 0.5;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor * a, a * vA * uOpacity);
          }
        `,
      }),
    [size, color, opacity]
  );

  useFrame(() => {
    if (!isActive(index)) return;
    material.uniforms.uTime.value = stage.time;
    if (ref.current) ref.current.rotation.y = stage.time * 0.01;
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
