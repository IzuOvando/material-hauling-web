"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTenantBranding } from "./TenantBrandingProvider";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = "h-12 w-32" }: BrandMarkProps) {
  const { appName, logoUrl } = useTenantBranding();

  if (!logoUrl) {
    return <div className="text-white font-semibold tracking-wide">{appName}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      <Image
        src={logoUrl}
        alt={`${appName} logo`}
        fill
        unoptimized
        sizes="200px"
        className="object-contain"
      />
    </div>
  );
}
