import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { getAdminCookieOptions, getAdminSessionToken } from "@/lib/adminSession";

const DEFAULT_ADMIN_USERNAME = "s0n0smanli56";
const DEFAULT_ADMIN_PASSWORD = "06SG716tr.";
const ADMIN_COOKIE_NAME = "hatrix_admin_session";

const hashSha256 = (value) => createHash("sha256").update(String(value || ""), "utf8").digest("hex");

const safeCompare = (left, right) => {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const getExpectedUsername = () => DEFAULT_ADMIN_USERNAME;
const getExpectedPasswordHash = () => hashSha256(DEFAULT_ADMIN_PASSWORD);

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Kullanıcı adı ve şifre gerekli." }, { status: 400 });
    }

    const expectedUsername = getExpectedUsername();
    const expectedPasswordHash = getExpectedPasswordHash();
    const sessionToken = getAdminSessionToken();

    if (!expectedUsername || !expectedPasswordHash || !sessionToken) {
      return NextResponse.json(
        { success: false, message: "Admin oturum ayarları eksik. .env ayarlarını tamamla." },
        { status: 500 }
      );
    }

    const usernameOk = safeCompare(username.trim(), expectedUsername);
    const passwordOk = safeCompare(hashSha256(password), expectedPasswordHash);
    if (!usernameOk || !passwordOk) {
      return NextResponse.json({ success: false, message: "Hatalı kullanıcı adı veya şifre." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, getAdminCookieOptions());
    return response;
  } catch (error) {
    console.error("Admin login API hatası:", error);
    return NextResponse.json({ success: false, message: "Sunucu hatası." }, { status: 500 });
  }
}
