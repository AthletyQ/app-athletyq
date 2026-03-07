import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware-client";
import type { UserRole } from "@/services/auth/auth.service";

/* ─── Route configuration ─────────────────────────────────────────────────── */

/** Public routes that never require authentication. */
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/confirm"];

/**
 * Maps a URL path prefix to the role that is allowed to access it.
 * The order matters — more specific prefixes should come first.
 */
const ROLE_ROUTE_MAP: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/athlete", role: "athlete" },
  { prefix: "/coach", role: "coach" },
  { prefix: "/consultant", role: "wellness_professional" },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

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

  // Start with a passthrough response so cookies can be forwarded.
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // Always call getUser() — it refreshes expired tokens and keeps cookies
  // up to date. IMPORTANT: use getUser(), not getSession(), to avoid trusting
  // an unverified client-side session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as UserRole | undefined;

  // ── 1. Allow static assets and Next.js internals through immediately ──────
  // (handled by the `matcher` in config below — middleware won't even run)

  // ── 2. Unauthenticated user ───────────────────────────────────────────────
  if (!user) {
    if (!isPublicRoute(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // ── 3. Authenticated user hitting an auth/public route ───────────────────
  // Redirect them straight to their dashboard instead of showing login/signup.
  if (isPublicRoute(pathname)) {
    return NextResponse.redirect(
      new URL(defaultDashboard(role), request.url),
    );
  }

  // ── 4. Role-based access control ─────────────────────────────────────────
  const matchedRoute = ROLE_ROUTE_MAP.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (matchedRoute && role !== matchedRoute.role) {
    // User is authenticated but is trying to access another role's area.
    return NextResponse.redirect(
      new URL(defaultDashboard(role), request.url),
    );
  }

  return response;
}

/* ─── Matcher ────────────────────────────────────────────────────────────── */

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
