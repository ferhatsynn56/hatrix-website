"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, PenTool, Truck, ShieldCheck, ArrowRight, LogIn, UserPlus, LogOut, X, Trash2, Menu, User, Beaker, Shirt, Zap, Droplets, Thermometer, FlaskConical, ChevronLeft, ChevronRight, Instagram, Play } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously, signInWithCustomToken } from "firebase/auth";

// --- FIREBASE SETUP ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let db = null;
let auth = null;

if (firebaseConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase başlatma hatası:", error);
  }
} else {
  console.warn("Firebase config bulunamadı. Veritabanı işlemleri devre dışı.");
}

export default function AnaSayfa() {
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // --- STATE'LER ---
  const [kullanici, setKullanici] = useState(null);
  const [sepet, setSepet] = useState([]);
  const [sepetAcik, setSepetAcik] = useState(false);
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const [bilimselAcik, setBilimselAcik] = useState(false);
  
  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      // 📸 GÖRSEL DEĞİŞTİRME REHBERİ:
      // Kendi görselinizi kullanmak için:
      // 1. Resmi projenizin içindeki 'public' klasörüne koyun. (Örn: slide1.jpg)
      // 2. Aşağıdaki satırı şu şekilde değiştirin: image: "/slide1.jpg"
      image: "urungorsel/IMG_7626.png", 
      title: "HATRİX",
      subtitle: "MİNİ T-SHİRTLER",
      desc: "Arabanız için en özel aksesuar.",
      button: "KOLEKSİYONU KEŞFET"
    },
    {
      id: 2,
      // 📸 ÖRNEK: image: "/mini-series-banner.jpg" (public klasöründe olmalı)
      image: "https://images.unsplash.com/photo-1512418490979-92798cec1380?q=80&w=2000&auto=format&fit=crop", 
      title: "HATRİX",
      subtitle: "TARAFTARLARA ÖZEL",
      desc: "İstediğin takımı seç.",
      button: "KOLEKSİYONU KEŞFET"
    },
    {
      id: 3,
      // 📸 ÖRNEK: image: "/street-style.jpg"
      image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000&auto=format&fit=crop", 
      title: "STREET CULTURE",
      subtitle: "URBAN STYLE",
      desc: "Sokak modasının kurallarını yeniden yazıyoruz.",
      button: "KOLEKSİYONU KEŞFET"
    },
     {
      id: 4,
      // 📸 ÖRNEK: image: "/street-style.jpg"
      image: "urungorsel/Ekran görüntüsü 2025-12-23 170041.png", 
      title: "TARZINI YANSIT",
      subtitle: "HATRİX By You",
      desc: "Kendini ifade et.",
      button: "Kişiselleştirmeye Başla"
    }
  ];

  // 1. Firebase Auth ve Kullanıcı Takibi
  useEffect(() => {
    const initAuth = async () => {
      if (!auth) return;
      
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setKullanici(user);
        } else {
          setKullanici(null);
          setSepet([]); 
          localStorage.removeItem('sepet');
        }
      });
      return unsubscribe;
    };

    const unsubPromise = initAuth();
    return () => { unsubPromise && unsubPromise.then(unsub => unsub && unsub()); };
  }, []);

  // 2. Sepeti LocalStorage'dan Yükle
  useEffect(() => {
    const kayıtlıSepet = localStorage.getItem('sepet');
    if (kayıtlıSepet) {
      setSepet(JSON.parse(kayıtlıSepet));
    }
  }, []);

  // 3. Sepet Değişince LocalStorage'a Kaydet
  useEffect(() => {
    localStorage.setItem('sepet', JSON.stringify(sepet));
  }, [sepet]);

  // 4. Verileri Firebase'den Çek
  useEffect(() => {
    const urunleriGetir = async () => {
      if (!db || !kullanici) {
        if(!db) setYukleniyor(false); 
        return;
      }

      try {
        const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'urunler'));
        const veriler = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUrunler(veriler);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
        setUrunler([]); 
      } finally {
        setYukleniyor(false);
      }
    };

    urunleriGetir();
  }, [kullanici]); 

  // Slider Otomatik Geçiş
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000); 
    return () => clearInterval(timer);
  }, [slides.length]);

  // --- İŞLEVLER ---

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const cikisYap = async () => {
    if(confirm("Çıkış yapmak istediğinize emin misiniz?")) {
        if(auth) await signOut(auth);
        setMobilMenuAcik(false); 
    }
  };

  const sepeteEkle = (urun) => {
    setSepet([...sepet, urun]);
    setSepetAcik(true); 
  };

  const sepettenCikar = (index) => {
    const yeniSepet = [...sepet];
    yeniSepet.splice(index, 1);
    setSepet(yeniSepet);
  };

  const sepetToplami = sepet.reduce((total, item) => total + Number(item.fiyat), 0);

  return (
    <div className="min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* --- BİLİMSEL FULL SCREEN PANEL --- */}
      {bilimselAcik && (
        <div className="fixed inset-0 z-[100] bg-[#f5f5f7] text-gray-900 overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
            <div className="sticky top-0 bg-[#f5f5f7]/80 backdrop-blur-md z-50 px-6 py-4 flex justify-between items-center max-w-[1400px] mx-auto w-full border-b border-gray-200/50">
                <div className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer" onClick={() => setBilimselAcik(false)}>
                    <X size={24} />
                    <span className="font-medium text-sm">Kapat</span>
                </div>
                <div className="flex items-center gap-2">
                    <Beaker size={20} className="text-black"/>
                    <span className="font-bold tracking-tight">Sentist Lab</span>
                </div>
            </div>
            <div className="max-w-[1400px] mx-auto px-4 pb-20 pt-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter text-black">
                        Moleküler <span className="text-gray-400">Tasarım.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto">
                        Kumaşın DNA'sını yeniden kodladık. Her detayda bilim, her dokunuşta teknoloji.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* BİLİMSEL KART 1 */}
                    <div className="group relative overflow-hidden rounded-[2.5rem] bg-white h-[600px] flex flex-col justify-between p-10 transition-all hover:scale-[1.01] hover:shadow-2xl shadow-sm border border-gray-100">
                        <div className="z-10 relative">
                            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">Oto Aksesuar</span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight">Mini T-Shirt.<br/>Arabanızın İmzası.</h3>
                            <p className="text-lg text-gray-500 font-medium mt-2 max-w-xs">Güneşe meydan okuyan UV dirençli kumaş ve vantuzlu askı sistemi.</p>
                        </div>
                        <div className="absolute inset-0 top-32 flex items-end justify-center">
                             {/* 📸 BİLİMSEL GÖRSEL 1: public/bilimsel-1.jpg */}
                             <img src="https://placehold.co/600x600?text=Mini+Tshirt" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Mini Tshirt"/>
                             <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-20"></div>
                        </div>
                        <div className="z-10 relative flex gap-6 mt-auto pt-6 border-t border-gray-100/50 backdrop-blur-sm bg-white/30 rounded-2xl p-4">
                            <div className="flex items-center gap-2">
                                <Zap size={20} className="text-yellow-500"/>
                                <span className="font-bold text-gray-900 text-sm">UV Koruma</span>
                            </div>
                            <div className="w-px bg-gray-300 h-6"></div>
                            <div className="flex items-center gap-2">
                                <Truck size={20} className="text-blue-500"/>
                                <span className="font-bold text-gray-900 text-sm">Vantuzlu</span>
                            </div>
                        </div>
                    </div>

                    {/* BİLİMSEL KART 2 */}
                    <div className="group relative overflow-hidden rounded-[2.5rem] bg-black h-[600px] flex flex-col justify-between p-10 transition-all hover:scale-[1.01] hover:shadow-2xl shadow-sm">
                        <div className="z-10 relative">
                            <span className="text-xs font-bold text-purple-300 tracking-wider uppercase bg-white/10 px-3 py-1 rounded-full mb-3 inline-block">Giyilebilir Teknoloji</span>
                            <h3 className="text-4xl font-bold text-white tracking-tight leading-tight">Premium Cotton.<br/>Hissedilen Kalite.</h3>
                            <p className="text-lg text-gray-400 font-medium mt-2 max-w-xs">220 GSM ağır gramaj. Nefes alan organik yapı ile terlemeye son.</p>
                        </div>
                        <div className="absolute inset-0">
                             {/* 📸 BİLİMSEL GÖRSEL 2: public/bilimsel-2.jpg */}
                             <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-700" alt="Premium Tshirt"/>
                             <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>
                        </div>
                        <div className="z-10 relative flex gap-6 text-sm font-bold text-gray-300 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                            <div className="flex items-center gap-2">
                                <Droplets size={18} className="text-blue-400"/>
                                <span>Nem Transferi</span>
                            </div>
                            <div className="w-px bg-white/20 h-6"></div>
                            <div className="flex items-center gap-2">
                                <Shirt size={18} className="text-purple-400"/>
                                <span>%100 Organik</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-gradient-to-b from-black/90 to-black/0 z-50 transition-all duration-300">
        <div className="container mx-auto px-6 h-24 flex justify-between items-center">
          <a href="/" className="text-4xl font-black tracking-widest cursor-pointer flex items-center gap-2 font-mono text-white mix-blend-difference z-50">
            STENIST<span className="text-blue-600">.</span>
          </a>
          
          <div className="hidden md:flex items-center gap-10 font-bold text-sm text-white tracking-widest uppercase mix-blend-difference z-50">
            <a href="#" className="hover:text-blue-500 transition duration-300 relative group">
                KOLEKSİYON
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </a>
            <a href="#" className="hover:text-blue-500 transition duration-300 relative group">
                HAKKIMIZDA
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </a>
            <button onClick={() => setBilimselAcik(true)} className="flex items-center gap-1 hover:text-blue-500 transition relative group">
                BİLİMSEL
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </button>
          </div>

          <div className="flex items-center gap-6 mix-blend-difference z-50">
             {kullanici ? (
                <div className="hidden md:flex items-center gap-4">
                    <button onClick={cikisYap} className="text-white hover:text-red-500 transition">
                        <LogOut size={22} />
                    </button>
                </div>
             ) : (
                <div className="hidden md:flex items-center gap-4">
                    <a href="/giris" className="text-white hover:text-gray-300 transition text-sm font-bold uppercase">Giriş</a>
                </div>
             )}

            <button onClick={() => setSepetAcik(true)} className="relative hover:scale-110 transition">
                <ShoppingBag size={26} className="text-white" />
                {sepet.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                        {sepet.length}
                    </span>
                )}
            </button>

            <button onClick={() => setMobilMenuAcik(!mobilMenuAcik)} className="md:hidden">
                {mobilMenuAcik ? <X size={30}/> : <Menu size={30}/>}
            </button>
          </div>
        </div>
      </nav>

      {/* --- SEPET SIDEBAR (Aynı) --- */}
      {sepetAcik && (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setSepetAcik(false)}></div>
            <div className="fixed inset-y-0 right-0 max-w-md w-full flex bg-zinc-900 shadow-2xl border-l border-white/10">
                <div className="flex flex-col w-full h-full p-6">
                    <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                        <h2 className="text-2xl font-black uppercase">Sepetim ({sepet.length})</h2>
                        <button onClick={() => setSepetAcik(false)}><X size={24} className="text-gray-400 hover:text-white"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                        {sepet.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                <ShoppingBag size={64} className="mb-4"/>
                                <p className="text-lg font-bold">Sepetiniz Boş</p>
                            </div>
                        ) : (
                            sepet.map((urun, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="w-24 h-32 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={urun.resim} alt={urun.isim} className="w-full h-full object-cover"/>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{urun.isim}</h3>
                                            <p className="text-blue-500 font-bold mt-1">₺{urun.fiyat}</p>
                                        </div>
                                        <button onClick={() => sepettenCikar(index)} className="self-start text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 uppercase tracking-wider">
                                            <Trash2 size={12}/> Ürünü Sil
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {sepet.length > 0 && (
                        <div className="border-t border-white/10 pt-6 mt-4">
                            <div className="flex justify-between text-xl font-black mb-6">
                                <span>TOPLAM</span>
                                <span>₺{sepetToplami}</span>
                            </div>
                            <a href="/odeme" className="block w-full bg-white text-black py-4 text-center font-black text-lg uppercase tracking-widest hover:bg-gray-200 transition">
                                Ödemeye Geç
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- HERO SECTION (FULL SCREEN + VIDEO ETKİSİ) --- */}
      <header className="relative h-screen w-full overflow-hidden">
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <div className="absolute inset-0">
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 opacity-80"></div>
            </div>

            <div className="absolute inset-0 flex flex-col justify-end pb-32 px-6 md:px-20 container mx-auto">
                <h2 className="text-blue-500 font-bold tracking-[0.8em] text-sm md:text-xl mb-4 uppercase animate-in slide-in-from-left-10 fade-in duration-1000">
                    {slide.subtitle}
                </h2>
                <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter text-white leading-[0.8] mb-8 animate-in slide-in-from-bottom-10 fade-in duration-1000 mix-blend-overlay">
                    {slide.title}
                </h1>
                <p className="text-white text-lg md:text-2xl max-w-xl font-light mb-10 border-l-4 border-blue-600 pl-6 animate-in fade-in duration-1000 delay-300">
                    {slide.desc}
                </p>
                <div className="flex gap-6 animate-in fade-in duration-1000 delay-500">
                    <a href="/tasarim">
                        <button className="bg-white text-black px-12 py-5 font-black text-lg hover:bg-gray-200 transition uppercase tracking-widest flex items-center gap-3">
                            {slide.button} <ArrowRight size={20}/>
                        </button>
                    </a>
                    <button className="border border-white/30 text-white px-12 py-5 font-bold text-lg hover:bg-white/10 transition uppercase tracking-widest backdrop-blur-sm">
                        Filmi İzle
                    </button>
                </div>
            </div>
          </div>
        ))}
        
        {/* Slider Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/10 z-20">
            <div 
                key={currentSlide}
                className="h-full bg-blue-600 animate-[width_5s_linear]" 
                style={{ width: '100%' }}
            ></div>
        </div>
      </header>

      {/* --- MARQUEE (KAYAN ŞERİT) --- */}
      <div className="bg-blue-600 overflow-hidden py-4 whitespace-nowrap relative z-20">
        <div className="inline-block animate-marquee text-black font-black text-2xl uppercase tracking-widest">
            Stenist • Automotive Fashion • Limited Edition • Custom Design • Stenist • Automotive Fashion • Limited Edition • Custom Design • Stenist • Automotive Fashion • Limited Edition • Custom Design •
        </div>
      </div>

      {/* --- MOZAİK VİTRİN (MASONRY GRID) --- */}
      <section className="py-24 bg-black px-4 md:px-10">
        <div className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-6">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">Koleksiyonlar</h2>
            <a href="#" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white transition font-bold uppercase tracking-wider text-sm">
                Tümünü Gör <ArrowRight size={16}/>
            </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[800px]">
            {/* Büyük Görsel (Sol) */}
            <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden cursor-pointer h-[500px] md:h-full">
                {/* 📸 GÖRSEL DEĞİŞTİRME: src="/sol-buyuk-banner.jpg" */}
                <img src="https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-10">
                    <span className="text-blue-500 font-bold tracking-widest text-sm mb-2">YENİ SEZON</span>
                    <h3 className="text-5xl font-black uppercase leading-none mb-4">Street<br/>Culture</h3>
                    <button className="text-white border-b border-white self-start pb-1 uppercase font-bold text-sm group-hover:text-blue-400 group-hover:border-blue-400 transition">İncele</button>
                </div>
            </div>

            {/* Sağ Üst */}
            <div className="md:col-span-2 relative group overflow-hidden cursor-pointer h-[300px] md:h-full">
                {/* 📸 GÖRSEL DEĞİŞTİRME: src="/sag-ust-banner.jpg" */}
                <img src="https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover transition duration-700 group-hover:scale-110 group-hover:opacity-80" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex flex-col justify-center items-center text-center p-6">
                    <h3 className="text-4xl font-black uppercase mb-2">Mini Series</h3>
                    <p className="text-zinc-300 max-w-xs text-sm">Arabanız için özel tasarım minyatür giyim aksesuarları.</p>
                </div>
            </div>

            {/* Sağ Alt Sol */}
            <div className="relative group overflow-hidden cursor-pointer h-[300px] md:h-full bg-zinc-900">
                {/* 📸 GÖRSEL DEĞİŞTİRME: src="/kategori-1.jpg" */}
                <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                <div className="absolute bottom-6 left-6">
                    <h3 className="text-2xl font-black uppercase">Hoodies</h3>
                </div>
            </div>

            {/* Sağ Alt Sağ */}
            <div className="relative group overflow-hidden cursor-pointer h-[300px] md:h-full bg-zinc-800">
                {/* 📸 GÖRSEL DEĞİŞTİRME: src="/kategori-2.jpg" */}
                <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                <div className="absolute bottom-6 left-6">
                    <h3 className="text-2xl font-black uppercase">T-Shirts</h3>
                </div>
            </div>
        </div>
      </section>

      {/* --- TRENDING PRODUCTS (YATAY KAYDIRMALI) --- */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900">
        <div className="container mx-auto px-6">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Vitrindekiler</h2>
                    <p className="text-zinc-500 mt-2 font-medium">Bu haftanın en çok ilgi gören tasarımları.</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-4 rounded-full border border-zinc-800 hover:bg-white hover:text-black transition"><ChevronLeft size={20}/></button>
                    <button className="p-4 rounded-full border border-zinc-800 hover:bg-white hover:text-black transition"><ChevronRight size={20}/></button>
                </div>
            </div>

            {yukleniyor ? (
                <div className="text-center py-20 text-zinc-600 animate-pulse font-mono">VERİLER YÜKLENİYOR...</div>
            ) : urunler.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                    <p>Vitrin şu an boş.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {urunler.map((urun) => (
                        <div key={urun.id} className="group relative">
                            <div className="bg-white h-[450px] overflow-hidden relative">
                                <img 
                                    src={urun.resim} 
                                    alt={urun.isim}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                    onError={(e) => {e.target.src='https://placehold.co/600x800/eee/333?text=Resim+Yok'}}
                                />
                                {/* Sepete Ekle Butonu - Hoverda Çıkar */}
                                <button 
                                    onClick={() => sepeteEkle(urun)}
                                    className="absolute bottom-0 left-0 w-full bg-blue-600 text-white py-4 font-bold uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition duration-300 hover:bg-blue-700"
                                >
                                    Sepete Ekle
                                </button>
                                {/* Fiyat Etiketi */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-black font-black text-sm">
                                    ₺{urun.fiyat}
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-bold text-white uppercase leading-tight group-hover:text-blue-500 transition cursor-pointer">{urun.isim}</h3>
                                <p className="text-sm text-zinc-500 mt-1">Limited Edition</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </section>

      {/* --- LOOKBOOK / LIFESTYLE --- */}
      {/* 📸 GÖRSEL DEĞİŞTİRME: background-image: url('/lookbook-bg.jpg') */}
      <section className="relative py-32 bg-fixed bg-center bg-cover" style={{backgroundImage: "url('https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop')"}}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
            <span className="text-blue-500 font-bold tracking-[0.5em] text-sm uppercase mb-6 block">Stenist Lifestyle</span>
            <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-8 leading-none">
                Hayatın<br/>Hızına Yetiş
            </h2>
            <p className="text-zinc-300 text-xl max-w-2xl mx-auto mb-12 font-light">
                Moda sadece giydiğin değil, yaşadığın şeydir. Stenist ile her anını bir podyuma çevir.
            </p>
            <button className="bg-white text-black px-10 py-4 font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition transform hover:-translate-y-1">
                Hikayeyi Keşfet
            </button>
        </div>
      </section>

      {/* --- NEWSLETTER --- */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
                <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Aramıza Katıl</h2>
                <p className="text-blue-100 font-medium">Yeni koleksiyonlardan ve özel indirimlerden ilk sen haberdar ol.</p>
            </div>
            <div className="flex-1 w-full flex gap-4">
                <input type="email" placeholder="E-posta adresin" className="w-full bg-blue-700 border-none px-6 py-4 text-white placeholder-blue-300 focus:ring-2 focus:ring-white outline-none font-bold" />
                <button className="bg-black text-white px-8 py-4 font-black uppercase tracking-wider hover:bg-zinc-900 transition">
                    Abone Ol
                </button>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black pt-20 pb-10 border-t border-zinc-900 text-zinc-500 text-sm">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between gap-12 mb-20">
                <div className="max-w-sm">
                    <a href="/" className="text-3xl font-black tracking-widest text-white font-mono block mb-6">STENIST.</a>
                    <p className="leading-relaxed mb-6">
                        Otomobil kültürü ve sokak modasının kesişim noktası. Her parça, hız tutkusu ve tasarım estetiği ile İstanbul'da üretilmiştir.
                    </p>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition cursor-pointer"><Instagram size={18}/></div>
                        <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition cursor-pointer"><Play size={18} fill="currentColor"/></div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6">Mağaza</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-blue-500 transition">Yeni Gelenler</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">Koleksiyonlar</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">Aksesuarlar</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">Outlet</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6">Destek</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-blue-500 transition">Sipariş Takibi</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">İade & Değişim</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">Beden Tablosu</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">S.S.S.</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider mb-6">Kurumsal</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-blue-500 transition">Hikayemiz</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">Sürdürülebilirlik</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">Kariyer</a></li>
                            <li><a href="#" className="hover:text-blue-500 transition">İletişim</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-bold tracking-wide">
                <p>&copy; 2025 STENIST AUTOMOTIVE FASHION.</p>
                <div className="flex gap-8 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition">Gizlilik Politikası</a>
                    <a href="#" className="hover:text-white transition">Kullanım Şartları</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}