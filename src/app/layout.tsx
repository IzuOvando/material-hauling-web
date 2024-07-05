import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { PrinterStoreInitializer } from "@/store";
import EnterprisesImagesInitializer from "@/contexts/EnterprisesImagesInitializer";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--montserrat" });

export const metadata: Metadata = {
  title: "SEDENA: Web Tickets",
  description: "A webapp for managing tickets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          montserrat.variable,
          montserrat.className
        )}
      >
        <Navbar />
        {children}
        <Toaster />
        <PrinterStoreInitializer />
        <EnterprisesImagesInitializer />
        <Script src="/lib/epos-2.27.0.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
