"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, useFBO } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CHAPTER_COUNT, damp, scrollState, smoothstep } from "@/lib/scroll";
import { stage, type ChapterProps } from "./stage";
import { compositorFragment, compositorVertex } from "./compositor";
import HeroSky from "./chapters/HeroSky";
import Mind from "./chapters/Mind";
import Assembly from "./chapters/Assembly";
import Hand from "./chapters/Hand";
import Schematic from "./chapters/Schematic";
import Reach from "./chapters/Reach";

const CHAPTERS: React.ComponentType<ChapterProps>[] = [HeroSky, Mind, Assembly, Hand, Schematic, Reach];

/** Accent colour of the halftone rim for each dive (from chapter i into i+1). */
const RIMS = ["#9ff6ff", "#ffc877", "#fff1c9", "#8fd8ff", "#ffd49a", "#ffffff"];

const project = new THREE.Vector3();

function Director({ high }: { high: boolean }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  stage.high = high;

  const scenes = useMemo(() => CHAPTERS.map(() => new THREE.Scene()), []);
  const cameras = useMemo(
    () => CHAPTERS.map(() => new THREE.PerspectiveCamera(34, 1, 0.05, 400)),
    []
  );

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scenes.forEach((s) => {
      s.environment = env;
    });
    pmrem.dispose();
    return () => env.dispose();
  }, [gl, scenes]);

  const samples = high ? 2 : 0;
  const fboA = useFBO({ samples, depthBuffer: true });
  const fboB = useFBO({ samples, depthBuffer: true });

  const quad = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: compositorVertex,
      fragmentShader: compositorFragment,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        tA: { value: null },
        tB: { value: null },
        uMix: { value: 0 },
        uTime: { value: 0 },
        uFocus: { value: new THREE.Vector2(0.5, 0.5) },
        uAnchor: { value: new THREE.Vector2(0.5, 0.5) },
        uRes: { value: new THREE.Vector2(1, 1) },
        uRim: { value: new THREE.Color() },
        uVelocity: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    return { scene, material, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    stage.time += dt;
    stage.g = damp(stage.g, scrollState.chapter, 6, dt);
    if (Math.abs(stage.g - scrollState.chapter) < 1e-4) stage.g = scrollState.chapter;
    stage.px = damp(stage.px, state.pointer.x, 3, dt);
    stage.py = damp(stage.py, state.pointer.y, 3, dt);

    const aspect = size.width / size.height;
    stage.aspect = aspect;
    const wide = aspect > 1.15;
    cameras.forEach((cam) => {
      // frame the subject in the right half on wide screens, upper half on tall ones
      const fullH = 1000;
      const fullW = fullH * aspect;
      const offX = wide ? -fullW * 0.17 : 0;
      const offY = wide ? 0 : fullH * 0.1;
      if (
        cam.aspect !== aspect ||
        !cam.view ||
        cam.view.offsetX !== offX ||
        cam.view.offsetY !== offY
      ) {
        cam.aspect = aspect;
        cam.setViewOffset(fullW, fullH, offX, offY, fullW, fullH);
        cam.updateProjectionMatrix();
      }
    });

    const g = Math.max(0, Math.min(CHAPTER_COUNT - 1, stage.g));
    const i = Math.min(CHAPTER_COUNT - 1, Math.floor(g));
    const f = g - i;
    const hasNext = i < CHAPTER_COUNT - 1;
    const mix = hasNext ? smoothstep(0.34, 0.8, f) : 0;

    gl.setRenderTarget(fboA);
    gl.clear();
    gl.render(scenes[i], cameras[i]);

    const u = quad.material.uniforms;
    if (mix > 0.01) {
      gl.setRenderTarget(fboB);
      gl.clear();
      gl.render(scenes[i + 1], cameras[i + 1]);
      project.copy(stage.anchor[i + 1]).project(cameras[i + 1]);
      u.uAnchor.value.set(project.x * 0.5 + 0.5, project.y * 0.5 + 0.5);
    }
    gl.setRenderTarget(null);

    project.copy(stage.focus[i]).project(cameras[i]);
    const fx = THREE.MathUtils.clamp(project.x * 0.5 + 0.5, 0.05, 0.95);
    const fy = THREE.MathUtils.clamp(project.y * 0.5 + 0.5, 0.05, 0.95);
    u.uFocus.value.set(fx, fy);

    u.tA.value = fboA.texture;
    u.tB.value = fboB.texture;
    u.uMix.value = mix > 0.01 ? mix : 0;
    u.uTime.value = stage.time;
    u.uRes.value.set(size.width * state.viewport.dpr, size.height * state.viewport.dpr);
    u.uRim.value.set(RIMS[i]);
    u.uVelocity.value = damp(u.uVelocity.value, Math.min(1, Math.abs(scrollState.velocity) / 60), 4, dt);

    gl.render(quad.scene, quad.camera);
  }, 1);

  return (
    <>
      {CHAPTERS.map((Chapter, k) => (
        <Fragment key={k}>
          {createPortal(<Chapter index={k} camera={cameras[k]} />, scenes[k], {
            camera: cameras[k],
          })}
        </Fragment>
      ))}
    </>
  );
}

export default function Scene() {
  const [high] = useState(() => {
    if (typeof window === "undefined") return true;
    const smallScreen = window.innerWidth < 820;
    const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
    return !(smallScreen || weakCpu);
  });

  const maxDpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, high ? 1.75 : 1.25);
  const [dpr, setDpr] = useState(maxDpr);

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.setClearColor("#0b5fc4");
        }}
      >
        {/* step resolution down (and back up) to hold a smooth frame rate */}
        <PerformanceMonitor
          bounds={() => [48, 58]}
          flipflops={4}
          onDecline={() => setDpr((d) => Math.max(0.75, +(d - 0.25).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, +(d + 0.25).toFixed(2)))}
        />
        <Director high={high} />
      </Canvas>
    </div>
  );
}
