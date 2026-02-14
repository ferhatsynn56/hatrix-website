import { NextResponse } from "next/server";
import { getAdminSessionToken } from "@/lib/adminSession";

const ADMIN_COOKIE_NAME = "hatrix_admin_session";
const ADMIN_LOGIN_PATH = "/admin";
const ADMIN_DEFAULT_PATH = "/admin/dashboard";

const PROTECTED_ADMIN_PATHS = [
  "/admin/dashboard",
  "/admin/panel",
  "/admin/urunler",
  "/admin/raporlar",
];

const isProtectedAdminPath = (pathname) =>
  PROTECTED_ADMIN_PATHS.some((basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`));

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionToken = getAdminSessionToken();

  if (!sessionToken) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value || "";
  const isAuthed = cookieValue === sessionToken;
  const isLoginPath = pathname === ADMIN_LOGIN_PATH;

  if (isProtectedAdminPath(pathname) && !isAuthed) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPath && isAuthed) {
    return NextResponse.redirect(new URL(ADMIN_DEFAULT_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
