import { NextRequest, NextResponse } from "next/server";
import { SHA256 as sha256 } from "crypto-js";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { message: "Required attributes username & password" },
      { status: 400 }
    );
  }

  if (password.length < 6)
    return NextResponse.json(
      { message: "Password length should be more than 6 characters" },
      { status: 400 }
    );

  try {
    const user = await prisma.user.create({
      data: {
        username: username,
        password: sha256(password).toString(),
      },
    });

    return NextResponse.json({ username: user.username }, { status: 201 });
  } catch (ex) {
    if (ex instanceof Prisma.PrismaClientKnownRequestError)
      if (ex.code === "P2002")
        return NextResponse.json(
          { message: "Username already exists" },
          { status: 400 }
        );

    console.error(ex);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
