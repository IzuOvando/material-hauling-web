// Allowed host patterns for SSRF protection
const ALLOWED_HOST_PATTERNS = [
  /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/,
  /^[a-z0-9-]+\.blob\.vercel-storage\.com$/,
];

// Blocked IP ranges (private networks, localhost, metadata endpoints)
const BLOCKED_IP_PATTERNS = [
  /^127\./, // Localhost
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local (AWS/cloud metadata)
  /^0\./, // Current network
  /^localhost$/i, // Localhost hostname
];

/**
 * Validates if a URL is allowed for server-side fetching.
 * Prevents SSRF attacks by only allowing specific trusted hosts.
 */
export function isAllowedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTPS
    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Block private/internal IP ranges
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Check if hostname matches allowed patterns
    for (const pattern of ALLOWED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Validates URL and throws an error if not allowed.
 */
export function validateUrlOrThrow(url: string, context?: string): void {
  if (!isAllowedUrl(url)) {
    const message = context
      ? `Invalid or unauthorized URL for ${context}: ${url}`
      : `Invalid or unauthorized URL: ${url}`;
    throw new Error(message);
  }
}
