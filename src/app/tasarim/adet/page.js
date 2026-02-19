"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCheckoutData, setCheckoutData } from "@/lib/checkoutStore";

const sanitizeQty = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.floor(n);
};

export default function TasarimAdetPage() {
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [orderNote, setOrderNote] = useState("");
  const [error, setError] = useState("");
  const resumeHref = useMemo(() => {
    const modelType = payload?.designs?.[0]?.modelType;
    return modelType ? `/tasarim?resume=1&model=${encodeURIComponent(modelType)}` : "/tasarim?resume=1";
  }, [payload]);

  useEffect(() => {
    const data = getCheckoutData();
    setPayload(data);
    setOrderNote(String(data?.orderNote || ""));
    const next = {};
    (data?.designs || []).forEach((item) => {
      next[item.id] = Math.max(1, sanitizeQty(item.quantity || 1) || 1);
    });
    setQuantities(next);
  }, []);

  const designs = payload?.designs || [];

  const total = useMemo(() => {
    if (!designs.length) return 0;
    return designs.reduce((sum, item) => {
      const qty = Math.max(1, sanitizeQty(quantities[item.id]) || 1);
      return sum + Number(item.price || 0) * qty;
    }, 0);
  }, [designs, quantities]);

  const setItemQty = (id, value) => {
    const parsed = sanitizeQty(value);
    if (Number.isNaN(parsed)) {
      setQuantities((prev) => ({ ...prev, [id]: value }));
      return;
    }
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, parsed) }));
  };

  const goNext = () => {
    const invalid = designs.some((item) => {
      const q = sanitizeQty(quantities[item.id]);
      return !Number.isFinite(q) || q < 1;
    });

    if (invalid) {
      setError("Adet en az 1 olmalı. Boş, 0 veya negatif değer kabul edilmez.");
      return;
    }

    const nextDesigns = designs.map((item) => {
      const qty = Math.max(1, sanitizeQty(quantities[item.id]));
      return {
        ...item,
        quantity: qty,
      };
    });

    setCheckoutData({
      ...payload,
      designs: nextDesigns,
      totalPrice: nextDesigns.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
      orderNote: String(orderNote || "").trim(),
    });

    router.push("/siparis");
  };

  if (!designs.length) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] text-zinc-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Adet</p>
          <h1 className="mt-3 text-lg font-black">Tasarım verisi bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-500">Önce model seçip tasarımını tamamla.</p>
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
    <div className="min-h-screen bg-[#f5f6f8] text-zinc-900">
      <header className="px-4 md:px-6 py-5 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={resumeHref}
              className="px-3 py-2 rounded-full border border-zinc-300 bg-white text-xs font-black uppercase tracking-widest"
            >
              Geri
            </Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Adım 3</p>
              <h1 className="text-lg md:text-xl font-black">Adet Belirle</h1>
            </div>
          </div>
          <button
            onClick={goNext}
            className="px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
          >
            Sipariş Özetine Geç
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        {designs.map((item) => {
          const qty = quantities[item.id] ?? 1;
          return (
            <section
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 grid gap-4 md:grid-cols-[140px_1fr_auto]"
            >
              <div className="aspect-square rounded-xl bg-[#eceff3] overflow-hidden flex items-center justify-center">
                {item.preview || item.image ? (
                  <img src={item.preview || item.image} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-zinc-400">Önizleme yok</span>
                )}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wide">{item.name}</p>
                <p className="text-xs text-zinc-500 mt-1">Birim fiyat: {item.price} ₺</p>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setItemQty(item.id, Math.max(1, sanitizeQty(qty) - 1))}
                  className="w-9 h-9 rounded-full border border-zinc-300 bg-white text-zinc-900 text-lg font-black"
                >
                  -
                </button>
                <input
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) => setItemQty(item.id, e.target.value)}
                  className="w-16 h-9 rounded-lg border border-zinc-300 bg-white text-center text-sm font-black"
                  aria-label={`${item.name} adet`}
                />
                <button
                  type="button"
                  onClick={() => setItemQty(item.id, Math.max(1, sanitizeQty(qty) + 1))}
                  className="w-9 h-9 rounded-full border border-zinc-300 bg-white text-zinc-900 text-lg font-black"
                >
                  +
                </button>
              </div>
            </section>
          );
        })}

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-wide">Toplam</p>
          <p className="text-xl font-black">{total} ₺</p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Sipariş Notu</p>
          <textarea
            rows={3}
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
            placeholder="Örn: teslim saatleri, paket notu, özel istek"
            className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <p className="mt-1 text-[11px] text-zinc-500 text-right">{orderNote.length}/500</p>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
