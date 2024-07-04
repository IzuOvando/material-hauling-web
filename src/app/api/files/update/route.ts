import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import prisma from '@/lib/db';

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

export async function POST(req: NextRequest) {

    if (req.method !== 'POST') {
        return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const rootPath = path.resolve(process.cwd());
    const outputFolder = path.join(rootPath, 'db_output', 'csv', 'csv_output');
    const specificFilePath = path.join(rootPath, 'db_input', 'bbd.xlsx');

    try {
        const files = await readdir(outputFolder);
        await Promise.all(files.map(file => unlink(path.join(outputFolder, file))));

        await unlink(specificFilePath);

        await prisma.ticket.deleteMany({});

        return NextResponse.json({ message: 'All files and data deleted successfully.' }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete files or data:", error);
        return NextResponse.json({ message: `Failed to delete files or data: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
