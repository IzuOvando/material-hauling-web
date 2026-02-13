import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { validateUser } from "@/lib/db/validateUser";
import { InvalidCredentialsError } from "./InvalidCredentialsError";
import { logSecurityEvent, SecurityEventType } from "./securityLogger";
import { roleDefaultRoute } from "@/lib/middleware/accessControl";
import type { Role } from "@/types/roles";

// Temporarily stores each user's role during sign-in (set in the jwt
// callback, read by the server action). Keyed by username so concurrent
// logins don't interfere. This file only runs in Node.js (not Edge).
const _signInRoles = new Map<string, string>();

/** Return the route a user should land on after login, based on their role. */
export function getPostLoginRoute(username: string): string {
  const role = _signInRoles.get(username);
  if (role) {
    _signInRoles.delete(username);
    return roleDefaultRoute[role as Role] ?? "/";
  }
  return "/";
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const username = credentials?.username as string;
        const password = credentials?.password as string; // Already hashed with SHA256 from the client

        const user = await validateUser(username, password);

        if (user) {
          logSecurityEvent({
            type: SecurityEventType.AUTH_SUCCESS,
            userId: user.username,
            resource: "/login",
          });
          return { name: user.username, role: user.rol };
        }

        logSecurityEvent({
          type: SecurityEventType.AUTH_FAILURE,
          resource: "/login",
          details: { username },
        });
        throw new InvalidCredentialsError();
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        if (user.name) _signInRoles.set(user.name, (user as any).role);
      }
      return token;
    },
  },
});
