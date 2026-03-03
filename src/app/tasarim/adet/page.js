"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronUp, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { clearCheckoutData, getCheckoutData, setCheckoutData } from "@/lib/checkoutStore";

const sanitizeQty = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.floor(n);
};

const formatMoney = (value) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function TasarimAdetPage() {
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [orderNote, setOrderNote] = useState("");
  const [error, setError] = useState("");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(true);

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
    setError("");
  };

  const syncCheckoutPayload = (nextDesigns, nextQuantities = quantities, nextNote = orderNote) => {
    const normalizedDesigns = nextDesigns.map((item) => {
      const qty = Math.max(1, sanitizeQty(nextQuantities[item.id]) || 1);
      return {
        ...item,
        quantity: qty,
      };
    });
    const nextPayload = {
      ...(payload || {}),
      designs: normalizedDesigns,
      totalPrice: normalizedDesigns.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
        0
      ),
      orderNote: String(nextNote || "").trim(),
    };
    setPayload(nextPayload);
    setCheckoutData(nextPayload);
    return nextPayload;
  };

  const handleRemoveItem = (id) => {
    const nextDesigns = designs.filter((item) => item.id !== id);
    const nextQuantities = { ...quantities };
    delete nextQuantities[id];
    setQuantities(nextQuantities);
    if (!nextDesigns.length) {
      clearCheckoutData();
      setPayload({ ...(payload || {}), designs: [] });
      setError("");
      return;
    }
    syncCheckoutPayload(nextDesigns, nextQuantities);
  };

  const handleClearCart = () => {
    clearCheckoutData();
    setPayload({ ...(payload || {}), designs: [] });
    setQuantities({});
    setOrderNote("");
    setError("");
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

    syncCheckoutPayload(designs);
    router.push("/siparis");
  };

  if (!designs.length) {
    return (
      <div className="min-h-screen bg-[#f3f5f8] text-zinc-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
            <ShoppingCart size={28} />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Sepet</p>
          <h1 className="mt-3 text-xl font-black text-slate-900">Sepette tasarım yok</h1>
          <p className="mt-2 text-sm text-zinc-500">Önce model seçip tasarımını kaydetmen gerekiyor.</p>
          <Link
            href="/tasarim"
            className="inline-flex mt-6 px-5 py-3 rounded-full border border-zinc-300 bg-white text-xs font-black uppercase tracking-widest text-zinc-900 hover:bg-zinc-100"
          >
            Tasarıma Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            <Link
              href={resumeHref}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 text-xs font-black uppercase tracking-widest text-zinc-900 shadow-sm hover:bg-zinc-100"
            >
              <ArrowLeft size={14} /> Geri
            </Link>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Sepet</p>
              <h1 className="text-lg font-black text-slate-900 md:text-xl">Kaydedilen Tasarımlar</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-500 px-5 text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-emerald-600"
          >
            Alışverişi Tamamla <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-5 pb-56 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-8">
        <section className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Sepet ({designs.length})</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Tasarımların</h2>
            </div>
            <button
              type="button"
              onClick={handleClearCart}
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-rose-500 hover:text-rose-600"
            >
              <Trash2 size={16} /> Sepeti Temizle
            </button>
          </div>

          <div className="divide-y divide-zinc-200">
            {designs.map((item) => {
              const qty = quantities[item.id] ?? 1;
              const lineTotal = Number(item.price || 0) * Math.max(1, sanitizeQty(qty) || 1);
              return (
                <article
                  key={item.id}
                  className="grid gap-4 py-5 md:grid-cols-[132px_minmax(0,1fr)_160px] md:items-center"
                >
                  <div className="aspect-[4/5] w-full max-w-[132px] overflow-hidden rounded-2xl bg-[#eef1f4] border border-zinc-200 flex items-center justify-center">
                    {item.preview || item.image ? (
                      <img
                        src={item.preview || item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-3 text-center text-xs text-zinc-400">Önizleme yok</span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div>
                      <h3 className="text-lg font-black leading-snug text-zinc-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-zinc-500">Özel tasarım ürün</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.color && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {item.size}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                        aria-label={`${item.name} ürününü sil`}
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="inline-flex h-11 items-center rounded-full bg-slate-100 px-2">
                        <button
                          type="button"
                          onClick={() => setItemQty(item.id, Math.max(1, sanitizeQty(qty) - 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white"
                          aria-label={`${item.name} adedini azalt`}
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          inputMode="numeric"
                          value={qty}
                          onChange={(e) => setItemQty(item.id, e.target.value)}
                          className="w-12 bg-transparent text-center text-lg font-black text-zinc-900 outline-none"
                          aria-label={`${item.name} adet`}
                        />
                        <button
                          type="button"
                          onClick={() => setItemQty(item.id, Math.max(1, sanitizeQty(qty) + 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition hover:bg-white"
                          aria-label={`${item.name} adedini artır`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="md:justify-self-end text-left md:text-right">
                    {Number(item.listPrice || 0) > Number(item.price || 0) && (
                      <p className="text-sm text-zinc-400 line-through">{formatMoney(Number(item.listPrice || 0) * Math.max(1, sanitizeQty(qty) || 1))} TL</p>
                    )}
                    <p className="text-3xl font-black text-emerald-600">{formatMoney(lineTotal)} TL</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="border-t border-zinc-200 pt-5">
            <Link
              href={resumeHref}
              className="text-base font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900"
            >
              Alışverişe Devam Et
            </Link>
          </div>

          <section className="mt-6 rounded-3xl border border-zinc-200 bg-[#f8fafc] p-4 md:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Sipariş Notu</p>
            <textarea
              rows={3}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value.slice(0, 500))}
              placeholder="Örn: teslim saatleri, paket notu, özel istek"
              className="mt-3 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <p className="mt-2 text-right text-[11px] text-zinc-500">{orderNote.length}/500</p>
          </section>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
        </section>

        <aside className="hidden lg:block lg:sticky lg:top-6 h-fit rounded-[28px] border border-zinc-200 bg-[#eef1f4] p-4 shadow-sm md:p-5">
          <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-2xl font-black text-slate-900">Sipariş Özeti</h2>
            </div>
            <div className="space-y-0">
              <div className="flex items-center justify-between px-5 py-5 text-base text-zinc-700">
                <span>Sepet Tutarı</span>
                <span className="font-black text-zinc-900">{formatMoney(total)} TL</span>
              </div>
              <div className="border-t border-zinc-200 flex items-center justify-between px-5 py-5 text-xl font-black text-slate-900">
                <span>Toplam Tutar</span>
                <span>{formatMoney(total)} TL</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-white transition hover:bg-emerald-600"
          >
            Alışverişi Tamamla
          </button>

          <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            <p className="font-black text-slate-900">Not</p>
            <p className="mt-1 leading-relaxed">
              Adetleri burada netleştiriyorsun. Devam ettiğinde sipariş formu ekranına geçeceksin.
            </p>
          </div>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div
          className={`overflow-hidden rounded-t-[28px] border border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ${
            mobileSummaryOpen ? "translate-y-0" : "translate-y-[calc(100%-88px)]"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileSummaryOpen((prev) => !prev)}
            className="flex w-full items-center justify-between border-b border-zinc-200 px-5 py-4 text-left"
          >
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Toplam</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(total)} TL</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700">
              {mobileSummaryOpen ? <X size={20} /> : <ChevronUp size={20} />}
            </span>
          </button>

          <div className="space-y-4 px-5 py-5">
            <div className="rounded-3xl border border-zinc-200 bg-[#f8fafc] overflow-hidden">
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="text-xl font-black text-slate-900">Sepet Özeti</h2>
              </div>
              <div className="space-y-0">
                <div className="flex items-center justify-between px-5 py-4 text-base text-zinc-700">
                  <span>Sepet Tutarı</span>
                  <span className="font-black text-zinc-900">{formatMoney(total)} TL</span>
                </div>
                <div className="border-t border-zinc-200 flex items-center justify-between px-5 py-4 text-xl font-black text-slate-900">
                  <span>Toplam Tutar</span>
                  <span>{formatMoney(total)} TL</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-white transition hover:bg-emerald-600"
            >
              Alışverişi Tamamla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
