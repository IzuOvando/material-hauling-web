import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { VoucherCamion as PrismaVoucherCamion } from "@prisma/client";
import { TokenAuthenticator } from "@/auth/TokenAuthenticator";
import {
    ValidationError,
    validateFrenteNombre,
    validateTurno,
    validateFrenteExists
} from '@/utils/validators';
import { invalidateFacetsCache } from "@/actions/tickets";
import { Section } from "@/types";
import { VoucherDateTimeUtil } from "@/helpers/formatters/voucherdatetime";
import { VoucherDateTimeError } from "@/errors";

export async function POST(req: NextRequest) {

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
        return NextResponse.json({ message: "No autorizado, proporcione credenciales válidas para realizar esta acción" }, { status: 401 });
    }

    let requestBody;
    let vouchersArray

    try {
        requestBody = await req.json();
        vouchersArray = Object.values(requestBody) as PrismaVoucherCamion[];
        const frenteNombres = new Set(vouchersArray.map(voucher => voucher.frenteNombre).filter(Boolean));
        if (frenteNombres.size !== 1) {
            return NextResponse.json({ error: "Inconsistencia en el campo 'frente' entre los vouchers" }, { status: 400 });
        }

        const frenteNombre = frenteNombres.values().next().value as string;
        if (!vouchersArray || vouchersArray.length === 0) {
            return NextResponse.json({ error: "No se proporcionaron datos de vouchers" }, { status: 400 });
        }
        if (typeof frenteNombre === 'string') {
            validateFrenteNombre(frenteNombre);
            await validateFrenteExists(frenteNombre, prisma);
        } else {
            return NextResponse.json({ error: "Este frente no existe en la base de datos global" }, { status: 400 });
        }

        const validationErrors: ValidationError[] = [];

        for (const voucher of vouchersArray) {
            try {
                if (voucher.turno !== undefined) {
                    validateTurno(voucher.turno);
                } else {
                    validationErrors.push(new ValidationError("turno", "El campo 'turno' es requerido"));
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
                    errors: validationErrors.map(e => ({ field: e.field, message: e.message }))
                },
                { status: 400 }
            );
        }
        
        await invalidateFacetsCache(frenteNombre, Section.VOUCHERCAMION);
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message, field: error.field }, { status: 400 });
        }
        return NextResponse.json({ error: "Formato JSON inválido o error de validación" }, { status: 400 });
    }
    try {

        for (const voucher of vouchersArray) {
            const { voucherDate, voucherTime } = VoucherDateTimeUtil.splitDateTime(new Date(voucher.voucherTime));
            voucher.voucherDate = voucherDate;
            voucher.voucherTime = voucherTime;
        }

        await prisma.$transaction(
            vouchersArray.map((voucher, index) => {
                const odometerInt =
                    typeof voucher.odometer === "string"
                        ? parseInt(voucher.odometer, 10)
                        : voucher.odometer;

                if (Number.isNaN(odometerInt)) {
                    console.error(`❌ Odometer inválido en voucher [${index}]`, voucher.odometer);
                    throw new Prisma.PrismaClientValidationError(
                        `Odometer inválido: ${voucher.odometer}`,
                        { clientVersion: "5.22.0" }
                    );
                }

                return prisma.voucherCamion.create({
                    data: {
                        voucherDate: voucher.voucherDate,
                        voucherTime: voucher.voucherTime,
                        tiro: voucher.tiro,
                        origen: voucher.origen,
                        material: voucher.material,
                        placas: voucher.placas,
                        odometer: odometerInt,
                        operador: voucher.operador,
                        turno: voucher.turno,
                        ejido: voucher.ejido,
                        noEconomico: voucher.noEconomico,
                        empresa: voucher.empresa,
                        cubicacion: voucher.cubicacion,
                        frenteNombre: voucher.frenteNombre,
                        checkerName: voucher.checkerName,
                        noEmpleado: voucher.noEmpleado,
                        idCamion: voucher.idCamion,
                        ...(voucher.checkerNo !== undefined &&
                        voucher.checkerNo !== null &&
                        voucher.checkerNo !== ""
                            ? { checkerNo: voucher.checkerNo }
                            : {}),
                    },
                });
            })
        );

    } catch (error) {
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

    return NextResponse.json({ message: "Vouchers creados con éxito" }, { status: 201 });
}
