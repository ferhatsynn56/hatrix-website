"use client";

import React, { useEffect, useMemo, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
  authDomain: "hatrix-db.firebaseapp.com",
  projectId: "hatrix-db",
  storageBucket: "hatrix-db.firebasestorage.app",
  messagingSenderId: "903710965804",
  appId: "1:903710965804:web:5dc754a337a1d9d7951189",
  measurementId: "G-C03LWY68K7",
};

function safeInitFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  return { app, db };
}

function formatDateTR(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR");
  } catch {
    return "-";
  }
}

function downloadByUrl(url, filename = "dosya.png") {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function safeFileName(s) {
  return String(s || "")
    .replace(/[^\w\-\.]+/g, "_")
    .slice(0, 80);
}

export default function SiparisPaneli() {
  const { db } = useMemo(() => safeInitFirebase(), []);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const STATUS_OPTIONS = useMemo(
    () => ["Sipariş Alındı", "Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal"],
    []
  );

  useEffect(() => {
    const q = query(collection(db, "siparisler"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Sipariş çekme hatası:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [db]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await updateDoc(doc(db, "siparisler", orderId), { status: newStatus });
    } catch (e) {
      console.error("Status güncelleme hatası:", e);
      alert("Durum güncellenemedi. Konsolu kontrol et.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-zinc-900">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-start gap-8">
          {/* Sidebar */}
          <aside className="w-[260px] shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <div className="mb-6">
                <div className="text-lg font-black tracking-tight">STENIST</div>
                <div className="text-[11px] font-bold tracking-[0.25em] text-zinc-400">
                  ADMIN PANELİ
                </div>
              </div>

              <nav className="space-y-2">
                <a
                  href="/admin/panel"
                  className="block px-4 py-3 rounded-xl bg-black text-white font-bold"
                >
                  • Siparişler
                </a>
                <a
                  href="/admin/urunler"
                  className="block px-4 py-3 rounded-xl text-zinc-700 hover:bg-zinc-100 font-bold"
                >
                  Ürün Yönetimi
                </a>
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">
            <header className="mb-6">
              <h1 className="text-4xl font-black tracking-tight">Sipariş Yönetimi</h1>
              <p className="text-sm text-zinc-500 mt-2">
                {loading ? "Yükleniyor..." : `Toplam ${orders.length} sipariş listeleniyor.`}
              </p>
            </header>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                      <th className="p-5">Sipariş ID & Tarih</th>
                      <th className="p-5">Müşteri</th>
                      <th className="p-5 w-[520px]">Ürünler & Tasarımlar</th>
                      <th className="p-5 text-right">Tutar</th>
                      <th className="p-5">Durum</th>
                      <th className="p-5 text-right">İşlem</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!loading && orders.length === 0 && (
                      <tr>
                        <td className="p-6 text-sm text-zinc-500" colSpan={6}>
                          Sipariş yok.
                        </td>
                      </tr>
                    )}

                    {orders.map((o) => {
                      const createdAt = o.createdAt || o.created || o.date || null;
                      const total = Number(o.total || 0);
                      const status = o.status || "Sipariş Alındı";
                      const customer = o.customer || {};
                      const items = Array.isArray(o.items) ? o.items : [];

                      return (
                        <tr key={o.id} className="border-b last:border-b-0 align-top">
                          {/* ID & date */}
                          <td className="p-5">
                            <div className="font-black text-sm">#{String(o.id).slice(0, 10)}...</div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {createdAt ? formatDateTR(createdAt) : "-"}
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="p-5">
                            <div className="font-bold text-sm">{customer.name || "-"}</div>
                            <div className="text-xs text-zinc-500 mt-1">{customer.city || "-"}</div>
                            <div className="text-xs text-zinc-500 mt-1">
                              {customer.phone || "-"}
                            </div>
                          </td>

                          {/* Items */}
                          <td className="p-5">
                            <div className="space-y-4">
                              {items.length === 0 && (
                                <div className="text-sm text-zinc-500">Ürün bulunamadı.</div>
                              )}

                              {items.map((it, idx) => {
                                const name = it.name || "Ürün";
                                const qty = it.quantity || 1;
                                const size = it.size || "Standart";
                                const color = it.color || "#000000";

                                // ✅ Baskı (model üstünde duran) PNG
                                const printFile = it?.designDetails?.printFile || "";

                                // ✅ Kullanıcının yüklediği "ham" görseller (array)
                                const userUploads = Array.isArray(it?.designDetails?.userUploads)
                                  ? it.designDetails.userUploads.filter(Boolean)
                                  : [];

                                // Thumbnail: Önce ürün görseli, yoksa printFile
                                const thumb = it.image || printFile || "";

                                return (
                                  <div key={`${o.id}_${idx}`} className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                                      {thumb ? (
                                        <img
                                          src={thumb}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      ) : null}
                                    </div>

                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="font-black text-sm">
                                          {name} <span className="text-zinc-400 font-bold">x{qty}</span>
                                        </div>
                                      </div>

                                      <div className="text-xs text-zinc-500 mt-1">
                                        • Beden: {size} • Renk:{" "}
                                        <span className="font-mono">{String(color)}</span>
                                      </div>

                                      {/* ✅ İndirme Butonları */}
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {printFile ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              downloadByUrl(
                                                printFile,
                                                `${safeFileName(name)}_${o.id}_baski.png`
                                              )
                                            }
                                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-black hover:bg-blue-700 transition"
                                          >
                                            İndir: Baskı PNG
                                          </button>
                                        ) : null}

                                        {userUploads.length > 0
                                          ? userUploads.map((u, uix) => (
                                              <button
                                                key={`${o.id}_${idx}_u_${uix}`}
                                                type="button"
                                                onClick={() =>
                                                  downloadByUrl(
                                                    u,
                                                    `${safeFileName(name)}_${o.id}_yuklenen_${uix + 1}.png`
                                                  )
                                                }
                                                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 transition"
                                              >
                                                İndir: Yüklenen Görsel {uix + 1}
                                              </button>
                                            ))
                                          : null}

                                        {/* Eğer hiçbir dosya yoksa ufak bilgi */}
                                        {!printFile && userUploads.length === 0 ? (
                                          <span className="text-[11px] text-zinc-400 font-bold">
                                            Dosya yok
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="p-5 text-right">
                            <div className="font-black text-sm">
                              ₺{Number.isFinite(total) ? total.toFixed(2) : "0.00"}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-5">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-black">
                              {status}
                            </div>

                            <div className="mt-3">
                              <select
                                value={status}
                                disabled={updatingId === o.id}
                                onChange={(e) => updateStatus(o.id, e.target.value)}
                                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {updatingId === o.id ? (
                              <div className="text-[11px] text-zinc-400 font-bold mt-2">
                                Güncelleniyor...
                              </div>
                            ) : null}
                          </td>

                          {/* Actions */}
                          <td className="p-5 text-right">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-black hover:opacity-90 transition"
                              onClick={() => alert(`Sipariş: ${o.id}`)}
                            >
                              Detay
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-bold mt-6">
              Not: “Yüklenen Görsel” butonlarının çıkması için siparişe
              <span className="font-mono"> designDetails.userUploads[] </span>
              alanının kaydedilmesi gerekir (aşağıdaki CartContext güncellemesi).
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
