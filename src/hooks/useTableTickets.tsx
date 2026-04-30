import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CONFIG from "@/config";
import { TicketArea, Section } from "@/types";
import { useRef } from "react";

function parseFilterString(filterStr: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!filterStr) return result;
  filterStr.split("|").forEach((part) => {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) return;
    const field = part.slice(0, eqIdx).trim();
    const valStr = part.slice(eqIdx + 1).trim();
    const vals = valStr.split("^").filter(Boolean);
    if (field && vals.length > 0) result[field] = vals;
  });
  return result;
}

const useTableTickets = () => {
  const { replace } = useRouter();
  const pathname = usePathname();
  const page = useRef(CONFIG.PAGINATION.DEFAULT_PAGE);
  const limit = useRef(CONFIG.PAGINATION.DEFAULT_LIMIT);
  const sort = useRef<string | null>(null);
  const filters = useRef<string | null>(null);

  const reloadTable = () => {
    const searchParams = new URLSearchParams();
    searchParams.set("page", page.current.toString());
    searchParams.set("limit", limit.current.toString());
    if (sort.current) searchParams.set("sort", sort.current);
    if (filters.current) searchParams.set("filters", filters.current);
    replace(`${pathname}?${searchParams.toString()}`, { scroll: false });
  };

  const nextPage = (total: number) => {
    const totalPages = Math.ceil(total / limit.current);
    if (page.current < totalPages) {
      page.current++;
      reloadTable();
    }
  };

  const prevPage = () => {
    if (page.current > 1) {
      page.current--;
      reloadTable();
    }
  };

  const firstPage = () => {
    page.current = 1;
    reloadTable();
  };

  const lastPage = (total: number) => {
    page.current = Math.ceil(total / limit.current);
    reloadTable();
  };

  const setLimit = (newLimit: number) => {
    page.current = 1;
    limit.current = newLimit;
    reloadTable();
  };

  const setSort = (field: string, desc: boolean) => {
    sort.current = `${desc ? "-" : "+"}${field}`;
    reloadTable();
  };

  const updateFilters = (
    field: string,
    options: string[],
    area: TicketArea | Section
  ) => {
    // Parse current filter string to a field→values map (raw strings, no Prisma objects)
    const actualFilters = parseFilterString(filters.current || "");

    if (options.length === 0) delete actualFilters[field];
    else actualFilters[field] = options;

    // Rebuild filter string
    const newFilter = Object.entries(actualFilters)
      .map(([f, vals]) => `${f}=${vals.join("^")}`)
      .join("|");

    page.current = 1;
    filters.current = newFilter || null;
    reloadTable();
  };

  const cleanFilters = () => {
    page.current = 1;
    filters.current = null;
    reloadTable();
  };

  return {
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setLimit,
    setSort,
    updateFilters,
    cleanFilters,
  };
};

export default useTableTickets;
