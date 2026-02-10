/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * Defines allowed origins, methods, and headers for API requests.
 * Used primarily for mobile app and external API consumers.
 */

import CONFIG from "@/config";

const allowedOrigin = CONFIG.BASE_URL;

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};
