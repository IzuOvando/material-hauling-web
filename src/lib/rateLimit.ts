import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import CONSTANTS from "@/config/constants";

const { AUTH, API } = CONSTANTS.RATE_LIMIT;

export const authRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(AUTH.REQUESTS, AUTH.WINDOW as Parameters<typeof Ratelimit.slidingWindow>[1]),
  prefix: "rl:auth",
});

export const apiRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(API.REQUESTS, API.WINDOW as Parameters<typeof Ratelimit.slidingWindow>[1]),
  prefix: "rl:api",
});

export function rateLimitResponse(
  limit: number,
  remaining: number,
  reset: number,
): Response {
  const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(Math.max(retryAfterSeconds, 1)),
      },
    },
  );
}
