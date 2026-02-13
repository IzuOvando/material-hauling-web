/**
 * Access Control Configuration
 *
 * Defines which routes are public, protected, or have special handling.
 * Centralizes route access rules for the middleware.
 */

import type { Role } from "@/types/roles";

/** Web routes accessible without authentication */
export const publicWebRoutes = new Set(["/trucks/voucher", "/forbidden"]);

/** Routes accessible to admin and user roles */
const restrictedRoleRoutes = ["/trucks/db"];

/** Default redirect target per role */
export const roleDefaultRoute: Record<Role, string> = {
  owner: "/",
  admin: "/trucks/db",
  user: "/forbidden",
};

/** Check if a role can access a given pathname */
export function canRoleAccessRoute(role: Role, pathname: string): boolean {
  if (role === "owner") return true;
  if (role === "user") return false;
  return restrictedRoleRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/** API routes that don't require session auth (have own auth or are open) */
const publicApiRoutes = new Set([
  "/api/mobile/auth",
  "/api/mobile/auth/refresh",
  "/api/enterprises/images",
]);

/** API routes with stricter rate limiting (auth endpoints) */
export const strictRateLimitRoutes = new Set([
  "/api/mobile/auth",
  "/api/mobile/auth/refresh",
]);

/** Mobile API prefixes that use JWT (have internal token verification) */
const mobileApiPrefixes = ["/api/mobile/vouchers"];

/**
 * Check if a route is a public API route or uses mobile JWT auth
 */
export function isPublicOrMobileApiRoute(pathname: string): boolean {
  return (
    publicApiRoutes.has(pathname) ||
    mobileApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}
