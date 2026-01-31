"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

const TabTrucks = ({ isOwner }: { isOwner: boolean }) => {
  const [activeTab, setActiveTab] = useState("qr");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname.includes("/trucks/db")) {
      setActiveTab("db");
    } else if (pathname.includes("/trucks")) {
      setActiveTab("qr");
    }
  }, [pathname]);

  const handleTabChange = (value: string) => {
    if (value === "qr") {
      router.push("/trucks");
    } else if (value === "db") {
      router.push("/trucks/db");
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList
        className="p-[6px] h-auto"
        style={{
          backgroundColor: "rgba(var(--accent-light-color) / 40%)",
        }}
      >
        {isOwner && (
          <TabsTrigger
            value="qr"
            className="font-medium text-accent-dark data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            Generador de QRs
          </TabsTrigger>
        )}
        <TabsTrigger
          value="db"
          className="font-medium text-accent-dark data-[state=active]:bg-accent data-[state=active]:text-white"
        >
          Bases de Datos
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default TabTrucks;
