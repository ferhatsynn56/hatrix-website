"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    ShoppingBag, Menu, User, ChevronDown, LogOut, Beaker, Search,
    ArrowRight, X, Trash2, CreditCard, Star
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";

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

// --- FIREBASE BAŞLATMA ---
let auth = null;
try {
    if (Object.keys(firebaseConfig).length > 0) {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
    }
} catch (e) { console.error(e); }

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    
    const cartContext = useCart();
    const cart = cartContext?.cart || [];
    const removeFromCart = cartContext?.removeFromCart || (() => {});
    const totalPrice = cartContext?.totalPrice || 0;

    const [kullanici, setKullanici] = useState(null);
    const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
    const [sepetAcik, setSepetAcik] = useState(false);
    const [aramaAcik, setAramaAcik] = useState(false);
    const [aramaMetni, setAramaMetni] = useState("");
    const [tasarimMenuAcik, setTasarimMenuAcik] = useState(false);
    const [bilimselAcik, setBilimselAcik] = useState(false);
    
    const aramaInputRef = useRef(null);
    const iletisimMaili = "mailto:info@stenist.com";

    useEffect(() => {
        setMobilMenuAcik(false);
        setSepetAcik(false);
        setAramaAcik(false);
    }, [pathname]);

    useEffect(() => {
        if (!auth) return;
        const initAuth = async () => {
            await signInAnonymously(auth).catch(e => console.log(e));
            onAuthStateChanged(auth, (user) => {
                if (user && !user.isAnonymous) setKullanici(user);
                else setKullanici(null);
            });
        };
        initAuth();
    }, []);

    useEffect(() => {
        if (aramaAcik && aramaInputRef.current) {
            setTimeout(() => aramaInputRef.current.focus(), 100);
        }
    }, [aramaAcik]);

    const cikisYap = async () => { if (auth) await signOut(auth); };

    const aramaYap = (e) => {
        e.preventDefault();
        if (aramaMetni.trim().length > 0) {
            setAramaAcik(false);
            router.push(`/tum-urunler?ara=${encodeURIComponent(aramaMetni)}`);
        }
    };

    const formatPrice = (price) => {
        if (isNaN(price) || price === null || price === undefined) return "0.00";
        return parseFloat(price).toFixed(2);
    };

    return (
        <>
            <style jsx global>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 30s linear infinite; }
            `}</style>

            {/* MARQUEE */}
            <div className="fixed top-0 left-0 w-full z-[60] overflow-hidden py-1 whitespace-nowrap bg-white text-black transition-colors duration-500 h-[24px]">
                <div className="inline-block animate-marquee font-black text-[10px] uppercase tracking-[0.2em]">
                    Stenist • Automotive Fashion • Street Culture • Ready to Wear • Stenist • Automotive Fashion • Street Culture • Ready to Wear • Stenist • Automotive Fashion • Street Culture • Ready to Wear • Stenist • Automotive Fashion • Street Culture • Ready to Wear • 
                </div>
            </div>

            {/* MASAÜSTÜ NAVBAR */}
            <nav className="hidden md:flex fixed top-[24px] left-0 w-full h-[64px] items-center justify-between px-4 md:px-8 bg-black/90 backdrop-blur-md border-b border-zinc-800 shadow-2xl z-50">
                <div className="flex items-center gap-3 h-full ml-8 lg:ml-64">
                    {/* LOGO BURADAN KALDIRILDI */}
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-white tracking-widest uppercase h-full">
                        <div 
                            className="relative group h-full flex items-center"
                            onMouseEnter={() => setTasarimMenuAcik(true)}
                            onMouseLeave={() => setTasarimMenuAcik(false)}
                        >
                            <button className="flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all duration-300">
                                MAĞAZA <ChevronDown size={10} />
                            </button>
                            {tasarimMenuAcik && (
                                <div className="absolute top-full left-0 pt-2 w-56 animate-in fade-in slide-in-from-top-1 z-50">
                                    <div className="bg-zinc-900 border border-zinc-700 shadow-xl rounded-xl overflow-hidden">
                                        <div className="flex flex-col">
                                            <Link href="/tum-urunler?koleksiyon=steni" className="px-6 py-3 hover:bg-zinc-800 text-[10px] font-bold text-white transition border-b border-zinc-800 block">TÜM ÜRÜNLER</Link>
                                            <Link href="/tum-urunler?koleksiyon=steni&kategori=tshirt" className="px-6 py-3 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white transition block">T-SHIRTS</Link>
                                            <Link href="/tum-urunler?koleksiyon=steni&kategori=sweatshirt" className="px-6 py-3 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white transition block">SWEATSHIRTS</Link>
                                            <Link href="/tum-urunler?koleksiyon=steni&kategori=hoodie" className="px-6 py-3 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white transition block">HOODIES</Link>
                                            <Link href="/tum-urunler?koleksiyon=steni&kategori=ikonik" className="px-6 py-3 hover:bg-zinc-800 text-[10px] font-bold text-yellow-500 hover:text-yellow-400 transition block flex items-center gap-2"><Star size={10} fill="currentColor" /> İKONİK ÜRÜNLER</Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href="#" className="flex items-center px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all duration-300">Hakkımızda</Link>
                        <a href={iletisimMaili} className="flex items-center px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all duration-300">İletişim</a>
                        <button onClick={() => setBilimselAcik(true)} className="flex items-center px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ml-2">
                            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent font-black text-sm tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">BİLİMSEL</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <button onClick={() => setAramaAcik(true)} className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full"><Search size={20} strokeWidth={2} /></button>
                    {kullanici ? (
                        <button onClick={cikisYap} className="text-white hover:text-red-500 transition hover:bg-zinc-800 p-2 rounded-full"><LogOut size={20} strokeWidth={2} /></button>
                    ) : (
                        <Link href="/giris" className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full"><User size={20} strokeWidth={2} /></Link>
                    )}
                    <button onClick={() => setSepetAcik(true)} className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full relative">
                        <ShoppingBag size={20} strokeWidth={2} />
                        {cart.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full font-bold">{cart.length}</span>}
                    </button>
                </div>
            </nav>

            {/* MOBİL ALT BAR */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-[70] bg-black/90 backdrop-blur-xl border-t border-zinc-800 px-4 py-3 flex items-center justify-around">
                <button onClick={() => setMobilMenuAcik(true)} className="text-white/90 hover:text-white transition flex flex-col items-center gap-1"><Menu size={20} /><span className="text-[9px] font-bold tracking-widest uppercase">Menü</span></button>
                <button onClick={() => setAramaAcik(true)} className="text-white/90 hover:text-white transition flex flex-col items-center gap-1"><Search size={20} /><span className="text-[9px] font-bold tracking-widest uppercase">Ara</span></button>
                <button onClick={() => setSepetAcik(true)} className="text-white/90 hover:text-white transition flex flex-col items-center gap-1 relative">
                    <ShoppingBag size={20} />
                    {cart.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-black"></span>}
                    <span className="text-[9px] font-bold tracking-widest uppercase">Sepet</span>
                </button>
                {kullanici ? (
                    <button onClick={cikisYap} className="text-white/90 hover:text-red-400 transition flex flex-col items-center gap-1"><LogOut size={20} /><span className="text-[9px] font-bold tracking-widest uppercase">Çıkış</span></button>
                ) : (
                    <Link href="/giris" className="text-white/90 hover:text-white transition flex flex-col items-center gap-1"><User size={20} /><span className="text-[9px] font-bold tracking-widest uppercase">Hesap</span></Link>
                )}
            </div>

            {/* MOBİL DRAWER */}
            {mobilMenuAcik && (
                <div className="fixed inset-0 z-[120] md:hidden">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setMobilMenuAcik(false)} />
                    <div className="absolute top-0 left-0 h-full w-[85%] max-w-sm bg-zinc-950 border-r border-zinc-800 shadow-2xl animate-in slide-in-from-left-6 duration-300 flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-900">
                            <div className="text-white font-black uppercase tracking-widest text-lg">MENÜ</div>
                            <button onClick={() => setMobilMenuAcik(false)} className="text-zinc-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-4">
                            <ul className="space-y-1">
                                <li><Link href="/" className="block px-6 py-4 text-white font-bold text-sm hover:bg-zinc-900 border-l-2 border-transparent hover:border-white transition-all uppercase tracking-wider">ANASAYFA</Link></li>
                                <li><Link href="/tum-urunler?koleksiyon=steni" className="block px-6 py-4 text-zinc-300 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-all uppercase tracking-wider">TÜM ÜRÜNLER</Link></li>
                                <li><Link href="/tum-urunler?kategori=tshirt" className="block px-6 py-4 text-zinc-300 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-all uppercase tracking-wider">T-SHIRTS</Link></li>
                                <li><Link href="/tum-urunler?kategori=sweatshirt" className="block px-6 py-4 text-zinc-300 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-all uppercase tracking-wider">SWEATSHIRTS</Link></li>
                                <li><Link href="/tum-urunler?kategori=hoodie" className="block px-6 py-4 text-zinc-300 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-all uppercase tracking-wider">HOODIES</Link></li>
                                <li><Link href="/tum-urunler?kategori=ikonik" className="block px-6 py-4 text-yellow-500 font-bold text-sm hover:bg-zinc-900 hover:text-yellow-400 transition-all uppercase tracking-wider">İKONİK ÜRÜNLER</Link></li>
                                <li><button onClick={() => { setMobilMenuAcik(false); setBilimselAcik(true); }} className="block w-full text-left px-6 py-4 font-bold text-sm hover:bg-zinc-900 transition-all uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">SENTIST LAB (BİLİMSEL)</button></li>
                                <li><a href={iletisimMaili} className="block px-6 py-4 text-zinc-300 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-all uppercase tracking-wider">İLETİŞİM</a></li>
                            </ul>
                        </div>
                        <div className="p-6 border-t border-zinc-900 bg-zinc-900/50">
                            <Link href="/tasarim" className="flex items-center justify-center w-full bg-red-600 text-white font-black uppercase text-xs p-4 rounded-lg tracking-widest hover:bg-red-500 transition">STÜDYOYU BAŞLAT</Link>
                        </div>
                    </div>
                </div>
            )}

            {/* SEPET DRAWER */}
            {sepetAcik && (
                <div className="fixed inset-0 z-[200]">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSepetAcik(false)} />
                    <div className="absolute top-0 right-0 h-full w-[90%] md:w-[450px] bg-zinc-950 border-l border-zinc-800 shadow-2xl animate-in slide-in-from-right-10 duration-300 flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950">
                            <h2 className="text-xl font-black uppercase tracking-widest text-white">SEPETİM ({cart.length})</h2>
                            <button onClick={() => setSepetAcik(false)} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-900 rounded-full transition"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <ShoppingBag size={64} className="mb-4 text-zinc-600" />
                                    <p className="text-zinc-400 font-bold uppercase tracking-widest">Sepetin Boş</p>
                                    <button onClick={() => {setSepetAcik(false); router.push('/tum-urunler')}} className="mt-4 text-white underline text-xs uppercase font-bold tracking-wider">Alışverişe Başla</button>
                                </div>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="flex gap-4">
                                        <div className="w-20 h-24 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800">
                                            {item.image ? (<img src={item.image} alt={item.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-[9px]">Görsel Yok</div>)}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-white uppercase tracking-wide line-clamp-1">{item.name}</h3>
                                                <div className="flex flex-col mt-1 gap-1">
                                                    {item.size && <p className="text-xs text-zinc-500">Beden: <span className="text-white">{item.size}</span></p>}
                                                    {item.color && (<div className="flex items-center gap-2 text-xs text-zinc-500">Renk: <div className="w-3 h-3 rounded-full border border-zinc-600" style={{ backgroundColor: item.color }}></div></div>)}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-3 bg-zinc-900 rounded px-2 py-1"><span className="text-xs font-bold text-white">{item.quantity || 1} Adet</span></div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-bold text-white">₺{formatPrice(item.price)}</span>
                                                    <button onClick={() => removeFromCart(item.id, item.size)} className="text-zinc-500 hover:text-red-500 transition"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="p-6 border-t border-zinc-900 bg-zinc-950">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">ARA TOPLAM</span>
                                    <span className="text-white text-lg font-black tracking-wider">₺{formatPrice(totalPrice)}</span>
                                </div>
                                <button onClick={() => router.push('/odeme')} className="w-full bg-white text-black py-4 rounded-full font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition flex items-center justify-center gap-2"><CreditCard size={18} /> ÖDEMEYE GEÇ</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ARAMA MODAL */}
            {aramaAcik && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col">
                    <div className="absolute top-6 right-6">
                        <button onClick={() => setAramaAcik(false)} className="text-zinc-400 hover:text-white p-2 rounded-full border border-zinc-800 hover:border-white transition"><X size={32} /></button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center px-6">
                        <h2 className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs mb-8">Ne arıyorsunuz?</h2>
                        <form onSubmit={aramaYap} className="w-full max-w-3xl relative">
                            <input ref={aramaInputRef} type="text" value={aramaMetni} onChange={(e) => setAramaMetni(e.target.value)} placeholder="T-Shirt, Hoodie..." className="w-full bg-transparent border-b-2 border-zinc-700 text-3xl md:text-6xl font-black text-white py-6 outline-none placeholder-zinc-800 focus:border-white transition-colors text-center uppercase tracking-tighter" />
                            <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-white hover:text-zinc-400 transition"><ArrowRight size={48} /></button>
                        </form>
                    </div>
                </div>
            )}

            {/* BİLİMSEL MODAL */}
            {bilimselAcik && (
                <div className="fixed inset-0 z-[250] bg-black text-white overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
                    <div className="sticky top-0 bg-black/90 backdrop-blur-md z-50 px-6 py-6 flex justify-between items-center max-w-[1400px] mx-auto w-full border-b border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-400 hover:text-white transition cursor-pointer uppercase font-bold text-xs tracking-widest" onClick={() => setBilimselAcik(false)}><X size={24} /> Kapat</div>
                        <div className="flex items-center gap-2 text-cyan-500"><Beaker size={24} /><span className="font-black tracking-tighter text-lg">SENTIST LAB</span></div>
                    </div>
                    <div className="max-w-7xl mx-auto px-6 py-32">
                        <h2 className="text-7xl font-black mb-8">Engineering The Fabric</h2>
                        <p className="text-xl text-zinc-400">Özel laboratuvarlarımızda geliştirdiğimiz teknolojiler.</p>
                    </div>
                </div>
            )}
        </>
    );
}