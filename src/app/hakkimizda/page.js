"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white">
            <ArrowLeft size={16} />
            Ana sayfaya dön
          </Link>
          <Link href="/bilimsel" className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-200 hover:bg-zinc-900">
            Bilimsel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <article className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-6 text-white">
            Steni: Kumaşın Dokusunda, Baskının Ustalığında Sizin İmzanız
          </h1>

          <section className="space-y-5 text-sm md:text-[15px] leading-relaxed text-zinc-300">
            <p>
              <span className="font-black text-white">Biz Kimiz?</span> Steni olarak, tekstil sektöründeki 25 yıllık köklü baskı tecrübemizi,
              dijital çağın sunduğu sınırsız özgürlükle birleştiriyoruz. Çeyrek asırdır mürekkebin kumaşla kurduğu bağa tanıklık eden bir ekip olarak,
              rotamızı seri üretimden tamamen kişiye özel üretime çevirdik.
            </p>

            <p>
              Bizim için moda, raflardaki binlerce kopyadan birini seçmek değil; en baştan yaratmaktır.
            </p>

            <div>
              <p>
                <span className="font-black text-white">Neden Steni?</span> Standartların ötesine geçiyoruz. Web sitemizde sunduğumuz gelişmiş
                3D modelleme teknolojisi ile sadece bir tişört veya hoodie satın almanızı değil, onu tasarlamanızı sağlıyoruz.
                Farklılığımızı detaylara verdiğimiz önemle gösteriyoruz:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-1">
                <li>Bir hoodienin ip rengini değiştirmek,</li>
                <li>Ürünün kumaş tipini seçmek,</li>
                <li>Tasarımınızı 3 boyutlu ortamda canlı görmek artık lüks değil, Steni standardıdır.</li>
              </ul>
            </div>

            <p>
              <span className="font-black text-white">Teknolojik Gücümüz ve Ustalığımız:</span> Steni’yi diğerlerinden ayıran en büyük özellik,
              sahip olduğumuz geniş baskı ve üretim yelpazesidir. Basit bir dijital baskı atölyesi değiliz; 25 yılın getirdiği teknik donanımla çalışıyoruz.
            </p>

            <p className="font-black text-white">
              Tasarımınızı hayata geçirirken kullandığımız teknikler:
            </p>
            <p className="font-black text-white">
              DTF, Emprime, Nakış, Enjeksiyon, Gofre, Taş, Flok, UV, Silikon, Flexi, Rubber ve Frekans baskı.
            </p>

            <p>
              Bu teknik çeşitliliği, hayalinizdeki tasarımı kumaşa en doğru ve en kaliteli şekilde aktarmamızı sağlar.
            </p>

            <p>
              <span className="font-black text-white">Kumaştan Gelen Kalite:</span> Sadece baskıda değil, ürüne dokunduğunuzda hissettiğiniz
              kalitede de iddialıyız. Yerel üreticilerle kurduğumuz güçlü iş ortaklığı ve sıkı kalite kontrol süreçlerimiz sayesinde
              24/1, 30/2, şardonlu, şardonsuz, üç iplik, iki iplik ve %100 pamuklu premium kumaşları kullanıyoruz.
            </p>

            <p>
              <span className="font-black text-white">İlkemiz Net:</span> Seri üretim yok. Stok fazlası yok. Sadece sizin seçimlerinizle,
              yerel üretimin gücüyle hazırlanan Premium Tekstil Ürünü + Usta Baskı = Makul Fiyat var.
            </p>

            <p>
              Steni’de tasarımcı sizsiniz; biz ise o tasarımı en iyi kumaş ve en doğru teknikle giyilebilir bir sanata dönüştüren yol arkadaşınız.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
