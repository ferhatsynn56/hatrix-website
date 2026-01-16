"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, ArrowLeft, Search, Check, Plus, Minus, ChevronDown, Share2, Heart } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// --- FIREBASE AYARLARI (BURAYI DOLDUR) ---
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
let auth = null;

try {
    if (Object.keys(firebaseConfig).length === 0) {
        console.error("LÜTFEN firebaseConfig ALANINI DOLDURUNUZ!");
    } else {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    }
} catch (e) {
    console.error("Firebase Başlatılamadı:", e);
}

export default function UrunDetayWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">YÜKLENİYOR...</div>}>
            <UrunDetay />
        </Suspense>
    );
}

function UrunDetay() {
    const params = useParams(); // URL'deki [id] yi alır
    const router = useRouter();
    const id = params.id;

    const [urun, setUrun] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [secilenBeden, setSecilenBeden] = useState(null);
    const [acikAccordion, setAcikAccordion] = useState(null); // 'materyal', 'kargo' vb.

    // --- SEPET MANTIĞI ---
    const [sepet, setSepet] = useState([]);

    useEffect(() => {
        const savedCart = localStorage.getItem('sepet');
        if (savedCart) setSepet(JSON.parse(savedCart));
    }, []);

    const sepeteEkle = () => {
        if (!secilenBeden && urun.kategori !== 'AKSESUAR') {
            alert("Lütfen bir beden seçiniz.");
            return;
        }

        const yeniUrun = { ...urun, beden: secilenBeden };
        const yeniSepet = [...sepet, yeniUrun];
        setSepet(yeniSepet);
        localStorage.setItem('sepet', JSON.stringify(yeniSepet));
        alert("Ürün sepete eklendi!");
    };

    // --- VERİ ÇEKME ---
    useEffect(() => {
        if (!db || !id) return;

        const urunuGetir = async () => {
            try {
                const docRef = doc(db, "urunler", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUrun({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("Ürün bulunamadı!");
                }
            } catch (error) {
                console.error("Hata:", error);
            } finally {
                setYukleniyor(false);
            }
        };

        urunuGetir();
    }, [id]);

    // --- ADMIN KISAYOLU ---
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

    if (yukleniyor) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">YÜKLENİYOR...</div>;
    if (!urun) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono text-xs">ÜRÜN BULUNAMADI.</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-700 selection:text-white">

            {/* --- NAVBAR (SADE) --- */}
            <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-md z-[60] h-16 flex items-center px-6 justify-between border-b border-zinc-900">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition uppercase tracking-widest">
                    <ArrowLeft size={18} /> GERİ
                </button>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="text-xl font-black tracking-[-0.05em] cursor-pointer" onClick={() => router.push('/')}>STENIST</span>
                </div>
                <div className="flex items-center gap-6">
                    <ShoppingBag size={24} strokeWidth={1.5} className="text-zinc-400 hover:text-white transition cursor-pointer" />
                </div>
            </nav>

            {/* --- İÇERİK (SPLIT LAYOUT) --- */}
            <main className="pt-16 lg:grid lg:grid-cols-12 min-h-screen">

                {/* SOL: GÖRSELLER (SCROLLABLE GRID) */}
                <div className="lg:col-span-8 lg:h-[calc(100vh-64px)] lg:overflow-y-auto bg-zinc-950 no-scrollbar">
                    <div className="grid grid-cols-1 gap-1">
                        {/* Ana Resim */}
                        <div className="w-full aspect-[3/4] relative group">
                            <img src={urun.resim} className="w-full h-full object-cover" alt={urun.isim} />
                        </div>
                        {/* Detay Resimleri (Simüle Edilmiş - Aynı resmi tekrar koyuyoruz ama normalde db'den array gelir) */}
                        <div className="grid grid-cols-2 gap-1">
                            <div className="w-full aspect-[3/4] overflow-hidden">
                                <img src={urun.resim} className="w-full h-full object-cover scale-150 origin-top" alt="detail" />
                            </div>
                            <div className="w-full aspect-[3/4] overflow-hidden">
                                <img src={urun.resim} className="w-full h-full object-cover scale-150 origin-bottom" alt="detail" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ: DETAYLAR (STICKY) */}
                <div className="lg:col-span-4 bg-black border-l border-zinc-900 p-8 lg:h-[calc(100vh-64px)] lg:overflow-y-auto relative">
                    <div className="sticky top-0 space-y-8">

                        {/* Başlık ve Fiyat */}
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none mb-4">{urun.isim}</h1>
                            <p className="text-xl font-mono text-zinc-400">₺{urun.fiyat}</p>
                            <p className="text-xs text-zinc-500 mt-2 font-bold tracking-widest uppercase">{urun.koleksiyon} KOLEKSİYONU</p>
                        </div>

                        {/* Açıklama */}
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {urun.aciklama || "Bu ürün özel Stenist kumaş teknolojisi ile üretilmiştir. Sokak modasının dinamiklerini yansıtan, rahat ve şık bir kalıba sahiptir."}
                        </p>

                        {/* Beden Seçimi (Eğer Aksesuar Değilse) */}
                        {urun.kategori !== 'AKSESUAR' && (
                            <div>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Beden Seç</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {['S', 'M', 'L', 'XL'].map((beden) => (
                                        <button
                                            key={beden}
                                            onClick={() => setSecilenBeden(beden)}
                                            className={`h-12 border text-sm font-bold transition flex items-center justify-center
                                                ${secilenBeden === beden
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500 hover:text-white'
                                                }`}
                                        >
                                            {beden}
                                        </button>
                                    ))}
                                </div>
                                {secilenBeden && <p className="text-[10px] text-zinc-500 mt-2 text-right">Seçilen: {secilenBeden}</p>}
                            </div>
                        )}

                        {/* Sepete Ekle Butonu */}
                        <div className="pt-4 border-t border-zinc-900">
                            <button
                                onClick={sepeteEkle}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 h-14 font-black uppercase tracking-widest text-sm transition shadow-lg shadow-blue-900/20"
                            >
                                Sepete Ekle
                            </button>
                            <div className="flex justify-center gap-6 mt-4">
                                <button className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition font-bold uppercase tracking-wider"><Heart size={14} /> Favorile</button>
                                <button className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition font-bold uppercase tracking-wider"><Share2 size={14} /> Paylaş</button>
                            </div>
                        </div>

                        {/* Accordion Bilgiler */}
                        <div className="space-y-4 pt-8">

                            {/* Materyal */}
                            <div className="border-b border-zinc-900 pb-4">
                                <button onClick={() => setAcikAccordion(acikAccordion === 'mat' ? null : 'mat')} className="flex justify-between items-center w-full text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition">
                                    Materyal & Bakım
                                    {acikAccordion === 'mat' ? <Minus size={14} /> : <Plus size={14} />}
                                </button>
                                {acikAccordion === 'mat' && (
                                    <p className="text-xs text-zinc-500 mt-3 leading-relaxed animate-in slide-in-from-top-1">
                                        %100 Pamuk. 30 derecede yıkayınız. Ağartıcı kullanmayınız. Düşük ısıda ütüleyiniz.
                                    </p>
                                )}
                            </div>

                            {/* Kargo */}
                            <div className="border-b border-zinc-900 pb-4">
                                <button onClick={() => setAcikAccordion(acikAccordion === 'kargo' ? null : 'kargo')} className="flex justify-between items-center w-full text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition">
                                    Kargo & İade
                                    {acikAccordion === 'kargo' ? <Minus size={14} /> : <Plus size={14} />}
                                </button>
                                {acikAccordion === 'kargo' && (
                                    <p className="text-xs text-zinc-500 mt-3 leading-relaxed animate-in slide-in-from-top-1">
                                        2-4 iş günü içinde kargoya verilir. 14 gün içinde ücretsiz iade hakkınız mevcuttur.
                                    </p>
                                )}
                            </div>

                        </div>

                    </div>
                </div>

            </main>

            {/* Scrollbar Gizleme */}
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}