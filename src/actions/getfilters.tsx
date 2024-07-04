import prisma from "@/lib/db";
import { Prisma } from '@prisma/client';

async function getFilteredVouchers(filters: Prisma.TicketWhereInput) {
    const filteredVouchers = await prisma.ticket.findMany({
        where: filters,
    });
    return filteredVouchers;
}

export { getFilteredVouchers };