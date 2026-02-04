import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { validateUser } from "@/lib/db/validateUser";
import { InvalidCredentialsError } from "./InvalidCredentialsError";
import { logSecurityEvent, SecurityEventType } from "./securityLogger";

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const username = credentials?.username as string;
        const password = credentials?.password as string; // Already hashed with SHA256 from the client

        const user = await validateUser(username, password);

        if (user) {
          logSecurityEvent({ type: SecurityEventType.AUTH_SUCCESS, userId: user.username, resource: "/login" });
          return { name: user.username };
        }

        logSecurityEvent({ type: SecurityEventType.AUTH_FAILURE, resource: "/login", details: { username } });
        throw new InvalidCredentialsError();
      },
    }),
  ],
});
