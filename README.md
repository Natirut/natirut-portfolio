# Natirut Duangpak — 3D Portfolio

A resume/portfolio site built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and a **Three.js** background (via `@react-three/fiber` + `@react-three/drei`) — floating wireframe shapes and a starfield behind glassmorphic content cards.

## Tech stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Three.js / @react-three/fiber / @react-three/drei
- Tailwind CSS
- lucide-react icons

## Getting started locally

Requires [Node.js 18.18+](https://nodejs.org).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Editing content

All resume content lives in one place: [`data/resume.ts`](data/resume.ts). Edit that file to update your name, summary, experience, education, skills, certifications, or contact info — no need to touch the components.

## Deploy to Vercel

1. Push this repo to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import this repository.
3. Framework preset "Next.js" is auto-detected — no config needed. Click **Deploy**.

Alternatively, with the [Vercel CLI](https://vercel.com/docs/cli) installed and logged in:

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Push to GitHub

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```
