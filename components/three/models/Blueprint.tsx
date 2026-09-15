"use client";

import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

/**
 * Re-renders any subtree as a technical drawing: hard edges become ink lines,
 * and every surface gets contour hatching plus a silhouette rim. A clipping
 * plane lets the drawing "print" progressively.
 */
export function useBlueprintMaterials(line: string, fill: string, clip: THREE.Plane) {
  return useMemo(() => {
    const surface = new THREE.ShaderMaterial({
      clipping: true,
      clippingPlanes: [clip],
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      uniforms: {
        uLine: { value: new THREE.Color(line) },
        uFill: { value: new THREE.Color(fill) },
        uDensity: { value: 26 },
      },
      vertexShader: /* glsl */ `
        #include <clipping_planes_pars_vertex>
        varying vec3 vW;
        varying vec3 vN;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vW = wp.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <clipping_planes_vertex>
        }
      `,
      fragmentShader: /* glsl */ `
        #include <clipping_planes_pars_fragment>
        uniform vec3 uLine, uFill;
        uniform float uDensity;
        varying vec3 vW;
        varying vec3 vN;
        void main() {
          #include <clipping_planes_fragment>
          vec3 v = normalize(cameraPosition - vW);
          float rim = 1.0 - abs(dot(normalize(vN), v));
          float sil = smoothstep(0.62, 0.92, rim);

          float y = vW.y * uDensity;
          float fy = fwidth(y);
          float dy = min(fract(y), 1.0 - fract(y));
          float contour = 1.0 - smoothstep(0.0, fy * 1.3, dy);

          // cross-hatch the faces turned away from the "lamp"
          float shade = clamp(dot(normalize(vN), normalize(vec3(-0.4, 0.8, 0.5))), 0.0, 1.0);
          float h = (vW.x + vW.z) * uDensity * 1.6;
          float fh = fwidth(h);
          float dh = min(fract(h), 1.0 - fract(h));
          float hatch = (1.0 - smoothstep(0.0, fh * 1.2, dh)) * smoothstep(0.45, 0.05, shade);

          float ink = max(max(contour * 0.5, sil * 0.95), hatch * 0.35);
          gl_FragColor = vec4(mix(uFill, uLine, ink), 1.0);
        }
      `,
    });
    const edges = new THREE.LineBasicMaterial({
      color: new THREE.Color(line),
      transparent: true,
      opacity: 0.9,
      clippingPlanes: [clip],
    });
    return { surface, edges };
  }, [line, fill, clip]);
}

export default function Blueprint({
  children,
  line = "#e9f3ff",
  fill = "#0f4aa0",
  clip,
}: {
  children: ReactNode;
  line?: string;
  fill?: string;
  clip: THREE.Plane;
}) {
  const ref = useRef<THREE.Group>(null);
  const { surface, edges } = useBlueprintMaterials(line, fill, clip);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const added: THREE.LineSegments[] = [];
    // defer one tick so drei helpers (RoundedBox) have built their geometry
    const id = requestAnimationFrame(() => {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || (obj as THREE.Sprite).isSprite || mesh.userData.blueprint) return;
        mesh.userData.blueprint = true;
        mesh.material = surface;
        if ((mesh as unknown as THREE.InstancedMesh).isInstancedMesh) return;
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), edges);
        lines.userData.blueprint = true;
        mesh.add(lines);
        added.push(lines);
      });
      root.traverse((obj) => {
        if ((obj as THREE.Sprite).isSprite) obj.visible = false;
      });
    });
    return () => {
      cancelAnimationFrame(id);
      added.forEach((l) => {
        l.removeFromParent();
        l.geometry.dispose();
      });
    };
  }, [surface, edges]);

  return <group ref={ref}>{children}</group>;
}
