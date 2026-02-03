"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Filter, Check, X, Search, Plus } from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
  apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
  authDomain: "hatrix-db.firebaseapp.com",
  projectId: "hatrix-db",
  storageBucket: "hatrix-db.firebasestorage.app",
  messagingSenderId: "903710965804",
  appId: "1:903710965804:web:5dc754a337a1d9d7951189",
  measurementId: "G-C03LWY68K7",
};

function getFirebaseServicesSafe() {
  try {
    if (typeof window === "undefined") return { app: null, db: null, auth: null };
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    return { app, db, auth };
  } catch (e) {
    console.error("Firebase init hatası:", e);
    return { app: null, db: null, auth: null };
  }
}

// Basit kategori tahmin fonksiyonu
function inferKategori(urun) {
  const kat = String(urun?.kategori || "").toLowerCase().trim();
  if (kat) return kat;
  const name = String(urun?.isim || "").toLowerCase();
  if (name.includes("hoodie")) return "hoodie";
  if (name.includes("sweat")) return "sweatshirt";
  if (name.includes("t-shirt") || name.includes("tshirt")) return "tshirt";
  return "diger";
}

export default function TumUrunlerSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">YÜKLENİYOR...</div>}>
      <UrunlerIcerik />
    </Suspense>
  );
}

function UrunlerIcerik() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tumUrunler, setTumUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  const [aktifKategori, setAktifKategori] = useState("HEPSİ");
  const [fiyatSiralamasi, setFiyatSiralamasi] = useState("ONERILEN");
  const [filtreMenuAcik, setFiltreMenuAcik] = useState(false);

  const kategoriler = useMemo(() => ([
    { id: "HEPSİ", label: "TÜMÜ" },
    { id: "TSHIRT", label: "T-SHIRT" },
    { id: "SWEATSHIRT", label: "SWEATSHIRT" },
    { id: "HOODIE", label: "HOODIE" },
    { id: "IKONIK", label: "İKONİK" },
    { id: "AKSESUAR", label: "AKSESUAR" },
  ]), []);

  useEffect(() => {
    const urlKategori = searchParams.get("kategori");
    const urlAra = searchParams.get("ara");
    if (urlAra && urlAra.trim()) setAktifKategori("ARAMA");
    else if (urlKategori) setAktifKategori(urlKategori.toUpperCase());
    else setAktifKategori("HEPSİ");
  }, [searchParams]);

  // --- FIREBASE VERİ ÇEKME ---
  useEffect(() => {
    const { db, auth } = getFirebaseServicesSafe();
    let unsubscribe = null;

    async function veriCek() {
      if (!db || !auth) return;
      try {
        await signInAnonymously(auth);
        const q = query(collection(db, "urunler"));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const veriler = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTumUrunler(veriler);
          setYukleniyor(false);
        });
      } catch (error) {
        console.error("Hata:", error);
      }
    }
    veriCek();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // --- FİLTRELEME ---
  const goruntulenenUrunler = useMemo(() => {
    let sonuc = [...tumUrunler];
    const aramaKelimesi = searchParams.get("ara")?.toLowerCase()?.trim();

    if (aramaKelimesi) {
      sonuc = sonuc.filter((urun) => {
        const isim = (urun.isim || "").toLowerCase();
        return isim.includes(aramaKelimesi);
      });
    } else if (aktifKategori !== "HEPSİ") {
      sonuc = sonuc.filter((urun) => {
        const isim = (urun.isim || "").toLowerCase();
        const kat = inferKategori(urun);
        if (aktifKategori === "TSHIRT") return kat === "tshirt" || isim.includes("t-shirt");
        if (aktifKategori === "SWEATSHIRT") return kat === "sweatshirt" || isim.includes("sweat");
        if (aktifKategori === "HOODIE") return kat === "hoodie" || isim.includes("hoodie");
        if (aktifKategori === "IKONIK") return kat === "ikonik";
        if (aktifKategori === "AKSESUAR") return kat === "aksesuar";
        return true;
      });
    }

    if (fiyatSiralamasi === "ARTAN") sonuc.sort((a, b) => Number(a.fiyat) - Number(b.fiyat));
    if (fiyatSiralamasi === "AZALAN") sonuc.sort((a, b) => Number(b.fiyat) - Number(a.fiyat));

    return sonuc;
  }, [tumUrunler, aktifKategori, fiyatSiralamasi, searchParams]);

  return (
    <div className="min-h-screen bg-black font-sans text-white flex flex-col">
      {/* ÜST BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-zinc-900 shadow-2xl">
        <div className="px-4 py-3 md:px-8 border-b border-zinc-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
            <ArrowLeft size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">ANASAYFAYA DÖN</span>
          </Link>
          <button onClick={() => setFiltreMenuAcik(!filtreMenuAcik)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700">
            <Filter size={12} /> {filtreMenuAcik ? "KAPAT" : "SIRALA"}
          </button>
        </div>
        <div className="px-4 py-3 md:px-8 overflow-x-auto no-scrollbar flex items-center gap-2">
          {kategoriler.map((kat) => (
            <button key={kat.id} onClick={() => { setAktifKategori(kat.id); setFiltreMenuAcik(false); 
              if (kat.id === "HEPSİ") router.push("/tum-urunler");
              else router.push(`/tum-urunler?kategori=${kat.id.toLowerCase()}`);
            }} className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-black tracking-widest border ${aktifKategori === kat.id ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-400 border-zinc-800"}`}>
              {kat.label}
            </button>
          ))}
        </div>
        
        {filtreMenuAcik && (
          <div className="absolute top-full right-2 sm:right-4 mt-2 w-64 sm:w-72 bg-[#111] border border-zinc-800 p-4 sm:p-5 rounded-2xl z-50">
             {["ONERILEN", "ARTAN", "AZALAN"].map((tip) => (
                <button key={tip} onClick={() => { setFiyatSiralamasi(tip); setFiltreMenuAcik(false); }} className="block w-full text-left text-[11px] py-3 text-zinc-400 hover:text-white font-bold">
                  {tip === "ONERILEN" ? "ÖNERİLEN SIRALAMA" : tip === "ARTAN" ? "FİYAT: DÜŞÜKTEN YÜKSEĞE" : "FİYAT: YÜKSEKTEN DÜŞÜĞE"}
                </button>
             ))}
          </div>
        )}
      </div>

      <div className="pt-[40px] sm:pt-[60px] md:pt-[165px] lg:pt-[175px]" />

      <main className="flex-grow px-3 sm:px-4 md:px-6 lg:px-8 pb-16 sm:pb-20">
        {yukleniyor ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-zinc-900/50 animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 gap-y-8 sm:gap-y-12">
            {goruntulenenUrunler.map((urun) => (
              <div key={urun.id} className="group cursor-pointer flex flex-col" onClick={() => router.push(`/urun/${urun.id}`)}>
                <div className="aspect-[3/4] bg-zinc-900 overflow-hidden relative mb-3 sm:mb-4 rounded-lg border border-transparent hover:border-zinc-800 transition-colors">
                  {/* --- İŞTE DÜZELTİLEN KISIM BURASI --- */}
                  <img
                    src={urun.resim} 
                    alt={urun.isim || "Ürün"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/600x800/111/fff?text=RESİM+YOK"; }}
                  />
                  {/* ---------------------------------- */}
                  
                  <div className="absolute bottom-3 right-3 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <button className="bg-white text-black p-3 rounded-full hover:bg-zinc-200 transition shadow-xl">
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 px-1">
                  <h3 className="text-[11px] md:text-xs font-bold uppercase tracking-widest line-clamp-2 text-white">{urun.isim}</h3>
                  <span className="text-xs md:text-sm font-bold bg-zinc-900 px-2 py-1 rounded w-fit text-white">₺{urun.fiyat}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}