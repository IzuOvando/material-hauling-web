"use client";

import { Fragment, useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { VoucherCamion } from "@prisma/client";
import {
  PropertyType,
  CONCRETO_DISTRIBUTION,
  ConcreteMaterialData,
} from "@/assets/data";
import getConcreteDescription from "@/utils/getConcreteDescription";
import { formatVoucherId } from "@/helpers/formatters/formatVoucherId";

const propertyEntries = Object.entries(PropertyType);

function getMaterial(material: string): string {
  if (!material || material === "undefined") return "";

  try {
    const parsed: ConcreteMaterialData = JSON.parse(material);

    if (
      parsed &&
      typeof parsed === "object" &&
      "tipo" in parsed &&
      "fc" in parsed &&
      "tma" in parsed &&
      "dias" in parsed
    ) {
      const { tipo, fc, tma, dias, propiedades } = parsed;

      let selectedProps: PropertyType[] | undefined;

      if (Array.isArray(propiedades)) {
        selectedProps = propiedades
          .map((p) => {
            const match = propertyEntries.find(
              ([key]) => key.toLowerCase() === p.toLowerCase()
            );
            return match ? match[1] : null;
          })
          .filter((v): v is PropertyType => v !== null);
      }

      return getConcreteDescription(
        CONCRETO_DISTRIBUTION,
        tipo,
        fc.toString(),
        tma.toString(),
        dias.toString(),
        selectedProps
      );
    }
  } catch {
    return material;
  }

  return material;
}

export default function VoucherInfoClient({
  voucher,
}: {
  voucher: VoucherCamion;
}) {
  const [localDate, setLocalDate] = useState<string>("Cargando…");

  useEffect(() => {
    if (voucher.voucherTime) {
      setLocalDate(
        new Date(voucher.voucherTime).toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
        })
      );
    }
  }, [voucher.voucherTime]);

  const voucherData = [
    { label: "Folio", value: formatVoucherId(voucher.folio) },
    { label: "IdCamión", value: voucher.idCamion },
    { label: "Placas", value: voucher.placas },
    { label: "Odómetro Origen", value: voucher.odometer },
    { label: "Material", value: getMaterial(voucher.material) },
    { label: "Cubicación", value: voucher.cubicacion },
    { label: "Origen", value: voucher.origen },
    { label: "Destino", value: voucher.destino },
    { label: "Fecha", value: localDate },
    { label: "Operador", value: voucher.operador },
    { label: "No Operador", value: voucher.noEmpleado },
    {
      label: "Turno",
      value: voucher.turno === 1 ? "Primer Turno" : "Segundo Turno",
    },
    { label: "Localidad", value: voucher.localidad },
    { label: "Empresa", value: voucher.empresa },
    { label: "Checador", value: voucher.checkerName },
    { label: "No Checador", value: voucher.checkerNo },
  ].filter((item) => item.value !== undefined);

  return (
    <main className="container my-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Detalle del Voucher
      </h1>
      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-28 w-full justify-center">
        <div className="flex aspect-square w-[60%] max-w-[400px] items-center justify-center rounded-xl bg-white shadow-2xl">
          <Truck size={"80%"} className="text-accent-dark" />
        </div>
        <div className="grid grid-cols-[38%_1fr] w-full gap-3 max-w-[400px]">
          {voucherData.map(({ label, value }) => (
            <Fragment key={label}>
              <b className="w-fit">{label}:</b>
              <span className="w-fit">{value}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </main>
  );
}