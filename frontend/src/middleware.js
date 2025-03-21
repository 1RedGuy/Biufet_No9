import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// These paths require a valid token to access
const protectedPaths = ["/profile"];

// These paths show mock data when no token is present
const mockDataPaths = ["/dashboard"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if the path is fully protected and requires authentication
  const isFullyProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Check if the path can use mock data without authentication
  const isMockDataPath = mockDataPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const token = request.cookies.get("token")?.value;

  // For fully protected paths, redirect to login if not authenticated
  if (isFullyProtectedPath && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // If the user is authenticated and trying to access login/register
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for the ones starting with /api, static files, etc.
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
