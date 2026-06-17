"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTrucksTable } from "@/hooks/useTrucksTable";

const DEBOUNCE_MS = 300;

export function SearchInput() {
  const { state, setSearch } = useTrucksTable();
  const [localValue, setLocalValue] = useState(state.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external changes (URL → state.q) into local input
  useEffect(() => {
    setLocalValue(state.q);
  }, [state.q]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalValue("");
    setSearch("");
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar folio o no. económico…"
        className="w-full h-9 pl-9 pr-9 rounded-md border-2 border-primary-light bg-white text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:border-accent transition-colors"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary-light/15 text-primary/60 hover:text-primary"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
