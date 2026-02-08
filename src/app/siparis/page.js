"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCheckoutData } from "@/lib/checkoutStore";

const SIZE_OPTIONS = ["S", "M", "L", "XL"];

export default function SiparisPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");

  useEffect(() => {
    const payload = getCheckoutData();
    setData(payload);
    const initialSize = payload?.designs?.[0]?.size;
    if (initialSize) setSelectedSize(initialSize);
  }, []);

  const totalPrice = useMemo(() => {
    if (!data?.designs?.length) return 0;
    return data.totalPrice ?? data.designs.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [data]);

  if (!data?.designs?.length) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Sipariş</p>
          <h1 className="mt-3 text-lg font-black">Sipariş özeti bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-500">Tasarım sayfasına dönüp işlemi tamamlayabilirsin.</p>
          <Link
            href="/tasarim"
            className="inline-flex mt-5 px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
          >
            Tasarıma Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
      <header className="px-6 py-5 border-b border-zinc-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/tasarim"
              className="px-3 py-2 rounded-full border border-zinc-300 bg-white text-xs font-black uppercase tracking-widest"
            >
              Geri
            </Link>
            <div>
              <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.18em]">Sipariş</p>
              <p className="text-sm font-black">Tasarım Özeti</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/odeme")}
            className="px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
          >
            Ödemeye Geç
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            {data.designs.map((item) => (
              <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-4">
                  <div className="w-full sm:w-[calc(50%-0.5rem)]">
                    <div className="aspect-[4/5] rounded-xl bg-[#efefef] overflow-hidden flex items-center justify-center">
                      {item.mockupFiles?.front || item.preview ? (
                        <img
                          src={item.mockupFiles?.front || item.preview}
                          alt={`${item.name} on`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-zinc-400">Ön Görsel Yok</div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Ön</p>
                  </div>
                  <div className="w-full sm:w-[calc(50%-0.5rem)]">
                    <div className="aspect-[4/5] rounded-xl bg-[#efefef] overflow-hidden flex items-center justify-center">
                      {item.mockupFiles?.back ? (
                        <img
                          src={item.mockupFiles?.back}
                          alt={`${item.name} arka`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-zinc-400">Arka Görsel Yok</div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Arka</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide">{item.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="inline-flex w-3.5 h-3.5 rounded-full border border-zinc-300" style={{ backgroundColor: item.color }} />
                      <span>{item.color}</span>
                    </div>
                  </div>
                  <div className="text-sm font-black">{item.price} ₺</div>
                </div>
              </div>
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Beden</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 font-bold uppercase">Toplam</span>
                  <span className="font-black">{totalPrice} ₺</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/odeme")}
                className="mt-4 w-full py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
              >
                Ödemeye Geç
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
