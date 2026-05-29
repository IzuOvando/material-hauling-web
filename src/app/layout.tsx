import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { PrinterStoreInitializer } from "@/store";
import { EnterprisesImagesInitializer } from "@/contexts";
import { auth } from "@/auth";
import { UserProvider } from '@/contexts/UserContext';
import { getAppUser } from "@/auth/auth.user";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--montserrat" });

export const metadata: Metadata = {
  title: "SEDENA: Web Tickets",
  description: "A webapp for managing tickets",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAppUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          montserrat.variable,
          montserrat.className
        )}
      >
        <UserProvider user={user}>
<Navbar userName={user?.name} />
          {children}
          <Toaster />
          <PrinterStoreInitializer />
          <EnterprisesImagesInitializer />
          <Script src="/lib/epos-2.27.0.js" strategy="beforeInteractive" />
        </UserProvider>
      </body>
    </html>
  );
}
