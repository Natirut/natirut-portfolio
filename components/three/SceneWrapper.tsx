"use client";

import dynamic from "next/dynamic";

// WebGL never runs on the server, so skip SSR entirely for the scene.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed inset-0 z-0 bg-gradient-to-b from-[#0759c2] via-[#1b8fe3] to-[#9fdcfa]"
      aria-hidden
    />
  ),
});

export default function SceneWrapper() {
  return <Scene />;
}
