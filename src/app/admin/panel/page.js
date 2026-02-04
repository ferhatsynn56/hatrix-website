"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import AdminShell from "@/components/AdminShell";
import {
  Loader2,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
  Printer,
} from "lucide-react";

const statusOptions = ["Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal"];

/* ================= helpers ================= */
const formatDate = (ts) => {
  try {
    if (!ts) return "";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const getMillis = (ts) => {
  try {
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    const d = new Date(ts);
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
};

const safeFileName = (name) => {
  return String(name || "dosya")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
};

// ✅ dataURL gelirse fetch yapmadan indir (senin tasarım tarafında base64 çok dönüyor)
const downloadByUrl = async (url, filename) => {
  if (!url) return;

  const finalName = safeFileName(filename || "dosya.png");

  try {
    // data:image/png;base64,... gibi gelirse direkt indir
    if (typeof url === "string" && url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // normal URL ise blob ile indir
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch (error) {
    console.error("İndirme hatası:", error);
    // Hata olursa yeni sekmede aç
    window.open(url, "_blank");
  }
};

// ✅ sides içinden (front/back/left/right) ham yüklemeleri topla
const extractUserUploadsFromSides = (dd) => {
  const sides = dd?.sides || {};
  const urls = [];

  for (const sd of Object.values(sides)) {
    const logos = Array.isArray(sd?.logos) ? sd.logos : [];
    for (const l of logos) {
      if (l?.url) urls.push(l.url);
    }
  }
  // dedupe
  return Array.from(new Set(urls));
};

const pickAny = (obj) => {
  if (!obj) return null;
  const entries = Object.entries(obj).filter(([_, v]) => !!v);
  return entries[0]?.[1] || null;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    try {
      const ok = localStorage.getItem("hatrix_admin_auth") === "1";
      if (!ok) router.push("/admin");
    } catch {
      router.push("/admin");
    }
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
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
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
        setOrders(list);
      } catch (error) {
        console.error("Siparişler çekilemedi:", error);
        if (error?.code === "permission-denied") {
          setErrorMsg("Firestore izin hatası: 'siparisler' koleksiyonu için okuma yetkisi yok. Firebase Console > Firestore Database > Rules kısmından admin için read izni vermen gerekiyor (veya Anonymous Auth/Email login ile request.auth dolu olmalı).");
        } else {
          setErrorMsg("Siparişler çekilemedi.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const changeStatus = async (orderId, newStatus) => {
    try {
      const refDoc = doc(db, "siparisler", orderId);
      await updateDoc(refDoc, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (error) {
      alert("Durum güncellenemedi.");
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm("Bu siparişi tamamen silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "siparisler", orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      alert("Silme işlemi başarısız.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-white">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <AdminShell title="Siparişler">
      <div className="max-w-6xl mx-auto">

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-200 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {orders.length === 0 && <p className="text-zinc-500 text-center py-10">Henüz sipariş yok.</p>}

          {orders.map((order) => {
            const items = order.items || [];
            const totalPrice = items.reduce(
              (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
              0
            );
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-zinc-950 border transition-colors duration-300 rounded-2xl overflow-hidden ${
                  isExpanded ? "border-zinc-600" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* HEADER */}
                <div
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono">
                        {order.id.slice(0, 8)}...
                      </span>
                      <span className="text-xs font-bold text-zinc-300">
                        Tarih: {formatDate(order.createdAt) || "-"}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {order.customer?.adSoyad || order.customer?.name || "İsimsiz Müşteri"}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      {items.length} Ürün • Toplam:{" "}
                      <span className="text-green-400 font-bold">{totalPrice} ₺</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.status || "Hazırlanıyor"}
                      onChange={(e) => changeStatus(order.id, e.target.value)}
                      className={`appearance-none bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-zinc-800 focus:outline-none focus:border-white transition
                        ${order.status === "Teslim Edildi" ? "text-green-400 border-green-900" : "text-zinc-300"}`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button onClick={() => toggleExpand(order.id)} className="p-2 rounded-full hover:bg-zinc-800 transition">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* DETAY */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-900/30 p-5 md:p-8 space-y-8 animate-in slide-in-from-top-2">
                    {/* Müşteri */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                          TESLİMAT BİLGİLERİ
                        </h3>
                        <div className="space-y-2 text-sm text-zinc-300">
                          <p>
                            <span className="text-zinc-500 block text-xs mb-0.5">Müşteri:</span>{" "}
                            {order.customer?.adSoyad || "-"}
                          </p>
                          <p>
                            <span className="text-zinc-500 block text-xs mb-0.5">Telefon:</span>{" "}
                            {order.customer?.telefon || "-"}
                          </p>
                          <p>
                            <span className="text-zinc-500 block text-xs mb-0.5">Şehir:</span>{" "}
                            {order.customer?.sehir || "-"}
                          </p>
                          <p>
                            <span className="text-zinc-500 block text-xs mb-0.5">Adres:</span>{" "}
                            {order.customer?.adres || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-black/40 border border-zinc-800 rounded-xl p-5 flex flex-col justify-center items-center text-center">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                          ÖDEME YÖNTEMİ
                        </h3>
                        <p className="text-xl font-black text-white">{order.customer?.odemeYontemi || "Kredi Kartı"}</p>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="mt-4 text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Siparişi Sil
                        </button>
                      </div>
                    </div>

                    {/* Ürünler */}
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-800 pb-2">
                        SİPARİŞ İÇERİĞİ
                      </h3>

                      <div className="space-y-12">
                        {items.map((item, idx) => {
                          const dd = item.designDetails || {};

                          const mockupFiles = dd.mockupFiles || {};
                          const printFiles = dd.printFiles || {};
                          const adjustedUploads = dd.adjustedUploads || {};

                          // ✅ userUploads yoksa sides’tan otomatik çıkar
                          const userUploads =
                            Array.isArray(dd.userUploads) && dd.userUploads.length > 0
                              ? dd.userUploads
                              : extractUserUploadsFromSides(dd);

                          // ✅ ana görsel: front mockup > herhangi mockup > item.image
                          const mainPreview = mockupFiles.front || pickAny(mockupFiles) || item.image || null;

                          const itemName = safeFileName(item.name || `urun_${idx + 1}`);
                          const orderShort = order.id.slice(0, 8);

                          return (
                            <div key={idx} className="bg-black border border-zinc-800 rounded-2xl p-6 relative">
                              <div className="absolute top-4 right-4 bg-white text-black text-xs font-bold px-2 py-1 rounded">
                                #{idx + 1}
                              </div>

                              <div className="flex flex-col lg:flex-row gap-8">
                                {/* SOL */}
                                <div className="lg:w-1/3">
                                  <div className="aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 mb-4 relative group">
                                    {mainPreview ? (
                                      <img src={mainPreview} className="w-full h-full object-contain" alt="Mockup" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                                        Görsel Yok
                                      </div>
                                    )}

                                    {mainPreview && (
                                      <button
                                        onClick={() =>
                                          downloadByUrl(
                                            mainPreview,
                                            `Mockup_${orderShort}_${itemName}.png`
                                          )
                                        }
                                        className="absolute bottom-2 right-2 bg-white text-black p-2 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg"
                                        title="Önizlemeyi İndir"
                                      >
                                        <Download size={16} />
                                      </button>
                                    )}
                                  </div>

                                  <h4 className="text-lg font-bold text-white">{item.name}</h4>
                                  <div className="flex gap-4 text-xs text-zinc-400 mt-1">
                                    <span>
                                      Beden: <b className="text-white">{item.size}</b>
                                    </span>
                                    <span>
                                      Renk: <b className="text-white">{item.color}</b>
                                    </span>
                                    <span>
                                      Adet: <b className="text-white">{item.quantity}</b>
                                    </span>
                                  </div>
                                  <div className="mt-2 text-xs text-zinc-500 font-mono">Model Kodu: {dd.model || "-"}</div>
                                </div>

                                {/* SAĞ */}
                                <div className="lg:w-2/3 grid gap-6">
                                  {/* A) Print */}
                                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-emerald-400">
                                      <Printer size={16} />
                                      <h5 className="text-xs font-black uppercase tracking-wider">
                                        Üretim Dosyaları (Baskı PNG)
                                      </h5>
                                    </div>

                                    {Object.keys(printFiles).length > 0 ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.entries(printFiles).map(([side, url]) => (
                                          <div key={side} className="bg-black border border-zinc-700 rounded-lg p-2 text-center group relative">
                                            <div className="aspect-square mb-2 bg-zinc-900 rounded overflow-hidden flex items-center justify-center">
                                              <img src={url} className="max-w-full max-h-full object-contain" alt="" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">{side}</p>
                                            <button
                                              onClick={() =>
                                                downloadByUrl(url, `BASKI_${orderShort}_${itemName}_${side}.png`)
                                              }
                                              className="w-full bg-emerald-900/30 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-800/50 rounded py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1"
                                            >
                                              <Download size={10} /> İNDİR
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-500 italic">
                                        Baskı dosyası bulunamadı. (Tasarım sayfasında `printFiles` oluşmuyor olabilir.)
                                      </p>
                                    )}
                                  </div>

                                  {/* A.5) Adjusted uploads */}
                                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-fuchsia-400">
                                      <ImageIcon size={16} />
                                      <h5 className="text-xs font-black uppercase tracking-wider">
                                        Ayarlanmış Görseller (Son Hali)
                                      </h5>
                                    </div>

                                    {Object.keys(adjustedUploads).length > 0 ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.entries(adjustedUploads).map(([side, list]) => (
                                          <div key={side} className="bg-black border border-zinc-700 rounded-lg p-3">
                                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-3">{side}</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                              {(Array.isArray(list) ? list : []).map((url, uIdx) => (
                                                <div key={uIdx} className="bg-zinc-900 border border-zinc-700 rounded p-2 text-center">
                                                  <div className="aspect-square mb-2 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
                                                    <img src={url} className="max-w-full max-h-full object-contain" alt="" />
                                                  </div>
                                                  <button
                                                    onClick={() =>
                                                      downloadByUrl(
                                                        url,
                                                        `AYARLI_${orderShort}_${itemName}_${side}_${uIdx + 1}.png`
                                                      )
                                                    }
                                                    className="w-full bg-fuchsia-900/30 hover:bg-fuchsia-600 text-fuchsia-300 hover:text-white border border-fuchsia-800/50 rounded py-1 text-[10px] font-bold transition flex items-center justify-center gap-1"
                                                  >
                                                    <Download size={10} /> İNDİR
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-500 italic">
                                        Ayarlanmış görsel bulunamadı.
                                      </p>
                                    )}
                                  </div>

                                  {/* B) Mockup */}
                                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-blue-400">
                                      <ImageIcon size={16} />
                                      <h5 className="text-xs font-black uppercase tracking-wider">Model Görünümleri (Mockup)</h5>
                                    </div>

                                    {Object.keys(mockupFiles).length > 0 ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.entries(mockupFiles).map(([side, url]) => (
                                          <div key={side} className="bg-black border border-zinc-700 rounded-lg p-2 text-center">
                                            <div className="aspect-square mb-2 rounded overflow-hidden bg-zinc-800">
                                              <img src={url} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">{side}</p>
                                            <button
                                              onClick={() =>
                                                downloadByUrl(url, `MOCKUP_${orderShort}_${itemName}_${side}.png`)
                                              }
                                              className="w-full bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-800/50 rounded py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1"
                                            >
                                              <Download size={10} /> İNDİR
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-500 italic">Mockup bulunamadı.</p>
                                    )}
                                  </div>

                                  {/* C) User uploads */}
                                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-purple-400">
                                      <ExternalLink size={16} />
                                      <h5 className="text-xs font-black uppercase tracking-wider">Müşteri Görselleri (Ham Hali)</h5>
                                    </div>

                                    {userUploads.length > 0 ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {userUploads.map((url, uIdx) => (
                                          <div key={uIdx} className="bg-black border border-zinc-700 rounded-lg p-2 text-center">
                                            <div className="aspect-square mb-2 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
                                              <img src={url} className="max-w-full max-h-full object-contain" alt="" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Görsel {uIdx + 1}</p>
                                            <button
                                              onClick={() =>
                                                downloadByUrl(url, `MUSTERI_GORSEL_${orderShort}_${itemName}_${uIdx + 1}.png`)
                                              }
                                              className="w-full bg-purple-900/30 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-800/50 rounded py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1"
                                            >
                                              <Download size={10} /> İNDİR
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-500 italic">
                                        Müşteri görsel yüklememiş (Sadece yazı veya hazır tasarım).
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
