"use client";

import Image from "next/image";
import tenantLogo from "@tenant-logo";
import { cn } from "@/lib/utils";
import { useTenantBranding } from "./TenantBrandingProvider";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  const { appName } = useTenantBranding();

  return (
    <Image
      src={tenantLogo}
      alt={`${appName} logo`}
      unoptimized
      className={cn("h-12 w-auto max-w-[200px] object-contain", className)}
    />
  );
}
