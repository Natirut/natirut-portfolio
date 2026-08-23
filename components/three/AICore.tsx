"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { simplexNoise } from "@/lib/glsl";

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uDistort;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

${simplexNoise}

void main() {
  // The geometry is a unit sphere, so the outward direction is simply the
  // normalized position. Using it (instead of the flat-shaded face normal)
  // keeps the displaced surface seamless.
  vec3 dir = normalize(position);

  float n1 = snoise(dir * 1.7 + vec3(0.0, uTime * 0.22, 0.0));
  float n2 = snoise(dir * 4.2 - vec3(uTime * 0.16));
  float d = n1 * 0.20 + n2 * 0.07;

  vNoise = d;
  vec3 displaced = position + dir * d * uDistort;

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vView = mv.xyz;
  vNormal = normalize(normalMatrix * dir);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(-vView);
  float fres = pow(1.0 - clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0), 2.2);

  vec3 col = mix(uColorA, uColorB, clamp(vNoise * 2.2 + 0.5, 0.0, 1.0));

  // Horizontal energy bands scanning up the sphere.
  float band = sin(vView.y * 9.0 - uTime * 2.2) * 0.5 + 0.5;
  band = pow(band, 8.0) * 0.9;

  float glow = fres * 2.1 + band + 0.10;
  gl_FragColor = vec4(col * glow, clamp(fres * 0.95 + band * 0.6 + 0.05, 0.0, 1.0));
}
`;

export default function AICore({ detail = 20 }: { detail?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const seedRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistort: { value: 1 },
      uColorA: { value: new THREE.Color("#00d9ff") },
      uColorB: { value: new THREE.Color("#7b5cff") },
    }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (matRef.current) matRef.current.uniforms.uTime.value = t;
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
    if (shellRef.current) {
      shellRef.current.rotation.y -= delta * 0.25;
      shellRef.current.rotation.x += delta * 0.08;
    }
    if (seedRef.current) {
      const s = 1 + Math.sin(t * 2.4) * 0.09;
      seedRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Holographic energy body */}
      <mesh>
        <icosahedronGeometry args={[1.55, detail]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Faceted wireframe shell counter-rotating around it */}
      <mesh ref={shellRef} scale={1.28}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshBasicMaterial
          color="#00d9ff"
          wireframe
          transparent
          opacity={0.22}
          toneMapped={false}
        />
      </mesh>

      {/* Bright inner seed — the part that really blooms */}
      <mesh ref={seedRef}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshBasicMaterial color="#d8fbff" toneMapped={false} />
      </mesh>
    </group>
  );
}
