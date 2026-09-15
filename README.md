# Natirut Duangpak — 3D Resume

A scroll-driven, cinematic resume. Six hand-built WebGL scenes, all set in a world of porcelain androids and gold circuitry. As you scroll, the camera **dives** into a focal point in each scene (the android's eye, the neural core, the processor), and the next scene blooms through a halftone-dot dissolve. The look borrows from editorial print: halftone clouds, engraved line work, serif type and hairline guides.

Every model is built in code from Three.js primitives. There are no external 3D assets.

**Live:** _(add your Vercel URL here after deploying)_

## The chapters

| # | Scene | Resume section |
| --- | --- | --- |
| 00 | **The Sky**: a porcelain android under a gilded, engraved halo, adrift in halftone clouds | Hero |
| 01 | **The Mind**: a plasma heart inside a gold icosahedral lattice, astrolabe rings and a pulsing synapse web | Profile |
| 02 | **The Work**: industrial robot arms welding a compute monolith inside scaffolding, with sparks | Experience |
| 03 | **The Toolkit**: an articulated robotic hand offering a processor while skill modules orbit it | Skills |
| 04 | **The Record**: the android redrawn as a blueprint that prints itself layer by layer | Credentials |
| 05 | **The Reach**: the android on a classical column at golden hour, gazing at a glowing orb | Contact |

## How it works

- **Director** ([components/three/Scene.tsx](components/three/Scene.tsx)): each chapter lives in its own `THREE.Scene` via `createPortal`. Every frame, only the current chapter (and the next one, during a dive) is rendered into multisampled half-float render targets.
- **Compositor** ([components/three/compositor.ts](components/three/compositor.ts)): a full-screen shader that zooms scene A toward its focus with radial blur and chromatic fringe, grows scene B out of its anchor, and swaps them through a rotated halftone screen. It then applies highlight roll-off, grain and a vignette.
- **Scroll mapping** ([components/ui/SmoothScroll.tsx](components/ui/SmoothScroll.tsx)): Lenis smooth scrolling plus keyframes taken from each section's DOM position. That way the camera rests while a section is on screen and dives in the spacers between sections.
- **Camera rig** ([components/three/stage.ts](components/three/stage.ts)): arrive, rest and dive easing, pointer parallax, and an automatic pull-back on portrait screens.
- **Blueprint shader** ([components/three/models/Blueprint.tsx](components/three/models/Blueprint.tsx)): re-renders any model as contour lines, cross-hatching, silhouette rims and edge lines, revealed by a clipping plane.
- **Performance**: drei `PerformanceMonitor` steps the pixel ratio down or up to hold the frame rate. Inactive chapters skip their animation work, and smaller or low-core devices get a lighter tier.

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Three.js · @react-three/fiber · @react-three/drei · Lenis · Tailwind CSS · lucide-react

## Run locally

Requires [Node.js 18.18+](https://nodejs.org).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Editing the content

All resume content lives in [`data/resume.ts`](data/resume.ts). The one-line chapter captions and the "dive" lines are in [`app/page.tsx`](app/page.tsx).

## Deploy to Vercel

1. Push to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Next.js is detected automatically. Click **Deploy**.

## Project structure

```
app/                         layout, page, global styles, icon
components/three/Scene.tsx   director: portals, render targets, compositor pass
components/three/chapters/   HeroSky, Mind, Assembly, Hand, Schematic, Reach
components/three/models/     Android, RobotHand, RobotArm, Chip, Blueprint
components/three/parts/      Backdrop, halftone Clouds, Halo, Dust
components/ui/               SmoothScroll, Hud, Nav, Hero, Dive, sections
data/resume.ts               all resume content
lib/                         scroll store, GLSL noise
```
