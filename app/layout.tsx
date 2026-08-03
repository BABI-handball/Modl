import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/src/components/Navbar";
import { BetaBanner } from "@/src/components/BetaBanner";
import { SeedInitializer } from "@/src/components/SeedInitializer";
import { SkipToContent } from "@/src/components/ui/SkipToContent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MODL - Plateforme de casting mode",
  description: "Fluidifie les échanges entre mannequins, photographes et marques",
  icons: {
    icon: [
      { url: "/modl-favicon-v2.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/modl-favicon-v2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased flex min-h-dvh flex-col bg-[#faf9f7]`}
        style={{ position: 'relative' }}
      >
        <SkipToContent />
        <SeedInitializer />
        <BetaBanner />
        <main id="main-content" className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-visible">
          {children}
        </main>
        <Navbar />
      </body>
    </html>
  );
}
