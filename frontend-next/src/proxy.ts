import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/quiz",
  "/flashcards",
  "/materials",
  "/ai-tutor",
];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin-dashboard"];

// Routes that authenticated users should NOT visit
const AUTH_ROUTES = ["/auth/login", "/auth/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the session flag cookie set by auth service
  const isLoggedIn = request.cookies.has("is_logged_in");

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Unauthenticated user trying to access a protected route → redirect to login
  if ((isProtectedRoute || isAdminRoute) && !isLoggedIn) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to visit login/signup → redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.delete("next");
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals, static files, and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)).*)",
  ],
};
