"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import AdminShell from "@/components/AdminShell";
import { TrendingUp, Percent, Truck, CreditCard, Package } from "lucide-react";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

export default function AdminRaporlarPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Basit varsayımlar (maliyet datası yoksa rapor için)
  const [costRatio, setCostRatio] = useState(0.45); // ürün maliyeti oranı
  const [paymentFeeRatio, setPaymentFeeRatio] = useState(0.03); // ödeme komisyonu
  const [shippingPerOrder, setShippingPerOrder] = useState(70); // ortalama kargo

  useEffect(() => {
    const run = async () => {
      if (!db) {
        setLoading(false);
        return;
      }

      try {
        if (auth && !auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch {}
        }

        const q = query(collection(db, "siparisler"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setErrorMsg(null);
      } catch (e) {
        if (e?.code === "permission-denied") {
          setErrorMsg(
            "Firestore izin hatası: 'siparisler' verisi okunamadı. Rules tarafında admin için read izni vermen gerekiyor."
          );
        } else {
          setErrorMsg("Rapor verileri çekilemedi.");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const metrics = useMemo(() => {
    const nonCancelled = orders.filter((o) => (o.status || "") !== "İptal");
    const delivered = nonCancelled.filter((o) => (o.status || "") === "Teslim Edildi");

    const itemsAll = nonCancelled.flatMap((o) => (Array.isArray(o.items) ? o.items : []));
    const itemsDelivered = delivered.flatMap((o) => (Array.isArray(o.items) ? o.items : []));

    const revenueAll = itemsAll.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
      0
    );

    const revenueDelivered = itemsDelivered.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
      0
    );

    const ordersCount = nonCancelled.length;

    const cogs = revenueAll * clamp01(Number(costRatio) || 0);
    const paymentFees = revenueAll * clamp01(Number(paymentFeeRatio) || 0);
    const shipping = ordersCount * Math.max(0, Number(shippingPerOrder) || 0);

    const grossProfit = revenueAll - cogs;
    const netProfit = revenueAll - cogs - paymentFees - shipping;

    const topProductsMap = new Map();
    for (const it of itemsAll) {
      const name = String(it?.name || it?.isim || "Ürün").trim() || "Ürün";
      const qty = Number(it?.quantity || 1);
      const rev = Number(it?.price || 0) * qty;
      const prev = topProductsMap.get(name) || { name, qty: 0, revenue: 0 };
      topProductsMap.set(name, { name, qty: prev.qty + qty, revenue: prev.revenue + rev });
    }
    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      revenueAll,
      revenueDelivered,
      ordersCount,
      grossProfit,
      netProfit,
      cogs,
      paymentFees,
      shipping,
      topProducts,
    };
  }, [orders, costRatio, paymentFeeRatio, shippingPerOrder]);

  return (
    <AdminShell title="Raporlar (Kar/Zarar)">
      <div className="max-w-6xl mx-auto">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-200 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-900 bg-black/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Özet</div>
                <div className="text-lg font-black">Satış / Kar / Zarar</div>
              </div>
              <TrendingUp className="text-zinc-400" size={20} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Toplam Ciro</div>
                <div className="mt-2 text-3xl font-black">{loading ? "..." : `${Math.round(metrics.revenueAll)} ₺`}</div>
                <div className="mt-1 text-[11px] text-zinc-500">İptaller hariç</div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Teslim Edilen Ciro</div>
                <div className="mt-2 text-3xl font-black">{loading ? "..." : `${Math.round(metrics.revenueDelivered)} ₺`}</div>
                <div className="mt-1 text-[11px] text-zinc-500">Sadece “Teslim Edildi”</div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Brüt Kar (tahmini)</div>
                <div className="mt-2 text-3xl font-black">{loading ? "..." : `${Math.round(metrics.grossProfit)} ₺`}</div>
                <div className="mt-1 text-[11px] text-zinc-500">Ciro - Ürün maliyeti</div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Net Kar (tahmini)</div>
                <div className="mt-2 text-3xl font-black">{loading ? "..." : `${Math.round(metrics.netProfit)} ₺`}</div>
                <div className="mt-1 text-[11px] text-zinc-500">Brüt - ödeme - kargo</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-900 bg-zinc-950/30 p-4 text-xs text-zinc-300 leading-relaxed">
              Bu rapor "tahmini" çalışır. Çünkü sipariş/ürün dokümanlarında gerçek maliyet alanı yok.
              İstersen ürün ekleme formuna `maliyet` alanı ekleyip kar hesaplarını gerçeğe çevirebilirim.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-black/40 p-5">
            <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Varsayımlar</div>
            <div className="mt-2 text-sm font-black">Hesaplama Ayarları</div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-2">
                  <Percent size={12} /> Ürün Maliyeti Oranı
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={costRatio}
                  onChange={(e) => setCostRatio(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
                <div className="mt-1 text-[11px] text-zinc-500">Örn: 0.45 = %45</div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-2">
                  <CreditCard size={12} /> Ödeme Komisyonu Oranı
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={paymentFeeRatio}
                  onChange={(e) => setPaymentFeeRatio(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
                <div className="mt-1 text-[11px] text-zinc-500">Örn: 0.03 = %3</div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-2">
                  <Truck size={12} /> Ortalama Kargo / Sipariş (₺)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={shippingPerOrder}
                  onChange={(e) => setShippingPerOrder(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-6 text-[11px] text-zinc-500 leading-relaxed">
              Bu değerler sadece rapor ekranını etkiler. Veritabanına yazılmaz.
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-900 bg-black/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">En Çok Satanlar</div>
              <div className="text-lg font-black">Top Ürünler</div>
            </div>
            <Package className="text-zinc-400" size={20} />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(metrics.topProducts || []).map((p) => (
              <div key={p.name} className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-4">
                <div className="text-sm font-black text-white line-clamp-2">{p.name}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Adet: <b className="text-white">{p.qty}</b></span>
                  <span>Ciro: <b className="text-white">{Math.round(p.revenue)} ₺</b></span>
                </div>
              </div>
            ))}
            {!loading && (metrics.topProducts || []).length === 0 && (
              <div className="col-span-full text-zinc-500 text-sm">Henüz hesaplanacak satış yok.</div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
