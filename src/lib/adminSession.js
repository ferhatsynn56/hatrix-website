const DEV_FALLBACK_SESSION_TOKEN = "hatrix-dev-admin-session-token";

export const getAdminSessionToken = () => {
  const envToken = process.env.ADMIN_SESSION_TOKEN;
  if (typeof envToken === "string" && envToken.trim().length >= 24) {
    return envToken.trim();
  }
  if (process.env.NODE_ENV !== "production") {
    return DEV_FALLBACK_SESSION_TOKEN;
  }
  return "";
};

export const getAdminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 12,
});
