import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth/auth.config";
import {
  authRateLimit,
  apiRateLimit,
  rateLimitResponse,
} from "./lib/rateLimit";
import CONFIG from "./config";
import { logSecurityEvent, SecurityEventType } from "./auth/securityLogger";

const allowedOrigin = CONFIG.BASE_URL;

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Public web routes that don't require authentication
const publicWebRoutes = new Set(["/trucks/voucher"]);

// Public API routes (no session required, have their own auth or are open)
const publicApiRoutes = new Set([
  "/api/mobile/auth",
  "/api/mobile/auth/refresh",
  "/api/enterprises/images",
]);

// Auth API routes subject to strict rate limiting
const strictRateLimitRoutes = new Set([
  "/api/mobile/auth",
  "/api/mobile/auth/refresh",
]);

// Mobile API route prefixes that use JWT (have their own internal verification)
const mobileApiPrefixes = ["/api/mobile/vouchers"];

export default NextAuth(authConfig).auth(async (req) => {
  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  // --- API routes ---
  if (isApiRoute) {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    // Rate limiting (production only — dev may not have Redis)
    if (process.env.NODE_ENV === "production") {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
      const limiter = strictRateLimitRoutes.has(pathname) ? authRateLimit : apiRateLimit;
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      if (!success) {
        logSecurityEvent({ type: SecurityEventType.RATE_LIMIT_EXCEEDED, ip, resource: pathname });
        return rateLimitResponse(limit, remaining, reset);
      }
    }

    // Public API routes & mobile JWT routes — pass through with CORS
    if (
      publicApiRoutes.has(pathname) ||
      mobileApiPrefixes.some((prefix) => pathname.startsWith(prefix))
    ) {
      return NextResponse.next({ headers: corsHeaders });
    }

    // Authenticated API routes
    if (req.auth?.user) {
      return NextResponse.next({ headers: corsHeaders });
    }

    // Unauthenticated API request
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

  // --- Web routes ---
  const isLoggedIn = !!req.auth?.user;

  if (publicWebRoutes.has(pathname)) return;

  if (isLoggedIn && pathname === "/login") {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }

  if (!isLoggedIn && pathname !== "/login") {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    // Include API routes, exclude static assets
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico|js)$).*)",
  ],
};
