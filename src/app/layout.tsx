import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { EnterprisesImagesInitializer } from "@/contexts";
import { UserProvider } from '@/contexts/UserContext';
import { getAppUser } from "@/auth/auth.user";
import whiteLabelConfig from "../../white-label.config";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--montserrat" });

export const metadata: Metadata = {
  title: `${whiteLabelConfig.app.name} | Dashboard`,
  description: whiteLabelConfig.app.tagline,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAppUser();

  return (
    <html lang={whiteLabelConfig.app.locale} suppressHydrationWarning>
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
          <EnterprisesImagesInitializer />
          <Script src="/lib/epos-2.27.0.js" strategy="beforeInteractive" />
        </UserProvider>
      </body>
    </html>
  );
}
