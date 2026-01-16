"use client";

import React from 'react';
import { ArrowLeft, Printer, Layers, Scissors, Zap, Microscope, Feather, ShieldCheck, Droplets } from 'lucide-react';
import Link from 'next/link';

export default function BilimselSayfa() {
  
  // Baskı Teknolojileri Verisi
  const teknolojiler = [
    {
      id: "DTF",
      kod: "TECH-01",
      baslik: "DTF (Direct to Film)",
      ozet: "Yeni nesil polimer transfer teknolojisi.",
      aciklama: "Tasarım önce özel bir filme basılır, ardından polimer tozu ile fırınlanıp kumaşa preslenir. Renkler çok canlıdır ve her türlü kumaşa uygulanabilir.",
      ikon: <Layers size={40} className="text-blue-500"/>,
      ozellikler: ["Yüksek Renk Canlılığı", "Her Kumaşa Uygun", "Uzun Ömürlü"],
      gorsel: "https://placehold.co/600x400/111/3b82f6?text=DTF+Film+Detayi" 
    },
    {
      id: "DTG",
      kod: "TECH-02",
      baslik: "DTG (Direct to Garment)",
      ozet: "Kumaşa doğrudan mikro enjeksiyon.",
      aciklama: "Modifiye edilmiş inkjet yazıcılar boyayı doğrudan kumaş liflerinin içine işler. Kumaşta 'sıfır doku' hissi bırakır, ancak sadece %100 pamuklu ürünlerde en iyi sonucu verir.",
      ikon: <Printer size={40} className="text-purple-500"/>,
      ozellikler: ["Sıfır Doku Hissi", "Fotoğraf Kalitesi", "Nefes Alabilir"],
      gorsel: "https://placehold.co/600x400/111/a855f7?text=DTG+Baski+Kafasi"
    },
    {
      id: "EMPRIME",
      kod: "TECH-03",
      baslik: "Serigrafi (Emprime)",
      ozet: "Geleneksel endüstriyel şablon baskı.",
      aciklama: "Her renk için ayrı ipek kalıplar hazırlanır. Boya kalıptan kumaşa geçirilir. Dünyanın en dayanıklı baskı türüdür, genellikle yüksek adetli üretimlerde kullanılır.",
      ikon: <Droplets size={40} className="text-green-500"/>,
      ozellikler: ["Maksimum Dayanıklılık", "Endüstriyel Standart", "Tam Örtücülük"],
      gorsel: "https://placehold.co/600x400/111/22c55e?text=Serigrafi+Kalibi"
    },
    {
      id: "NAKIS",
      kod: "TECH-04",
      baslik: "Nakış (Embroidery)",
      ozet: "İplikle işlenen premium doku.",
      aciklama: "Tasarım dijital ortamda iğne vuruşlarına dönüştürülür ve otomatik kasnak makineleriyle kumaşa işlenir. Yıkanmaya karşı en dirençli ve en prestijli yöntemdir.",
      ikon: <Scissors size={40} className="text-yellow-500"/>,
      ozellikler: ["Premium Görünüm", "Sonsuz Ömür", "3D Doku"],
      gorsel: "https://placehold.co/600x400/111/eab308?text=Nakis+Detayi"
    },
    {
      id: "FLEX",
      kod: "TECH-05",
      baslik: "Flex (Vinyl Transfer)",
      ozet: "Vektörel kesim ve ısı transferi.",
      aciklama: "Düz renkli folyolar plotter ile kesilir ve ayıklandıktan sonra kumaşa preslenir. Genellikle forma numaraları ve basit logolar için kullanılır.",
      ikon: <Zap size={40} className="text-red-500"/>,
      ozellikler: ["Keskin Hatlar", "Neon/Reflektör Seçeneği", "Basit Logolar"],
      gorsel: "https://placehold.co/600x400/111/ef4444?text=Flex+Transfer"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-600 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-black/90 backdrop-blur-md z-50 border-b border-zinc-900 h-20 flex items-center px-6 md:px-12 justify-between">
          <Link href="/" className="text-2xl font-black tracking-widest font-mono flex items-center gap-2 cursor-pointer">
            STENIST<span className="text-blue-600 border border-blue-600 text-[10px] px-1.5 py-0.5 rounded">LAB</span>
          </Link>
          <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-2 transition uppercase tracking-widest">
            <ArrowLeft size={16}/> Geri Dön
          </Link>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-40 pb-16 px-6 container mx-auto text-center">
         <div className="inline-flex items-center gap-2 text-zinc-500 font-mono text-xs font-bold mb-4 border border-zinc-800 px-3 py-1 rounded-full uppercase tracking-wider">
            <Microscope size={14}/> Production Technology
         </div>
         <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
            BİLİM, KUMAŞLA BULUŞUYOR.
         </h1>
         <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
            Sentist ürünlerinin arkasındaki üretim teknolojilerini şeffaflıkla paylaşıyoruz. 
            Hangi yöntemin size uygun olduğunu keşfedin.
         </p>
      </header>

      {/* --- TEKNOLOJİ KARTLARI (GRID) --- */}
      <div className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {teknolojiler.map((tech) => (
                <div key={tech.id} className="group bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 rounded-2xl overflow-hidden transition duration-500 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col md:flex-row">
                    
                    {/* Görsel Alanı */}
                    <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden bg-black">
                        {/* Gerçek resimlerin varsa buradaki src'yi değiştir */}
                        <img 
                            src={tech.gorsel} 
                            alt={tech.baslik} 
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur text-white text-[10px] font-mono px-2 py-1 rounded border border-zinc-700">
                            {tech.kod}
                        </div>
                    </div>

                    {/* İçerik Alanı */}
                    <div className="md:w-3/5 p-8 flex flex-col justify-between">
                        <div>
                            <div className="mb-4 p-3 bg-black/50 w-fit rounded-lg border border-zinc-800 group-hover:border-zinc-600 transition">
                                {tech.ikon}
                            </div>
                            <h3 className="text-2xl font-black mb-2 text-white group-hover:text-blue-500 transition">{tech.baslik}</h3>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">{tech.ozet}</p>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                {tech.aciklama}
                            </p>
                        </div>

                        {/* Özellik Etiketleri */}
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {tech.ozellikler.map((ozellik, i) => (
                                <span key={i} className="text-[10px] font-bold bg-zinc-950 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-800 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span> {ozellik}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>
            ))}

        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="border-t border-zinc-900 bg-black pt-12 pb-8 text-center">
        <p className="text-zinc-600 text-xs font-mono">
             SENTIST LABORATORY © 2025 <br/> 
             <span className="opacity-50">Engineering for Apparel</span>
        </p>
      </footer>

    </div>
  );
}