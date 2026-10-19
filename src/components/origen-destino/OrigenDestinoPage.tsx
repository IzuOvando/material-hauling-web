"use client";

import { useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrigenCatalogSection } from "./OrigenCatalogSection";
import { FrenteOrigenAssignmentSection } from "./FrenteOrigenAssignmentSection";
import { TiroCatalogSection } from "./TiroCatalogSection";
import { FrenteTiroAssignmentSection } from "./FrenteTiroAssignmentSection";
import whiteLabelConfig from "#/white-label.config";

interface OrigenDestinoPageProps {
  frentes: string[];
}

export function OrigenDestinoPage({ frentes }: OrigenDestinoPageProps) {
  const origenRefreshRef = useRef<() => void>(null);
  const tiroRefreshRef = useRef<() => void>(null);

  const handleOrigenCatalogChange = useCallback(() => {
    origenRefreshRef.current?.();
  }, []);

  const handleTiroCatalogChange = useCallback(() => {
    tiroRefreshRef.current?.();
  }, []);

  return (
    <Tabs defaultValue="origenes" className="w-full">
      <TabsList>
        <TabsTrigger value="origenes">
          {(whiteLabelConfig as any)?.ui?.origenes?.tabLabel || "Orígenes"}
        </TabsTrigger>
        <TabsTrigger value="tiros">
          {(whiteLabelConfig as any)?.ui?.tiros?.tabLabel || "Tiros"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="origenes" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrigenCatalogSection onCatalogChange={handleOrigenCatalogChange} />
          <FrenteOrigenAssignmentSection frentes={frentes} refreshRef={origenRefreshRef} />
        </div>
      </TabsContent>

      <TabsContent value="tiros" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TiroCatalogSection onCatalogChange={handleTiroCatalogChange} />
          <FrenteTiroAssignmentSection frentes={frentes} refreshRef={tiroRefreshRef} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
