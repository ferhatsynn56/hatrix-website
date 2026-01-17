"use client";

import React from 'react';
import { useCart } from '@/context/CartContext'; // Context'i çekiyoruz
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function SepetSayfasi() {
    const { cart, removeFromCart, totalPrice } = useCart();

    // --- BOŞ SEPET GÖRÜNÜMÜ ---
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <ShoppingBag size={40} className="text-zinc-500" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Sepetin Boş</h1>
                <p className="text-zinc-400 mb-8 text-center max-w-md">Henüz tasarım yapmadın veya koleksiyondan bir parça seçmedin.</p>
                <Link href="/" className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-zinc-200 transition">
                    Alışverişe Başla
                </Link>
            </div>
        );
    }

    // --- DOLU SEPET GÖRÜNÜMÜ ---
    return (
        <div className="min-h-screen bg-black text-white font-sans">

            {/* HEADER */}
            <div className="fixed top-0 left-0 w-full bg-black/80 backdrop-blur-md border-b border-zinc-800 z-50 px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition uppercase text-xs font-bold tracking-widest">
                    <ArrowLeft size={16} /> Alışverişe Dön
                </Link>
                <div className="text-sm font-black uppercase tracking-widest">SEPETİM ({cart.length})</div>
                <div className="w-20"></div> {/* Hizalama için boşluk */}
            </div>

            <div className="pt-24 pb-32 max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* ÜRÜN LİSTESİ (SOL) */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item, index) => (
                        <div key={`${item.id}-${item.size}-${index}`} className="flex gap-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl items-center">

                            {/* Ürün Resmi */}
                            <div className="w-24 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Ürün Bilgisi */}
                            <div className="flex-1">
                                <h3 className="font-bold text-sm uppercase tracking-wide mb-1">{item.name}</h3>
                                <p className="text-xs text-zinc-400 mb-2">Beden: <span className="text-white font-bold">{item.size}</span></p>
                                <div className="text-red-500 font-mono font-bold">₺{item.price}</div>
                            </div>

                            {/* Sil Butonu */}
                            <button
                                onClick={() => removeFromCart(item.id, item.size)}
                                className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-red-500 hover:bg-zinc-700 transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* ÖZET VE ÖDEME (SAĞ) */}
                <div className="lg:col-span-1">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
                        <h2 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Sipariş Özeti</h2>

                        <div className="flex justify-between items-center mb-4 text-sm text-zinc-400">
                            <span>Ara Toplam</span>
                            <span className="text-white font-mono">₺{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 text-sm text-zinc-400">
                            <span>Kargo</span>
                            <span className="text-green-400 font-bold uppercase text-xs">Ücretsiz</span>
                        </div>

                        <div className="flex justify-between items-center mb-8 text-xl font-black border-t border-zinc-800 pt-4">
                            <span>TOPLAM</span>
                            <span className="text-red-500 font-mono">₺{totalPrice.toFixed(2)}</span>
                        </div>

                        <button className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            Ödemeye Geç
                        </button>

                        <p className="text-[10px] text-zinc-500 text-center mt-4">
                            Güvenli ödeme altyapısı ile korunmaktadır.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}