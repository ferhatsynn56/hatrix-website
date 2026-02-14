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

const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const FLOW_TOKENS = {
    "--s-2": "8px",
    "--s-3": "12px",
    "--s-4": "16px",
    "--s-6": "24px",
    "--s-8": "32px",
    "--s-10": "40px",
    "--s-12": "48px",
    "--bottom-nav-height": "72px",
    "--top-banner-height": "0px",
};

function SegmentToggle({ aktifBolum, onSelect }) {
    return (
        <div
            className="fixed left-4 sm:left-6 md:left-8 z-40 w-40 sm:w-48"
            style={{
                transform: "translateZ(0)",
                top: "calc(var(--top-banner-height, 0px) + env(safe-area-inset-top) + 12px)",
            }}
        >
            <div className="relative bg-black/80 backdrop-blur-xl rounded-full p-1 border border-zinc-700 shadow-2xl flex w-full">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 ${aktifBolum === 'steni' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                <button onClick={() => onSelect('steni')} className={`min-h-[44px] flex-1 relative z-10 py-1.5 text-[9px] sm:text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'steni' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>STENI</button>
                <button onClick={() => onSelect('ozel')} className={`min-h-[44px] flex-1 relative z-10 py-1.5 text-[9px] sm:text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'ozel' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>ÖZEL</button>
            </div>
        </div>
    );
}

function HeroSection() {
    return (
        <section className="relative overflow-hidden border-b border-zinc-900" style={{ padding: "calc(var(--s-12) + env(safe-area-inset-top)) var(--s-4) var(--s-10)" }}>
            <div className="absolute inset-0">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-45" src="https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/92" />
            </div>
            <div className="relative z-10 max-w-[760px] mx-auto">
                <div className="inline-flex items-center min-h-[44px] px-4 rounded-full border border-white/20 bg-black/35 backdrop-blur mb-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/90">Interactive Studio</span>
                </div>
                <h1 className="text-[42px] sm:text-[56px] md:text-[76px] font-black leading-[0.9] tracking-tight text-white">DESIGN YOURSELF</h1>
                <p className="text-white/90 text-sm sm:text-base max-w-xl mt-4">Modelini seç, tasarımını üretime hazırla.</p>
                <a
                    href="/tasarim"
                    className="inline-flex items-center justify-center min-h-[48px] mt-6 px-7 rounded-full bg-white text-black text-xs font-black uppercase tracking-[0.16em] shadow-[0_14px_32px_rgba(0,0,0,0.35)] active:scale-[0.985] transition-transform duration-150"
                    style={{ transitionTimingFunction: APPLE_EASE }}
                >
                    Tasarıma Başla
                </a>
            </div>
        </section>
    );
}

function StepCard({ index, title, desc, Icon }) {
    return (
        <article
            className="rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-[0_12px_32px_rgba(0,0,0,0.28)] active:scale-[0.985] transition-transform duration-150"
            style={{ transitionTimingFunction: APPLE_EASE, padding: "var(--s-6)" }}
        >
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <Icon size={20} className="text-zinc-100" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 mb-1">{index}. Adım</p>
            <h3 className="text-white font-black text-lg leading-tight">{title}</h3>
            <p className="text-sm mt-2 leading-relaxed text-white/90">{desc}</p>
        </article>
    );
}

function TrustItem({ title, desc, Icon }) {
    return (
        <div
            className="rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-[0_10px_26px_rgba(0,0,0,0.25)]"
            style={{ padding: "var(--s-4)" }}
        >
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                <Icon size={18} className="text-zinc-100" />
            </div>
            <h4 className="text-white font-black text-sm tracking-wide uppercase">{title}</h4>
            <p className="text-xs mt-2 leading-relaxed text-white/90">{desc}</p>
        </div>
    );
}

function CommunityGrid() {
    const cards = [
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=900&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=900&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=900&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=900&auto=format&fit=crop",
    ];
    return (
        <div className="grid grid-cols-2 gap-3">
            {cards.map((src, i) => (
                <div key={`community-${i}`} className="aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                    <img src={src} alt={`Topluluk tasarım ${i + 1}`} className="w-full h-full object-cover" />
                </div>
            ))}
        </div>
    );
}

function FooterGroup({ title, children }) {
    return (
        <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 font-black">{title}</h4>
            {children}
        </div>
    );
}

function BottomNav() {
    return (
        <nav
            className="fixed left-0 right-0 bottom-0 z-40 border-t border-zinc-800 bg-black/92 backdrop-blur-xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="max-w-[760px] mx-auto grid grid-cols-3 gap-2 px-4 py-3">
                <a href="/tasarim" className="min-h-[44px] rounded-full bg-white text-black text-[11px] font-black tracking-wide uppercase flex items-center justify-center active:scale-[0.985] transition-transform duration-150" style={{ transitionTimingFunction: APPLE_EASE }}>
                    Tasarıma Başla
                </a>
                <a href="/bilimsel" className="min-h-[44px] rounded-full border border-zinc-700 text-white/90 text-[11px] font-bold uppercase flex items-center justify-center active:scale-[0.985] transition-transform duration-150" style={{ transitionTimingFunction: APPLE_EASE }}>
                    Bilimsel
                </a>
                <a href="/hakkimizda" className="min-h-[44px] rounded-full border border-zinc-700 text-white/90 text-[11px] font-bold uppercase flex items-center justify-center active:scale-[0.985] transition-transform duration-150" style={{ transitionTimingFunction: APPLE_EASE }}>
                    Destek
                </a>
            </div>
        </nav>
    );
}

function OzelPremiumFlow() {
    return (
        <div style={FLOW_TOKENS} className="bg-[#050608]">
            <main style={{ paddingBottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)" }}>
                <HeroSection />

                <section className="max-w-[760px] mx-auto" style={{ padding: "var(--s-10) var(--s-4)" }}>
                    <h2 className="text-white font-black text-[24px] sm:text-[30px] leading-tight">3 adımda özel üretim</h2>
                    <div className="grid gap-3 mt-4">
                        <StepCard index={1} title="Ürününü Seç" desc="Tshirt, Sweatshirt, Hoodie veya Polar modelini seç." Icon={MousePointer2} />
                        <StepCard index={2} title="Tasarımını Oluştur" desc="Yazı, baskı ve renk ayarlarını 3D sahnede düzenle." Icon={PenTool} />
                        <StepCard index={3} title="Kaydet & Sipariş Ver" desc="Son görünümü onayla, siparişini güvenle tamamla." Icon={Download} />
                    </div>
                </section>

                <section className="border-y border-zinc-900 bg-black/60">
                    <div className="max-w-[760px] mx-auto" style={{ padding: "var(--s-8) var(--s-4)" }}>
                        <h3 className="text-white font-black text-[22px] sm:text-[26px]">Neden STENI Custom?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                            <TrustItem title="Ücretsiz Kargo" desc="1500 TL üzeri alışverişlerde ücretsiz gönderim." Icon={Truck} />
                            <TrustItem title="Kolay İade" desc="14 gün içinde kolay ve hızlı iade süreci." Icon={RotateCcw} />
                            <TrustItem title="Güvenli Ödeme" desc="Iyzico altyapısı ile güvenli ödeme deneyimi." Icon={ShieldCheck} />
                        </div>
                    </div>
                </section>

                <section className="max-w-[760px] mx-auto" style={{ padding: "var(--s-10) var(--s-4)" }}>
                    <div className="flex items-end justify-between gap-3 mb-4">
                        <h3 className="text-white font-black text-[22px] sm:text-[26px] leading-tight">Topluluk Tasarımları</h3>
                        <a href="/tasarim" className="text-xs uppercase tracking-[0.14em] text-white/90 font-bold">Keşfet →</a>
                    </div>
                    <CommunityGrid />
                </section>

                <footer className="border-t border-zinc-900 bg-black/80">
                    <div className="max-w-[760px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ padding: "var(--s-8) var(--s-4) var(--s-12)" }}>
                        <FooterGroup title="Müşteri Hizmetleri">
                            <div className="space-y-2 text-sm text-white/90">
                                <a href="#" className="block">Bize Ulaşın</a>
                                <a href="#" className="block">İade ve Değişim</a>
                            </div>
                        </FooterGroup>
                        <FooterGroup title="Şirket">
                            <div className="space-y-2 text-sm text-white/90">
                                <a href="/hakkimizda" className="block">Hakkımızda</a>
                                <a href="/bilimsel" className="block">Bilimsel</a>
                            </div>
                        </FooterGroup>
                        <FooterGroup title="Sosyal">
                            <div className="flex gap-4 text-sm text-white/90">
                                <a href="#">Instagram</a>
                                <a href="#">Youtube</a>
                                <a href="#">X</a>
                            </div>
                        </FooterGroup>
                        <FooterGroup title="Bülten">
                            <p className="text-sm text-white/90">Yeni koleksiyonlardan ilk sen haberdar ol.</p>
                            <form className="flex items-center gap-2">
                                <input type="email" placeholder="E-posta" className="min-h-[44px] flex-1 rounded-xl bg-zinc-950 border border-zinc-700 px-3 text-white placeholder:text-zinc-500" />
                                <button type="button" className="min-h-[44px] px-4 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wide active:scale-[0.985] transition-transform duration-150" style={{ transitionTimingFunction: APPLE_EASE }}>
                                    Kayıt Ol
                                </button>
                            </form>
                        </FooterGroup>
                    </div>
                </footer>
            </main>
            <BottomNav />
        </div>
    );
}

export default function HomePage() {
    const router = useRouter();

    // --- STATE'LER ---
    const [aktifBolum, setAktifBolum] = useState(null);
    const [bilimselAcik, setBilimselAcik] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);
    const [introPressedCard, setIntroPressedCard] = useState(null);
    const [introTransitionCard, setIntroTransitionCard] = useState(null);
    const heroTimerRef = useRef(null);
    const introNavLockRef = useRef(false);
    const introNavTimerRef = useRef(null);

    // --- AKILLI NAVİGASYON KONTROLÜ ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const modeFromQuery = new URLSearchParams(window.location.search).get('mode');
            if (modeFromQuery === 'steni' || modeFromQuery === 'ozel') {
                sessionStorage.setItem('session_bolum_tercihi', modeFromQuery);
                setAktifBolum(modeFromQuery);
                return;
            }

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

    useEffect(() => {
        return () => {
            if (introNavTimerRef.current) {
                clearTimeout(introNavTimerRef.current);
                introNavTimerRef.current = null;
            }
        };
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

    const startIntroNavigation = (bolum) => {
        if (introNavLockRef.current) return;
        introNavLockRef.current = true;
        setIntroPressedCard(null);
        setIntroTransitionCard(bolum);

        if (introNavTimerRef.current) {
            clearTimeout(introNavTimerRef.current);
            introNavTimerRef.current = null;
        }

        introNavTimerRef.current = setTimeout(() => {
            sessionStorage.setItem('session_bolum_tercihi', bolum);
            setAktifBolum(bolum);
            router.push(`/?mode=${bolum}`, { scroll: false });
            introNavLockRef.current = false;
        }, 100);
    };

    if (aktifBolum === null) {
        return <div className="h-screen w-full bg-black"></div>;
    }

    // =====================================================================================
    // --- GİRİŞ EKRANI (INTRO) ---
    // =====================================================================================
    if (aktifBolum === 'intro') {
        const INTRO_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
        const isIntroLeaving = Boolean(introTransitionCard);
        return (
            <div className="h-screen w-full bg-[#07080a] overflow-hidden relative z-[60]">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.10),transparent_42%),radial-gradient(circle_at_85%_88%,rgba(255,255,255,0.07),transparent_42%)]" />
                <div
                    className={`absolute inset-0 pointer-events-none bg-black/20 backdrop-blur-[4px] transition-opacity duration-200`}
                    style={{
                        opacity: isIntroLeaving ? 1 : 0,
                        transitionTimingFunction: INTRO_EASE,
                    }}
                />

                <div
                    className="relative z-10 h-full max-w-[760px] mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col justify-center gap-4 sm:gap-5"
                    style={{
                        opacity: isIntroLeaving ? 0 : 1,
                        transform: isIntroLeaving ? 'scale(0.995)' : 'scale(1)',
                        transition: `opacity 360ms ${INTRO_EASE}, transform 360ms ${INTRO_EASE}`,
                    }}
                >
                    <button
                        type="button"
                        onPointerDown={() => setIntroPressedCard('steni')}
                        onPointerUp={() => setIntroPressedCard(null)}
                        onPointerLeave={() => setIntroPressedCard(null)}
                        onPointerCancel={() => setIntroPressedCard(null)}
                        onClick={() => startIntroNavigation('steni')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                startIntroNavigation('steni');
                            }
                        }}
                        className="relative w-full min-h-[280px] sm:min-h-[310px] rounded-[24px] overflow-hidden border border-white/15 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/55 mt-[7px]"
                        style={{
                            transform: introPressedCard === 'steni' ? 'scale(0.985)' : 'scale(1)',
                            boxShadow: introPressedCard === 'steni'
                                ? '0 16px 36px rgba(0,0,0,0.42)'
                                : '0 24px 52px rgba(0,0,0,0.48)',
                            opacity: isIntroLeaving && introTransitionCard !== 'steni' ? 0.6 : 1,
                            transition: `transform 170ms ${INTRO_EASE}, box-shadow 170ms ${INTRO_EASE}, opacity 170ms ${INTRO_EASE}`,
                        }}
                    >
                        <img
                            src="/urungorsel/girisFoto1.png"
                            alt="STENI Ready to Wear"
                            className="absolute inset-0 w-full h-full object-cover object-center md:object-[50%_8%] lg:object-[50%_6%]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/48 to-black/18" />
                        <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
                            <span className="inline-flex items-center min-h-[44px] w-fit px-3 rounded-full border border-white/25 bg-black/35 backdrop-blur text-[10px] font-black tracking-[0.18em] uppercase text-zinc-100">
                                Hazır Giyim
                            </span>
                            <div className="space-y-1.5">
                                <h2 className="text-[44px] sm:text-[58px] leading-none font-black tracking-tight text-white">STENI</h2>
                                <p className="text-[12px] sm:text-[13px] tracking-[0.24em] uppercase font-semibold text-zinc-100">READY TO WEAR</p>
                                <p className="text-[13px] sm:text-sm text-white/90 max-w-[420px]">Hazır koleksiyonlardan seç, doğrudan satın al.</p>
                                <p className="pt-1 text-[13px] sm:text-sm font-bold text-white">Koleksiyonu Gör →</p>
                            </div>
                        </div>
                    </button>

                    <div className="h-px mx-3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <button
                        type="button"
                        onPointerDown={() => setIntroPressedCard('ozel')}
                        onPointerUp={() => setIntroPressedCard(null)}
                        onPointerLeave={() => setIntroPressedCard(null)}
                        onPointerCancel={() => setIntroPressedCard(null)}
                        onClick={() => startIntroNavigation('ozel')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                startIntroNavigation('ozel');
                            }
                        }}
                        className="relative w-full min-h-[280px] sm:min-h-[310px] rounded-[24px] overflow-hidden border border-white/15 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/55"
                        style={{
                            transform: introPressedCard === 'ozel' ? 'scale(0.985)' : 'scale(1)',
                            boxShadow: introPressedCard === 'ozel'
                                ? '0 16px 36px rgba(0,0,0,0.42)'
                                : '0 24px 52px rgba(0,0,0,0.48)',
                            opacity: isIntroLeaving && introTransitionCard !== 'ozel' ? 0.6 : 1,
                            transition: `transform 170ms ${INTRO_EASE}, box-shadow 170ms ${INTRO_EASE}, opacity 170ms ${INTRO_EASE}`,
                        }}
                    >
                        <img
                            src="/urungorsel/800x800/conceptttt.jpg"
                            alt="ÖZEL Design Studio"
                            className="absolute inset-0 w-full h-full object-cover object-center md:object-[50%_12%] lg:object-[50%_10%]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/48 to-black/18" />
                        <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
                            <span className="inline-flex items-center min-h-[44px] w-fit px-3 rounded-full border border-white/25 bg-black/35 backdrop-blur text-[10px] font-black tracking-[0.18em] uppercase text-zinc-100">
                                Kişiye Özel
                            </span>
                            <div className="space-y-1.5">
                                <h2 className="text-[44px] sm:text-[58px] leading-none font-black tracking-tight text-white">ÖZEL</h2>
                                <p className="text-[12px] sm:text-[13px] tracking-[0.24em] uppercase font-semibold text-zinc-100">DESIGN STUDIO</p>
                                <p className="text-[13px] sm:text-sm text-white/90 max-w-[420px]">Modelini seç, tasarımını üretime hazırla.</p>
                                <p className="pt-1 text-[13px] sm:text-sm font-bold text-white">Tasarımı Başlat →</p>
                            </div>
                        </div>
                    </button>
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

            <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-500">
                <SegmentToggle aktifBolum={aktifBolum} onSelect={bolumSec} />
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
                                <div onClick={() => router.push('/tum-urunler?kategori=tshirt')} className="relative h-[320px] sm:h-[420px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src={encodeURI(HOME_CATEGORY_IMAGES_800x800.tshirt)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-6 left-4 sm:left-6 md:left-10 z-20">
                                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-md">T-Shirts</h3>
                                        <span className="inline-block border-b-2 border-white text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Koleksiyonu Keşfet</span>
                                    </div>
                                </div>
                                {/* Kutu 2 - HOODIE */}
                                <div onClick={() => router.push('/tum-urunler?kategori=hoodie')} className="relative h-[320px] sm:h-[420px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src={encodeURI(HOME_CATEGORY_IMAGES_800x800.hoodie)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-6 left-4 sm:left-6 md:left-10 z-20">
                                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-md">Hoodies</h3>
                                        <span className="inline-block border-b-2 border-white text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Sıcak Kal</span>
                                    </div>
                                </div>
                                {/* Kutu 3 - AKSESUAR */}
                                <div onClick={() => router.push('/tum-urunler?kategori=aksesuar')} className="relative h-[320px] sm:h-[420px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src={encodeURI(HOME_CATEGORY_IMAGES_800x800.aksesuar)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-6 left-4 sm:left-6 md:left-10 z-20">
                                        <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 drop-shadow-md">Aksesuarlar</h3>
                                        <span className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Detayları Gör</span>
                                    </div>
                                </div>
                                {/* Kutu 4 - SWEATSHIRT (GÜNCELLENDİ: ARTIK SWEATSHIRT KUTUSU) */}
                                <div onClick={() => router.push('/tum-urunler?kategori=sweatshirt')} className="relative h-[320px] sm:h-[420px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
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
                                        <button onClick={() => router.push('/bilimsel')} className="bg-white text-black px-8 py-4 font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition rounded-full flex items-center gap-2">
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
                        <OzelPremiumFlow />
                    </div>
                )}

                {/* ✅ ORTAK FOOTER & TRUST BADGES */}
                {aktifBolum !== 'ozel' && (
                <>
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
                                <li><a href="/hakkimizda" className="hover:text-white hover:underline transition">Hakkımızda</a></li>
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
                </>
                )}

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
