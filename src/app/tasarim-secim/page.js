"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Check, ArrowRight } from "lucide-react";
import { Space_Grotesk, Fraunces } from "next/font/google";

const grotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-grotesk",
});

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
});

const MODELS = [
  {
    id: "tshirt",
    name: "T‑Shirt",
    tag: "Klasik Fit",
    desc: "Günlük kullanım için hafif ve rahat, %100 pamuklu doku.",
    price: 750,
    print: "40×54 cm baskı alanı",
    image: "/urungorsel/tişört 2 k ön.png",
    accent: "from-emerald-400/25 via-transparent to-transparent",
    img: { pos: "50% 45%", scale: "scale-[0.9]", shift: "translate-y-2" },
    recommended: true,
  },
  {
    id: "hoodie",
    name: "Hoodie",
    tag: "Oversize",
    desc: "Kalın ve tok kumaş, sokak stiline uygun oversize kesim.",
    price: 1250,
    print: "64×55 cm baskı alanı",
    image: "/urungorsel/hoodie ön.jpg",
    accent: "from-indigo-400/25 via-transparent to-transparent",
    img: { pos: "50% 35%", scale: "scale-[0.92]", shift: "translate-y-3" },
    recommended: false,
  },
  {
    id: "sweatshirt",
    name: "Sweatshirt",
    tag: "Rahat Kesim",
    desc: "Şardonlu iç yüzey, mevsim geçişleri için ideal.",
    price: 950,
    print: "43×62 cm baskı alanı",
    image: "/urungorsel/sweat ön.png",
    accent: "from-amber-300/25 via-transparent to-transparent",
    img: { pos: "50% 50%", scale: "scale-[1]", shift: "translate-y-0" },
    recommended: false,
  },
];

const STEPS = [
  "Model seçimini yap",
  "Renk ve bedenini belirle",
  "Görselini yükleyip yerleştir",
];

const formatPrice = (value) =>
  `${new Intl.NumberFormat("tr-TR").format(value)} ₺`;

export default function ModelSecimSayfasi() {
  return (
    <div
      className={`${grotesk.variable} ${display.variable} relative min-h-screen bg-[#060606] text-white`}
      style={{ fontFamily: "var(--font-grotesk)" }}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(255,255,255,0.12),transparent),radial-gradient(900px_500px_at_90%_10%,rgba(99,102,241,0.14),transparent)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(transparent_24px,rgba(255,255,255,0.05)_25px),linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.05)_25px)] [background-size:25px_25px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 md:px-12 pt-8 pb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition uppercase text-[11px] font-bold tracking-[0.2em]"
        >
          <ArrowLeft size={14} /> Geri Dön
        </Link>

        <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
          <Sparkles size={14} /> Tasarım Seçimi
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 md:px-12 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              İlk adım
            </p>
            <h1
              className="mt-3 text-4xl md:text-6xl font-black leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Canvasını seç,
              <br />
              hikayeni başlat.
            </h1>
            <p className="mt-5 text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl">
              Tasarıma başlamadan önce ürün tipini seç. Sonrasında renk, yazı ve
              baskı görselini ekleyip ürünü anında önizleyebilirsin.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {STEPS.map((step) => (
                <div
                  key={step}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-300"
                >
                  <Check size={12} className="text-emerald-300" />
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-400">
                Önerilen
              </span>
              <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Hızlı Başlangıç
              </span>
            </div>
            <div className="mt-6">
              <p className="text-2xl font-black">Klasik T‑Shirt</p>
              <p className="text-sm text-zinc-400 mt-2">
                En hızlı başlangıç. Baskı alanı geniş, kumaş hafif.
              </p>
            </div>
            <Link
              href="/tasarim?model=tshirt"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white text-black py-3 text-xs font-black uppercase tracking-[0.2em] transition hover:bg-zinc-200"
            >
              Tasarıma Başla <ArrowRight size={14} />
            </Link>
            <p className="mt-3 text-[11px] text-zinc-500">
              Not: Tüm modeller tasarım ekranında değiştirilebilir.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODELS.map((model) => (
            <Link
              key={model.id}
              href={`/tasarim?model=${model.id}`}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] transition-all duration-500 hover:border-white/30"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${model.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {model.recommended && (
                <div className="absolute top-4 left-4 z-20 rounded-full bg-emerald-300/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                  Önerilen
                </div>
              )}

              <div className="relative h-[320px] w-full overflow-hidden bg-white">
                <div
                  className={`absolute inset-0 ${model.img?.shift || ""} ${model.img?.scale || ""} transition-transform duration-700 ease-out group-hover:scale-[1.04]`}
                >
                  <Image
                    src={model.image}
                    alt={model.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                    style={{ objectPosition: model.img?.pos || "50% 50%" }}
                    priority={model.id === "tshirt"}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </div>

              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                      {model.tag}
                    </p>
                    <h3 className="mt-2 text-2xl font-black">{model.name}</h3>
                  </div>
                  <span className="text-sm font-mono text-zinc-300">
                    {formatPrice(model.price)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  {model.desc}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">
                    {model.print}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white">
                    Başla
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
