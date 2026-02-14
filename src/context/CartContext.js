"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const safeParse = (s, fallback) => {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

const isDataUrl = (v) => typeof v === "string" && v.startsWith("data:");
const mimeInfoFromDataUrl = (dataUrl) => {
  const m = (dataUrl || "").match(/^data:([^;,]+)[;,]/i);
  const mime = (m?.[1] || "application/octet-stream").toLowerCase();
  if (mime.startsWith("image/")) {
    const extRaw = mime.split("/")[1] || "png";
    const ext = extRaw === "jpg" ? "jpeg" : extRaw;
    return { mime, ext };
  }
  if (mime === "application/pdf") return { mime, ext: "pdf" };
  if (mime === "text/plain") return { mime, ext: "txt" };
  return { mime, ext: "bin" };
};

const blobFromDataUrl = async (dataUrl) => {
  // fetch dataURL destekli
  const res = await fetch(dataUrl);
  return await res.blob();
};

const uploadDataUrl = async (dataUrl, pathNoExt) => {
  if (!dataUrl) return null;
  if (!isDataUrl(dataUrl)) return dataUrl; // zaten url ise dokunma

  const { ext, mime } = mimeInfoFromDataUrl(dataUrl);
  const blob = await blobFromDataUrl(dataUrl);
  const storageRef = ref(storage, `${pathNoExt}.${ext}`);
  await uploadBytes(storageRef, blob, { contentType: blob.type || mime || `application/octet-stream` });
  return await getDownloadURL(storageRef);
};

const uploadObjectOfImages = async (obj, basePath) => {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  const keys = Object.keys(obj);
  for (const k of keys) {
    const v = obj[k];
    if (!v) continue;
    out[k] = await uploadDataUrl(v, `${basePath}/${k}_${Date.now()}`);
  }
  return out;
};

const uploadArrayOfImages = async (arr, basePath) => {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (!v) continue;
    // eslint-disable-next-line no-await-in-loop
    out.push(await uploadDataUrl(v, `${basePath}/img_${i}_${Date.now()}`));
  }
  return out;
};

const uploadNestedUploads = async (obj, basePath) => {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    // eslint-disable-next-line no-await-in-loop
    out[k] = await uploadArrayOfImages(v, `${basePath}/${k}`);
  }
  return out;
};

const compactSides = (sides) => {
  if (!sides || typeof sides !== "object") return undefined;
  const out = {};
  for (const [key, sd] of Object.entries(sides)) {
    if (!sd) continue;
    const logos = Array.isArray(sd.logos)
      ? sd.logos.map((l) => ({ id: l.id, box: l.box }))
      : [];
    out[key] = {
      logos,
      customText: sd.customText || null,
      textPos: sd.textPos || null,
    };
  }
  return out;
};

const sanitizeForFirestore = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "function" || typeof value === "symbol") return undefined;
  if (typeof value === "number" && !Number.isFinite(value)) return 0;
  if (value instanceof Blob) return undefined;
  if (value instanceof File) return undefined;
  if (value && typeof value === "object") {
    if (value instanceof Date) return value;
    if (Array.isArray(value)) {
      const next = value.map(sanitizeForFirestore).filter((v) => v !== undefined);
      return next;
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const sv = sanitizeForFirestore(v);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }
  return value;
};

const stripHeavyItemForStorage = (item) => {
  if (!item || typeof item !== "object") return item;
  const safe = { ...item };

  // dataURL görseller localStorage'ı şişirir
  if (isDataUrl(safe.image)) safe.image = null;

  if (safe.designDetails) {
    const dd = safe.designDetails || {};
    safe.designDetails = {
      model: dd.model,
      baseColor: dd.baseColor,
      fabricType: dd.fabricType,
      stringColor: dd.stringColor,
      hoodieV12Parts: dd.hoodieV12Parts || null,
      hasPdf: Boolean(dd.hasPdf),
      pdfFileUrl: isDataUrl(dd.pdfFileUrl) ? null : dd.pdfFileUrl || null,
      pdfOriginalName: dd.pdfOriginalName || "",
      pdfPlacement: dd.pdfPlacement || null,
      printTypes: Array.isArray(dd.printTypes) ? dd.printTypes : [],
      printTypesBySide: dd.printTypesBySide || null,
      rubberSpecsBySide: dd.rubberSpecsBySide || null,
      // ağır alanları localStorage'dan çıkar
    };
  }

  return safe;
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem("cart") || "[]", []);
    setCart(Array.isArray(saved) ? saved : []);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      // QuotaExceededError: base64/dataURL şişmesi
      try {
        const lite = cart.map(stripHeavyItemForStorage);
        localStorage.setItem("cart", JSON.stringify(lite));
      } catch {
        // tamamen doluysa sessiz geç
      }
    }
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => [...prev, { ...item, quantity: item.quantity || 1 }]);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const clearCart = () => setCart([]);

  const total = useMemo(() => {
    return cart.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
  }, [cart]);

  const completeOrderWithItems = async (sourceItems, customer) => {
    const itemsToProcess = Array.isArray(sourceItems) ? sourceItems : [];
    if (!itemsToProcess.length) throw new Error("Cart is empty");
    const orderIdSeed = `order_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // Upload + normalize items
    const normalizedItems = [];
    for (let idx = 0; idx < itemsToProcess.length; idx++) {
      const item = itemsToProcess[idx];
      const dd = item.designDetails || {};

      // 1) upload preview image (item.image)
      const uploadedPreview = item.image
        ? await uploadDataUrl(item.image, `orders/${orderIdSeed}/items/${idx}/preview`)
        : null;

      // 2) upload printFiles
      const uploadedPrintFiles = dd.printFiles
        ? await uploadObjectOfImages(dd.printFiles, `orders/${orderIdSeed}/items/${idx}/print`)
        : {};

      // 3) upload mockupFiles
      const uploadedMockupFiles = dd.mockupFiles
        ? await uploadObjectOfImages(dd.mockupFiles, `orders/${orderIdSeed}/items/${idx}/mockup`)
        : {};

      // 4) upload textFiles (sadece yazı çıktıları)
      const uploadedTextFiles = dd.textFiles
        ? await uploadObjectOfImages(dd.textFiles, `orders/${orderIdSeed}/items/${idx}/text`)
        : {};

      // 5) upload userUploads (ham görseller)
      let uploadedUserUploads = [];
      if (Array.isArray(dd.userUploads) && dd.userUploads.length) {
        uploadedUserUploads = [];
        for (let u = 0; u < dd.userUploads.length; u++) {
          const url = dd.userUploads[u];
          if (!url) continue;
          const up = await uploadDataUrl(url, `orders/${orderIdSeed}/items/${idx}/uploads/upload_${u}_${Date.now()}`);
          uploadedUserUploads.push(up);
        }
      }

      // 6) upload adjustedUploads (kullanıcının son ayarladığı görseller)
      const uploadedAdjustedUploads = dd.adjustedUploads
        ? await uploadNestedUploads(dd.adjustedUploads, `orders/${orderIdSeed}/items/${idx}/adjusted`)
        : {};
      const uploadedPdfFileUrl = dd.pdfFileUrl
        ? await uploadDataUrl(dd.pdfFileUrl, `orders/${orderIdSeed}/items/${idx}/pdf/source_${Date.now()}`)
        : null;
      const normalizedPdfPlacement =
        dd.pdfPlacement && typeof dd.pdfPlacement === "object"
          ? {
              x: Number(dd.pdfPlacement.x || 0),
              y: Number(dd.pdfPlacement.y || 0),
              w: Number(dd.pdfPlacement.w || 0),
              h: Number(dd.pdfPlacement.h || 0),
              scale: Number(dd.pdfPlacement.scale || dd.pdfPlacement.w || 0),
              rotation: Number(dd.pdfPlacement.rotation || 0),
              side: dd.pdfPlacement.side === "back" ? "back" : "front",
            }
          : null;

      const compactDesignDetails = dd
        ? {
            model: dd.model,
            baseColor: dd.baseColor,
            fabricType: dd.fabricType,
            stringColor: dd.stringColor,
            hoodieV12Parts: dd.hoodieV12Parts || null,
            hasPdf: Boolean(dd.hasPdf && uploadedPdfFileUrl),
            pdfFileUrl: uploadedPdfFileUrl,
            pdfOriginalName: dd.pdfOriginalName || "",
            pdfPlacement: normalizedPdfPlacement,
            printTypes: Array.isArray(dd.printTypes) ? dd.printTypes : [],
            printTypesBySide: dd.printTypesBySide || null,
            rubberSpecsBySide: dd.rubberSpecsBySide || {},
            printFiles: uploadedPrintFiles,
            textFiles: uploadedTextFiles,
            mockupFiles: uploadedMockupFiles,
            userUploads: uploadedUserUploads,
            adjustedUploads: uploadedAdjustedUploads,
            sides: compactSides(dd.sides),
          }
        : undefined;

      normalizedItems.push({
        ...item,
        image: uploadedPreview || item.image || null,
        designDetails: compactDesignDetails,
      });
    }

    const orderDoc = {
      createdAt: serverTimestamp(),
      status: "Hazırlanıyor",
      customer: customer || {},
      items: normalizedItems,
    };

    const safeOrderDoc = sanitizeForFirestore(orderDoc);
    const docRef = await addDoc(collection(db, "siparisler"), safeOrderDoc);

    return { success: true, orderId: docRef.id };
  };

  /**
   * ✅ Siparişi tamamla:
   * - Cart içindeki görselleri storage'a upload eder
   * - Firestore "siparisler" koleksiyonuna yazar
   */
  const completeOrder = async (customer) => {
    const result = await completeOrderWithItems(cart, customer);
    clearCart();
    return result;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        addToCart,
        removeFromCart,
        clearCart,
        completeOrder,
        completeOrderWithItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
