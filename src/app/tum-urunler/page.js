"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, ArrowLeft, SlidersHorizontal, Check, X, ArrowRight, Search, Filter, Plus } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

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

export default function TumUrunlerSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-bold tracking-widest">YÜKLENİYOR...</div>}>
      <UrunlerIcerik />
    </Suspense>
  );
}

function UrunlerIcerik() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- STATE'LER ---
  const [tumUrunler, setTumUrunler] = useState([]);
  const [goruntulenenUrunler, setGoruntulenenUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // Filtreler
  const [aktifKategori, setAktifKategori] = useState("HEPSİ");
  const [fiyatSiralamasi, setFiyatSiralamasi] = useState("ONERILEN");
  const [filtreMenuAcik, setFiltreMenuAcik] = useState(false);

  // KATEGORİ LİSTESİ
  const kategoriler = [
    { id: 'HEPSİ', label: 'TÜMÜ' },
    { id: 'TSHIRT', label: 'T-SHIRT' },
    { id: 'SWEATSHIRT', label: 'SWEATSHIRT' },
    { id: 'HOODIE', label: 'HOODIE' },
    { id: 'IKONIK', label: 'İKONİK' },
    { id: 'AKSESUAR', label: 'AKSESUAR' }
  ];

  // 1. URL'den Kategori ve Arama Okuma
  useEffect(() => {
    const urlKategori = searchParams.get('kategori');
    const urlAra = searchParams.get('ara');

    if (urlAra) {
        setAktifKategori("ARAMA"); 
    } else if (urlKategori) {
        setAktifKategori(urlKategori.toUpperCase());
    } else {
        setAktifKategori("HEPSİ");
    }
  }, [searchParams]);

  // 2. Firebase Veri Çekme
  useEffect(() => {
    if (!db) { setYukleniyor(false); return; }
    
    const unsubscribe = onSnapshot(collection(db, 'urunler'), (snapshot) => {
      const veriler = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      veriler.sort((a, b) => (b.eklenmeTarihi?.seconds || 0) - (a.eklenmeTarihi?.seconds || 0));
      setTumUrunler(veriler);
      setYukleniyor(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Filtreleme Mantığı
  useEffect(() => {
    let sonuc = [...tumUrunler];
    const aramaKelimesi = searchParams.get('ara')?.toLowerCase();

    if (aramaKelimesi) {
        sonuc = sonuc.filter(urun => 
            (urun.isim || "").toLowerCase().includes(aramaKelimesi) || 
            (urun.kategori || "").toLowerCase().includes(aramaKelimesi)
        );
    } else if (aktifKategori !== "HEPSİ") {
      sonuc = sonuc.filter(urun => {
        const isim = (urun.isim || "").toLowerCase();
        const kat = (urun.kategori || "").toLowerCase();

        if (aktifKategori === 'TSHIRT') return isim.includes('t-shirt') || isim.includes('tshirt') || kat === 'tshirt';
        if (aktifKategori === 'SWEATSHIRT') return (isim.includes('sweat') && !isim.includes('hoodie')) || kat === 'sweatshirt';
        if (aktifKategori === 'HOODIE') return isim.includes('hoodie') || kat === 'hoodie';
        if (aktifKategori === 'IKONIK') return isim.includes('hatrix') || kat === 'ikonik';
        if (aktifKategori === 'AKSESUAR') return isim.includes('mini') || kat === 'aksesuar';
        return true;
      });
    }

    if (fiyatSiralamasi === "ARTAN") sonuc.sort((a, b) => Number(a.fiyat) - Number(b.fiyat));
    if (fiyatSiralamasi === "AZALAN") sonuc.sort((a, b) => Number(b.fiyat) - Number(a.fiyat));

    setGoruntulenenUrunler(sonuc);
  }, [aktifKategori, fiyatSiralamasi, tumUrunler, searchParams]);

  return (
    // Üst boşluk: Marquee(24) + Navbar(64) = 88px
    <div className="min-h-screen bg-black font-sans text-white selection:bg-red-600 selection:text-white flex flex-col pt-[88px]"> 

      {/* --- ÜST BİLGİ & FİLTRE BAR (STICKY) --- */}
      <div className="sticky top-[88px] z-40 bg-black/95 backdrop-blur-xl border-b border-zinc-900 shadow-xl">
        
        <div className="px-4 py-3 md:px-8 border-b border-zinc-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition group bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/>
                <span className="text-[10px] font-black uppercase tracking-widest">ANASAYFAYA DÖN</span>
            </Link>
            
            <button 
                onClick={() => setFiltreMenuAcik(!filtreMenuAcik)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black bg-white border border-white px-4 py-2 rounded-full hover:bg-zinc-200 transition"
            >
                <Filter size={12} /> FİLTRELE
            </button>
        </div>

        <div className="px-4 py-3 md:px-8 overflow-x-auto no-scrollbar flex items-center gap-2">
            {kategoriler.map((kat) => (
                <button
                    key={kat.id}
                    onClick={() => {
                        setAktifKategori(kat.id);
                        if (kat.id === 'HEPSİ') router.push('/tum-urunler'); 
                        else router.push(`/tum-urunler?koleksiyon=steni&kategori=${kat.id.toLowerCase()}`);
                    }}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-all duration-300 ${
                        aktifKategori === kat.id 
                        ? 'bg-red-600 text-white border-red-600' 
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                >
                    {kat.label}
                </button>
            ))}
        </div>

        {filtreMenuAcik && (
            <div className="absolute top-full right-4 md:right-8 mt-2 w-56 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 z-50">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">SIRALAMA</span>
                    <button onClick={() => setFiltreMenuAcik(false)}><X size={16} className="text-zinc-500 hover:text-white"/></button>
                </div>
                <div className="space-y-2">
                    {['ONERILEN', 'ARTAN', 'AZALAN'].map((tip) => (
                        <button 
                            key={tip}
                            onClick={() => { setFiyatSiralamasi(tip); setFiltreMenuAcik(false); }} 
                            className="flex items-center justify-between w-full text-left text-xs py-2 text-zinc-400 hover:text-white font-bold group"
                        >
                            {tip === 'ONERILEN' && 'ÖNERİLEN'}
                            {tip === 'ARTAN' && 'FİYAT: DÜŞÜKTEN YÜKSEĞE'}
                            {tip === 'AZALAN' && 'FİYAT: YÜKSEKTEN DÜŞÜĞE'}
                            {fiyatSiralamasi === tip && <Check size={14} className="text-white" />}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* --- ÜRÜN IZGARASI (Mounte Bianca Tarzı) --- */}
      <main className="flex-grow px-4 md:px-8 py-10">
        {yukleniyor ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (<div key={i} className="aspect-[3/4] bg-zinc-900 animate-pulse rounded-lg"></div>))}
          </div>
        ) : (
          /* GÜNCELLEME: Izgara yapısı (Desktop: 4 sütun) ve aralıklar (gap-y-12) */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
            {goruntulenenUrunler.map((urun) => (
              <div
                key={urun.id}
                className="group relative cursor-pointer flex flex-col"
                onClick={() => router.push(`/urun/${urun.id}`)}
              >
                {/* Resim Alanı */}
                <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative mb-4">
                  <img
                    src={urun.resim}
                    alt={urun.isim}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    onError={(e) => { e.target.src = 'https://placehold.co/600x800/111/fff?text=No+Image' }}
                  />
                  {/* Hızlı Ekle Butonu */}
                  <div className="absolute bottom-4 right-4 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <button className="bg-white text-black p-2.5 rounded-full hover:bg-zinc-200 transition shadow-lg">
                        <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Bilgi Alanı (Mounte Bianca Tarzı: Sade, Sola Hizalı) */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest line-clamp-1 group-hover:underline underline-offset-4 decoration-zinc-600 transition-all">
                    {urun.isim}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-medium text-zinc-400">
                      ₺{urun.fiyat}
                    </span>
                    {/* İndirimli fiyat simülasyonu (varsa) için alan */}
                  </div>
                </div>
              </div>
            ))}

            {goruntulenenUrunler.length === 0 && (
              <div className="col-span-full h-96 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                <Search size={48} className="mb-4 opacity-20" />
                <span className="text-2xl font-black uppercase tracking-tighter mb-2 text-zinc-700">Sonuç Yok</span>
                <p className="text-xs tracking-widest uppercase">Aradığınız kriterde ürün bulunamadı.</p>
                <button onClick={() => {setAktifKategori('HEPSİ'); router.push('/tum-urunler')}} className="mt-6 text-white text-xs font-bold underline">Tümünü Göster</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-zinc-950 text-white py-20 px-8 border-t border-zinc-900 mt-auto">
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

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}