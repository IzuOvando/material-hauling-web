"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrucksLayoutClientProps {
  nav: React.ReactNode;
  children: React.ReactNode;
}

export function TrucksLayoutClient({ nav, children }: TrucksLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className="md:hidden mb-4">{nav}</div>
      
      <div className="flex items-start">
        <div
          className={cn(
            "hidden md:block shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
            collapsed
              ? "w-0 opacity-0 pointer-events-none"
              : "w-56 opacity-100 border-r border-border/60",
          )}
        >
          {nav}
        </div>

        <div className="hidden md:block relative self-stretch w-6 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir panel" : "Colapsar panel"}
            className={cn(
              "absolute top-6 left-0 z-10",
              "flex items-center justify-center",
              "h-8 w-5 rounded-r-md",
              "bg-primary/10 text-primary/60",
              "border border-l-0 border-primary/20",
              "shadow-sm",
              "hover:bg-accent hover:text-white hover:border-accent/50 hover:shadow-accent/20",
              "active:scale-95",
              "transition-all duration-200",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        </div>

        <div className="flex-1 min-w-0 md:pl-4">{children}</div>
      </div>
    </>
  );
}
