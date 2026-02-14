import { NextResponse } from "next/server";
import { getAdminCookieOptions } from "@/lib/adminSession";

const ADMIN_COOKIE_NAME = "hatrix_admin_session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    ...getAdminCookieOptions(),
    maxAge: 0,
  });
  return response;
}
