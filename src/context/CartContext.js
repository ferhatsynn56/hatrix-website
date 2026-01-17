"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    // Sayfa yüklendiğinde LocalStorage'dan sepeti çek
    useEffect(() => {
        const savedCart = localStorage.getItem("sepet");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Sepet her değiştiğinde LocalStorage'a kaydet
    useEffect(() => {
        localStorage.setItem("sepet", JSON.stringify(cart));
    }, [cart]);

    // Ürün Ekleme Fonksiyonu
    const addToCart = (product) => {
        setCart((prevCart) => {
            // Aynı ürün ve aynı beden varsa miktarını arttır, yoksa yeni ekle
            const existingItem = prevCart.find((item) => item.id === product.id && item.size === product.size);

            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id && item.size === product.size
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    };

    // Ürün Silme Fonksiyonu
    const removeFromCart = (id, size) => {
        setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.size === size)));
    };

    // Sepeti Temizle
    const clearCart = () => setCart([]);

    // Toplam Tutar
    const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}