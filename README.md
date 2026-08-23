# Natirut Duangpak — 3D AI Portfolio

An interactive, futuristic portfolio built around a real-time **Three.js** scene: a shader-driven AI core wrapped in a neural network, orbiting gyroscope rings, an infinite grid horizon and bloom post-processing — with the résumé content layered on top as holographic HUD panels.

**Live:** _(add your Vercel URL here after deploying)_

## The 3D scene

| Element | How it works |
| --- | --- |
| **AI core** | Custom GLSL `ShaderMaterial` — simplex-noise vertex displacement plus a Fresnel rim and scanning energy bands, additively blended |
| **Neural field** | ~130 nodes on a Fibonacci sphere, auto-wired with `lineSegments` wherever two nodes fall within range |
| **Gyro rings** | Three tilted tori counter-rotating, each carrying a travelling data node |
| **Data streams** | Vertical light streaks rising on a loop |
| **Horizon** | drei `<Grid infiniteGrid>` with distance fade |
| **Post-processing** | Selective bloom (`mipmapBlur`) + vignette via `@react-three/postprocessing` |
| **Camera** | Scroll position and pointer parallax drive an exponentially damped camera rig |

## Interface details

- Terminal **boot sequence** on first load
- **Glitch** treatment on the name (pure CSS clip-path + RGB split)
- Rotating **typewriter** job title
- Custom **cursor** that expands over interactive targets
- **HUD overlay** — corner brackets, vertical rails, live scroll telemetry, clock, scanline sweep
- **Holo cards** that tilt toward the pointer with a radial sheen
- Scroll-triggered reveals, count-up statistics, and an infinite tech marquee

Performance and accessibility are handled: the scene drops to a lighter quality tier on small screens, weak CPUs, or when `prefers-reduced-motion` is set, and that same query skips the boot animation and flattens transitions.

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Three.js · @react-three/fiber · @react-three/drei · @react-three/postprocessing · Tailwind CSS · lucide-react

## Run locally

Requires [Node.js 18.18+](https://nodejs.org).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Editing the content

Every piece of résumé content lives in [`data/resume.ts`](data/resume.ts) — profile, stats, experience, skills, credentials and contact details. Edit that one file; no component changes needed.

## Deploy to Vercel

1. Push to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Next.js is auto-detected — no configuration required. Click **Deploy**.

## Project structure

```
app/                 layout, page, global styles
components/three/    Scene, AICore, Rings, NeuralField, DataStreams
components/ui/       Boot, Hud, Cursor, Nav, Hero, sections, cards
data/resume.ts       all résumé content
lib/                 scroll store, GLSL noise
```
