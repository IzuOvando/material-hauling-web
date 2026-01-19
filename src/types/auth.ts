import type { Role } from "@/types/roles";

export type AppUser = {
  name: string;
  role: Role;
  frentes: string[];
};
