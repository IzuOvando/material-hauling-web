"use client";

import { createPortal } from "react-dom";

const FullScreenLoader = ({ message = "Cargando..." }: { message?: string }) => {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in-0">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-accent animate-spin" />
        </div>
        <p className="text-sm md:text-base font-medium text-white tracking-wide">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default FullScreenLoader;
