"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, User, ChevronDown, LogOut, Beaker, Search, ArrowRight, X, MousePointer2, PenTool, Download, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    if (Object.keys(firebaseConfig).length === 0) {
        console.error("LÜTFEN firebaseConfig ALANINI DOLDURUNUZ!");
    } else {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
    }
} catch (e) {
    console.error("Firebase Başlatılamadı:", e);
}

export default function AnaSayfa() {
    const router = useRouter();

    // --- STATE'LER ---
    const [aktifBolum, setAktifBolum] = useState(null);

    const [kullanici, setKullanici] = useState(null);
    const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
    const [bilimselAcik, setBilimselAcik] = useState(false);
    const [tasarimMenuAcik, setTasarimMenuAcik] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const iletisimMaili = "mailto:info@stenist.com";

    // --- AKILLI NAVİGASYON KONTROLÜ ---
    useEffect(() => {
        const navEntries = performance.getEntriesByType("navigation");

        let isReload = false;
        if (navEntries.length > 0 && navEntries[0].type === 'reload') {
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
    }, []);

    // Bölüm Seçme Fonksiyonu
    const bolumSec = (bolum) => {
        sessionStorage.setItem('session_bolum_tercihi', bolum);
        setAktifBolum(bolum);
    };

    // --- GİZLİ ADMİN KISAYOLU ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
                e.preventDefault();
                router.push('/admin');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    // --- SLIDER VERİLERİ ---
    const slidesSteni = [
        { id: 1, image: "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=2000&auto=format&fit=crop", title: "HUGO STYLE", subtitle: "YENİ KOLEKSİYON", desc: "Kuralları sen koy.", button: "KEŞFET", link: "/tum-urunler?koleksiyon=steni" },
        { id: 2, image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000&auto=format&fit=crop", title: "URBAN RACER", subtitle: "2025 EDITION", desc: "Hız tutkunları.", button: "İNCELE", link: "/tum-urunler?koleksiyon=steni" }
    ];

    // Auth Kontrolü
    useEffect(() => {
        if (!auth) return;
        const initAuth = async () => {
            await signInAnonymously(auth).catch(e => console.log("Anonim giriş:", e));
            onAuthStateChanged(auth, (user) => {
                if (user && !user.isAnonymous) setKullanici(user);
                else setKullanici(null);
            });
        };
        initAuth();
    }, []);

    // Slider Zamanlayıcı
    useEffect(() => {
        if (!aktifBolum || aktifBolum === 'intro' || aktifBolum === 'ozel') return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === slidesSteni.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [aktifBolum]);

    const cikisYap = async () => { if (auth) await signOut(auth); };

    // Yükleniyor durumunda siyah ekran
    if (aktifBolum === null) {
        return <div className="h-screen w-full bg-black"></div>;
    }

    // =====================================================================================
    // --- GİRİŞ EKRANI (SPLIT SCREEN) ---
    // =====================================================================================
    if (aktifBolum === 'intro') {
        return (
            <div className="h-screen w-full flex flex-col md:flex-row bg-black overflow-hidden relative">

                {/* STENI TARAFI (SOL) */}
                <div
                    onClick={() => bolumSec('steni')}
                    className="relative w-full md:w-1/2 h-1/2 md:h-full group cursor-pointer border-b md:border-b-0 md:border-r border-zinc-800"
                >
                    <div className="absolute inset-0 bg-black">
                        <img
                            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000&auto=format&fit=crop"
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 ease-out grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-10">
                        <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4 group-hover:translate-y-[-10px] transition duration-500">STENI</h2>
                        <p className="text-zinc-400 font-bold tracking-[0.3em] text-xs uppercase group-hover:text-white transition">Ready to Wear</p>
                        <span className="mt-8 border border-white px-8 py-3 text-white text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition duration-500 rounded-full">Keşfet</span>
                    </div>
                </div>

                {/* ÖZEL TARAFI (SAĞ) */}
                <div
                    onClick={() => bolumSec('ozel')}
                    className="relative w-full md:w-1/2 h-1/2 md:h-full group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-black">
                        <img
                            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop"
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 ease-out grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-10">
                        <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4 group-hover:translate-y-[-10px] transition duration-500">ÖZEL</h2>
                        <p className="text-zinc-400 font-bold tracking-[0.3em] text-xs uppercase group-hover:text-white transition">Design Studio</p>
                        <span className="mt-8 border border-white px-8 py-3 text-white text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition duration-500 rounded-full">Tasarla</span>
                    </div>
                </div>

                {/* ORTA LOGO */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none mix-blend-difference">
                    <h1 className="text-xl font-black tracking-widest text-white uppercase">Stenist</h1>
                </div>

            </div>
        );
    }

    // =====================================================================================
    // --- ANA SİTE İÇERİĞİ ---
    // =====================================================================================
    return (
        <div className="min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-red-600 selection:text-white animate-in fade-in duration-700">

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}} />

            {/* --- MARQUEE --- */}
            <div className={`fixed top-0 left-0 w-full z-[60] overflow-hidden py-1 whitespace-nowrap transition-colors duration-500 ${aktifBolum === 'steni' ? 'bg-white text-black' : 'bg-red-600 text-white'}`}>
                <div className="inline-block animate-marquee font-black text-[10px] uppercase tracking-[0.2em]">
                    {aktifBolum === 'steni'
                        ? "Stenist • Automotive Fashion • Street Culture • Ready to Wear • Stenist • Automotive Fashion • Street Culture • Ready to Wear • Stenist • Automotive Fashion • Street Culture • Ready to Wear • Stenist • Automotive Fashion • Street Culture • Ready to Wear • "
                        : "Design Your Own • 3D Studio • Custom Made • Sentist Lab Technology • Design Your Own • 3D Studio • Custom Made • Sentist Lab Technology • Design Your Own • 3D Studio • Custom Made • Sentist Lab Technology • Design Your Own • 3D Studio • Custom Made • Sentist Lab Technology • "
                    }
                </div>
            </div>

            {/* --- NAVBAR --- */}
            <nav className="fixed top-[24px] left-0 w-full h-[64px] flex items-center justify-between px-8 bg-black border-b border-zinc-800 shadow-2xl z-50">
                <div className="flex items-center gap-4 h-full ml-64">
                    <div className="hidden md:flex items-center gap-2 text-xs font-bold text-white tracking-widest uppercase h-full">
                        <div
                            className="relative group h-full flex items-center"
                            onMouseEnter={() => setTasarimMenuAcik(true)}
                            onMouseLeave={() => setTasarimMenuAcik(false)}
                        >
                            <button className="flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all duration-300">
                                MAĞAZA <ChevronDown size={10} />
                            </button>
                            {tasarimMenuAcik && (
                                <div className="absolute top-full left-0 pt-2 w-48 animate-in fade-in slide-in-from-top-1 z-50">
                                    <div className="bg-zinc-900 border border-zinc-700 shadow-xl rounded-xl overflow-hidden">
                                        <div className="flex flex-col">
                                            <a href="/tum-urunler?koleksiyon=steni" className="px-6 py-3 hover:bg-zinc-800 text-[10px] font-bold text-white transition border-b border-zinc-800 block">TÜM ÜRÜNLER</a>
                                            <a href="/tum-urunler?koleksiyon=steni&kategori=tshirt" className="px-6 py-3 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white transition block">T-SHIRTS</a>
                                            <a href="/tum-urunler?koleksiyon=steni&kategori=sweatshirt" className="px-6 py-3 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white transition block">SWEATSHIRTS</a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <a href="#" className="flex items-center px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all duration-300">Hakkımızda</a>
                        <a href={iletisimMaili} className="flex items-center px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all duration-300">İletişim</a>
                        <button onClick={() => setBilimselAcik(true)} className="flex items-center px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ml-2">
                            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent font-black text-sm tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">BİLİMSEL</span>
                        </button>
                    </div>
                    <button onClick={() => setMobilMenuAcik(!mobilMenuAcik)} className="md:hidden text-white"><Menu size={24} /></button>
                </div>

                <div className="flex items-center gap-5">
                    <button className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full"><Search size={20} strokeWidth={2} /></button>
                    {kullanici ? (
                        <button onClick={cikisYap} className="text-white hover:text-red-500 transition hover:bg-zinc-800 p-2 rounded-full"><LogOut size={20} strokeWidth={2} /></button>
                    ) : (
                        <a href="/giris" className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full"><User size={20} strokeWidth={2} /></a>
                    )}
                    <a href="/tum-urunler" className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full">
                        <ShoppingBag size={20} strokeWidth={2} />
                    </a>
                </div>
            </nav>

            {/* --- SWITCHER --- */}
            <div className="fixed top-[100px] left-8 z-40 animate-in fade-in slide-in-from-left-4 duration-700 delay-500 w-56">
                <div className="bg-black/80 backdrop-blur-xl rounded-full p-1 border border-zinc-700 shadow-2xl flex w-full">
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 shadow-sm ${aktifBolum === 'steni' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                    <button onClick={() => bolumSec('steni')} className={`flex-1 relative z-10 py-1.5 text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'steni' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>STENI</button>
                    <button onClick={() => bolumSec('ozel')} className={`flex-1 relative z-10 py-1.5 text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'ozel' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>ÖZEL</button>
                </div>
            </div>

            {/* ================= STENI BÖLÜMÜ (HUGO BOSS DESIGN) ================= */}
            {aktifBolum === 'steni' && (
                <div className="animate-in fade-in duration-700">
                    {/* HERO SLIDER */}
                    <header className="relative h-screen w-full overflow-hidden">
                        {slidesSteni.map((slide, index) => (
                            <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                                <div className="absolute inset-0">
                                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40"></div>
                                </div>
                                <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pt-20">
                                    <h2 className="font-bold tracking-[0.5em] text-xs md:text-sm mb-6 uppercase text-white animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">{slide.subtitle}</h2>
                                    <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter text-white leading-none mb-8 animate-in zoom-in fade-in duration-1000">{slide.title}</h1>
                                    <div className="mt-8"><a href={slide.link}><button className="px-10 py-4 font-black text-xs hover:scale-105 transition transform animate-in fade-in duration-1000 delay-700 uppercase tracking-[0.2em] border rounded-full bg-white text-black border-white hover:bg-black hover:text-white">{slide.button}</button></a></div>
                                </div>
                            </div>
                        ))}
                    </header>

                    {/* --- HUGO BOSS STYLE GRID --- */}
                    <section className="w-full bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-white px-[0px] pb-[0px]">

                            {/* Kutu 1 */}
                            <div className="relative h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                <div className="absolute bottom-10 left-10 z-20">
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">T-Shirts</h3>
                                    <a href="/tum-urunler?koleksiyon=steni&kategori=tshirt" className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Koleksiyonu Keşfet</a>
                                </div>
                            </div>

                            {/* Kutu 2 */}
                            <div className="relative h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                <div className="absolute bottom-10 left-10 z-20">
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">Hoodies</h3>
                                    <a href="/tum-urunler?koleksiyon=steni&kategori=sweatshirt" className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Sıcak Kal</a>
                                </div>
                            </div>

                            {/* Kutu 3 */}
                            <div className="relative h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                <div className="absolute bottom-10 left-10 z-20">
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">Aksesuarlar</h3>
                                    <a href="/tum-urunler?koleksiyon=steni&kategori=aksesuar" className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Detayları Gör</a>
                                </div>
                            </div>

                            {/* Kutu 4 - BİLİMSEL SAYFA YÖNLENDİRMESİ */}
                            <div
                                onClick={() => setBilimselAcik(true)}
                                className="relative h-[700px] bg-black group overflow-hidden cursor-pointer flex flex-col justify-center items-center text-center p-12 hover:bg-zinc-950 transition-colors duration-500"
                            >
                                <div className="relative z-20 border border-zinc-800 p-12 w-full h-full flex flex-col justify-center items-center hover:border-zinc-700 transition duration-500">
                                    <div className="mb-6 text-cyan-500 animate-pulse">
                                        <Beaker size={48} strokeWidth={1} />
                                    </div>
                                    <h3 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">Sentist<br />Lab</h3>
                                    <p className="text-zinc-400 text-sm max-w-md mb-10 leading-relaxed font-light">
                                        Moda sadece görünüş değildir. Kumaş teknolojimizin arkasındaki bilimi keşfedin.
                                    </p>
                                    <span className="bg-white text-black px-8 py-4 font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition duration-300">
                                        LABORATUVARA GİR
                                    </span>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* --- HUGO BOSS STYLE FOOTER --- */}
                    <footer className="bg-zinc-950 text-white py-20 px-8 border-t border-zinc-900">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">

                            <div className="flex flex-col space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Müşteri Hizmetleri</h4>
                                <ul className="space-y-4 text-sm font-medium text-zinc-300">
                                    <li><a href="#" className="hover:text-white hover:underline transition">Bize Ulaşın</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Sıkça Sorulan Sorular</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">İade ve Değişim</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Ödeme Seçenekleri</a></li>
                                </ul>
                            </div>

                            <div className="flex flex-col space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Şirket</h4>
                                <ul className="space-y-4 text-sm font-medium text-zinc-300">
                                    <li><a href="#" className="hover:text-white hover:underline transition">Hakkımızda</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Kariyer</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Sürdürülebilirlik</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Basın</a></li>
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
                                <p className="text-zinc-400 text-xs leading-relaxed">Yeni koleksiyonlardan ve özel etkinliklerden ilk siz haberdar olun.</p>
                                <form className="flex border-b border-zinc-700 pb-2">
                                    <input type="email" placeholder="E-posta adresiniz" className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-zinc-600" />
                                    <button type="button" className="text-white hover:text-zinc-400 transition font-bold uppercase text-xs">KAYIT OL</button>
                                </form>
                            </div>

                        </div>

                        <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                            <p>© 2025 STENIST. Tüm hakları saklıdır.</p>
                            <div className="flex space-x-6 mt-4 md:mt-0">
                                <a href="#" className="hover:text-white transition">Gizlilik Politikası</a>
                                <a href="#" className="hover:text-white transition">Kullanım Şartları</a>
                            </div>
                        </div>
                    </footer>
                </div>
            )}

            {/* ================= ÖZEL BÖLÜMÜ (AYNI KALDI) ================= */}
            {aktifBolum === 'ozel' && (
                <div className="animate-in fade-in duration-700">
                    {/* VIDEO BANNER */}
                    <header className="relative h-screen w-full overflow-hidden bg-black">
                        <div className="absolute inset-0">
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-60"
                                src="https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pt-20 z-10">
                            <div className="border border-white/30 backdrop-blur-md px-6 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-top-4">
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-white">Interactive Studio</span>
                            </div>
                            <h1 className="text-6xl md:text-[8rem] font-black tracking-tighter text-white leading-none mb-6 animate-in zoom-in duration-1000">
                                DESIGN<br />YOURSELF
                            </h1>
                            <p className="text-zinc-300 text-sm md:text-lg max-w-xl font-light tracking-wide mb-10 animate-in fade-in delay-300">
                                Sınırları kaldır. Kendi koleksiyonunu tasarla ve anında üretime gönder.
                            </p>
                            <a href="/tasarim">
                                <button className="bg-red-600 text-white px-10 py-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-red-600 transition duration-300 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                    Stüdyoyu Başlat
                                </button>
                            </a>
                        </div>
                    </header>

                    {/* SÜREÇ */}
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

                    {/* ÖRNEK TASARIMLAR (GENİŞ GRID) */}
                    <section className="bg-zinc-950 py-20">
                        <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Topluluk<br />Tasarimları</h2>
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

                    {/* HATRIX ALANI */}
                    <section className="bg-black py-32 relative overflow-hidden border-t border-zinc-900">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-900/10 to-transparent"></div>
                        <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
                            <div className="md:w-1/2">
                                <div className="flex items-center gap-2 text-red-500 mb-6 font-bold uppercase tracking-widest text-xs animate-pulse">
                                    <Sparkles size={16} /> Best Seller
                                </div>
                                <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-8">
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

                    {/* --- YENİ HUGO BOSS FOOTER (ÖZEL İÇİN) --- */}
                    <footer className="bg-zinc-950 text-white py-20 px-8 border-t border-zinc-900">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">

                            <div className="flex flex-col space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Müşteri Hizmetleri</h4>
                                <ul className="space-y-4 text-sm font-medium text-zinc-300">
                                    <li><a href="#" className="hover:text-white hover:underline transition">Bize Ulaşın</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Sıkça Sorulan Sorular</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">İade ve Değişim</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Ödeme Seçenekleri</a></li>
                                </ul>
                            </div>

                            <div className="flex flex-col space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Şirket</h4>
                                <ul className="space-y-4 text-sm font-medium text-zinc-300">
                                    <li><a href="#" className="hover:text-white hover:underline transition">Hakkımızda</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Kariyer</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Sürdürülebilirlik</a></li>
                                    <li><a href="#" className="hover:text-white hover:underline transition">Basın</a></li>
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
                                <p className="text-zinc-400 text-xs leading-relaxed">Yeni koleksiyonlardan ve özel etkinliklerden ilk siz haberdar olun.</p>
                                <form className="flex border-b border-zinc-700 pb-2">
                                    <input type="email" placeholder="E-posta adresiniz" className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-zinc-600" />
                                    <button type="button" className="text-white hover:text-zinc-400 transition font-bold uppercase text-xs">KAYIT OL</button>
                                </form>
                            </div>

                        </div>

                        <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                            <p>© 2025 STENIST. Tüm hakları saklıdır.</p>
                            <div className="flex space-x-6 mt-4 md:mt-0">
                                <a href="#" className="hover:text-white transition">Gizlilik Politikası</a>
                                <a href="#" className="hover:text-white transition">Kullanım Şartları</a>
                            </div>
                        </div>
                    </footer>
                </div>
            )}

            {/* BİLİMSEL MODAL (GLOBAL) */}
            {bilimselAcik && (
                <div className="fixed inset-0 z-[150] bg-black text-white overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
                    <div className="sticky top-0 bg-black/90 backdrop-blur-md z-50 px-6 py-6 flex justify-between items-center max-w-[1400px] mx-auto w-full border-b border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-400 hover:text-white transition cursor-pointer uppercase font-bold text-xs tracking-widest" onClick={() => setBilimselAcik(false)}>
                            <X size={24} /> Kapat
                        </div>
                        <div className="flex items-center gap-2 text-cyan-500">
                            <Beaker size={24} />
                            <span className="font-black tracking-tighter text-lg">SENTIST LAB</span>
                        </div>
                    </div>
                    <div className="max-w-7xl mx-auto px-6 py-32">
                        <h2 className="text-7xl font-black mb-8">Engineering The Fabric</h2>
                        <p className="text-xl text-zinc-400">Özel laboratuvarlarımızda geliştirdiğimiz teknolojiler.</p>
                    </div>
                </div>
            )}
        </div>
    );
}