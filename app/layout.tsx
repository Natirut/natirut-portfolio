import type { Metadata, Viewport } from "next";
import { Orbitron, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import SceneWrapper from "@/components/three/SceneWrapper";
import Boot from "@/components/ui/Boot";
import Cursor from "@/components/ui/Cursor";
import Hud from "@/components/ui/Hud";
import ScrollDriver from "@/components/ui/ScrollDriver";

const display = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Natirut Duangpak — Senior Programmer",
  description:
    "Interactive 3D portfolio of Natirut Duangpak — Senior Programmer and Software Developer specialising in C#, .NET, SQL Server and the Microsoft Power Platform.",
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
      "Interactive 3D portfolio — C#, .NET, SQL Server and Microsoft Power Platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04050c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${sans.variable}`}
    >
      <body className="bg-void font-sans text-ink antialiased">
        <Boot />
        <ScrollDriver />
        <SceneWrapper />
        <Hud />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
