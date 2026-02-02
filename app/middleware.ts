import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("auth");
  const { pathname } = req.nextUrl;

  // halaman publik
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return NextResponse.next();
  }

  // admin only
  if (
    pathname.startsWith("/monitoring") ||
    pathname.startsWith("/dashboard")
  ) {
    if (!auth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}
