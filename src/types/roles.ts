export const ROLES = ["owner", "admin", "user"] as const;
export type Role = (typeof ROLES)[number];
