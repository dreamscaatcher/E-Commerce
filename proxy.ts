import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdminRequest } from "./lib/admin/auth";

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/logout")) {
    return NextResponse.next();
  }

  const isAdmin = await isAdminRequest(request);
  if (isAdmin) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return redirectToLogin(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

