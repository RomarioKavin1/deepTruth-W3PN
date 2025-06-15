import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "@/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "@/components/ThemeProvider";
import CofheProvider from "@/utils/CofheProvider";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "DeeperTruth - Prove Reality",
  description: "A Privacy-First Platform for Verified, Undeniable Videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexMono.variable} font-mono antialiased`}>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            <CofheProvider>{children}</CofheProvider>
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
