import { getSecurityHeaders } from "./security";

describe("getSecurityHeaders", () => {
  const csp = getSecurityHeaders("test-nonce")["Content-Security-Policy"];
  const directive = (name: string) =>
    csp.split("; ").find((d) => d.startsWith(`${name} `));

  it("only lets the browser connect to the app itself and Vercel Blob", () => {
    expect(directive("connect-src")).toBe(
      "connect-src 'self' https://*.public.blob.vercel-storage.com"
    );
  });

  it("does not allow arbitrary http or https origins anywhere", () => {
    expect(csp).not.toMatch(/(^|[\s;])https?:(\s|;|$)/);
  });

  it("allows scripts only from the app and the per-request nonce", () => {
    expect(directive("script-src")).toBe(
      "script-src 'self' 'nonce-test-nonce' 'strict-dynamic'"
    );
    expect(csp).not.toContain("unsafe-eval");
  });
});
