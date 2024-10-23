import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { VoucherCamion as PrismaVoucherCamion } from "@prisma/client";
import {
    ValidationError,
    validateFrenteNombre,
    validateTurno,
    validateFrenteExists
} from '@/utils/validators';

export async function POST(req: NextRequest) {

    let requestBody;

    try {
        requestBody = await req.json();

        const { frenteNombre, vouchers } = requestBody;
        if (!vouchers || !Array.isArray(vouchers) || vouchers.length === 0) {
            return NextResponse.json({ error: "No vouchers data provided" }, { status: 400 });
        }

        validateFrenteNombre(frenteNombre);

        await validateFrenteExists(frenteNombre, prisma);

    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message, field: error.field }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid JSON format or validation error" }, { status: 400 });
    }

    const voucherData: PrismaVoucherCamion[] = requestBody.vouchers;
    const validationErrors: ValidationError[] = [];

    for (const voucher of voucherData) {
        try {
            validateTurno(voucher.turno);
        } catch (error) {
            if (error instanceof ValidationError) {
                validationErrors.push(error);
            } else {
                console.error("Unexpected validation error:", error);
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

    try {
        await prisma.$transaction(
            voucherData.map((voucher) =>
                prisma.voucherCamion.create({
                    data: {
                        voucherTime: voucher.voucherTime,
                        tiro: voucher.tiro,
                        origen: voucher.origen,
                        material: voucher.material,
                        placas: voucher.placas,
                        operador: voucher.operador,
                        turno: voucher.turno,
                        noEconomico: voucher.noEconomico,
                        empresa: voucher.empresa,
                        cubicacion: voucher.cubicacion,
                        frenteNombre: voucher.frenteNombre,
                        checkerName: voucher.checkerName,
                        noEmpleado: voucher.noEmpleado,
                        idCamion: voucher.idCamion,
                        ...(voucher.checkerNo && { checkerNo: voucher.checkerNo }),
                    },
                })
            )
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientValidationError) {
            return NextResponse.json(
                { error: "Validation error with the data provided" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }

    return NextResponse.json({ message: "Vouchers created successfully" }, { status: 201 });
}
