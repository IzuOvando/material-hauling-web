"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { UncatalogedMaterial } from "@/actions/materials";
import CONFIG from "@/config";
import whiteLabelConfig from "#/white-label.config";
import { MaterialCatalogSection } from "./MaterialCatalogSection";
import { FrenteAssignmentSection } from "./FrenteAssignmentSection";

interface MaterialsPageProps {
  frentes: string[];
  uncataloged: UncatalogedMaterial[];
}

const MAX_FRENTES_SHOWN = 3;
const copy = whiteLabelConfig.ui.materials.uncataloged;

function describeUncataloged({ nombre, viajes, frentes }: UncatalogedMaterial): string {
  const shown = frentes.slice(0, MAX_FRENTES_SHOWN).join(", ");
  const extra = frentes.length - MAX_FRENTES_SHOWN;
  const where = extra > 0 ? `${shown} ${copy.more.replace("{n}", String(extra))}` : shown;
  return `${nombre} (${viajes} ${viajes === 1 ? copy.tripOne : copy.tripMany} ${copy.in} ${where})`;
}

export function MaterialsPage({ frentes, uncataloged }: MaterialsPageProps) {
  const router = useRouter();
  const frenteRefreshRef = useRef<() => void>(null);

  const handleCatalogChange = useCallback(() => {
    frenteRefreshRef.current?.();
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      {uncataloged.length > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {copy.prefix.replace("{days}", String(CONFIG.MATERIALS.UNCATALOGED_WINDOW_DAYS))}{" "}
          <span className="font-semibold">
            {uncataloged.map(describeUncataloged).join("; ")}
          </span>
          . {copy.suffix}
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaterialCatalogSection onCatalogChange={handleCatalogChange} />
        <FrenteAssignmentSection frentes={frentes} refreshRef={frenteRefreshRef} />
      </div>
    </div>
  );
}
