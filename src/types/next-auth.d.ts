import type { Role } from "@/types/roles";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: { name?: string | null; role?: Role };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
