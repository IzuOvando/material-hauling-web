// TODO (SEC-015): Migrate to next-auth v5 stable when released. Currently on beta.30.
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  logger: {
    error: (error: any) => {
      const suppressedTypes = ["AuthError"];
      if (!suppressedTypes.includes(error.type))
        console.error("[auth][error]", error);
    },
  },
} satisfies NextAuthConfig;
