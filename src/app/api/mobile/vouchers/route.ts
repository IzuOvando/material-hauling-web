import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { VoucherCamion as PrismaVoucherCamion } from "@prisma/client";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import {
  ValidationError,
  validateFrenteNombre,
  validateTurno,
  validateFrenteExists,
} from "@/utils/validators";
import { invalidateFacetsCache } from "@/actions/tickets";
import { Section } from "@/types";
import { VoucherDateTimeUtil } from "@/helpers/formatters/voucherdatetime";
import { VoucherDateTimeError } from "@/errors";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
    return NextResponse.json(
      { error: "No autorizado, proporcione credenciales válidas para realizar esta acción" },
      { status: 401 }
    );
  }

  const decoded = TokenAuthenticator.decode(accessToken);
  if (!decoded) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  let requestBody: any;
  let vouchersArray: PrismaVoucherCamion[] = [];

  try {
    requestBody = await req.json();
    vouchersArray = Object.values(requestBody) as PrismaVoucherCamion[];

    if (!vouchersArray || vouchersArray.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron datos de vouchers" },
        { status: 400 }
      );
    }

    for (const [i, v] of vouchersArray.entries()) {
      if (!v?.uuid || typeof v.uuid !== "string" || !v.uuid.trim()) {
        return NextResponse.json(
          { error: `Voucher [${i}] no trae uuid válido` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error("❌ Error parseando body:", error);
    return NextResponse.json(
      { error: "Formato JSON inválido" },
      { status: 400 }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // PARCHE: filtrado silencioso por frentes permitidos.
  //
  // ✅ La respuesta mantiene exactamente la misma forma que el original:
  //    { message, updated }  ← el mobile actual no necesita ningún cambio.
  //
  // Los vouchers de frentes no permitidos simplemente NO entran en
  // `updated`, así el mobile no los borra de Realm — quedan en local
  // automáticamente sin que el cliente haga nada especial.
  //
  // Roles:
  //   owner        → pasa todo sin consulta a BD
  //   admin / user → se filtran los que no estén en su lista de frentes
  //
  // Fallback: si la consulta de permisos falla, se loguea y se deja
  // pasar todo para no detener operaciones en campo.
  // ─────────────────────────────────────────────────────────────────

  if (decoded.role === "admin" || decoded.role === "user") {
    try {
      const userRecord = await prisma.user.findUnique({
        where: { username: decoded.username },
        include: { frentes: true },
      });

      const allowedFrentes = userRecord?.frentes.map((f) => f.frenteNombre) ?? [];
      const before = vouchersArray.length;

      vouchersArray = vouchersArray.filter((v) => {
        const allowed = allowedFrentes.includes(v.frenteNombre);
        if (!allowed) {
          console.warn(
            `[PARCHE] Voucher ${v.uuid} filtrado: frente "${v.frenteNombre}" ` +
            `no está en lista de ${decoded.username} [${allowedFrentes.join(", ")}]`
          );
        }
        return allowed;
      });

      console.log(
        `[PARCHE] ${decoded.username}: ${vouchersArray.length}/${before} vouchers pasan filtro de frentes`
      );

      // Ninguno pasó → devolver updated: [] sin procesar nada.
      // El mobile recibe la misma forma de siempre y simplemente
      // no borra nada de Realm porque updated está vacío.
      if (vouchersArray.length === 0) {
        console.warn(
          `[PARCHE] ${decoded.username}: ningún voucher pertenece a sus frentes asignados.`
        );
        return NextResponse.json(
          { message: "Vouchers procesados con éxito", updated: [] },
          { status: 201 }
        );
      }
    } catch (err) {
      // Si falla la consulta de permisos, logueamos pero NO bloqueamos.
      // Preferimos dejar pasar todo antes que detener operaciones en campo.
      console.error(
        "❌ [PARCHE] Error consultando frentes del usuario, se omite filtro:",
        err
      );
      // vouchersArray queda sin cambios → sigue el flujo original completo
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Flujo original desde aquí — sin ningún cambio
  // ─────────────────────────────────────────────────────────────────

  try {
    // El batch filtrado puede tener múltiples frentes permitidos,
    // validamos cada frente único individualmente en lugar del
    // check size === 1 que tenía el original.
    const frenteNombres = new Set(
      vouchersArray.map((voucher) => voucher.frenteNombre).filter(Boolean)
    );

    for (const frente of frenteNombres) {
      validateFrenteNombre(frente);
      await validateFrenteExists(frente, prisma);
    }

    const validationErrors: ValidationError[] = [];

    for (const voucher of vouchersArray) {
      try {
        if (voucher.turno !== undefined) {
          validateTurno(voucher.turno);
        } else {
          validationErrors.push(
            new ValidationError("turno", "El campo 'turno' es requerido")
          );
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          validationErrors.push(error);
        } else {
          console.error("Error de validación inesperado:", error);
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          errors: validationErrors.map((e) => ({
            field: e.field,
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    for (const frente of frenteNombres) {
      await invalidateFacetsCache(frente, Section.VOUCHERCAMION);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    console.error("❌ Error en validación/caché:", error);
    return NextResponse.json(
      { error: "Formato JSON inválido o error de validación" },
      { status: 400 }
    );
  }

  try {
    for (const voucher of vouchersArray) {
      const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(
        new Date(String(voucher.voucherTime))
      );
      voucher.voucherDate = voucherDate;
      voucher.voucherTime = voucherTime;
    }

    await prisma.$transaction(
      vouchersArray.map((voucher, index) => {
        const odometerFloat =
          typeof voucher.odometer === "string"
            ? parseFloat(voucher.odometer)
            : voucher.odometer;

        if (Number.isNaN(odometerFloat)) {
          console.error(`❌ Odometer inválido en voucher [${index}]`, voucher.odometer);
          throw new Prisma.PrismaClientValidationError(
            `Odometer inválido: ${voucher.odometer}`,
            { clientVersion: "5.22.0" }
          );
        }

        const data = {
          uuid: voucher.uuid,
          voucherDate: voucher.voucherDate,
          voucherTime: voucher.voucherTime,
          destino: voucher.destino.trim(),
          origen: voucher.origen.trim(),
          material: voucher.material.trim(),
          placas: voucher.placas.trim(),
          odometer: odometerFloat,
          status: voucher.status ?? "IN_TRANSIT",
          operador: voucher.operador.trim(),
          turno: voucher.turno,
          localidad: voucher.localidad.trim(),
          noEconomico: voucher.noEconomico.trim(),
          empresa: voucher.empresa.trim(),
          cubicacion: voucher.cubicacion,
          frenteNombre: voucher.frenteNombre,
          checkerName: voucher.checkerName.trim(),
          noEmpleado: voucher.noEmpleado.trim(),
          idCamion: voucher.idCamion.trim(),
          ...(voucher.checkerNo !== undefined &&
          voucher.checkerNo !== null &&
          voucher.checkerNo !== ""
            ? { checkerNo: voucher.checkerNo.trim() }
            : {}),
          latitude:          voucher.latitude          ?? null,
          longitude:         voucher.longitude         ?? null,
          locationAccuracy:  voucher.locationAccuracy  ?? null,
          locationTimestamp: voucher.locationTimestamp
            ? new Date(voucher.locationTimestamp)
            : null,
          locationStatus:    voucher.locationStatus    ?? null,
          locationSource:    voucher.locationSource    ?? null,
        };

        return prisma.voucherCamion.upsert({
          where: { uuid: voucher.uuid },
          create: data,
          update: {},
        });
      })
    );
  } catch (error) {
    console.error("❌ Error en transacción Prisma:", error);
    if (error instanceof VoucherDateTimeError) {
      return NextResponse.json(
        { error: "Error en el formato de fecha/hora proporcionado" },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "Error de validación con los datos proporcionados" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }

  // Misma forma de respuesta que el original — mobile no necesita cambios
  return NextResponse.json(
    {
      message: "Vouchers procesados con éxito",
      updated: vouchersArray.map((v) => v.uuid),
    },
    { status: 201 }
  );
}