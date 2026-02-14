const DEFAULT_SESSION_TOKEN = "hatrix-admin-session-token-2026";

export const getAdminSessionToken = () => {
  const envToken = process.env.ADMIN_SESSION_TOKEN;
  if (typeof envToken === "string" && envToken.trim().length >= 24) {
    return envToken.trim();
  }
  return DEFAULT_SESSION_TOKEN;
};

export const getAdminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 12,
});
