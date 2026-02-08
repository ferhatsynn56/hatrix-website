let checkoutCache = null;
const STORAGE_KEY = "hatrix_checkout_cache_v1";

const canUseStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

export const setCheckoutData = (data) => {
  checkoutCache = data || null;
  if (!canUseStorage()) return;
  try {
    if (!data) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

export const getCheckoutData = () => {
  if (checkoutCache) return checkoutCache;
  if (!canUseStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    checkoutCache = JSON.parse(raw);
    return checkoutCache;
  } catch {
    return null;
  }
};

export const clearCheckoutData = () => {
  checkoutCache = null;
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
};
