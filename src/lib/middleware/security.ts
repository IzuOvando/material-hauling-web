/**
 * Security Headers & Content Security Policy (CSP)
 *
 * Generates security headers including CSP with nonce support.
 * Nonces are unique per-request tokens that allow specific inline scripts
 * to execute while blocking unauthorized scripts (XSS protection).
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */

export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function buildCspHeader(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "font-src 'self'",
    "connect-src 'self' http: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

export function getSecurityHeaders(nonce: string): Record<string, string> {
  return {
    "Content-Security-Policy": buildCspHeader(nonce),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}
