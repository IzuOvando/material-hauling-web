import { Fragment } from "react";
import { Truck } from "lucide-react";
import { VoucherCamion } from "@prisma/client";
import DataCompressor from "@/utils/qr/dataCompressor";

export default function VoucherPreview({
  searchParams,
}: {
  searchParams: { digest?: string };
}) {
  const { digest } = searchParams;

  const voucher = DataCompressor.decompressTicketData(digest || "");

  if (voucher) return <VoucherInfo voucher={voucher as any} />;

  return (
    <main className="container my-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-32">
        Voucher Preview
      </h1>
      <h2 className="text-3xl md:text-2xl text-center">
        No se encontró ningún voucher en la URL
      </h2>
    </main>
  );
}

const VoucherInfo = ({ voucher }: { voucher: VoucherCamion }) => {
  const voucherData = [
    {
      label: "ID",
      value: voucher.uuid,
    },
    {
      label: "IdCamión",
      value: voucher.idCamion,
    },
    {
      label: "Placas",
      value: voucher.placas,
    },
    {
      label: "Material",
      value: voucher.material,
    },
    {
      label: "Cubicación",
      value: voucher.cubicacion,
    },
    {
      label: "Origen",
      value: voucher.origen,
    },
    {
      label: "Tiro",
      value: voucher.tiro,
    },
    {
      label: "Fecha",
      value: new Date(voucher.voucherTime).toLocaleString(),
    },
    {
      label: "Operador",
      value: voucher.operador,
    },
    {
      label: "No Operador",
      value: voucher.noEmpleado,
    },
    {
      label: "Turno",
      value: voucher.turno === 1 ? "Primer Turno" : "Segundo Turno",
    },
    {
      label: "Empresa",
      value: voucher.empresa,
    },
    {
      label: "Checador",
      value: voucher.checkerName,
    },
    {
      label: "No Checador",
      value: voucher.checkerNo,
    },
  ].filter((item) => item.value !== undefined);

  return (
    <main className="container my-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Voucher Preview
      </h1>
      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-28 w-full justify-center">
        <div className="flex aspect-square w-[60%] max-w-[400px] items-center justify-center rounded-xl bg-white shadow-2xl">
          <Truck size={"80%"} className="text-accent-dark" />
        </div>
        <div className="grid grid-cols-[38%_1fr] w-full gap-3 max-w-[400px]">
          {voucherData.map(({ label, value }) => (
            <Fragment key={label}>
              <b className="w-fit ">{label}:</b>
              <span className="w-fit">{value}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </main>
  );
};
