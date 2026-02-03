"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import AdminShell from "@/components/AdminShell";
import { Package, ShoppingBag, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

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

        const [ordersSnap, productsSnap] = await Promise.all([
          getDocs(query(collection(db, "siparisler"), orderBy("createdAt", "desc"))),
          getDocs(collection(db, "urunler")),
        ]);

        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setProductsCount(productsSnap.size);
        setErrorMsg(null);
      } catch (e) {
        if (e?.code === "permission-denied") {
          setErrorMsg(
            "Firestore izin hatası: Admin dashboard verileri okunamadı. Firestore Rules içinde 'siparisler' ve 'urunler' için read izni vermen gerekiyor."
          );
        } else {
          setErrorMsg("Dashboard verileri alınamadı.");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const summary = useMemo(() => {
    const nonCancelled = orders.filter((o) => (o.status || "") !== "İptal");
    const items = nonCancelled.flatMap((o) => Array.isArray(o.items) ? o.items : []);
    const revenue = items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
      0
    );

    const delivered = nonCancelled.filter((o) => (o.status || "") === "Teslim Edildi");
    const deliveredItems = delivered.flatMap((o) => Array.isArray(o.items) ? o.items : []);
    const deliveredRevenue = deliveredItems.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
      0
    );

    return {
      orders: nonCancelled.length,
      revenue,
      deliveredRevenue,
    };
  }, [orders]);

  return (
    <AdminShell title="Dashboard">
      <div className="max-w-6xl mx-auto">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-200 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-900 bg-black/40 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Sipariş</div>
              <ShoppingBag size={18} className="text-zinc-400" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight">{loading ? "..." : summary.orders}</div>
            <div className="mt-2 text-[11px] text-zinc-500">İptaller hariç</div>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-black/40 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Ciro</div>
              <TrendingUp size={18} className="text-zinc-400" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight">{loading ? "..." : `${Math.round(summary.revenue)} ₺`}</div>
            <div className="mt-2 text-[11px] text-zinc-500">Tüm aktif siparişler</div>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-black/40 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Ürün</div>
              <Package size={18} className="text-zinc-400" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight">{loading ? "..." : productsCount}</div>
            <div className="mt-2 text-[11px] text-zinc-500">Yayındaki ürün sayısı</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/panel" className="rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 transition p-5">
            <div className="text-sm font-black">Sipariş Yönetimi</div>
            <div className="text-xs text-zinc-500 mt-2">Siparişleri gör, durum güncelle, indirme dosyaları.</div>
          </Link>
          <Link href="/admin/urunler" className="rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 transition p-5">
            <div className="text-sm font-black">Ürün Yönetimi</div>
            <div className="text-xs text-zinc-500 mt-2">Ürün ekle, fiyat/kategori düzenle, sil.</div>
          </Link>
          <Link href="/admin/raporlar" className="rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 transition p-5">
            <div className="text-sm font-black">Kar/Zarar Raporu</div>
            <div className="text-xs text-zinc-500 mt-2">Ciro, tahmini maliyet, brüt/net kar hesapları.</div>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-900 bg-black/30 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Hızlı Not</div>
          <div className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Raporlar sayfasındaki kar/zarar hesapları, ürün başına maliyet bilgisi olmadığı için varsayımsal (oran bazlı) çalışır. İstersen ürün ekleme formuna "maliyet" alanı ekleyip gerçek brüt kar hesaplatabiliriz.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
