import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CONFIG from "@/config";
import { getFilters } from "@/actions/tickets/helpers";
import { TicketArea } from "@/types";
import { useRef } from "react";

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
    area: TicketArea
  ) => {
    // Getting actual filters
    const paramFilters = filters.current || "";
    let actualFilters = getFilters(paramFilters, area) || {};

    // Adding/Deleting new filter
    if (options.length === 0) delete actualFilters[field];
    else
      actualFilters[field] = {
        in: options,
      };

    // Build newFilterParam
    let newFilter = "";
    const fields = Object.keys(actualFilters);
    const values: any[] = Object.values(actualFilters);

    fields.forEach((field, index) => {
      newFilter += `${field}=${values[index].in.join("^")}|`;
    });

    newFilter = newFilter.slice(0, -1);

    // Update filters
    page.current = 1;
    filters.current = newFilter;
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
