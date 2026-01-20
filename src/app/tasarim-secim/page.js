"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// MODELLER VE RESİM YOLLARI
const MODELS = [
  {
    id: "tshirt",
    name: "T-SHIRT",
    desc: "Klasik kesim, %100 pamuklu kumaş. Günlük kullanım için ideal.",
    price: "₺750",
    image: "/urungorsel/tişört 2 k ön.png",
    color: "from-zinc-800 to-black",
    img: { pos: "50% 45%", scale: "scale-[0.88]", shift: "translate-y-2" }, // ✅ sweatshirt gibi
  },
  {
    id: "hoodie",
    name: "HOODIE",
    desc: "Oversize kesim, kalın ve tok kumaş. Sokak stili için mükemmel.",
    price: "₺1.250",
    image: "/urungorsel/hoodie ön.jpg",
    color: "from-zinc-900 to-black",
    img: { pos: "50% 35%", scale: "scale-[0.92]", shift: "translate-y-3" }, // ✅ baş/kapüşon taşmasın
  },
  {
    id: "sweatshirt",
    name: "SWEATSHIRT",
    desc: "Rahat kesim, şardonlu iç yüzey. Mevsim geçişleri için.",
    price: "₺950",
    image: "/urungorsel/sweat ön.png",
    color: "from-zinc-800 to-black",
    img: { pos: "50% 50%", scale: "scale-[1]", shift: "translate-y-0" }, // zaten iyi
  },
];


export default function ModelSecimSayfasi() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      {/* Üst Navigasyon */}
      <header className="p-8 flex items-center justify-between z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition uppercase text-xs font-bold tracking-widest"
        >
          <ArrowLeft size={16} /> Geri Dön
        </Link>

        {/* STENIST yazısı kaldırıldı */}
        <div />
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12">
        <div className="text-center mb-12 space-y-4 z-10">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-600">
            Canvasını Seç
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Tasarlamaya başlamak için önce temel ürününü seç.
          </p>
        </div>

        {/* Kartlar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full z-10">
          {MODELS.map((model) => (
            <Link
              key={model.id}
              href={`/tasarim?model=${model.id}`}
              className="group relative h-[520px] rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-white/30 transition-all duration-500 flex flex-col bg-[#0a0a0a]"
            >
              {/* Arkaplan Gradyanı */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${model.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
              />

              {/* GÖRSEL ALANI */}
              <div className="relative w-full flex-1 overflow-hidden bg-white">
  <div className={`absolute inset-0 ${model.img?.shift || ""} ${model.img?.scale || ""} transition-transform duration-700 ease-out group-hover:scale-[1.04]`}>
    <Image
      src={model.image}
      alt={model.name}
      fill
      className="object-contain drop-shadow-2xl"
      style={{ objectPosition: model.img?.pos || "50% 50%" }}
      priority
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
    />
  </div>

  {/* yazılar net dursun */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
</div>


              {/* Bilgi Alanı */}
              <div className="relative z-20 p-6 bg-black/80 backdrop-blur-[2px]">
                <div className="flex justify-between items-end mb-2">
                  <h2 className="text-2xl font-black italic tracking-wider text-white">
                    {model.name}
                  </h2>
                  <span className="text-lg font-mono text-zinc-400 group-hover:text-white transition-colors">
                    {model.price}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-medium mb-5 line-clamp-2">
                  {model.desc}
                </p>

                <div className="w-full py-3 rounded-lg bg-white text-black text-center text-xs font-bold uppercase tracking-widest opacity-90 group-hover:opacity-100 transition-all duration-300">
                  Tasarlamaya Başla
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer tamamen kaldırıldı */}
    </div>
  );
}
