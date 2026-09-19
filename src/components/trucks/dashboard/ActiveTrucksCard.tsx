"use client";

import { useEffect, useRef, useState } from "react";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveResponse } from "@/types/dashboard";
import whiteLabelConfig from "../../../../white-label.config";

const POLL_INTERVAL_MS = 30_000;

interface ActiveTrucksCellProps {
  frente: string;
  className?: string;
}

export function ActiveTrucksCard({ frente, className }: ActiveTrucksCellProps) {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch(
          `/api/trucks/dashboard/active?frente=${encodeURIComponent(frente)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error();
        const data: ActiveResponse = await res.json();
        setCount(data.inTransitNow);
        setError(false);
      } catch {
        setError(true);
      }
    }

    fetchActive();
    timerRef.current = setInterval(fetchActive, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [frente]);

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-2 px-5 py-3 bg-primary shrink-0 min-w-[130px]",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <Truck className="h-3 w-3 text-white/60 shrink-0" />
        <p className="text-[11px] text-white/60 leading-none">{whiteLabelConfig.ui.dashboard.inTransit}</p>
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse ml-auto shrink-0" />
      </div>
      {count === null && !error ? (
        <div className="h-6 w-10 rounded bg-white/10 animate-pulse" />
      ) : (
        <p className={cn("text-2xl font-bold leading-none", error ? "text-white/30" : "text-accent")}>
          {error ? "—" : count}
        </p>
      )}
    </div>
  );
}
