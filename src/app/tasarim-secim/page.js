"use client";

import React, { useRef } from "react";
import Link from "next/link";
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
    name: "Normal Tişört",
    tag: "Tişört",
    desc: "Klasik kesim, günlük kullanım için ideal.",
    tags: ["Pamuk", "Klasik", "Hafif"],
    accent: "from-emerald-400/25 via-transparent to-transparent",
    recommended: true,
    video: "/previews/tshirt.mp4",
  },
  {
    id: "oversize-tshirt",
    name: "Oversize Tişört",
    tag: "Tişört",
    desc: "Daha geniş kalıp, rahat ve modern görünüm.",
    tags: ["Oversize", "Rahat", "Günlük"],
    accent: "from-emerald-400/25 via-transparent to-transparent",
    video: "/previews/oversize-tshirt.mp4",
  },
  {
    id: "sweatshirt",
    name: "Normal Sweat",
    tag: "Sweat",
    desc: "Şardonlu iç yüzey, mevsim geçişleri için ideal.",
    tags: ["Şardonlu", "Sıcak", "Klasik"],
    accent: "from-amber-300/25 via-transparent to-transparent",
    video: "/previews/sweatshirt.mp4",
  },
  {
    id: "oversize-sweat",
    name: "Oversize Sweat",
    tag: "Sweat",
    desc: "Bol kesim ve rahat düşüş, sokak stiline uygun.",
    tags: ["Oversize", "Rahat", "Kalın"],
    accent: "from-amber-300/25 via-transparent to-transparent",
    video: "/previews/oversize-sweat.mp4",
  },
  {
    id: "hoodie",
    name: "Hoodie",
    tag: "Hoodie",
    desc: "Kapüşonlu, günlük kullanım için temel parça.",
    tags: ["Kapüşon", "Sokak", "Klasik"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie.mp4",
  },
  {
    id: "hoodie-ipli",
    name: "Hoodie İpli",
    tag: "Hoodie",
    desc: "İpli kapüşon ile sportif görünüm.",
    tags: ["Kapüşon", "İpli", "Klasik"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie-ipli.mp4",
  },
  {
    id: "hoodie-cepli",
    name: "Hoodie Cepli",
    tag: "Hoodie",
    desc: "Ön cep detaylı, günlük kullanım için pratik.",
    tags: ["Kapüşon", "Cep", "Klasik"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie-cepli.mp4",
  },
  {
    id: "hoodie-ceplipli",
    name: "Hoodie Cepli İpli",
    tag: "Hoodie",
    desc: "Cep + ipli kapüşon bir arada.",
    tags: ["Kapüşon", "Cep", "İpli"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie-ceplipli.mp4",
  },
  {
    id: "hoodie-oversize",
    name: "Oversize Hoodie",
    tag: "Hoodie",
    desc: "Bol kalıp ve geniş omuz, modern sokak stili.",
    tags: ["Oversize", "Kapüşon", "Rahat"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie-oversize.mp4",
  },
  {
    id: "hoodie-oversize-ipli",
    name: "Oversize Hoodie İpli",
    tag: "Hoodie",
    desc: "Oversize kesim + ipli kapüşon.",
    tags: ["Oversize", "Kapüşon", "İpli"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie-oversize-ipli.mp4",
  },
  {
    id: "hoodie-oversize-cepli",
    name: "Oversize Hoodie Cepli",
    tag: "Hoodie",
    desc: "Oversize kesim + cep detayı.",
    tags: ["Oversize", "Kapüşon", "Cep"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie-oversize-cepli.mp4",
  },
  {
    id: "hoodie-oversize-ceplipli",
    name: "Oversize Hoodie Cepli İpli",
    tag: "Hoodie",
    desc: "Oversize + cep + ipli kapüşon.",
    tags: ["Oversize", "Cep", "İpli"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/hoodie-oversize-ceplipli.mp4",
  },
  {
    id: "fermuarli",
    name: "Fermuarlı",
    tag: "Hoodie",
    desc: "Önü fermuarlı, katmanlı giyim için ideal.",
    tags: ["Fermuar", "Katman", "Pratik"],
    accent: "from-indigo-400/25 via-transparent to-transparent",
    video: "/previews/fermuarli.mp4",
  },
  {
    id: "polar",
    name: "Polar",
    tag: "Dış Giyim",
    desc: "Yumuşak dokulu, sıcak tutan polar kumaş.",
    tags: ["Sıcak", "Yumuşak", "Kış"],
    accent: "from-sky-400/25 via-transparent to-transparent",
    video: "/previews/polar.mp4",
  },
];

const STEPS = [
  "Model seçimini yap",
  "Renk ve bedenini belirle",
  "Görselini yükleyip yerleştir",
];

const formatPrice = (value) =>
  value ? `${new Intl.NumberFormat("tr-TR").format(value)} ₺` : "Fiyat: tasarımda";

const totalModels = MODELS.length;

const GROUPS = [
  { id: "tshirt", title: "Tişört", subtitle: "Düz ve oversize seçenekler" },
  { id: "sweat", title: "Sweat", subtitle: "Klasik ve oversize" },
  { id: "hoodie", title: "Hoodie", subtitle: "Cep / ipli / oversize varyasyonları" },
  { id: "outer", title: "Dış Giyim", subtitle: "Fermuarlı ve polar" },
];

const getGroupId = (tag) => {
  if (tag === "Tişört") return "tshirt";
  if (tag === "Sweat") return "sweat";
  if (tag === "Hoodie") return "hoodie";
  return "outer";
};

function ModelCard({ model }) {
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const pressRef = useRef({ start: 0 });
  const PREVIEW_MS = 1800;
  const PRESS_BLOCK_MS = 260;

  const playPreview = () => {
    if (!model.video) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p?.catch) p.catch(() => {});
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      v.pause();
    }, PREVIEW_MS);
  };

  const stopPreview = () => {
    const v = videoRef.current;
    if (!v) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    v.pause();
  };

  return (
    <Link
      href={`/tasarim?model=${model.id}`}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] transition-all duration-500 hover:border-white/30"
      onMouseEnter={playPreview}
      onMouseLeave={stopPreview}
      onPointerDown={() => {
        pressRef.current.start = Date.now();
        playPreview();
      }}
      onPointerUp={stopPreview}
      onPointerCancel={stopPreview}
      onClick={(e) => {
        if (Date.now() - pressRef.current.start > PRESS_BLOCK_MS) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${model.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {model.recommended && (
        <div className="absolute top-4 left-4 z-20 rounded-full bg-emerald-300/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
          Önerilen
        </div>
      )}

      {model.video && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          muted
          playsInline
          preload="metadata"
          src={model.video}
        />
      )}

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-400">
              {model.tag}
            </p>
            <h3 className="mt-2 text-2xl font-black">{model.name}</h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-300">
            {formatPrice(model.price)}
          </span>
        </div>

        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          {model.desc}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(model.tags || []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 uppercase tracking-[0.2em]">
            Ön + Arka Baskı
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-white">
            Seç
          </span>
        </div>

        {model.video && (
          <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Üzerine gel / basılı tut
          </div>
        )}
      </div>
    </Link>
  );
}

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
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            Toplam {totalModels} model
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

        {/* Cards by groups */}
        <div className="mt-14 space-y-12">
          {GROUPS.map((group) => {
            const items = MODELS.filter((m) => getGroupId(m.tag) === group.id);
            if (!items.length) return null;
            return (
              <section key={group.id} className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black">
                      {group.title}
                    </h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] mt-1">
                      {group.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {items.length} seçenek
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {items.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
