import DataCompressor from "@/utils/qr/dataCompressor";
import { VoucherCamion } from "@prisma/client";
import VoucherInfoClient from "./VoucherInfoClient";

export default function VoucherPreview({
  searchParams,
}: {
  searchParams: { digest?: string };
}) {
  const { digest } = searchParams;

  const voucher = DataCompressor.decompressTicketData(digest || "");

  if (voucher) {
    return <VoucherInfoClient voucher={voucher as VoucherCamion} />;
  }

  return (
    <main className="container my-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-32">
        Detalle del Voucher
      </h1>
      <h2 className="text-3xl md:text-2xl text-center">
        No se encontró ningún voucher en la URL
      </h2>
    </main>
  );
}
