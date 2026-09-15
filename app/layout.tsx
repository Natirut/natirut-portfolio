import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SceneWrapper from "@/components/three/SceneWrapper";
import Preloader from "@/components/ui/Preloader";
import Cursor from "@/components/ui/Cursor";
import Hud from "@/components/ui/Hud";
import SmoothScroll from "@/components/ui/SmoothScroll";
import CopyGuard from "@/components/ui/CopyGuard";

// Geist (by Vercel), self-hosted from app/fonts under the SIL Open Font License, no CDN.
const sans = localFont({
  src: [{ path: "./fonts/Geist-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
  fallback: ["-apple-system", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const mono = localFont({
  src: [{ path: "./fonts/GeistMono-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "Natirut Duangpak — Senior Programmer",
  description:
    "Interactive 3D resume of Natirut Duangpak — Senior Programmer and Software Developer specialising in C#, .NET, SQL Server and the Microsoft Power Platform.",
  keywords: [
    "Natirut Duangpak",
    "Senior Programmer",
    "Software Developer",
    "C#",
    ".NET",
    "SQL Server",
    "Power Platform",
    "Thailand",
  ],
  openGraph: {
    title: "Natirut Duangpak — Senior Programmer",
    description:
      "Interactive 3D resume — C#, .NET, SQL Server and Microsoft Power Platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#030b22",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${mono.variable} ${sans.variable}`}
    >
      <body className="font-sans antialiased">
        <CopyGuard />
        <Preloader />
        <SmoothScroll />
        <SceneWrapper />
        <Hud />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
