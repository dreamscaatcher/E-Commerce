import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdminRequest } from "./lib/admin/auth";

const AUTH_HEADER = 'Basic realm="Backend Dashboard"';

function unauthorizedPage() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": AUTH_HEADER },
  });
}

function unauthorizedApi() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": AUTH_HEADER } }
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdmin = await isAdminRequest(request);
  if (isAdmin) return NextResponse.next();

  if (pathname.startsWith("/api/")) return unauthorizedApi();
  return unauthorizedPage();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
