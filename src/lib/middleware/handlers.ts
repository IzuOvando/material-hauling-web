/**
 * Middleware Request Handlers
 *
 * Contains handlers for different route types (API, Web).
 * Each handler encapsulates the logic for its specific route category.
 */

import { NextResponse } from "next/server";
import { NextAuthRequest } from "next-auth";
import {
  authRateLimit,
  apiRateLimit,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { logSecurityEvent, SecurityEventType } from "@/auth/securityLogger";
import { corsHeaders } from "./cors";
import type { Role } from "@/types/roles";
import {
  publicWebRoutes,
  strictRateLimitRoutes,
  isPublicOrMobileApiRoute,
  roleDefaultRoute,
  canRoleAccessRoute,
} from "./accessControl";

export interface HandlerContext {
  nonce: string;
  securityHeaders: Record<string, string>;
  isProduction: boolean;
}

// ============================================================================
// API Route Handlers
// ============================================================================

function handleCorsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * Apply rate limiting for API routes
 * @returns Response if rate limited, null otherwise
 */
async function applyRateLimit(
  pathname: string,
  headers: Headers,
): Promise<Response | null> {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const limiter = strictRateLimitRoutes.has(pathname)
    ? authRateLimit
    : apiRateLimit;

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      ip,
      resource: pathname,
    });
    return rateLimitResponse(limit, remaining, reset);
  }

  return null;
}

function unauthorizedApiResponse(): Response {
  return new Response(
    JSON.stringify({
      error:
        "Not authorized to access this resource. Please log in on the web platform.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
}
export async function handleApiRoute(
  req: NextAuthRequest,
  ctx: HandlerContext,
): Promise<Response | NextResponse> {
  const pathname = req.nextUrl.pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  // Rate limiting (production only)
  if (ctx.isProduction) {
    const rateLimitResponse = await applyRateLimit(pathname, req.headers);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // Public API routes & mobile JWT routes — pass through with CORS
  if (isPublicOrMobileApiRoute(pathname)) {
    return NextResponse.next({ headers: corsHeaders });
  }

  // Authenticated API routes
  if (req.auth?.user) {
    return NextResponse.next({ headers: corsHeaders });
  }

  // Unauthenticated API request
  return unauthorizedApiResponse();
}

// ============================================================================
// Web Route Handlers
// ============================================================================

function createSecureWebResponse(
  req: NextAuthRequest,
  ctx: HandlerContext,
): NextResponse {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", ctx.nonce);

  return NextResponse.next({
    request: { headers: requestHeaders },
    headers: ctx.securityHeaders,
  });
}

function createSecureRedirect(url: URL, ctx: HandlerContext): NextResponse {
  const response = NextResponse.redirect(url);
  Object.entries(ctx.securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function handleWebRoute(
  req: NextAuthRequest,
  ctx: HandlerContext,
): NextResponse {
  const pathname = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;

  // Public web routes - allow with security headers
  if (publicWebRoutes.has(pathname)) {
    return createSecureWebResponse(req, ctx);
  }

  // Not logged in — redirect to /login (unless already there)
  if (!isLoggedIn && pathname !== "/login") {
    return createSecureRedirect(new URL("/login", req.nextUrl.origin), ctx);
  }

  // Not logged in and on /login — allow
  if (!isLoggedIn) {
    return createSecureWebResponse(req, ctx);
  }

  // Logged in: determine role and default route
  const role = (req.auth?.user as any)?.role as Role | undefined;
  const defaultRoute = role ? roleDefaultRoute[role] : "/";

  // Logged in on /login — redirect to role's default route
  if (pathname === "/login") {
    return createSecureRedirect(new URL(defaultRoute, req.nextUrl.origin), ctx);
  }

  // Role-based route access check
  if (role && !canRoleAccessRoute(role, pathname)) {
    return createSecureRedirect(new URL(defaultRoute, req.nextUrl.origin), ctx);
  }

  // Default: allow request with security headers
  return createSecureWebResponse(req, ctx);
}
