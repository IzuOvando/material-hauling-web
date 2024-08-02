import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { SHA256 as sha256 } from "crypto-js";
import prisma from "@/lib/db";

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const userCredentials = {
          username: credentials?.username as string,
          password: credentials?.password as string,
        };

        const user = await prisma.user.findUnique({
          where: { username: userCredentials.username },
        });

        if (
          user &&
          user.password === sha256(userCredentials.password).toString()
        )
          return { name: user.username };
        else return null;
      },
    }),
  ],
});