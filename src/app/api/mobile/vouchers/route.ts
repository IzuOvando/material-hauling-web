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

export async function POST(req: NextRequest) {

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken || !TokenAuthenticator.verify(accessToken)) {
        return NextResponse.json({ message: "Unauthorized, provide valid credentials to perform this action" }, { status: 401 });
    }

    let requestBody;
    let vouchersArray

    try {
        requestBody = await req.json();
        vouchersArray = Object.values(requestBody) as PrismaVoucherCamion[];
        const frenteNombres = new Set(vouchersArray.map(voucher => voucher.frenteNombre).filter(Boolean));
        if (frenteNombres.size !== 1) {
            return NextResponse.json({ error: "Inconsistent frenteNombre across vouchers" }, { status: 400 });
        }

        const frenteNombre = frenteNombres.values().next().value as string;
        if (!vouchersArray || vouchersArray.length === 0) {
            return NextResponse.json({ error: "No vouchers data provided" }, { status: 400 });
        }
        if (typeof frenteNombre === 'string') {
            validateFrenteNombre(frenteNombre);
            await validateFrenteExists(frenteNombre, prisma);
        } else {
            return NextResponse.json({ error: "Invalid frenteNombre value" }, { status: 400 });
        }

        const validationErrors: ValidationError[] = [];

        for (const voucher of vouchersArray) {
            try {
                if (voucher.turno !== undefined) {
                    validateTurno(voucher.turno);
                } else {
                    validationErrors.push(new ValidationError("turno", "Turno is required"));
                }
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
    
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ error: error.message, field: error.field }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid JSON format or validation error" }, { status: 400 });
    }
    try {
        await prisma.$transaction(
            vouchersArray.map((voucher) =>
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
