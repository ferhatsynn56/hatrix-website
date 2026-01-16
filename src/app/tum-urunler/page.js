"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { ShoppingBag, ArrowLeft, Search, SlidersHorizontal, ChevronDown, Menu, User, LogOut, Beaker, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from "firebase/auth";

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

export default function TumUrunlerSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">YÜKLENİYOR...</div>}>
      <UrunlerIcerik />
    </Suspense>
  );
}

function UrunlerIcerik() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tumUrunler, setTumUrunler] = useState([]);
  const [goruntulenenUrunler, setGoruntulenenUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // --- NAVBAR & UI STATE'LERİ ---
  const [kullanici, setKullanici] = useState(null);
  const [tasarimMenuAcik, setTasarimMenuAcik] = useState(false);
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const [bilimselAcik, setBilimselAcik] = useState(false);
  const iletisimMaili = "mailto:info@stenist.com";

  // --- FİLTRE STATE'LERİ ---
  const [aktifKategori, setAktifKategori] = useState("HEPSİ");
  const [fiyatSiralamasi, setFiyatSiralamasi] = useState("ONERILEN");
  const [filtreMenuAcik, setFiltreMenuAcik] = useState(false);

  // KATEGORİ LİSTESİ
  const kategoriler = [
    { id: 'HEPSİ', label: 'TÜM ÜRÜNLER' },
    { id: 'TSHIRT', label: 'T-SHIRT' },
    { id: 'SWEATSHIRT', label: 'SWEATSHIRT' },
    { id: 'HOODIE', label: 'HOODIE' },
    { id: 'PANTS', label: 'PANTOLON' },
    { id: 'AKSESUAR', label: 'AKSESUAR' }
  ];

  // 1. Firebase Auth & Kullanıcı Durumu
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      // Anonim giriş yap (eğer giriş yoksa)
      await signInAnonymously(auth).catch(err => console.error(err));

      // Kullanıcı durumunu dinle
      onAuthStateChanged(auth, (user) => {
        if (user && !user.isAnonymous) setKullanici(user);
        else setKullanici(null);
      });
    };
    initAuth();
  }, []);

  const cikisYap = async () => { if (auth) await signOut(auth); };

  // 2. URL'DEN KATEGORİ OKUMA
  useEffect(() => {
    const urlKategori = searchParams.get('kategori');
    if (urlKategori) {
      setAktifKategori(urlKategori.toUpperCase());
    } else {
      setAktifKategori("HEPSİ");
    }
  }, [searchParams]);

  // 3. VERİ ÇEKME
  useEffect(() => {
    if (!db) {
      console.warn("Veritabanı bağlantısı yok. Config ayarlarını kontrol et.");
      setYukleniyor(false);
      return;
    }

    try {
      const collRef = collection(db, 'urunler');
      const unsubscribe = onSnapshot(collRef, (querySnapshot) => {
        const veriler = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        veriler.sort((a, b) => (b.eklenmeTarihi?.seconds || 0) - (a.eklenmeTarihi?.seconds || 0));
        setTumUrunler(veriler);
        setYukleniyor(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Hata:", err);
      setYukleniyor(false);
    }
  }, []);

  // 4. FİLTRELEME MANTIĞI
  useEffect(() => {
    let sonuc = [...tumUrunler];

    if (aktifKategori !== "HEPSİ") {
      sonuc = sonuc.filter(urun => {
        const isim = (urun.isim || "").toLowerCase();
        const kat = (urun.kategori || "").toLowerCase();

        if (aktifKategori === 'TSHIRT') return isim.includes('t-shirt') || isim.includes('tshirt') || isim.includes('tişört') || kat === 'tshirt';
        if (aktifKategori === 'SWEATSHIRT') return (isim.includes('sweat') && !isim.includes('hoodie')) || kat === 'sweatshirt';
        if (aktifKategori === 'HOODIE') return isim.includes('hoodie') || kat === 'hoodie';
        if (aktifKategori === 'PANTS') return isim.includes('pant') || isim.includes('cargo') || kat === 'pants' || kat === 'pantolon';
        if (aktifKategori === 'AKSESUAR') return isim.includes('mini') || isim.includes('hatrix') || isim.includes('süs') || kat === 'aksesuar';
        return true;
      });
    }

    if (fiyatSiralamasi === "ARTAN") {
      sonuc.sort((a, b) => Number(a.fiyat) - Number(b.fiyat));
    } else if (fiyatSiralamasi === "AZALAN") {
      sonuc.sort((a, b) => Number(b.fiyat) - Number(a.fiyat));
    }

    setGoruntulenenUrunler(sonuc);
  }, [aktifKategori, fiyatSiralamasi, tumUrunler]);

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-zinc-700 selection:text-white flex flex-col">

      {/* --- ANA NAVBAR (GÜNCELLENDİ) --- */}
      <nav className="fixed top-0 left-0 w-full h-20 flex items-center justify-between px-6 bg-black border-b border-zinc-900 shadow-2xl z-[60]">

        {/* SOL: LOGO / GERİ */}
        <div className="flex items-center">
          <a href="/" className="text-2xl font-black uppercase tracking-tighter text-white hover:text-zinc-300 transition">
            STENIST
          </a>
        </div>

        {/* ORTA: MENÜ (MOBİLDE GİZLİ) */}
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
              <div className="absolute top-12 left-0 pt-2 w-48 animate-in fade-in slide-in-from-top-1 z-50">
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

        {/* SAĞ: İKONLAR */}
        <div className="flex items-center gap-5">
          <button className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full hidden md:block"><Search size={20} strokeWidth={2} /></button>
          {kullanici ? (
            <button onClick={cikisYap} className="text-white hover:text-red-500 transition hover:bg-zinc-800 p-2 rounded-full"><LogOut size={20} strokeWidth={2} /></button>
          ) : (
            <a href="/giris" className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full"><User size={20} strokeWidth={2} /></a>
          )}
          <div className="text-white hover:text-zinc-300 transition hover:bg-zinc-800 p-2 rounded-full cursor-pointer">
            <ShoppingBag size={20} strokeWidth={2} />
          </div>
          <button onClick={() => setMobilMenuAcik(!mobilMenuAcik)} className="md:hidden text-white ml-2"><Menu size={24} /></button>
        </div>
      </nav>

      {/* --- STICKY FILTER BAR --- */}
      {/* Top değeri navbar yüksekliği (h-20 = 80px) kadar ayarlandı */}
      <div className="fixed top-20 left-0 w-full z-[50] bg-black/80 backdrop-blur-md border-b border-zinc-900">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-8 pr-8">
            {kategoriler.map((kat) => (
              <button
                key={kat.id}
                onClick={() => setAktifKategori(kat.id)}
                className={`whitespace-nowrap text-xs font-bold tracking-widest transition-colors duration-300 ${aktifKategori === kat.id ? 'text-white border-b border-white pb-0.5' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {kat.label}
              </button>
            ))}
          </div>
          <div className="relative border-l border-zinc-800 pl-6 bg-transparent">
            <button
              onClick={() => setFiltreMenuAcik(!filtreMenuAcik)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition"
            >
              FİLTRELE <SlidersHorizontal size={14} />
            </button>
            {filtreMenuAcik && (
              <div className="absolute top-full right-0 mt-4 w-48 bg-black border border-zinc-800 p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] text-zinc-500 mb-2 font-bold uppercase">Sıralama</p>
                <button onClick={() => setFiyatSiralamasi('ONERILEN')} className={`block w-full text-left text-xs py-2 hover:text-white ${fiyatSiralamasi === 'ONERILEN' ? 'text-white font-bold' : 'text-zinc-400'}`}>Önerilen</button>
                <button onClick={() => setFiyatSiralamasi('ARTAN')} className={`block w-full text-left text-xs py-2 hover:text-white ${fiyatSiralamasi === 'ARTAN' ? 'text-white font-bold' : 'text-zinc-400'}`}>Fiyat: Artan</button>
                <button onClick={() => setFiyatSiralamasi('AZALAN')} className={`block w-full text-left text-xs py-2 hover:text-white ${fiyatSiralamasi === 'AZALAN' ? 'text-white font-bold' : 'text-zinc-400'}`}>Fiyat: Azalan</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ANA İÇERİK --- */}
      <main className="pt-36 pb-20 flex-grow">
        {yukleniyor ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 px-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (<div key={i} className="aspect-[3/4] bg-zinc-900 animate-pulse"></div>))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 px-1">
            {goruntulenenUrunler.map((urun) => (
              <div
                key={urun.id}
                className="group relative cursor-pointer"
                onClick={() => router.push(`/urun/${urun.id}`)}
              >
                <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative">
                  <img
                    src={urun.resim}
                    alt={urun.isim}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    onError={(e) => { e.target.src = 'https://placehold.co/600x800/111/fff?text=No+Image' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </div>
                <div className="flex justify-between items-start mt-2 px-1">
                  <div className="flex flex-col max-w-[75%]">
                    <h3 className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-widest leading-tight group-hover:text-white transition">
                      {urun.isim}
                    </h3>
                    <span className="text-[9px] text-zinc-600 uppercase mt-0.5">
                      {urun.kategori || "Genel"}
                    </span>
                  </div>
                  <span className="text-[10px] md:text-xs font-mono text-white">
                    ₺{urun.fiyat}
                  </span>
                </div>
              </div>
            ))}
            {goruntulenenUrunler.length === 0 && (
              <div className="col-span-full h-96 flex flex-col items-center justify-center text-zinc-500">
                <span className="text-4xl mb-4 opacity-20 font-black">BOŞ</span>
                <p className="text-xs tracking-widest uppercase">Aradığınız kriterde ürün bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- HUGO BOSS STYLE FOOTER --- */}
      <footer className="bg-zinc-950 text-white py-20 px-8 border-t border-zinc-900 mt-auto">
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

      {/* --- BİLİMSEL MODAL (GLOBAL) --- */}
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

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}