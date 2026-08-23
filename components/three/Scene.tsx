"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Grid } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { scrollState, damp } from "@/lib/scroll";
import AICore from "./AICore";
import Rings from "./Rings";
import NeuralField from "./NeuralField";
import DataStreams from "./DataStreams";

/** Drives the camera from scroll position + pointer parallax. */
function CameraRig() {
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = scrollState.progress;

    // A gentle arc through the scene as the page scrolls.
    const wantX = Math.sin(p * Math.PI * 1.6) * 3.4 + state.pointer.x * 0.9;
    const wantY = 0.2 + p * 2.2 + state.pointer.y * 0.6;
    const wantZ = 7.2 + p * 4.5;

    state.camera.position.x = damp(state.camera.position.x, wantX, 2.2, dt);
    state.camera.position.y = damp(state.camera.position.y, wantY, 2.2, dt);
    state.camera.position.z = damp(state.camera.position.z, wantZ, 2.2, dt);

    target.set(0, p * 1.1, 0);
    state.camera.lookAt(target);
  });

  return null;
}

/** The whole core assembly, which drifts aside as you scroll into the content. */
function CoreAssembly({ quality }: { quality: "high" | "low" }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.1);
    const p = scrollState.progress;
    const scale = 1 - Math.min(p * 0.9, 0.42);
    ref.current.scale.setScalar(damp(ref.current.scale.x, scale, 2.5, dt));
    ref.current.position.y = damp(ref.current.position.y, p * 1.9, 2.5, dt);
  });

  return (
    <group ref={ref}>
      <AICore detail={quality === "high" ? 20 : 10} />
      <Rings />
      <NeuralField count={quality === "high" ? 130 : 70} />
    </group>
  );
}

export default function Scene() {
  // Client-only (this module is loaded with ssr:false), so reading the
  // environment during the lazy initializer is safe.
  const [quality] = useState<"high" | "low">(() => {
    if (typeof window === "undefined") return "high";
    const smallScreen = window.innerWidth < 820;
    const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    return smallScreen || weakCpu || reduced ? "low" : "high";
  });

  const high = quality === "high";

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 52 }}
        dpr={high ? [1, 1.8] : [1, 1.25]}
        gl={{ antialias: high, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#04050c"]} />
        <fog attach="fog" args={["#04050c", 9, 30]} />

        <ambientLight intensity={0.35} />
        <pointLight position={[6, 5, 6]} intensity={40} color="#00d9ff" />
        <pointLight position={[-7, -4, -4]} intensity={30} color="#ff3ea5" />

        <CameraRig />

        <Suspense fallback={null}>
          <CoreAssembly quality={quality} />
          <DataStreams count={high ? 26 : 12} />

          <Grid
            position={[0, -4.2, 0]}
            args={[40, 40]}
            cellSize={0.7}
            cellThickness={0.5}
            cellColor="#12304a"
            sectionSize={3.5}
            sectionThickness={1.1}
            sectionColor="#00d9ff"
            fadeDistance={34}
            fadeStrength={1.5}
            infiniteGrid
            followCamera={false}
          />

          <Stars
            radius={70}
            depth={45}
            count={high ? 2600 : 1100}
            factor={3.2}
            saturation={0}
            fade
            speed={0.5}
          />
        </Suspense>

        <EffectComposer enableNormalPass={false}>
          <Bloom
            intensity={high ? 1.5 : 0.9}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
          <Vignette offset={0.22} darkness={0.92} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
