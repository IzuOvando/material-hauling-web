import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import CONSTANTS from "@/config/constants";

const { AUTH_LOGIN, AUTH_REFRESH, API } = CONSTANTS.RATE_LIMIT;

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

export const authLoginRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(
    AUTH_LOGIN.REQUESTS,
    AUTH_LOGIN.WINDOW as Window,
  ),
  prefix: "rl:auth:login",
});

export const authRefreshRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(
    AUTH_REFRESH.REQUESTS,
    AUTH_REFRESH.WINDOW as Window,
  ),
  prefix: "rl:auth:refresh",
});

export const apiRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(API.REQUESTS, API.WINDOW as Window),
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
