import CONFIG from "@/config";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { requireFrenteAccess } from "@/auth/guards";
import { getTrucksData } from "@/actions/trucks";
import { getDefaultRangeString } from "@/actions/trucks/periods";
import { TrucksDbView } from "@/components/trucks";

export default async function DBPage({
  params,
  searchParams,
}: {
  params: { frente: string };
  searchParams: {
    page?: string;
    limit?: string;
    sort?: string;
    filters?: string;
  };
}) {
  const user = await requireFrenteAccess(params.frente);

  const isPrivileged = user.role === "owner" || user.role === "general";
  const frentes = isPrivileged
    ? await prisma.frente.findMany()
    : await prisma.frente.findMany({ where: { nombre: { in: user.frentes } } });

  const page = Number(searchParams.page) || CONFIG.PAGINATION.DEFAULT_PAGE;
  const limit = Number(searchParams.limit) || CONFIG.PAGINATION.DEFAULT_LIMIT;

  // Default to "yesterday" range when the URL has no filter — keeps the UI
  // operational without redirecting and bookmark-able once the user changes anything.
  const effectiveFilters =
    searchParams.filters && searchParams.filters.length > 0
      ? searchParams.filters
      : `voucherDatetimeRange=${getDefaultRangeString()}`;

  const response = await getTrucksData(
    params.frente,
    effectiveFilters,
    { page, limit },
    searchParams.sort
  );

  if (!response) notFound();

  return (
    <TrucksDbView
      frente={params.frente}
      frentes={frentes}
      vouchers={response.vouchers}
      total={response.total}
      page={page}
      limit={limit}
      appliedFilters={effectiveFilters}
      sort={searchParams.sort ?? null}
      isOwner={user.role === "owner"}
      isReadOnly={user.role === "general"}
    />
  );
}
