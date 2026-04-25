export const ROLES = ["owner", "admin", "user", "general"] as const;
export type Role = (typeof ROLES)[number];
