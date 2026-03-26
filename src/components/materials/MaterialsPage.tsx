"use client";

import { useCallback, useRef } from "react";
import { MaterialCatalogSection } from "./MaterialCatalogSection";
import { FrenteAssignmentSection } from "./FrenteAssignmentSection";

interface MaterialsPageProps {
  frentes: string[];
}

export function MaterialsPage({ frentes }: MaterialsPageProps) {
  const frenteRefreshRef = useRef<() => void>(null);

  const handleCatalogChange = useCallback(() => {
    frenteRefreshRef.current?.();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MaterialCatalogSection onCatalogChange={handleCatalogChange} />
      <FrenteAssignmentSection frentes={frentes} refreshRef={frenteRefreshRef} />
    </div>
  );
}
