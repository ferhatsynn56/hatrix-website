"use client";

import React, { useState, useEffect } from 'react';
import {
    MousePointer2,
    PenTool,
    Download,
    Sparkles,
    Truck,
    RotateCcw,
    ShieldCheck,
    Beaker,
    ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- SLIDER VERİLERİ ---
const slidesSteni = [
    { id: 1, image: "/urungorsel/anasayfa banner.png", title: "HUGO STYLE", subtitle: "YENİ KOLEKSİYON", desc: "Kuralları sen koy.", button: "KEŞFET", link: "/tum-urunler?koleksiyon=steni" },
    { id: 2, image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000&auto=format&fit=crop", title: "URBAN RACER", subtitle: "2025 EDITION", desc: "Hız tutkunları.", button: "İNCELE", link: "/tum-urunler?koleksiyon=steni" }
];

export default function AnaSayfa() {
    const router = useRouter();

    // --- STATE'LER ---
    const [aktifBolum, setAktifBolum] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [bilimselAcik, setBilimselAcik] = useState(false);

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

    // Bölüm Seçme Fonksiyonu
    const bolumSec = (bolum) => {
        sessionStorage.setItem('session_bolum_tercihi', bolum);
        setAktifBolum(bolum);
    };

    // Slider Zamanlayıcı
    useEffect(() => {
        if (!aktifBolum || aktifBolum === 'intro' || aktifBolum === 'ozel') return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === slidesSteni.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [aktifBolum]);

    if (aktifBolum === null) {
        return <div className="h-screen w-full bg-black"></div>;
    }

    // =====================================================================================
    // --- GİRİŞ EKRANI (SPLIT SCREEN) ---
    // =====================================================================================
    if (aktifBolum === 'intro') {
        return (
            <div className="h-screen w-full flex flex-col md:flex-row bg-black overflow-hidden relative z-[60]"> {/* Navbar'ın üstünde kalması için z-60 */}
                {/* STENI TARAFI */}
                <div onClick={() => bolumSec('steni')} className="relative w-full md:w-1/2 h-1/2 md:h-full group cursor-pointer border-b md:border-b-0 md:border-r border-zinc-800">
                    <div className="absolute inset-0 bg-black">
                        <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 ease-out grayscale group-hover:grayscale-0" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-10">
                        <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4 group-hover:translate-y-[-10px] transition duration-500">STENI</h2>
                        <p className="text-zinc-400 font-bold tracking-[0.3em] text-xs uppercase group-hover:text-white transition">Ready to Wear</p>
                        <span className="mt-8 border border-white px-8 py-3 text-white text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition duration-500 rounded-full">Keşfet</span>
                    </div>
                </div>

                {/* ÖZEL TARAFI */}
                <div onClick={() => bolumSec('ozel')} className="relative w-full md:w-1/2 h-1/2 md:h-full group cursor-pointer">
                    <div className="absolute inset-0 bg-black">
                        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 ease-out grayscale group-hover:grayscale-0" />
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

            {/* --- SWITCHER (DÜZENLENDİ: MOBİLDE SOL ÜSTTE) --- */}
            <div className="fixed top-24 left-4 md:left-8 z-40 animate-in fade-in slide-in-from-left-4 duration-700 delay-500 w-48">
                <div className="bg-black/80 backdrop-blur-xl rounded-full p-1 border border-zinc-700 shadow-2xl flex w-full">
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 shadow-sm ${aktifBolum === 'steni' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                    <button onClick={() => bolumSec('steni')} className={`flex-1 relative z-10 py-1.5 text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'steni' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>STENI</button>
                    <button onClick={() => bolumSec('ozel')} className={`flex-1 relative z-10 py-1.5 text-[10px] font-black tracking-widest transition-colors duration-300 rounded-full ${aktifBolum === 'ozel' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>ÖZEL</button>
                </div>
            </div>

            {/* --- İÇERİK BAŞLANGICI --- */}
            <div className="pb-[72px] md:pb-0 pt-[64px]"> 
                
                {/* ================= STENI BÖLÜMÜ (HAZIR GİYİM) ================= */}
                {aktifBolum === 'steni' && (
                    <div className="animate-in fade-in duration-700">
                        {/* HERO SLIDER */}
                        <header className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
                            {slidesSteni.map((slide, index) => (
                                <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                                    <div className="absolute inset-0 overflow-hidden bg-black">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-50 scale-110"
                                            style={{ backgroundImage: `url(${slide.image})` }}
                                        ></div>
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            className="relative w-full h-full object-contain z-10 shadow-2xl"
                                        />
                                        <div className="absolute inset-0 bg-black/30 z-20"></div>
                                    </div>
                                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 pt-20 z-30">
                                        <h2 className="font-bold tracking-[0.5em] text-xs md:text-sm mb-6 uppercase text-white animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">{slide.subtitle}</h2>
                                        <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter text-white leading-none mb-8 animate-in zoom-in fade-in duration-1000">{slide.title}</h1>
                                        <div className="mt-8"><a href={slide.link}><button className="px-10 py-4 font-black text-xs hover:scale-105 transition transform animate-in fade-in duration-1000 delay-700 uppercase tracking-[0.2em] border rounded-full bg-white text-black border-white hover:bg-black hover:text-white">{slide.button}</button></a></div>
                                    </div>
                                </div>
                            ))}
                        </header>

                        {/* --- GRID --- */}
                        <section className="w-full bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-white px-[0px] pb-[0px]">
                                {/* Kutu 1 - TSHIRT */}
                                <div className="relative h-[520px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-10 left-6 md:left-10 z-20">
                                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">T-Shirts</h3>
                                        <a href="/tum-urunler?koleksiyon=steni&kategori=tshirt" className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Koleksiyonu Keşfet</a>
                                    </div>
                                </div>
                                {/* Kutu 2 - HOODIE */}
                                <div className="relative h-[520px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-10 left-6 md:left-10 z-20">
                                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">Hoodies</h3>
                                        <a href="/tum-urunler?koleksiyon=steni&kategori=sweatshirt" className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Sıcak Kal</a>
                                    </div>
                                </div>
                                {/* Kutu 3 - AKSESUAR */}
                                <div className="relative h-[520px] md:h-[700px] group overflow-hidden bg-gray-100 cursor-pointer">
                                    <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                    <div className="absolute bottom-10 left-6 md:left-10 z-20">
                                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-md">Aksesuarlar</h3>
                                        <a href="/tum-urunler?koleksiyon=steni&kategori=aksesuar" className="inline-block border-b-2 border-white text-white font-bold text-xs uppercase tracking-widest pb-1 hover:text-gray-200 hover:border-gray-200 transition">Detayları Gör</a>
                                    </div>
                                </div>
                                {/* Kutu 4 - LAB */}
                                <div onClick={() => setBilimselAcik(true)} className="relative h-[520px] md:h-[700px] bg-black group overflow-hidden cursor-pointer flex flex-col justify-center items-center text-center p-12 hover:bg-zinc-950 transition-colors duration-500">
                                    <div className="relative z-20 border border-zinc-800 p-12 w-full h-full flex flex-col justify-center items-center hover:border-zinc-700 transition duration-500">
                                        <div className="mb-6 text-cyan-500 animate-pulse"><Beaker size={48} strokeWidth={1} /></div>
                                        <h3 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">Sentist<br />Lab</h3>
                                        <p className="text-zinc-400 text-sm max-w-md mb-10 leading-relaxed font-light">Moda sadece görünüş değildir. Kumaş teknolojimizin arkasındaki bilimi keşfedin.</p>
                                        <span className="bg-white text-black px-8 py-4 font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition duration-300">LABORATUVARA GİR</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* ================= ÖZEL BÖLÜMÜ (3D TASARIM) ================= */}
                {aktifBolum === 'ozel' && (
                    <div className="animate-in fade-in duration-700">
                        <header className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-black">
                            <div className="absolute inset-0">
                                <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" src="https://videos.pexels.com/video-files/3163534/3163534-uhd_2560_1440_30fps.mp4" />
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

                        {/* NASIL ÇALIŞIR? */}
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
                    </div>
                )}

                {/* ✅ ORTAK FOOTER & TRUST BADGES (HER İKİ BÖLÜM İÇİN DE GÖRÜNÜR) */}
                
                {/* Güvenlik Şeridi */}
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

                {/* Footer */}
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
        </div>
    );
}