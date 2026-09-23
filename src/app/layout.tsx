import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getAppUser } from "@/auth/auth.user";
import { AppShell } from "@/components/app-shell";
import { getThemeCssVars } from "@/lib/theme";
import tenantFavicon from "@tenant-favicon";
import whiteLabelConfig from "#/white-label.config";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--montserrat" });

export const metadata: Metadata = {
  title: whiteLabelConfig.app.metadataTitle,
  description: whiteLabelConfig.app.metadataDescription,
  icons: { icon: tenantFavicon.src },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAppUser();

  return (
    <html
      lang={whiteLabelConfig.app.locale}
      suppressHydrationWarning
      style={getThemeCssVars(whiteLabelConfig)}
    >
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          montserrat.variable,
          montserrat.className
        )}
      >
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
