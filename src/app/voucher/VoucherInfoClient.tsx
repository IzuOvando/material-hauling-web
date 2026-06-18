"use client";

import { Truck } from "lucide-react";
import { VoucherCamion } from "@prisma/client";
import { VoucherDetails } from "@/components/trucks/VoucherDetails";

export default function VoucherInfoClient({
  voucher,
}: {
  voucher: VoucherCamion;
}) {
  return (
    <main className="container my-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
        Detalle del Voucher
      </h1>
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-20 w-full justify-center">
        <div className="flex aspect-square w-[60%] max-w-[360px] items-center justify-center rounded-xl bg-white shadow-2xl">
          <Truck size={"80%"} className="text-accent-dark" />
        </div>
        <VoucherDetails voucher={voucher} className="w-full max-w-md" />
      </div>
    </main>
  );
}
