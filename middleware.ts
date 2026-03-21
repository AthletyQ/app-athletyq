import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware-client";
import type { UserRole } from "@/services/auth/auth.service";


/** Public routes that never require authentication. */
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/confirm"];

/**
 * API route prefixes that are always public (they handle their own auth).
 * The middleware passes these through without any checks.
 */
const PUBLIC_API_PREFIXES = ["/api/auth/"];


const ROLE_ROUTE_MAP: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/athlete", role: "athlete" },
  { prefix: "/coach", role: "coach" },
  { prefix: "/consultant", role: "wellness_professional" },
];


function defaultDashboard(role: UserRole | undefined): string {
  switch (role) {
    case "athlete":
      return "/athlete/dashboard";
    case "coach":
      return "/coach/dashboard";
    case "wellness_professional":
      return "/consultant/dashboard";
    default:
      return "/login";
  }
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/* ─── Middleware ──────────────────────────────────────────────────────────── */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Always allow public API routes through immediately ─────────────────
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next({ request });
  }

  // Start with a passthrough response so cookies can be forwarded.
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  console.log("client ", supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("user", user);

  const role = user?.user_metadata?.role as UserRole | undefined;

  console.log("role", role);

  // ── 2. Unauthenticated user ───────────────────────────────────────────────
  if (!user) {
    if (!isPublicRoute(pathname)) {
      // API routes should get a 401 JSON response, not an HTML redirect.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.redirect(
      new URL(defaultDashboard(role), request.url),
    );
  }

  const matchedRoute = ROLE_ROUTE_MAP.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (matchedRoute && role !== matchedRoute.role) {
    // User is authenticated but is trying to access another role's area.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(
      new URL(defaultDashboard(role), request.url),
    );
  }

  return response;
}


export const config = {
  matcher: [
    /*
     * Run middleware on every route EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - common static asset extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
