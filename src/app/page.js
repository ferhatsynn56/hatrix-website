"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MousePointer2, PenTool, Download, Truck, RotateCcw, ShieldCheck, 
    ChevronLeft, ChevronRight
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
        kicker: "LIMITED DROP",
        title: "START",
        subtitle: "Temiz siluet, premium kumaş, sınırlı stok.",
    },
    {
        src: "/urungorsel/1920x850/Start-ana-ekranv2.jpg",
        kicker: "SMALL BATCH PRODUCTION",
        title: "START V2",
        subtitle: "Minimal çizgi, yüksek işçilik.",
    },
    {
        src: "/urungorsel/1920x850/concept-black-hoodie-front-v2.jpg",
        kicker: "SIGNATURE PRINT SERIES",
        title: "BLACK HOODIE",
        subtitle: "Uzun ömürlü baskı, premium dokunuş.",
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
    "--announcement-h": "36px",
    "--toggle-h": "52px",
    "--bottom-nav-h": "72px",
    "--safe-top": "env(safe-area-inset-top)",
    "--safe-bottom": "env(safe-area-inset-bottom)",
    "--sticky-offset": "calc(var(--announcement-h) + var(--toggle-h))",
    "--s-2": "8px",
    "--s-3": "12px",
    "--s-4": "16px",
    "--s-6": "24px",
    "--s-8": "32px",
    "--s-10": "40px",
    "--s-12": "48px",
};

const STENI_CATEGORY_CARDS = [
    { key: "tshirt", name: "T-SHIRT", label: "Günlük premium", href: "/tum-urunler?kategori=tshirt" },
    { key: "hoodie", name: "HOODIE", label: "Soğuk hava seçimi", href: "/tum-urunler?kategori=hoodie" },
    { key: "sweatshirt", name: "SWEATSHIRT", label: "Clean street layer", href: "/tum-urunler?kategori=sweatshirt" },
    { key: "aksesuar", name: "AKSESUAR", label: "Tamamlayıcı parça", href: "/tum-urunler?kategori=aksesuar" },
];

function HomeTabSwitcher({ activeTab, onChange }) {
    return (
        <div className="w-[170px]" style={{ transform: "translateZ(0)" }}>
            <div className="relative bg-[#0b0d12] rounded-full p-1 border border-zinc-700 shadow-[0_8px_20px_rgba(0,0,0,0.34)] flex w-full">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-150 ${activeTab === 'steni' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                <button
                    type="button"
                    onClick={() => onChange('steni')}
                    className={`min-h-[44px] flex-1 relative z-10 px-1 text-[10px] font-black tracking-[0.12em] transition-colors duration-150 rounded-full ${activeTab === 'steni' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                    STENI
                </button>
                <button
                    type="button"
                    onClick={() => onChange('ozel')}
                    className={`min-h-[44px] flex-1 relative z-10 px-1 text-[10px] font-black tracking-[0.12em] transition-colors duration-150 rounded-full ${activeTab === 'ozel' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                    ÖZEL
                </button>
            </div>
        </div>
    );
}

function HeroSection() {
    return (
        <section className="relative border-b border-zinc-900 overflow-hidden">
            <div className="relative h-[62svh] min-h-[440px] md:min-h-[520px]">
                <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-45" src="https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/92" />
                <div className="absolute inset-x-0 bottom-0 px-4 md:px-6 lg:px-8" style={{ paddingBottom: "var(--s-8)" }}>
                    <div className="max-w-[760px]">
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
                </div>
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
            className="h-full rounded-[20px] border border-zinc-800 bg-zinc-950/90 shadow-[0_10px_26px_rgba(0,0,0,0.25)]"
            style={{ padding: "20px" }}
        >
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
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
        <div className="grid grid-cols-2 gap-3 md:gap-4">
            {cards.map((src, i) => (
                <div key={`community-${i}`} className="aspect-square rounded-2xl md:rounded-[24px] overflow-hidden border border-zinc-800 bg-zinc-950">
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

function BottomNavBar({ primaryHref, primaryLabel }) {
    return (
        <nav
            className="fixed left-0 right-0 bottom-0 z-[70] border-t border-zinc-800 bg-black/92 backdrop-blur-xl"
            style={{ paddingBottom: "var(--safe-bottom)" }}
        >
            <div className="max-w-[760px] mx-auto grid grid-cols-3 gap-2 px-4 py-3">
                <a href={primaryHref} className="min-h-[44px] rounded-full bg-white text-black text-[11px] font-black tracking-wide uppercase flex items-center justify-center active:scale-[0.985] transition-transform duration-150" style={{ transitionTimingFunction: APPLE_EASE }}>
                    {primaryLabel}
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

function HeroCarousel({ heroIndex, goPrevHero, goNextHero }) {
    const slide = HOME_HERO_SLIDES_1920x850[heroIndex] || HOME_HERO_SLIDES_1920x850[0];
    return (
        <section className="relative border-b border-zinc-900 overflow-hidden">
            <div className="relative h-[62svh] min-h-[440px]">
                {HOME_HERO_SLIDES_1920x850.map((item, i) => (
                    <img
                        key={item.src}
                        src={encodeURI(item.src)}
                        alt={item.title}
                        className={`absolute inset-0 w-full h-full object-cover object-[52%_18%] transition-opacity duration-700 ${i === heroIndex ? "opacity-100" : "opacity-0"}`}
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/42 to-black/25" />

                <div className="absolute inset-x-0 bottom-0 max-w-[760px] mx-auto px-4" style={{ paddingBottom: "var(--s-8)" }}>
                    <p className="text-[10px] tracking-[0.2em] text-white/90 uppercase font-bold">{slide.kicker}</p>
                    <h1 className="text-[42px] leading-[0.95] tracking-tight font-black text-white mt-2">{slide.title}</h1>
                    <p className="text-sm text-white/90 mt-3 max-w-[30ch]">{slide.subtitle}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-[10px] uppercase tracking-[0.14em] border border-white/25 rounded-full px-3 py-1.5 text-white/90">Limited Drop</span>
                        <span className="text-[10px] uppercase tracking-[0.14em] border border-white/25 rounded-full px-3 py-1.5 text-white/90">Small Batch Production</span>
                        <span className="text-[10px] uppercase tracking-[0.14em] border border-white/25 rounded-full px-3 py-1.5 text-white/90">Signature Print Series</span>
                    </div>
                </div>

                <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3 pointer-events-none">
                    <button
                        type="button"
                        onClick={goPrevHero}
                        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-full bg-black/50 backdrop-blur border border-white/25 text-white flex items-center justify-center active:scale-[0.985] transition-transform duration-150"
                        style={{ transitionTimingFunction: APPLE_EASE }}
                        aria-label="Önceki slide"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={goNextHero}
                        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-full bg-black/50 backdrop-blur border border-white/25 text-white flex items-center justify-center active:scale-[0.985] transition-transform duration-150"
                        style={{ transitionTimingFunction: APPLE_EASE }}
                        aria-label="Sonraki slide"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
}

function PrimaryCTA({ onExplore }) {
    return (
        <section className="max-w-[760px] mx-auto" style={{ padding: "var(--s-8) var(--s-4) var(--s-6)" }}>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-[0_12px_28px_rgba(0,0,0,0.28)]" style={{ padding: "var(--s-6)" }}>
                <p className="text-white/90 text-sm leading-relaxed">Sınırlı stok premium koleksiyon. Kaliteli kumaş + seçkin baskı teknikleri.</p>
                <button
                    type="button"
                    onClick={onExplore}
                    className="mt-4 min-h-[48px] w-full rounded-full bg-white text-black text-xs font-black uppercase tracking-[0.16em] active:scale-[0.985] transition-transform duration-150"
                    style={{ transitionTimingFunction: APPLE_EASE }}
                >
                    Koleksiyonu Keşfet
                </button>
                <a href="/tum-urunler" className="block mt-3 text-center text-[11px] tracking-[0.12em] uppercase text-white/80 font-semibold">
                    Limited Drop’u İncele →
                </a>
            </div>
        </section>
    );
}

function CategoryGrid({ onNavigate }) {
    return (
        <section className="w-full px-4 md:px-6 lg:px-8" style={{ paddingBottom: "56px" }}>
            <h2 className="text-white text-2xl font-black tracking-tight mb-4">Kategoriler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {STENI_CATEGORY_CARDS.map((card) => (
                    <button
                        key={card.key}
                        type="button"
                        onClick={() => onNavigate(card.href)}
                        className="relative h-[196px] md:h-[420px] rounded-[20px] md:rounded-[24px] overflow-hidden border border-zinc-800 text-left group active:scale-[0.985] transition-transform duration-150"
                        style={{ transitionTimingFunction: APPLE_EASE }}
                    >
                        <img
                            src={encodeURI(HOME_CATEGORY_IMAGES_800x800[card.key])}
                            alt={card.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/32 to-black/18" />
                        <div className="absolute left-5 right-5 bottom-5">
                            <h3 className="text-2xl font-black tracking-tight text-white">{card.name}</h3>
                            <p className="text-xs text-white/90 mt-1">{card.label}</p>
                            <p className="text-xs text-white/90 mt-2 font-bold tracking-[0.14em] uppercase">İncele →</p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}

function PrintTechSection() {
    return (
        <section className="border-y border-zinc-900 bg-zinc-950/60">
            <div className="w-full px-4 md:pl-8 md:pr-8" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400 font-bold">Print Technology</p>
                <h3 className="text-white text-2xl font-black tracking-tight mt-2">Signature Print Series</h3>
                <div className="grid gap-2 mt-4 text-sm text-white/90">
                    <p>Premium baskı kalitesi ve net detay.</p>
                    <p>Uzun ömürlü yüzey performansı.</p>
                    <p>Kumaş dostu, tok ama konforlu his.</p>
                </div>
                <a
                    href="/bilimsel"
                    className="inline-flex items-center justify-center min-h-[44px] px-6 mt-5 rounded-full border border-zinc-700 text-white text-xs font-black uppercase tracking-[0.14em] active:scale-[0.985] transition-transform duration-150"
                    style={{ transitionTimingFunction: APPLE_EASE }}
                >
                    Teknolojiyi İncele
                </a>
                <div className="mt-6 rounded-[20px] overflow-hidden border border-zinc-800 bg-zinc-900">
                    <img
                        src="/urungorsel/1920x850/concept-black-hoodie-front-v2.jpg"
                        alt="Print Technology Görseli"
                        className="w-full h-[220px] object-cover"
                    />
                </div>
            </div>
        </section>
    );
}

function TrustRow() {
    return (
        <section className="max-w-[760px] mx-auto" style={{ padding: "56px var(--s-4)" }}>
            <div className="grid grid-cols-1 gap-3 auto-rows-fr">
                <TrustItem title="Ücretsiz Kargo" desc="1500 TL üzeri siparişlerde ücretsiz." Icon={Truck} />
                <TrustItem title="Kolay İade" desc="14 gün içinde hızlı iade süreci." Icon={RotateCcw} />
                <TrustItem title="Güvenli Ödeme" desc="Iyzico altyapısı ile korumalı ödeme." Icon={ShieldCheck} />
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="border-t border-zinc-900 bg-black/80">
            <div className="max-w-[760px] mx-auto grid grid-cols-1 gap-6" style={{ padding: "56px var(--s-4) 72px" }}>
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
                    <p className="text-sm text-white/90">Yeni drop bilgileri için e-posta listesine katıl.</p>
                    <form className="flex items-center gap-2">
                        <input type="email" placeholder="E-posta" className="min-h-[44px] flex-1 rounded-[20px] bg-zinc-950 border border-zinc-700 px-4 text-white placeholder:text-zinc-500" />
                        <button type="button" className="min-h-[44px] px-5 rounded-[20px] bg-white text-black text-xs font-black uppercase tracking-wide active:scale-[0.985] transition-transform duration-150" style={{ transitionTimingFunction: APPLE_EASE }}>
                            KAYIT OL
                        </button>
                    </form>
                </FooterGroup>
            </div>
        </footer>
    );
}

function SteniTabContent({ heroIndex, goPrevHero, goNextHero, onExplore, onNavigate }) {
    return (
        <>
            <HeroCarousel heroIndex={heroIndex} goPrevHero={goPrevHero} goNextHero={goNextHero} />
            <PrimaryCTA onExplore={onExplore} />
            <CategoryGrid onNavigate={onNavigate} />
            <PrintTechSection />
            <TrustRow />
        </>
    );
}

function OzelTabContent() {
    return (
        <div className="ozelScope relative">
            <HeroSection />

            <section className="w-full px-4 md:px-6 lg:px-8" style={{ paddingTop: "56px", paddingBottom: "56px" }}>
                <h2 className="text-white font-black text-[24px] sm:text-[30px] leading-tight">3 adımda özel üretim</h2>
                <div className="grid gap-3 md:grid-cols-3 mt-4">
                    <StepCard index={1} title="Ürününü Seç" desc="Tshirt, Sweatshirt, Hoodie veya Polar modelini seç." Icon={MousePointer2} />
                    <StepCard index={2} title="Tasarımını Oluştur" desc="Yazı, baskı ve renk ayarlarını 3D sahnede düzenle." Icon={PenTool} />
                    <StepCard index={3} title="Kaydet & Sipariş Ver" desc="Son görünümü onayla, siparişini güvenle tamamla." Icon={Download} />
                </div>
            </section>

            <section className="border-y border-zinc-900 bg-black/60">
                <div className="w-full px-4 md:px-6 lg:px-8" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
                    <h3 className="text-white font-black text-[22px] sm:text-[26px]">Neden STENI Custom?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 auto-rows-fr">
                        <TrustItem title="Ücretsiz Kargo" desc="1500 TL üzeri alışverişlerde ücretsiz gönderim." Icon={Truck} />
                        <TrustItem title="Kolay İade" desc="14 gün içinde kolay ve hızlı iade süreci." Icon={RotateCcw} />
                        <TrustItem title="Güvenli Ödeme" desc="Iyzico altyapısı ile güvenli ödeme deneyimi." Icon={ShieldCheck} />
                    </div>
                </div>
            </section>

            <section className="w-full px-4 md:px-6 lg:px-8" style={{ paddingTop: "56px", paddingBottom: "56px" }}>
                <div className="flex items-end justify-between gap-3 mb-4">
                    <h3 className="text-white font-black text-[22px] sm:text-[26px] leading-tight">Topluluk Tasarımları</h3>
                    <a href="/tasarim" className="text-xs uppercase tracking-[0.14em] text-white/90 font-bold">Keşfet →</a>
                </div>
                <CommunityGrid />
            </section>

            <section className="w-full px-4 md:px-6 lg:px-8" style={{ paddingBottom: "56px" }}>
                <div className="rounded-[20px] md:rounded-[24px] border border-zinc-800 bg-zinc-950/90 shadow-[0_12px_26px_rgba(0,0,0,0.28)]" style={{ padding: "20px" }}>
                    <p className="text-sm text-white/90">Tasarım stüdyosuna geç, ürününü anında kişiselleştir.</p>
                    <a href="/tasarim" className="mt-4 inline-flex items-center min-h-[44px] px-6 rounded-full bg-white text-black text-xs font-black uppercase tracking-[0.12em] active:scale-[0.985] transition-transform duration-150" style={{ transitionTimingFunction: APPLE_EASE }}>
                        Tasarıma Başla
                    </a>
                </div>
            </section>
        </div>
    );
}

function MobileHomeShell({ activeTab, onTabChange, heroIndex, onHeroPrev, onHeroNext, onExplore, onCategoryNavigate }) {
    return (
        <div style={FLOW_TOKENS} className="bg-[#050608] min-h-screen">
            <main
                style={{
                    paddingTop: "24px",
                    paddingBottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + var(--s-4))",
                    scrollPaddingTop: "calc(var(--sticky-offset) + var(--safe-top))",
                }}
            >
                <div
                    className="sticky top-[calc(24px+env(safe-area-inset-top))] md:fixed md:top-[96px] md:left-8 z-[45] border-b border-zinc-900 bg-[#050608]/95 backdrop-blur px-4 md:px-0 md:border-0 md:bg-transparent md:backdrop-blur-0"
                >
                    <div className="max-w-[760px] mx-auto py-2 md:py-0">
                        <HomeTabSwitcher activeTab={activeTab} onChange={onTabChange} />
                    </div>
                </div>

                {activeTab === "steni" ? (
                    <SteniTabContent
                        heroIndex={heroIndex}
                        goPrevHero={onHeroPrev}
                        goNextHero={onHeroNext}
                        onExplore={onExplore}
                        onNavigate={onCategoryNavigate}
                    />
                ) : (
                    <OzelTabContent />
                )}
                <Footer />
            </main>
        </div>
    );
}

export default function HomePage() {
    const router = useRouter();

    // --- STATE'LER ---
    const [aktifBolum, setAktifBolum] = useState(null);
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
        <div style={FLOW_TOKENS} className="min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-red-600 selection:text-white animate-in fade-in duration-700">
            <Navbar />

            <MobileHomeShell
                activeTab={aktifBolum === 'ozel' ? 'ozel' : 'steni'}
                onTabChange={bolumSec}
                heroIndex={heroIndex}
                onHeroPrev={goPrevHero}
                onHeroNext={goNextHero}
                onExplore={() => router.push('/tum-urunler')}
                onCategoryNavigate={(href) => router.push(href)}
            />
        </div>
    );
}
