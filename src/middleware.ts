import NextAuth from "next-auth";
import { authConfig } from "./auth/auth.config";

export default NextAuth(authConfig).auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const pathname = req.nextUrl.pathname;

  if (isLoggedIn && pathname === "/login")
    return Response.redirect(new URL("/", req.nextUrl.origin));

  if (!isLoggedIn && pathname !== "/login")
    return Response.redirect(new URL("/login", req.nextUrl.origin));
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff|ico|js)$).*)",
  ],
};
