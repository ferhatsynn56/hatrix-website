import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { getAdminCookieOptions, getAdminSessionToken } from "@/lib/adminSession";

const DEV_FALLBACK_USERNAME = "admin";
const DEV_FALLBACK_PASSWORD = "123456";
const ADMIN_COOKIE_NAME = "hatrix_admin_session";

const hashSha256 = (value) => createHash("sha256").update(String(value || ""), "utf8").digest("hex");

const safeCompare = (left, right) => {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const getExpectedUsername = () => {
  const fromEnv = process.env.ADMIN_USERNAME;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_USERNAME;
  return "";
};

const getExpectedPasswordHash = () => {
  const fromHash = process.env.ADMIN_PASSWORD_HASH;
  if (typeof fromHash === "string" && fromHash.trim().length === 64) return fromHash.trim().toLowerCase();

  const fromPlain = process.env.ADMIN_PASSWORD;
  if (typeof fromPlain === "string" && fromPlain.length > 0) return hashSha256(fromPlain);

  if (process.env.NODE_ENV !== "production") return hashSha256(DEV_FALLBACK_PASSWORD);
  return "";
};

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
