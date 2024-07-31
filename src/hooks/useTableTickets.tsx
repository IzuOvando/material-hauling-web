import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CONFIG from "@/config";

const useTableTickets = () => {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = new URLSearchParams(searchParams);
  const actualPage =
    Number(params.get("page")) || CONFIG.PAGINATION.DEFAULT_PAGE;
  const actualLimit =
    Number(params.get("limit")) || CONFIG.PAGINATION.DEFAULT_LIMIT;

  const nextPage = (total: number) => {
    const totalPages = Math.ceil(total / actualLimit);
    if (actualPage < totalPages) {
      params.set("page", `${actualPage + 1}`);
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const prevPage = () => {
    if (actualPage > 1) {
      params.set("page", `${actualPage - 1}`);
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const firstPage = () => {
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const lastPage = (total: number) => {
    const totalPages = Math.ceil(total / actualLimit);
    params.set("page", `${totalPages}`);
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setLimit = (limit: number) => {
    params.set("page", "1");
    params.set("limit", `${limit}`);
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setSort = (field: string, desc: boolean) => {
    params.set("sort", `${desc ? "-" : "+"}${field}`);
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return {
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setLimit,
    setSort,
  };
};

export default useTableTickets;
