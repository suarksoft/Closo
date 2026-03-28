import { NextRequest, NextResponse } from "next/server";

function redirectToOnboarding(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/onboarding";
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const role = request.cookies.get("mb_role")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard")) {
    if (!role) return redirectToOnboarding(request);
    if (role !== "seller" && role !== "admin") return NextResponse.redirect(new URL("/business", request.url));
  }

  if (pathname.startsWith("/business")) {
    if (!role) return redirectToOnboarding(request);
    if (role !== "business" && role !== "admin") return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/business/:path*"],
};
