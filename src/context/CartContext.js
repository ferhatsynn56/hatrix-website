"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
    apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
    authDomain: "hatrix-db.firebaseapp.com",
    projectId: "hatrix-db",
    storageBucket: "hatrix-db.firebasestorage.app",
    messagingSenderId: "903710965804",
    appId: "1:903710965804:web:5dc754a337a1d9d7951189",
    measurementId: "G-C03LWY68K7"
};

// Firebase Başlatma
let app, db, auth, storage;
try {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
} catch (e) {
    console.error("Firebase Başlatma Hatası:", e);
}

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
            });
            return () => unsubscribe();
        }
    }, []);

    // --- YARDIMCI: VERİ TEMİZLEME FONKSİYONU ---
    // Bu fonksiyon, Firestore'a gönderilmeden önce verideki 'undefined' değerleri temizler.
    const sanitizeData = (data) => {
        // Eğer veri undefined ise null döndür (Firestore null sever, undefined sevmez)
        if (data === undefined) return null;
        if (data === null) return null;
        
        // Eğer dizi ise içindekileri temizle
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }
        
        // Eğer obje ise alanlarını temizle
        if (typeof data === 'object') {
            const cleanObj = {};
            Object.keys(data).forEach(key => {
                cleanObj[key] = sanitizeData(data[key]);
            });
            return cleanObj;
        }
        
        // Düz veri (string, number, boolean) ise olduğu gibi döndür
        return data;
    };

    // --- SEPETE EKLEME ---
    const addToCart = (product, size = null, color = null) => {
        const safeProduct = {
            id: product.id || Date.now(),
            name: product.name || "Ürün",
            price: Number(product.price) || 0,
            size: size || product.size || "Standart",
            image: product.image || "",
            color: color ? (typeof color === 'object' ? color.hex : color) : (product.color || "#000000"),
            quantity: 1,
            // Tasarım detaylarını kontrol et ve eksikse null yap
            designDetails: product.designDetails ? {
                model: product.designDetails.model || "tshirt",
                baseColor: product.designDetails.baseColor || "#000000",
                printPosition: product.designDetails.printPosition || { x: 50, y: 30 },
                printScale: product.designDetails.printScale || 0.5,
                printFile: product.designDetails.printFile || "" 
            } : null
        };

        setCart((prevCart) => [...prevCart, safeProduct]);
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    // --- SİPARİŞİ TAMAMLA ---
    const completeOrder = async (customerDetails) => {
        if (!db) return { success: false, error: "Veritabanı bağlantısı yok." };
        
        try {
            // 1. ADIM: Resimleri Storage'a Yükle
            const processedCart = await Promise.all(cart.map(async (item) => {
                // Derin kopya alalım
                let finalItem = JSON.parse(JSON.stringify(item));

                // Özel tasarım dosyası var mı ve Base64 mü?
                if (finalItem.designDetails?.printFile && finalItem.designDetails.printFile.startsWith('data:')) {
                    try {
                        const fileName = `designs/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
                        const storageRef = ref(storage, fileName);
                        
                        await uploadString(storageRef, finalItem.designDetails.printFile, 'data_url');
                        const downloadURL = await getDownloadURL(storageRef);

                        // Linki güncelle
                        finalItem.designDetails.printFile = downloadURL;
                        finalItem.image = downloadURL; // Ana resmi de güncelle

                    } catch (uploadError) {
                        console.error("Resim yükleme hatası:", uploadError);
                        finalItem.designDetails.printFile = null; // Hata varsa null yap
                    }
                }
                return finalItem;
            }));

            // 2. ADIM: Veriyi Hazırla
            const rawOrderData = {
                items: processedCart,
                total: cart.reduce((total, item) => total + item.price, 0),
                customer: customerDetails,
                userId: user ? user.uid : "misafir",
                status: "Sipariş Alındı",
                createdAt: new Date().toISOString()
            };

            // 3. ADIM: Veriyi TEMİZLE (Sanitize) - Hatayı çözen kısım burası
            const cleanOrderData = sanitizeData(rawOrderData);

            // 4. ADIM: Kaydet
            const docRef = await addDoc(collection(db, "siparisler"), cleanOrderData);
            
            clearCart();
            return { success: true, orderId: docRef.id };

        } catch (error) {
            console.error("Sipariş hatası:", error);
            // Detaylı hatayı konsola yazdıralım ki görebilelim
            console.log("Hatalı Veri:", cart); 
            return { success: false, error: error.message };
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, completeOrder, user }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);