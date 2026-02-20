// TODO (SEC-015): Migrate to next-auth v5 stable when released. Currently on beta.30.
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  logger: {
    error: (error: any) => {
      const suppressedTypes = ["AuthError"];
      if (!suppressedTypes.includes(error.type))
        console.error("[auth][error]", error);
    },
  },
} satisfies NextAuthConfig;
