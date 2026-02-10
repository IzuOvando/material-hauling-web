/**
 * Middleware Utilities
 *
 * This module organizes middleware concerns into separate files:
 * - security.ts: CSP headers and nonce generation
 * - cors.ts: CORS configuration for API routes
 * - accessControl.ts: Route access rules (public/protected)
 * - handlers.ts: Request handlers for API and web routes
 */

export { generateNonce, getSecurityHeaders } from "./security";
export {
  handleApiRoute,
  handleWebRoute,
  type HandlerContext,
} from "./handlers";
