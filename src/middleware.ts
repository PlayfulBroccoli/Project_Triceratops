import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const user = process.env.TRICERATOPS_ADMIN_USER || "admin";
  const pass = process.env.TRICERATOPS_ADMIN_PASSWORD || "";

  if (!pass) {
    return new NextResponse("TRICERATOPS_ADMIN_PASSWORD not set", { status: 500 });
  }

  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const idx = decoded.indexOf(":");
      if (idx !== -1) {
        const u = decoded.slice(0, idx);
        const p = decoded.slice(idx + 1);
        if (u === user && p === pass) {
          return NextResponse.next();
        }
      }
    } catch {
      // fallthrough
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Project Triceratops"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};