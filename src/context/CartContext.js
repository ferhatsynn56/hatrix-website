"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
  authDomain: "hatrix-db.firebaseapp.com",
  projectId: "hatrix-db",
  storageBucket: "hatrix-db.firebasestorage.app",
  messagingSenderId: "903710965804",
  appId: "1:903710965804:web:5dc754a337a1d9d7951189",
  measurementId: "G-C03LWY68K7",
};

let app, db, auth, storage;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (e) {
  console.error("Firebase init hata:", e);
}

const CartContext = createContext(null);

function sanitizeData(data) {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === "object") {
    const clean = {};
    Object.keys(data).forEach((k) => (clean[k] = sanitizeData(data[k])));
    return clean;
  }
  return data;
}

async function uploadDataUrlToStorage(dataUrl, path) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, "data_url");
  return await getDownloadURL(storageRef);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // ✅ Sepete ekleme: designDetails içinde userUploads varsa taşı
  const addToCart = (product, size = null, color = null) => {
    const dd = product.designDetails || null;

    const safeProduct = {
      id: product.id || Date.now(),
      name: product.name || "Ürün",
      price: Number(product.price) || 0,
      size: size || product.size || "Standart",
      image: product.image || "",
      color: color ? (typeof color === "object" ? color.hex : color) : product.color || "#000000",
      quantity: 1,
      designDetails: dd
        ? {
            model: dd.model || "tshirt",
            baseColor: dd.baseColor || "#000000",
            printPosition: dd.printPosition || { x: 50, y: 30 },
            printScale: dd.printScale || 0.5,

            // ✅ Model üstünde duran baskı png (composite)
            printFile: dd.printFile || "",

            // ✅ Kullanıcının ham yüklediği görseller (1-2 logo vs)
            // Tasarım sayfasında bunu dolduracaksın:
            // designDetails.userUploads = [dataUrlOrUrl1, dataUrlOrUrl2]
            userUploads: Array.isArray(dd.userUploads) ? dd.userUploads.filter(Boolean) : [],
          }
        : null,
    };

    setCart((prev) => [...prev, safeProduct]);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((x) => x.id !== productId));
  };

  const clearCart = () => setCart([]);

  // ✅ Sipariş tamamlama: printFile + userUploads base64 ise Storage'a yükle, URL yap
  const completeOrder = async (customerDetails) => {
    if (!db || !storage) return { success: false, error: "Firebase bağlantısı yok." };

    try {
      const processedCart = await Promise.all(
        cart.map(async (item) => {
          const finalItem = JSON.parse(JSON.stringify(item || {}));

          // 1) printFile (composite)
          const pf = finalItem?.designDetails?.printFile;
          if (pf && typeof pf === "string" && pf.startsWith("data:")) {
            const fileName = `designs/${Date.now()}_${Math.random().toString(36).slice(2)}.png`;
            try {
              const url = await uploadDataUrlToStorage(pf, fileName);
              finalItem.designDetails.printFile = url;
              // ister thumbnail olarak da kullan:
              finalItem.image = finalItem.image || url;
            } catch (e) {
              console.error("printFile upload hata:", e);
              finalItem.designDetails.printFile = null;
            }
          }

          // 2) userUploads (ham yüklenenler)
          const ups = finalItem?.designDetails?.userUploads;
          if (Array.isArray(ups) && ups.length > 0) {
            const newUploads = [];
            for (let i = 0; i < ups.length; i++) {
              const u = ups[i];
              if (u && typeof u === "string" && u.startsWith("data:")) {
                const upName = `uploads/${Date.now()}_${i}_${Math.random().toString(36).slice(2)}.png`;
                try {
                  const url = await uploadDataUrlToStorage(u, upName);
                  newUploads.push(url);
                } catch (e) {
                  console.error("userUpload upload hata:", e);
                }
              } else if (typeof u === "string" && u.startsWith("http")) {
                newUploads.push(u);
              }
            }
            finalItem.designDetails.userUploads = newUploads;
          }

          return finalItem;
        })
      );

      const rawOrderData = {
        items: processedCart,
        total: cart.reduce((t, it) => t + Number(it.price || 0), 0),
        customer: customerDetails,
        userId: user ? user.uid : "misafir",
        status: "Sipariş Alındı",
        createdAt: new Date().toISOString(),
      };

      const cleanOrderData = sanitizeData(rawOrderData);
      const docRef = await addDoc(collection(db, "siparisler"), cleanOrderData);

      clearCart();
      return { success: true, orderId: docRef.id };
    } catch (error) {
      console.error("Sipariş hatası:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, completeOrder, user }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
