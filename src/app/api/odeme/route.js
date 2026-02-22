import { NextResponse } from "next/server";
import Iyzipay from "iyzipay";

export const runtime = "nodejs";

const FREE_SHIPPING_THRESHOLD = 1500;
const SHIPPING_FEE = 70;
const LARGE_PRINT_AREA_THRESHOLD_01 = 0.4; // 5'te 2
const LARGE_PRINT_EXTRA_PRICE = 50;

const DEFAULT_MODEL_TYPE = "yeni-duz-tshirt";
const MODEL_BASE_PRICES = Object.freeze({
  "yeni-duz-tshirt": 350,
  "yeni-oversize-tshirt": 400,
  "yeni-duz-sweat": 600,
  "yeni-oversize-sweat": 650,
  "yeni-fermuarli": 650,
  "hoodie-v12-canavari": 750,
  "oversize-hoodie-parcali": 800,
  "polarv3": 800,
  "polar-son": 800,
});

const MODEL_TYPE_ALIASES = Object.freeze({
  tshirt: "yeni-duz-tshirt",
  "normal-tshirt": "yeni-duz-tshirt",
  "normal-tisort": "yeni-duz-tshirt",
  "duz-tshirt": "yeni-duz-tshirt",
  "duz-tisort": "yeni-duz-tshirt",
  sweatshirt: "yeni-duz-sweat",
  "sweat-yeni": "yeni-duz-sweat",
  "sweat-deneme": "yeni-duz-sweat",
  "oversize-tshirt": "yeni-oversize-tshirt",
  "oversize-tshirt-efektli": "yeni-oversize-tshirt",
  "oversize-sweat": "yeni-oversize-sweat",
  hoodie: "hoodie-v12-canavari",
  "hoodie-ipli": "hoodie-v12-canavari",
  "hoodie-cepli": "hoodie-v12-canavari",
  "hoodie-ceplipli": "hoodie-v12-canavari",
  "hoodie-oversize": "oversize-hoodie-parcali",
  "hoodie-oversize-ipli": "oversize-hoodie-parcali",
  "hoodie-oversize-cepli": "oversize-hoodie-parcali",
  "hoodie-oversize-ceplipli": "oversize-hoodie-parcali",
  fermuarli: "yeni-fermuarli",
  polarv3: "polarv3",
  polarv5: "polarv3",
  polar: "polarv3",
  "polar-son": "polarv3",
  "duz tisort": "yeni-duz-tshirt",
  "duz tshirt": "yeni-duz-tshirt",
});

const toMoney = (value) => Number(value || 0).toFixed(2);
const onlyDigits = (value = "") => String(value).replace(/\D/g, "");
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));

const normalizeModelType = (type) => {
  const raw = String(type || "")
    .toLowerCase()
    .trim();
  if (!raw) return DEFAULT_MODEL_TYPE;
  const slug = raw.replace(/\s+/g, "-").replace(/_/g, "-");
  const resolved = MODEL_TYPE_ALIASES[raw] || MODEL_TYPE_ALIASES[slug] || raw;
  return Object.prototype.hasOwnProperty.call(MODEL_BASE_PRICES, resolved) ? resolved : DEFAULT_MODEL_TYPE;
};

const getModelBasePrice = (modelType) => {
  const safeType = normalizeModelType(modelType);
  return MODEL_BASE_PRICES[safeType] ?? MODEL_BASE_PRICES[DEFAULT_MODEL_TYPE] ?? 350;
};

const getTextCurveValue = (t) => clamp(Number(t?.curve ?? 30), 6, 88);

const estimateTextHalfBounds01 = (textState = {}) => {
  const rawText = String(textState?.text || "").trim();
  const text = rawText || "W";
  const charCount = Math.max(1, text.length);
  const size = clamp(Number(textState?.size) || 150, 30, 420);
  const scaleX = clamp(Number(textState?.scaleX) || 1, 0.3, 3);
  const scaleY = clamp(Number(textState?.scaleY) || 1, 0.3, 3);
  const layout = String(textState?.layout || "straight");
  const curve = getTextCurveValue(textState);

  const avgGlyphW = size * 0.58 * scaleX;
  const spacing = size * 0.03 * scaleX;
  const baseW = Math.max(size * 0.75 * scaleX, charCount * avgGlyphW + (charCount - 1) * spacing);
  let boxW = baseW;
  let boxH = size * 1.15 * scaleY;

  if (layout === "wave") boxH += size * (curve / 100) * 0.9 * scaleY;
  if (layout === "zigzag") boxH += size * (curve / 100) * 1.45 * scaleY;
  if (layout === "stair-up" || layout === "stair-down") boxH += size * (curve / 100) * 1.7 * scaleY;
  if (layout === "arc-up" || layout === "arc-down") {
    boxH += size * (curve / 100) * 1.35 * scaleY;
    boxW += size * 0.2 * scaleX;
  }
  if (layout === "arc-up-strong" || layout === "arc-down-strong") {
    boxH += size * (curve / 100) * 1.8 * scaleY;
    boxW += size * 0.28 * scaleX;
  }

  const pad = size * 0.1;
  const halfW01 = clamp((boxW / 2 + pad) / 1024, 0.035, 0.49);
  const halfH01 = clamp((boxH / 2 + pad) / 1024, 0.035, 0.49);
  return { halfW01, halfH01 };
};

const getLogoArea01 = (logo) => {
  if (!logo) return 0;
  const box = logo.box || {};
  const w = Number(box.w);
  const h = Number(box.h);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return 0;
  return clamp(w * h, 0, 1);
};

const getTextArea01 = (sideData = {}) => {
  const textState = sideData?.customText || {};
  const rawText = String(textState?.text || "").trim();
  if (!rawText) return 0;
  const { halfW01, halfH01 } = estimateTextHalfBounds01(textState);
  return clamp(halfW01 * 2 * halfH01 * 2, 0, 1);
};

const getPdfArea01 = (designDetails, side = "front") => {
  const hasPdf = Boolean(designDetails?.hasPdf && designDetails?.pdfFileUrl);
  if (!hasPdf) return 0;
  const placement = designDetails?.pdfPlacement || {};
  const placementSide = placement?.side === "back" ? "back" : "front";
  if (placementSide !== side) return 0;
  const w = Number(placement?.w);
  const h = Number(placement?.h);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return 0;
  return clamp(w * h, 0, 1);
};

const getDesignLargePrintChargeSummary = (designDetails = {}) => {
  const sides = designDetails?.sides || {};
  let count = 0;

  ["front", "back"].forEach((side) => {
    const sideData = sides?.[side] || {};
    const logos = Array.isArray(sideData?.logos) ? sideData.logos : [];
    const logosArea = logos.reduce((sum, logo) => sum + getLogoArea01(logo), 0);
    const textArea = getTextArea01(sideData);
    const pdfArea = getPdfArea01(designDetails, side);
    const coverage = clamp(logosArea + textArea + pdfArea, 0, 1);
    if (coverage >= LARGE_PRINT_AREA_THRESHOLD_01) count += 1;
  });

  return {
    count,
    amount: count * LARGE_PRINT_EXTRA_PRICE,
  };
};

const getDesignUnitPrice = (item = {}) => {
  const designDetails = item?.designDetails;
  if (!designDetails || typeof designDetails !== "object") return null;
  const modelType = item?.modelType || designDetails?.model || designDetails?.modelType;
  const basePrice = getModelBasePrice(modelType);
  const largePrintCharge = getDesignLargePrintChargeSummary(designDetails).amount;
  return basePrice + largePrintCharge;
};

const parseExpiry = (raw = "") => {
  const cleaned = String(raw).trim().replace(/\s+/g, "");
  const [monthRaw = "", yearRaw = ""] = cleaned.split("/");
  const month = monthRaw.padStart(2, "0");
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  if (!/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
  return { month, year };
};

const splitName = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { name: "Musteri", surname: "Musteri" };
  const name = parts.shift();
  const surname = parts.join(" ") || "Musteri";
  return { name, surname };
};

const getClientIp = (request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
};

const createIyziPayment = (client, payload) =>
  new Promise((resolve, reject) => {
    client.payment.create(payload, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });

export async function POST(request) {
  try {
    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { success: false, message: "Iyzico anahtarları eksik." },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { kartBilgileri, sepet, tutar, musteri } = data || {};

    if (!kartBilgileri || !Array.isArray(sepet) || sepet.length === 0) {
      return NextResponse.json(
        { success: false, message: "Sepet boş veya kart bilgisi eksik." },
        { status: 400 }
      );
    }

    const normalizedBasket = sepet
      .map((item, index) => ({
        id: item?.id ? String(item.id) : `item-${index + 1}`,
        name: String(item?.name || `Urun ${index + 1}`),
        incomingUnitPrice: Number(item?.price || 0),
        price: Number((getDesignUnitPrice(item) ?? item?.price) || 0),
        quantity: Math.max(1, Number(item?.quantity || 1)),
      }))
      .filter((item) => Number.isFinite(item.price) && item.price > 0);

    if (!normalizedBasket.length) {
      return NextResponse.json(
        { success: false, message: "Sepette geçerli ürün yok." },
        { status: 400 }
      );
    }

    const subtotal = normalizedBasket.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingPrice = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const calculatedTotal = Number((subtotal + shippingPrice).toFixed(2));
    const incomingTotal = Number(Number(tutar || 0).toFixed(2));

    if (!Number.isFinite(incomingTotal) || Math.abs(incomingTotal - calculatedTotal) > 0.01) {
      return NextResponse.json(
        { success: false, message: "Tutar doğrulaması başarısız." },
        { status: 400 }
      );
    }

    const cardNumber = onlyDigits(kartBilgileri?.kartNo);
    const cvc = onlyDigits(kartBilgileri?.cvv);
    const expiry = parseExpiry(kartBilgileri?.skt);

    if (cardNumber.length < 12 || cvc.length < 3 || !expiry) {
      return NextResponse.json(
        { success: false, message: "Kart bilgileri geçersiz." },
        { status: 400 }
      );
    }

    const customerNameRaw = musteri?.adSoyad || kartBilgileri?.adSoyad || "Musteri";
    const { name, surname } = splitName(customerNameRaw);
    const safeAddress = String(musteri?.adres || "Adres bilgisi yok");
    const safeCity = String(musteri?.sehir || "Istanbul");
    const safePhone = String(musteri?.telefon || "+905555555555");
    const safeEmail = String(musteri?.email || "test@example.com");
    const ip = getClientIp(request);
    const conversationId = `steni-${Date.now()}`;

    const iyzipay = new Iyzipay({ apiKey, secretKey, uri });

    const paymentRequest = {
      locale: "tr",
      conversationId,
      price: toMoney(subtotal),
      paidPrice: toMoney(calculatedTotal),
      currency: "TRY",
      installment: "1",
      basketId: `basket-${Date.now()}`,
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      paymentCard: {
        cardHolderName: customerNameRaw,
        cardNumber,
        expireMonth: expiry.month,
        expireYear: expiry.year,
        cvc,
        registerCard: "0",
      },
      buyer: {
        id: `BY-${Date.now()}`,
        name,
        surname,
        gsmNumber: safePhone,
        email: safeEmail,
        identityNumber: "11111111111",
        lastLoginDate: "2025-01-01 12:00:00",
        registrationDate: "2025-01-01 12:00:00",
        registrationAddress: safeAddress,
        ip,
        city: safeCity,
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: {
        contactName: customerNameRaw,
        city: safeCity,
        country: "Turkey",
        address: safeAddress,
        zipCode: "34000",
      },
      billingAddress: {
        contactName: customerNameRaw,
        city: safeCity,
        country: "Turkey",
        address: safeAddress,
        zipCode: "34000",
      },
      basketItems: normalizedBasket.map((item) => ({
        id: item.id,
        name: item.name,
        category1: "Tekstil",
        itemType: "PHYSICAL",
        price: toMoney(item.price * item.quantity),
      })),
    };

    const result = await createIyziPayment(iyzipay, paymentRequest);

    if (result?.status === "success") {
      return NextResponse.json({
        success: true,
        message: "Ödeme onaylandı.",
        siparisNo: result?.paymentId || conversationId,
        paymentId: result?.paymentId || null,
        conversationId,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: result?.errorMessage || "Ödeme reddedildi.",
        errorCode: result?.errorCode || null,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Ödeme API Hatası:", error);
    return NextResponse.json(
      { success: false, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
