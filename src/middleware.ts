/**
 * Next.js Middleware
 *
 * Handles cross-cutting concerns for all requests:
 * 1. Security Headers & CSP with nonces (production only)
 * 2. CORS for API routes
 * 3. Rate limiting for API routes (production only)
 * 4. Authentication redirects for web routes
 *
 */

import NextAuth from "next-auth";
import { authConfig } from "./auth/auth.config";
import {
  generateNonce,
  getSecurityHeaders,
  handleApiRoute,
  handleWebRoute,
} from "./lib/middleware";

const isProduction = process.env.NODE_ENV === "production";

export default NextAuth(authConfig).auth(async (req) => {
  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  // Generate nonce for CSP (used by Next.js for inline scripts)
  const nonce = generateNonce();
  const securityHeaders = isProduction ? getSecurityHeaders(nonce) : {};

  const ctx = { nonce, securityHeaders, isProduction };

  // Route to appropriate handler
  if (isApiRoute) {
    return handleApiRoute(req, ctx);
  }

  return handleWebRoute(req, ctx);
});

export const config = {
  matcher: [
    /**
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Static assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico|js)$).*)",
  ],
};
