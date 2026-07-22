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
    // Utiliser le nouveau logo local pour l’icône de l’application
    icon: '/logo-modl.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${playfair.variable} antialiased`} style={{ backgroundColor: '#faf9f7', position: 'relative' }}>
        <SkipToContent />
        <SeedInitializer />
        <BetaBanner />
        <main id="main-content" className="relative z-[1] min-h-0 overflow-visible">
          {children}
        </main>
        <Navbar />
      </body>
    </html>
  );
}
