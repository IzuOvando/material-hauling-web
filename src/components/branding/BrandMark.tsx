"use client";

import Image from "next/image";
import { useTenantBranding } from "./TenantBrandingProvider";

export function BrandMark() {
  const { appName, logoUrl } = useTenantBranding();

  if (!logoUrl) {
    return <div className="text-white font-semibold tracking-wide">{appName}</div>;
  }

  return <Image src={logoUrl} width={128} height={48} alt={`${appName} logo`} />;
}
