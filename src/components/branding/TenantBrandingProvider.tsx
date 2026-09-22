"use client";

import { createContext, useContext, type ReactNode } from "react";
import whiteLabelConfig from "#/white-label.config";

type TenantBranding = {
  appName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  welcomeLabel: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

const defaultBranding: TenantBranding = {
  appName: whiteLabelConfig.app.name,
  shortName: whiteLabelConfig.app.shortName,
  tagline: whiteLabelConfig.app.tagline,
  logoUrl: whiteLabelConfig.branding.logoUrl,
  welcomeLabel: whiteLabelConfig.auth.welcomeLabel,
  theme: whiteLabelConfig.theme,
};

const TenantBrandingContext = createContext<TenantBranding>(defaultBranding);

export function TenantBrandingProvider({
  children,
  branding,
}: {
  children: ReactNode;
  branding?: Partial<TenantBranding>;
}) {
  const value = { ...defaultBranding, ...branding };

  // The CSS variables themselves are set on the document root in RootLayout

  return (
    <TenantBrandingContext.Provider value={value}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext);
}

export type { TenantBranding };
