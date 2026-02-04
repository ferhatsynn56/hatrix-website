"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowRight, ShoppingBag, Play, Instagram, Twitter, Youtube, 
    MousePointer2, PenTool, Download, Truck, RotateCcw, ShieldCheck, 
    Sparkles, Beaker, X, Printer, Layers, Palette, ChevronLeft, ChevronRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
let db = null;
try {
    if (Object.keys(firebaseConfig).length > 0) {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
} catch (e) { console.error(e); }

const HOME_HERO_SLIDES_1920x850 = [
    {
        src: "/urungorsel/1920x850/Start-ana-ekran.jpg",
        kicker: "YENİ KOLEKSİYON",
        title: "START",
        subtitle: "Street-ready parçalar. Yeni sezonun en net hali.",
    },
    {
        src: "/urungorsel/1920x850/Start-ana-ekranv2.jpg",
        kicker: "YENİ KOLEKSİYON",
        title: "START V2",
        subtitle: "Minimal çizgi, maksimum duruş.",
    },
    {
        src: "/urungorsel/1920x850/concept-black-hoodie-front-v2.jpg",
        kicker: "CONCEPT",
        title: "BLACK HOODIE",
        subtitle: "Sokak stili için ağır kumaş, temiz silhouette.",
    },
];

const HOME_CATEGORY_IMAGES_800x800 = {
    tshirt: "/urungorsel/800x800/penguen arka.jpg",
    hoodie: "/urungorsel/800x800/hoodie.jpg",
    aksesuar: "/urungorsel/800x800/AY-AGE.jpg",
    sweatshirt: "/urungorsel/800x800/11ss.jpg",
};

export default function HomePage() {
    const router = useRouter();

    // --- STATE'LER ---
    const [aktifBolum, setAktifBolum] = useState(null);
    const [bilimselAcik, setBilimselAcik] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);
    const heroTimerRef = useRef(null);

    // --- AKILLI NAVİGASYON KONTROLÜ ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const navEntries = performance.getEntriesByType("navigation");
            let isReload = false;
            if (navEntries.length > 0 && navEntries[0]?.type === 'reload') {
                isReload = true;
            }

            if (isReload) {
                sessionStorage.removeItem('session_bolum_tercihi');
                setAktifBolum('intro');
            } else {
                const kayitliTercih = sessionStorage.getItem('session_bolum_tercihi');
                if (kayitliTercih) {
                    setAktifBolum(kayitliTercih);
                } else {
                    setAktifBolum('intro');
                }
            }
        }
    }, []);

    const startHeroTimer = useCallback(() => {
        if (!Array.isArray(HOME_HERO_SLIDES_1920x850) || HOME_HERO_SLIDES_1920x850.length === 0) return;

        if (heroTimerRef.current) {
            clearInterval(heroTimerRef.current);
            heroTimerRef.current = null;
        }

        heroTimerRef.current = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % HOME_HERO_SLIDES_1920x850.length);
        }, 5000);
    }, []);

    useEffect(() => {
        if (aktifBolum !== 'steni') {
            if (heroTimerRef.current) {
                clearInterval(heroTimerRef.current);
                heroTimerRef.current = null;
            }
            return;
        }
        if (!Array.isArray(HOME_HERO_SLIDES_1920x850) || HOME_HERO_SLIDES_1920x850.length === 0) return;

        setHeroIndex(0);
        startHeroTimer();

        return () => {
            if (heroTimerRef.current) {
                clearInterval(heroTimerRef.current);
                heroTimerRef.current = null;
            }
        };
    }, [aktifBolum, startHeroTimer]);

    const goNextHero = useCallback(() => {
        if (!Array.isArray(HOME_HERO_SLIDES_1920x850) || HOME_HERO_SLIDES_1920x850.length === 0) return;
        setHeroIndex((prev) => (prev + 1) % HOME_HERO_SLIDES_1920x850.length);
        startHeroTimer();
    }, [startHeroTimer]);

    const goPrevHero = useCallback(() => {
        if (!Array.isArray(HOME_HERO_SLIDES_1920x850) || HOME_HERO_SLIDES_1920x850.length === 0) return;
        setHeroIndex((prev) => (prev - 1 + HOME_HERO_SLIDES_1920x850.length) % HOME_HERO_SLIDES_1920x850.length);
        startHeroTimer();
    }, [startHeroTimer]);

    const bolumSec = (bolum) => {
        sessionStorage.setItem('session_bolum_tercihi', bolum);
        setAktifBolum(bolum);
    };

    if (aktifBolum === null) {
        return <div className="h-screen w-full bg-black"></div>;
    }

    // =====================================================================================
    // --- GİRİŞ EKRANI (INTRO) ---
    // =====================================================================================
    if (aktifBolum === 'intro') {
        return (
            <div className="h-screen w-full flex flex-col md:flex-row bg-black overflow-hidden relative z-[60]">
                
                {/* STENI TARAFI */}
                <div onClick={() => bolumSec('steni')} className="relative w-full md:w-1/2 h-1/2 md:h-full group cursor-pointer border-b md:border-b-0 md:border-r border-zinc-900">
                    <div className="absolute inset-0 bg-black">
                        <img 
                            src="/urungorsel/girisFoto1.png" 
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-10">
                        <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4 group-hover:translate-y-[-10px] transition duration-500 shadow-black drop-shadow-2xl">STENI</h2>
                        <p className="text-white/80 font-bold tracking-[0.3em] text-xs uppercase group-hover:text-white transition">Ready to Wear</p>
                    </div>
                </div>

                {/* ÖZEL TARAFI */}
                <div onClick={() => bolumSec('ozel')} className="relative w-full md:w-1/2 h-1/2 md:h-full group cursor-pointer">
                    <div className="absolute inset-0 bg-black">
                        <img 
                            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop" 
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-10">
                        <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4 group-hover:translate-y-[-10px] transition duration-500 shadow-black drop-shadow-2xl">ÖZEL</h2>
                        <p className="text-white/80 font-bold tracking-[0.3em] text-xs uppercase group-hover:text-white transition">Design Studio</p>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================================================
    // --- ANA SİTE İÇERİĞİ ---
    // =====================================================================================
    return (
        <div className="min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-red-600 selection:text-white animate-in fade-in duration-700">
            
            <Navbar />

            {/* --- SWITCHER --- */}
            <div className="fixed top-16 sm:top-20 left-4 sm:left-6 md:left-8 z-40 animate-in fade-in slide-in-from-left-4 duration-700 delay-500 w-40 sm:w-48">
                <div className="bg-black/80 backdrop-blur-xl rounded-full p-1 border border-zinc-700 shadow-2xl flex w-full">
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 shadow-sm ${aktifBolum === 'steni' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                    <button onClick={() => bolumSec('steni')} className={`flex-1 relative z-10 py-1.5 text-[9px] sm:text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'steni' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>STENI</button>
                    <button onClick={() => bolumSec('ozel')} className={`flex-1 relative z-10 py-1.5 text-[9px] sm:text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'ozel' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>ÖZEL</button>
                </div>
            </div>

            {/*
              ✅ Mobil alttaki sabit menü barı kaldırıldıysa (Navbar'dan),
              burada ekstra padding'e gerek yok. Eğer tekrar sabit bar eklersen,
              pb değerlerini geri açabilirsin.
            */}
            <div className="pb-0"> 
                
                {/* ================= STENI BÖLÜMÜ (HAZIR GİYİM) ================= */}
                {aktifBolum === 'steni' && (
                    <div className="animate-in fade-in duration-700">
                        
                        {/* HERO BANNER (MOBİL UYUMLU) */}
                        {/*
                          Mobilde "çok yakından" görünmesin diye:
                          - h-screen yerine daha kısa bir viewport yüksekliği
                          - object-position'ı yukarı/merkeze alıp yüzü/kafayı kesmesin
                          - minimum yükseklik verip aşırı küçülmeyi engelledik
                        */}
                        <header className="relative w-full h-[68svh] sm:h-[76svh] md:h-screen min-h-[480px] sm:min-h-[520px] md:min-h-0 overflow-hidden">
                            <div className="absolute inset-0">
                                {HOME_HERO_SLIDES_1920x850.map((slide, i) => (
                                    <img
                                        key={slide.src}
                                        src={encodeURI(slide.src)}
                                        alt="Stenist Hero"
                                        className={`absolute inset-0 w-full h-full object-cover object-[50%_18%] sm:object-[50%_28%] md:object-center transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
                                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=2000&auto=format&fit=crop'; }}
                                    />
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
                            </div>

                            <div className="absolute left-4 right-4 sm:left-6 sm:right-6 md:left-12 md:right-12 bottom-8 sm:bottom-12 md:bottom-20 z-10">
                                <div className="max-w-xl">
                                    <div className="inline-flex items-center gap-2 text-white/85 text-[9px] sm:text-[10px] md:text-xs font-black tracking-[0.5em] uppercase mb-3 sm:mb-4">
                                        {HOME_HERO_SLIDES_1920x850[heroIndex]?.kicker || ""}
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white leading-[0.9]">
                                        {HOME_HERO_SLIDES_1920x850[heroIndex]?.title || ""}
                                    </h2>
                                    <p className="text-zinc-200/80 text-xs sm:text-xs md:text-sm mt-3 sm:mt-4 max-w-md leading-relaxed">
                                        {HOME_HERO_SLIDES_1920x850[heroIndex]?.subtitle || ""}
                                    </p>

                                    <div className="mt-6 sm:mt-8">
                                        <button
                                            onClick={() => router.push('/tum-urunler')}
                                            className="w-full sm:w-auto bg-white text-black px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-black text-xs sm:text-xs md:text-sm tracking-[0.2em] hover:bg-zinc-200 hover:scale-105 transition-all duration-300"
                                        >
                                            KEŞFET
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-4 md:px-8 pointer-events-none">
                                <button
                                    type="button"
                                    onClick={goPrevHero}
                                    className="pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition flex items-center justify-center"
                                    aria-label="Önceki banner"
                                >
                                    <ChevronLeft size={18} className="sm:size-22" />
                                </button>

                                <button
                                    type="button"
                                    onClick={goNextHero}
                                    className="pointer-events-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition flex items-center justify-center"
                                    aria-label="Sonraki banner"
                                >
                                    <ChevronRight size={18} className="sm:size-22" />
                                </button>
                            </div>
                        </header>

                        {/* --- GRID (KATEGORİLER) --- */}
                        <section className="w-full bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-white px-[0px] pb-[0px]">
                                {/* Kutu 1 - TSHIRT */}
                                <div onClick={() => router.push('/tum-urunler?kategori=tshirt')} className="relative h-[400px] sm:h-[460px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src={encodeURI(HOME_CATEGORY_IMAGES_800x800.tshirt)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-6 left-4 sm:left-6 md:left-10 z-20">
                                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-md">T-Shirts</h3>
                                        <span className="inline-block border-b-2 border-white text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Koleksiyonu Keşfet</span>
                                    </div>
                                </div>
                                {/* Kutu 2 - HOODIE */}
                                <div onClick={() => router.push('/tum-urunler?kategori=hoodie')} className="relative h-[400px] sm:h-[460px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src={encodeURI(HOME_CATEGORY_IMAGES_800x800.hoodie)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-6 left-4 sm:left-6 md:left-10 z-20">
                                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-md">Hoodies</h3>
                                        <span className="inline-block border-b-2 border-white text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Sıcak Kal</span>
                                    </div>
                                </div>
                                {/* Kutu 3 - AKSESUAR */}
                                <div onClick={() => router.push('/tum-urunler?kategori=aksesuar')} className="relative h-[400px] sm:h-[460px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src={encodeURI(HOME_CATEGORY_IMAGES_800x800.aksesuar)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-6 left-4 sm:left-6 md:left-10 z-20">
                                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-md">Aksesuarlar</h3>
                                        <span className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Detayları Gör</span>
                                    </div>
                                </div>
                                {/* Kutu 4 - SWEATSHIRT (GÜNCELLENDİ: ARTIK SWEATSHIRT KUTUSU) */}
                                <div onClick={() => router.push('/tum-urunler?kategori=sweatshirt')} className="relative h-[400px] sm:h-[460px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src={encodeURI(HOME_CATEGORY_IMAGES_800x800.sweatshirt)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-6 left-4 sm:left-6 md:left-10 z-20">
                                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-md">Sweatshirts</h3>
                                        <span className="inline-block border-b-2 border-white text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">İncele</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* --- BİLİMSEL / BASKI TEKNOLOJİSİ (YENİLENEN ALAN) --- */}
                        <section className="bg-black py-32 relative overflow-hidden border-t border-zinc-900">
                            {/* Hafif Teknolojik Işık Efekti */}
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-900/10 to-transparent"></div>
                            
                            <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
                                <div className="md:w-1/2">
                                    <div className="flex items-center gap-2 text-indigo-500 mb-6 font-bold uppercase tracking-widest text-xs animate-pulse">
                                        <Printer size={16} /> Print Technology
                                    </div>
                                    <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-8">
                                        BİLİMSEL<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">DİJİTAL BASKI.</span>
                                    </h2>
                                    <p className="text-zinc-400 text-lg max-w-md mb-10 leading-relaxed">
                                        Sadece giyinmek değil, sanatı üzerinizde taşımak. Kullandığımız yüksek çözünürlüklü dijital baskı teknikleri ile kumaşın dokusunu bozmadan, canlı ve kalıcı desenler sunuyoruz.
                                    </p>
                                    <div className="flex gap-4">
                                        <button onClick={() => setBilimselAcik(true)} className="bg-white text-black px-8 py-4 font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition rounded-full flex items-center gap-2">
                                            <Beaker size={16} /> Teknolojiyi İncele
                                        </button>
                                    </div>
                                </div>
                                <div className="md:w-1/2 relative">
                                    <div className="aspect-[4/5] w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative group">
                                        {/* Baskı Makinesi veya Detaylı Baskı Görseli */}
                                        <img src="https://images.unsplash.com/photo-1565538420870-da58522e2307?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition duration-700 group-hover:scale-105 saturate-0 group-hover:saturate-100" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* ================= ÖZEL BÖLÜMÜ (3D TASARIM) ================= */}
                {aktifBolum === 'ozel' && (
                    <div className="animate-in fade-in duration-700">
                        {/* 1. VIDEO BANNER */}
                        <header className="relative h-[70svh] sm:h-[82svh] md:h-screen w-full overflow-hidden bg-black">
                            <div className="absolute inset-0">
                                <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" src="https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                            </div>
                            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pt-20 z-10">
                                <div className="border border-white/30 backdrop-blur-md px-6 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-top-4">
                                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-white">Interactive Studio</span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl md:text-[8rem] font-black tracking-tighter text-white leading-[0.9] mb-6 animate-in zoom-in duration-1000">
                                    DESIGN<br />YOURSELF
                                </h1>
                                <p className="text-zinc-300 text-sm md:text-lg max-w-xl font-light tracking-wide mb-10 animate-in fade-in delay-300">
                                    Sınırları kaldır. Kendi koleksiyonunu tasarla ve anında üretime gönder.
                                </p>
                                <a href="/tasarim-secim">
                                    <button className="w-full sm:w-auto bg-red-600 text-white px-8 sm:px-10 py-3.5 sm:py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-red-600 transition duration-300 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                            Stüdyoyu Başlat
                                    </button>
                                </a>
                            </div>
                        </header>

                        {/* 2. NASIL ÇALIŞIR? */}
                        <section className="bg-black py-20 border-b border-zinc-900">
                            <div className="container mx-auto px-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                                    <div className="group">
                                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white transition duration-500">
                                            <MousePointer2 size={32} className="text-white group-hover:text-black transition" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">1. Ürününü Seç</h3>
                                        <p className="text-zinc-500 text-xs leading-relaxed">T-Shirt, Hoodie veya ikonik Hatrix. Başlamak için tuvali belirle.</p>
                                    </div>
                                    <div className="group">
                                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-600 transition duration-500">
                                            <PenTool size={32} className="text-white transition" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">2. Tasarla</h3>
                                        <p className="text-zinc-500 text-xs leading-relaxed">Renkleri değiştir, desen ekle, yazı yaz. Tamamen sana özel.</p>
                                    </div>
                                    <div className="group">
                                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition duration-500">
                                            <Download size={32} className="text-white transition" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">3. Kaydet & Al</h3>
                                        <p className="text-zinc-500 text-xs leading-relaxed">Tasarımını 3D önizle, kaydet ve sipariş ver. Kapına gelsin.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. TOPLULUK TASARIMLARI */}
                        <section className="bg-zinc-950 py-20">
                            <div className="container mx-auto px-6 mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">Topluluk<br />Tasarimları</h2>
                                </div>
                                <button className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition flex items-center gap-2">Tümünü Gör <ArrowRight size={14} /></button>
                            </div>
                            <div className="w-full overflow-hidden">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                                    <div className="aspect-square bg-zinc-900 relative group overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" />
                                    </div>
                                    <div className="aspect-square bg-zinc-900 relative group overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" />
                                    </div>
                                    <div className="aspect-square bg-zinc-900 relative group overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" />
                                    </div>
                                    <div className="aspect-square bg-zinc-900 relative group overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. HATRIX */}
                        <section className="bg-black py-32 relative overflow-hidden border-t border-zinc-900">
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-900/10 to-transparent"></div>
                            <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
                                <div className="md:w-1/2">
                                    <div className="flex items-center gap-2 text-red-500 mb-6 font-bold uppercase tracking-widest text-xs animate-pulse">
                                        <Sparkles size={16} /> Best Seller
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
                                        İKONİK<br />ÜRÜN:<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">HATRIX.</span>
                                    </h2>
                                    <p className="text-zinc-400 text-lg max-w-md mb-10 leading-relaxed">
                                        Arabanızın aynası için tasarladığımız, dünyanın en detaylı mini T-Shirt aksesuarı.
                                    </p>
                                    <div className="flex gap-4">
                                        <a href="/tasarim?tip=mini" className="bg-white text-black px-8 py-4 font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition rounded-full">
                                            Hatrix Tasarla
                                        </a>
                                        <a href="/tum-urunler?kategori=aksesuar" className="border border-zinc-700 text-white px-8 py-4 font-black text-xs uppercase tracking-widest hover:border-white transition rounded-full">
                                            Koleksiyonu Gör
                                        </a>
                                    </div>
                                </div>
                                <div className="md:w-1/2 relative">
                                    <div className="aspect-[4/5] w-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative group">
                                        <img src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* ✅ ORTAK FOOTER & TRUST BADGES */}
                <section className="bg-zinc-900 border-t border-zinc-800 py-16 relative z-10">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            <div className="flex flex-col items-center group">
                                <div className="w-20 h-20 bg-black border border-zinc-800 rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:border-white transition-all duration-300 shadow-xl">
                                    <Truck size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-2">ÜCRETSİZ KARGO</h4>
                                <p className="text-zinc-400 text-xs font-medium">Tüm Türkiye'ye aynı gün ücretsiz gönderim.</p>
                            </div>
                            <div className="flex flex-col items-center group">
                                <div className="w-20 h-20 bg-black border border-zinc-800 rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:border-white transition-all duration-300 shadow-xl">
                                    <RotateCcw size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-2">KOLAY İADE</h4>
                                <p className="text-zinc-400 text-xs font-medium">14 gün içinde koşulsuz ve ücretsiz iade.</p>
                            </div>
                            <div className="flex flex-col items-center group">
                                <div className="w-20 h-20 bg-black border border-zinc-800 rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:border-white transition-all duration-300 shadow-xl">
                                    <ShieldCheck size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-2">GÜVENLİ ÖDEME</h4>
                                <p className="text-zinc-400 text-xs font-medium">Iyzico ve 256-bit SSL ile %100 güvenli.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="bg-zinc-950 text-white py-20 px-8 border-t border-zinc-900">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="flex flex-col space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Müşteri Hizmetleri</h4>
                            <ul className="space-y-4 text-sm font-medium text-zinc-300">
                                <li><a href="#" className="hover:text-white hover:underline transition">Bize Ulaşın</a></li>
                                <li><a href="#" className="hover:text-white hover:underline transition">İade ve Değişim</a></li>
                            </ul>
                        </div>
                        <div className="flex flex-col space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Şirket</h4>
                            <ul className="space-y-4 text-sm font-medium text-zinc-300">
                                <li><a href="#" className="hover:text-white hover:underline transition">Hakkımızda</a></li>
                                <li><a href="#" className="hover:text-white hover:underline transition">Kariyer</a></li>
                            </ul>
                        </div>
                        <div className="flex flex-col space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bizi Takip Et</h4>
                            <div className="flex space-x-6 text-zinc-300">
                                <a href="#" className="hover:text-white transition text-sm uppercase font-bold">Instagram</a>
                                <a href="#" className="hover:text-white transition text-sm uppercase font-bold">Youtube</a>
                                <a href="#" className="hover:text-white transition text-sm uppercase font-bold">X</a>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bülten</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed">Yeni koleksiyonlardan ilk siz haberdar olun.</p>
                            <form className="flex border-b border-zinc-700 pb-2">
                                <input type="email" placeholder="E-posta" className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-zinc-600" />
                                <button type="button" className="text-white hover:text-zinc-400 transition font-bold uppercase text-xs">KAYIT OL</button>
                            </form>
                        </div>
                    </div>
                    <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                        <p>© 2025 STENIST. Tüm hakları saklıdır.</p>
                    </div>
                </footer>

                {/* BİLİMSEL MODAL (GÜNCELLENDİ) */}
                {bilimselAcik && (
                    <div className="fixed inset-0 z-[150] bg-black text-white overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
                        <div className="sticky top-0 bg-black/90 backdrop-blur-md z-50 px-6 py-6 flex justify-between items-center max-w-[1400px] mx-auto w-full border-b border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-400 hover:text-white transition cursor-pointer uppercase font-bold text-xs tracking-widest" onClick={() => setBilimselAcik(false)}>
                                <X size={24} /> Kapat
                            </div>
                            <div className="flex items-center gap-2 text-indigo-500">
                                <Printer size={24} />
                                <span className="font-black tracking-tighter text-lg">BASKI TEKNOLOJİSİ</span>
                            </div>
                        </div>
                        <div className="max-w-7xl mx-auto px-6 py-32">
                            <h2 className="text-7xl font-black mb-12 uppercase">Baskı Bilimi</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Layers className="text-indigo-500" /> DTG (Direct to Garment)</h3>
                                    <p className="text-zinc-400 leading-relaxed mb-8">
                                        Doğrudan kumaşa püskürtülen su bazlı boyalar ile kumaşın nefes alabilirliği korunur. Bu teknoloji sayesinde baskı, kumaşın bir parçası gibi hissettirir; asla plastik veya yapışkan bir doku bırakmaz. Sınırsız renk geçişi ve fotoğraf kalitesinde detaylar sunar.
                                    </p>

                                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Palette className="text-indigo-500" /> Dijital Transfer</h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        Özel koleksiyonlarda kullanılan yüksek mukavemetli transfer teknolojisi. Esnekliği sayesinde kumaşla birlikte hareket eder, çatlama yapmaz ve yıkamalara karşı üstün dayanıklılık gösterir. Renkler her zaman ilk günkü canlılığını korur.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800">
                                        <h4 className="text-white font-bold mb-2">Ekolojik Mürekkepler</h4>
                                        <p className="text-zinc-500 text-sm">Kullandığımız boyalar Oeko-Tex sertifikalıdır, insan sağlığına ve çevreye zarar vermez.</p>
                                    </div>
                                    <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800">
                                        <h4 className="text-white font-bold mb-2">Hassas Kürleme</h4>
                                        <p className="text-zinc-500 text-sm">Baskılarımız, endüstriyel tünel fırınlarda optimum sıcaklıkta sabitlenerek maksimum yıkama ömrü sağlar.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
