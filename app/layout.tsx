import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import SceneWrapper from "@/components/three/SceneWrapper";
import Preloader from "@/components/ui/Preloader";
import Cursor from "@/components/ui/Cursor";
import Hud from "@/components/ui/Hud";
import SmoothScroll from "@/components/ui/SmoothScroll";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
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
  themeColor: "#0b5fc4",
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
      <body className="font-sans antialiased">
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
