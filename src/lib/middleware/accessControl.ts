/**
 * Access Control Configuration
 *
 * Defines which routes are public, protected, or have special handling.
 * Centralizes route access rules for the middleware.
 */

/** Web routes accessible without authentication */
export const publicWebRoutes = new Set(["/trucks/voucher"]);

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
