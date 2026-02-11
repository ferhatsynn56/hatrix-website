"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle, Beaker } from "lucide-react";

const BASKI_TEKNOLOJILERI = [
  {
    id: "dtf",
    title: "1. DTF (Direct to Film) Baskı",
    nediR: "Özel bir filme dijital olarak basılan tasarımın, tozlama ve ısı işlemiyle kumaşa aktarılmasıdır.",
    hissiyat: "İnce, esnek ve pürüzsüz bir dokusu vardır. Renkler çok canlı ve fotoğraf kalitesindedir.",
    referans: "Çok renkli tasarımlar ve detaylı grafikler için en ideal yöntemdir.",
    videoUrl: "",
    accent: "#2563eb",
  },
  {
    id: "emprime",
    title: "2. Emprime (Serigrafi) Baskı",
    nediR: "Kalıplar aracılığıyla boyanın doğrudan kumaş liflerine nüfuz ettirildiği geleneksel ve en kalıcı yöntemdir.",
    hissiyat: "Kumaşla bütünleşen, nefes alan ve yıkamaya en dayanıklı dokudur.",
    referans: "Büyük adetli siparişlerde ve klasikleşmiş bir dokunuş arandığında tercih edilir.",
    videoUrl: "",
    accent: "#16a34a",
  },
  {
    id: "nakis",
    title: "3. Nakış (Embroidery)",
    nediR: "Tasarımın yüksek devirli makinelerle, farklı renklerdeki ipliklerin kumaş üzerine işlenmesiyle oluşturulmasıdır.",
    hissiyat: "Kabarık, premium ve oldukça dayanıklı bir dokuya sahiptir.",
    referans: "Hoodie ve polo yaka ürünlerde üst segment bir hava yaratmak için kullanılır.",
    videoUrl: "",
    accent: "#a855f7",
  },
  {
    id: "enjeksiyon",
    title: "4. Enjeksiyon Baskı",
    nediR: "PVC veya silikon malzemenin bir kalıp içerisine enjekte edilerek kumaş üzerine sabitlenmesidir.",
    hissiyat: "Sert plastikimsi ama esnek, çok net kenar hatlarına sahip 3 boyutlu bir görünümdür.",
    referans: "Logo vurgusunda kesinlik ve derinlik isteyen tasarımlar içindir.",
    videoUrl: "",
    accent: "#f97316",
  },
  {
    id: "gofre",
    title: "5. Gofre (Kabartma) Baskı",
    nediR: "Yüksek ısı ve basınçlı kalıplar kullanılarak kumaşın kendi dokusunun yukarı doğru kabartılması işlemidir.",
    hissiyat: "Kumaşın kendi renginde, mürekkepsiz ama belirgin bir kabartma dokusu.",
    referans: "Minimalist ve sofistike tasarımlar için gizli şıklık sunar.",
    videoUrl: "",
    accent: "#0d9488",
  },
  {
    id: "tas",
    title: "6. Taş Baskı (Rhinestone)",
    nediR: "Küçük kristal veya metalik taşların, bir şablon yardımıyla ısı uygulanarak kumaş üzerine dizilmesidir.",
    hissiyat: "Işıltılı, pürüzlü ve dikkat çekici bir yüzey.",
    referans: "Işığı yansıtan, parlaması istenen özel tasarımlar için idealdir.",
    videoUrl: "",
    accent: "#e11d48",
  },
  {
    id: "flok",
    title: "7. Lazer Kesim Flok Baskı",
    nediR: "Kadifemsi flok yüzeylerin lazer teknolojisi ile milimetrik hassasiyette kesilip, yüksek ısıyla kumaşa transfer edilmesidir.",
    hissiyat: "Yumuşak, kadifemsi ve hafif yüksek bir dokunuş. Lazer kesim sayesinde ince detaylarda bile kusursuz kenar hatları.",
    referans: "Dokunsal zenginlik ve yüksek detay hassasiyeti isteyen tasarımlar için mükemmeldir.",
    videoUrl: "",
    accent: "#7c3aed",
  },
  {
    id: "flexi-rubber",
    title: "8. Flexi & Rubber Baskı",
    nediR: "Özel folyo plakaların lazerle kesilip yüksek ısıyla kumaşa preslenmesidir (Flexi daha ince, Rubber daha kauçuksu/kalındır).",
    hissiyat: "Pürüzsüz, keskin hatlı ve endüstriyel bir görünüm.",
    referans: "Tek renkli yazılar, numaralar ve net logolar için mükemmeldir.",
    videoUrl: "",
    accent: "#1d4ed8",
  },
  {
    id: "frekans",
    title: "9. Frekans Baskı (High Frequency)",
    nediR: "Yüksek frekanslı enerji dalgalarıyla malzemenin moleküler düzeyde ısıtılarak kumaşa kaynatılması ve şekil verilmesidir.",
    hissiyat: "Derinlemesine 3 boyutlu, dikişsiz ve pürüzsüz bir kabartma.",
    referans: "Teknik ve fütüristik görünümlü detaylar yaratmak için en ileri teknolojidir.",
    videoUrl: "",
    accent: "#0891b2",
  },
];

function VideoCard({ title, videoUrl, accent }) {
  return (
    <div className="rounded-2xl border bg-zinc-950/80 p-3 shadow-[0_14px_35px_rgba(0,0,0,0.4)]" style={{ borderColor: `${accent}66` }}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] mb-2" style={{ color: accent }}>
        Uygulama Videosu
      </p>
      {videoUrl ? (
        <video
          className="w-full aspect-video rounded-xl bg-black border"
          style={{ borderColor: `${accent}55` }}
          controls
          preload="metadata"
          playsInline
        >
          <source src={videoUrl} />
        </video>
      ) : (
        <div
          className="w-full aspect-video rounded-xl border border-dashed bg-gradient-to-br from-zinc-900 to-zinc-950 flex flex-col items-center justify-center text-center px-3"
          style={{ borderColor: `${accent}66` }}
        >
          <PlayCircle size={28} className="mb-2" style={{ color: accent }} />
          <p className="text-xs font-semibold text-zinc-100">{title}</p>
          <p className="text-[11px] text-zinc-400 mt-1">Video dosyasını eklediğinde burada oynatılır.</p>
        </div>
      )}
    </div>
  );
}

export default function BilimselSayfa() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white">
            <ArrowLeft size={16} />
            Ana sayfaya dön
          </Link>
          <Link href="/hakkimizda" className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-200 hover:bg-zinc-900">
            Hakkımızda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950/75 border border-zinc-800 p-5 md:p-8 mb-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="absolute -top-24 -right-16 h-52 w-52 rounded-full blur-3xl bg-indigo-300/45 pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full blur-3xl bg-cyan-300/40 pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/35 bg-indigo-500/15 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-200 mb-3">
            <Beaker size={14} />
            Steni Baskı Laboratuvarı
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">Teknik Bilgi Arşivi</h1>
          <p className="mt-3 text-sm md:text-base text-zinc-300 max-w-3xl">
            Aşağıda kullandığımız baskı tekniklerinin çalışma prensibi, hissiyatı ve kullanım notları yer alır.
            Her tekniğin yanında video kartı bulunur; dosyaları eklediğinde doğrudan oynatılabilir.
          </p>
        </div>

        <div className="space-y-4">
          {BASKI_TEKNOLOJILERI.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border bg-zinc-950/70 p-4 md:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
              style={{ borderColor: `${item.accent}66` }}
            >
              <div className="grid gap-4 md:grid-cols-[1.6fr_1fr] md:items-start">
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.accent }}
                    />
                    <span className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: item.accent }}>
                      Baskı Tipi
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black mb-3 text-white">{item.title}</h2>
                  <ul className="space-y-2 text-sm md:text-[15px] leading-relaxed text-zinc-300">
                    <li>
                      <span className="font-black text-zinc-100">Nedir:</span> {item.nediR}
                    </li>
                    <li>
                      <span className="font-black text-zinc-100">Hissiyat:</span> {item.hissiyat}
                    </li>
                    <li>
                      <span className="font-black text-zinc-100">Referans Notu:</span> {item.referans}
                    </li>
                  </ul>
                </div>
                <VideoCard title={item.title} videoUrl={item.videoUrl} accent={item.accent} />
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
