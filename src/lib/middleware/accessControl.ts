import type { Role } from "@/types/roles";

export const publicWebRoutes = new Set(["/trucks/voucher", "/forbidden"]);

const restrictedRoleRoutes = ["/trucks/db"];

const ownerGeneralOnlyRoutes = ["/trucks/dashboard"];

export const roleDefaultRoute: Record<Role, string> = {
  owner: "/",
  admin: "/trucks/db",
  user: "/forbidden",
  general: "/trucks/db",
};

export function canRoleAccessRoute(role: Role, pathname: string): boolean {
  if (role === "owner") return true;
  if (role === "user") return false;
  const allAllowed = role === "general"
    ? [...restrictedRoleRoutes, ...ownerGeneralOnlyRoutes]
    : restrictedRoleRoutes;
  return allAllowed.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

const publicApiRoutes = new Set([
  "/api/mobile/auth",
  "/api/mobile/auth/refresh",
  "/api/enterprises/images",
]);

export const AUTH_LOGIN_ROUTE = "/api/mobile/auth";
export const AUTH_REFRESH_ROUTE = "/api/mobile/auth/refresh";

export const strictRateLimitRoutes = new Set([
  AUTH_LOGIN_ROUTE,
  AUTH_REFRESH_ROUTE,
]);

const mobileApiPrefixes = ["/api/mobile"];

const dashboardApiPrefix = "/api/trucks/dashboard";

export function isDashboardApiRoute(pathname: string): boolean {
  return pathname.startsWith(dashboardApiPrefix);
}

export function isPublicOrMobileApiRoute(pathname: string): boolean {
  return (
    publicApiRoutes.has(pathname) ||
    mobileApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}
