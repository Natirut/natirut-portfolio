"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Float, MeshDistortMaterial } from "@react-three/drei";

type ShapeKind = "icosahedron" | "torusKnot" | "octahedron";

function FloatingShape({
  position,
  color,
  geometry,
  speed = 1,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  geometry: ShapeKind;
  speed?: number;
  scale?: number;
}) {
  return (
    <Float speed={speed} rotationIntensity={1.2} floatIntensity={1.5}>
      <mesh position={position} scale={scale}>
        {geometry === "icosahedron" && <icosahedronGeometry args={[1, 0]} />}
        {geometry === "torusKnot" && (
          <torusKnotGeometry args={[0.8, 0.25, 128, 16]} />
        )}
        {geometry === "octahedron" && <octahedronGeometry args={[1, 0]} />}
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.6}
          distort={0.3}
          speed={1.5}
          wireframe
        />
      </mesh>
    </Float>
  );
}

export default function BackgroundScene() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <Canvas camera={{ position: [0, 0, 8], fov: 55 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#7c9dff" />
          <pointLight
            position={[-10, -5, -10]}
            intensity={0.8}
            color="#ff7cd4"
          />
          <Stars
            radius={60}
            depth={40}
            count={2500}
            factor={3}
            saturation={0}
            fade
            speed={0.6}
          />
          <FloatingShape
            position={[-4, 2, -3]}
            color="#7c9dff"
            geometry="icosahedron"
            speed={0.8}
            scale={1.4}
          />
          <FloatingShape
            position={[4.5, -1.5, -4]}
            color="#ff7cd4"
            geometry="torusKnot"
            speed={1.1}
            scale={1}
          />
          <FloatingShape
            position={[3, 3, -6]}
            color="#9dffb0"
            geometry="octahedron"
            speed={1.4}
            scale={1.1}
          />
          <FloatingShape
            position={[-3.5, -3, -5]}
            color="#ffd27c"
            geometry="icosahedron"
            speed={1}
            scale={0.9}
          />
          <fog attach="fog" args={["#05060a", 8, 20]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
