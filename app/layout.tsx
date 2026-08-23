import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackgroundScene from "@/components/BackgroundScene";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Natirut Duangpak — Senior Programmer",
  description:
    "Portfolio of Natirut Duangpak, Senior Programmer / Software Developer specializing in C#, .NET, SQL Server and Power Platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased selection:bg-accent/30">
        <BackgroundScene />
        {children}
      </body>
    </html>
  );
}
