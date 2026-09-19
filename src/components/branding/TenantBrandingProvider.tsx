"use client";

import { createContext, useContext, type ReactNode } from "react";
import whiteLabelConfig from "../../../white-label.config";

type TenantBranding = {
  appName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
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
  primaryColor: whiteLabelConfig.branding.primaryColor,
  secondaryColor: whiteLabelConfig.branding.secondaryColor,
  accentColor: whiteLabelConfig.branding.accentColor,
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

  return (
    <TenantBrandingContext.Provider value={value}>
      <div
        style={
          {
            "--tenant-primary-color": value.primaryColor,
            "--tenant-secondary-color": value.secondaryColor,
            "--tenant-accent-color": value.accentColor,
            "--primary-color": value.theme.primary,
            "--secondary-color": value.theme.secondary,
            "--accent-color": value.theme.accent,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext);
}

export type { TenantBranding };
