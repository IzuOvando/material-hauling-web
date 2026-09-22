"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import whiteLabelConfig from "#/white-label.config";

const TabTrucks = ({ isOwner }: { isOwner: boolean }) => {
  const [activeTab, setActiveTab] = useState(isOwner ? "qr" : "db");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname.includes("/db")) {
      setActiveTab("db");
    } else if (pathname.includes("/materials")) {
      setActiveTab("materials");
    } else if (pathname.includes("/users")) {
      setActiveTab("users");
    } else if (pathname === "/") {
      setActiveTab("qr");
    }
  }, [pathname]);

  const handleTabChange = (value: string) => {
    if (value === "qr") {
      router.push("/");
    } else if (value === "db") {
      router.push("/db");
    } else if (value === "materials") {
      router.push("/materials");
    } else if (value === "users") {
      router.push("/users");
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList
        className="p-[6px] h-auto"
        style={{
          backgroundColor: "rgba(var(--accent-color) / 20%)",
        }}
      >
        {isOwner && (
          <TabsTrigger
            value="qr"
            className="font-medium text-accent data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            {whiteLabelConfig.ui.navbar.qrLabel}
          </TabsTrigger>
        )}

        <TabsTrigger
          value="db"
          className="font-medium text-accent data-[state=active]:bg-accent data-[state=active]:text-white"
        >
          {whiteLabelConfig.ui.navbar.databaseLabel}
        </TabsTrigger>

        {isOwner && (
          <TabsTrigger
            value="materials"
            className="font-medium text-accent data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            {whiteLabelConfig.ui.navbar.materialsLabel}
          </TabsTrigger>
        )}

        {isOwner && (
          <TabsTrigger
            value="users"
            className="font-medium text-accent data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            {whiteLabelConfig.ui.navbar.usersLabel}
          </TabsTrigger>
        )}

      </TabsList>
    </Tabs>
  );
};

export default TabTrucks;
