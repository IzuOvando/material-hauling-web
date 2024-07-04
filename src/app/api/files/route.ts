import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "db_input");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest) {
    try {
        if (req.method !== "POST") {
            return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: "No file uploaded or incorrect file type" }, { status: 400 });
        }

        const fileName = (file as File).name;
        const filePath = path.join(uploadDir, fileName);
        const fileStream = fs.createWriteStream(filePath);

        const stream = (file as Blob).stream();
        const reader = stream.getReader();

        const pump = (): Promise<void> => {
            return reader.read().then(({ done, value }) => {
                if (done) {
                    fileStream.end();
                    return;
                }

                fileStream.write(Buffer.from(value));
                return pump();
            });
        };

        await pump();

        return NextResponse.json({ message: "File uploaded and processed successfully." });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: `Error processing the file: ${error.message}` }, { status: 500 });
        } else {
            return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
        }
    }
}

