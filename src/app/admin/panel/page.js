"use client";

import { useEffect, useState } from "react";
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
  FileText,
} from "lucide-react";

const statusOptions = ["Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal"];

const MODEL_CM_LABELS = {
  tshirt: { front: { w: 40, h: 54 }, back: { w: 40, h: 54 } },
  sweatshirt: { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "sweat-yeni": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "sweat-deneme": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  hoodie: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-cepli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-ceplipli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-v12-canavari": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "oversize-hoodie-parcali": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "oversize-tshirt": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "oversize-tshirt-efektli": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "oversize-sweat": { front: { w: 58, h: 58 }, back: { w: 58, h: 58 } },
  fermuarli: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  polar: { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "polar-son": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "yeni-duz-tshirt": { front: { w: 40, h: 54 }, back: { w: 40, h: 54 } },
  "yeni-oversize-tshirt": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "yeni-duz-sweat": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "yeni-oversize-sweat": { front: { w: 58, h: 58 }, back: { w: 58, h: 58 } },
  "yeni-fermuarli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
};

/* ================= helpers ================= */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const roundTo = (v, digits = 2) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

const formatDate = (ts) => {
  try {
    if (!ts) return "";
    const asSeconds =
      typeof ts === "object" && ts !== null && Number.isFinite(Number(ts.seconds))
        ? Number(ts.seconds) * 1000
        : null;
    const d = ts?.toDate ? ts.toDate() : new Date(asSeconds || ts);
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
    if (typeof ts === "object" && ts !== null && Number.isFinite(Number(ts.seconds))) {
      return Number(ts.seconds) * 1000;
    }
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    const d = new Date(ts);
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
};

const resolveOrderDateValue = (order) =>
  order?.createdAt ||
  order?.createdAtClient ||
  order?.paymentDate ||
  order?.updatedAt ||
  order?.tarih ||
  order?.date ||
  null;

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

const estimateTextHalfBounds01 = (textState = {}) => {
  const rawText = String(textState?.text || "").trim();
  const text = rawText || "W";
  const charCount = Math.max(1, text.length);
  const size = clamp(Number(textState?.size) || 150, 30, 420);
  const scaleX = clamp(Number(textState?.scaleX) || 1, 0.3, 3);
  const scaleY = clamp(Number(textState?.scaleY) || 1, 0.3, 3);
  const layout = String(textState?.layout || "straight");
  const curve = clamp(Number(textState?.curve) || 30, 0, 100);

  const avgGlyphW = size * 0.58 * scaleX;
  const spacing = size * 0.03 * scaleX;
  const baseW = Math.max(size * 0.75 * scaleX, charCount * avgGlyphW + (charCount - 1) * spacing);
  let boxW = baseW;
  let boxH = size * 1.15 * scaleY;

  if (layout === "wave") boxH += size * (curve / 100) * 0.9 * scaleY;
  if (layout === "zigzag") boxH += size * (curve / 100) * 1.45 * scaleY;
  if (layout === "stair-up" || layout === "stair-down") boxH += size * (curve / 100) * 1.7 * scaleY;
  if (layout === "arc-up" || layout === "arc-down") {
    boxH += size * (curve / 100) * 1.35 * scaleY;
    boxW += size * 0.2 * scaleX;
  }
  if (layout === "arc-up-strong" || layout === "arc-down-strong") {
    boxH += size * (curve / 100) * 1.8 * scaleY;
    boxW += size * 0.28 * scaleX;
  }

  const pad = size * 0.1;
  return {
    halfW01: clamp((boxW / 2 + pad) / 1024, 0.035, 0.49),
    halfH01: clamp((boxH / 2 + pad) / 1024, 0.035, 0.49),
  };
};

const getModelPrintCm = (modelType, side = "front") => {
  const safeModel = String(modelType || "").trim().toLowerCase();
  const modelCm = MODEL_CM_LABELS[safeModel] || MODEL_CM_LABELS["yeni-duz-tshirt"];
  const sideKey = side === "back" ? "back" : "front";
  const cm = modelCm?.[sideKey] || modelCm?.front || { w: 0, h: 0 };
  return {
    w: Number(cm?.w) || 0,
    h: Number(cm?.h) || 0,
  };
};

const normalizePrintTypesBySide = (bySide, legacy = []) => {
  const base = { front: [], back: [] };
  const raw = bySide && typeof bySide === "object" ? bySide : {};
  const legacyList = Array.isArray(legacy) ? legacy : [];
  return {
    front: Array.from(new Set([...(Array.isArray(raw.front) ? raw.front : []), ...legacyList])),
    back: Array.from(new Set(Array.isArray(raw.back) ? raw.back : [])),
  };
};

const buildRubberSpecsBySide = (item, dd) => {
  const saved = dd?.rubberSpecsBySide;
  if (saved && typeof saved === "object" && Object.keys(saved).length > 0) {
    return saved;
  }

  const bySide = normalizePrintTypesBySide(dd?.printTypesBySide, dd?.printTypes);
  const sides = dd?.sides || {};
  const result = {};

  ["front", "back"].forEach((side) => {
    const sideTypes = Array.isArray(bySide?.[side]) ? bySide[side] : [];
    if (!sideTypes.includes("rubber")) return;

    const t = sides?.[side]?.customText || {};
    const rawText = String(t?.text || "").trim();
    if (!rawText) return;

    const cm = getModelPrintCm(dd?.model || item?.modelType, side);
    const textBounds = estimateTextHalfBounds01(t);
    const sizeWcm = cm.w > 0 ? roundTo(textBounds.halfW01 * 2 * cm.w, 2) : 0;
    const sizeHcm = cm.h > 0 ? roundTo(textBounds.halfH01 * 2 * cm.h, 2) : 0;
    const rubberDepth = 0.2;
    const letterSpacingFactor = clamp(Number(t?.rubberLetterSpacing ?? 1), 0.2, 3);
    const textSizePx = clamp(Number(t?.size) || 150, 30, 420);
    const textScaleX = clamp(Number(t?.scaleX) || 1, 0.3, 3);
    const spacingCm =
      cm.w > 0 ? roundTo((((textSizePx * 0.03 * textScaleX) / 1024) * cm.w) * letterSpacingFactor, 2) : 0;

    result[side] = {
      side,
      text: rawText,
      color: t?.color || "#ffffff",
      font: t?.font || "",
      sizeCm: { w: sizeWcm, h: sizeHcm },
      thicknessMm: roundTo(rubberDepth * 10, 2),
      letterSpacingCm: spacingCm,
      letterSpacingFactor: roundTo(letterSpacingFactor, 2),
    };
  });

  return result;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

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
        list.sort((a, b) => getMillis(resolveOrderDateValue(b)) - getMillis(resolveOrderDateValue(a)));
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
              (sum, it) => sum + Number(it.price ?? it.fiyat ?? 0) * Number(it.quantity || 1),
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
                        Tarih: {formatDate(resolveOrderDateValue(order)) || "-"}
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
                            <span className="text-zinc-500 block text-xs mb-0.5">Sipariş Tarihi:</span>{" "}
                            {formatDate(resolveOrderDateValue(order)) || "-"}
                          </p>
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
                          const textFiles = dd.textFiles || {};
                          const adjustedUploads = dd.adjustedUploads || {};
                          const hasPdf = Boolean(dd.hasPdf && dd.pdfFileUrl);
                          const pdfPlacement =
                            dd.pdfPlacement && typeof dd.pdfPlacement === "object"
                              ? dd.pdfPlacement
                              : null;
                          const rubberSpecsBySide = buildRubberSpecsBySide(item, dd);
                          const rubberSpecEntries = Object.entries(rubberSpecsBySide || {}).filter(
                            ([_, spec]) => spec && String(spec?.text || "").trim()
                          );

                          // ✅ userUploads yoksa sides’tan otomatik çıkar
                          const userUploads =
                            Array.isArray(dd.userUploads) && dd.userUploads.length > 0
                              ? dd.userUploads
                              : extractUserUploadsFromSides(dd);

                          // ✅ ana görsel: front mockup > herhangi mockup > item.image
                          const mainPreview =
                            mockupFiles.front || pickAny(mockupFiles) || item.image || item.resim || null;

                          const itemName = safeFileName(item.name || item.isim || `urun_${idx + 1}`);
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

                                  <h4 className="text-lg font-bold text-white">{item.name || item.isim || `Ürün ${idx + 1}`}</h4>
                                  <div className="flex gap-4 text-xs text-zinc-400 mt-1">
                                    <span>
                                      Beden: <b className="text-white">{item.size || item.beden || "-"}</b>
                                    </span>
                                    <span>
                                      Renk: <b className="text-white">{item.color || item.renk || "-"}</b>
                                    </span>
                                    <span>
                                      Adet: <b className="text-white">{item.quantity}</b>
                                    </span>
                                  </div>
                                  <div className="mt-2 text-xs text-zinc-500 font-mono">Model Kodu: {dd.model || "-"}</div>
                                </div>

                                {/* SAĞ */}
                                <div className="lg:w-2/3 grid gap-6">
                                  {/* Rubber text teknik bilgiler */}
                                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-orange-300">
                                      <FileText size={16} />
                                      <h5 className="text-xs font-black uppercase tracking-wider">
                                        Rubber Yazı Teknik Bilgileri
                                      </h5>
                                    </div>

                                    {rubberSpecEntries.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {rubberSpecEntries.map(([side, spec]) => {
                                          const sw = Number(spec?.sizeCm?.w || 0);
                                          const sh = Number(spec?.sizeCm?.h || 0);
                                          const thicknessMm = Number(spec?.thicknessMm || 0);
                                          const spacingCm = Number(spec?.letterSpacingCm || 0);
                                          const spacingFactor = Number(spec?.letterSpacingFactor || 0);
                                          const colorHex = String(spec?.color || "#ffffff");
                                          return (
                                            <div key={`rubber-spec-${side}`} className="rounded-lg border border-zinc-700 bg-black/40 p-3 space-y-1.5">
                                              <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                                                {side === "back" ? "Arka Yüz" : "Ön Yüz"}
                                              </p>
                                              <p className="text-xs text-zinc-300 break-words">
                                                <span className="text-zinc-500">Metin:</span> {String(spec?.text || "-")}
                                              </p>
                                              <div className="flex items-center gap-2 text-xs text-zinc-300">
                                                <span className="text-zinc-500">Renk:</span>
                                                <span className="inline-flex w-3.5 h-3.5 rounded-full border border-zinc-500" style={{ backgroundColor: colorHex }} />
                                                <span className="font-mono">{colorHex}</span>
                                              </div>
                                              <p className="text-xs text-zinc-300">
                                                <span className="text-zinc-500">Boyut:</span>{" "}
                                                {sw > 0 && sh > 0 ? `${sw.toFixed(2)} × ${sh.toFixed(2)} cm` : "-"}
                                              </p>
                                              <p className="text-xs text-zinc-300">
                                                <span className="text-zinc-500">Kalınlık:</span>{" "}
                                                {thicknessMm > 0 ? `${thicknessMm.toFixed(2)} mm` : "-"}
                                              </p>
                                              <p className="text-xs text-zinc-300">
                                                <span className="text-zinc-500">Harf Aralığı:</span>{" "}
                                                {spacingCm > 0 ? `${spacingCm.toFixed(2)} cm` : "-"}
                                                {spacingFactor > 0 ? ` (${spacingFactor.toFixed(2)}x)` : ""}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-500 italic">
                                        Rubber yazı bilgisi yok.
                                      </p>
                                    )}
                                  </div>

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

                                  {/* A.3) Text-only */}
                                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-amber-300">
                                      <FileText size={16} />
                                      <h5 className="text-xs font-black uppercase tracking-wider">
                                        PDF Yerleşim Dosyası
                                      </h5>
                                    </div>

                                    {hasPdf ? (
                                      <div className="space-y-3">
                                        <div className="rounded-lg border border-zinc-700 bg-black/40 p-3">
                                          <p className="text-[10px] font-bold uppercase text-zinc-400">Dosya</p>
                                          <p className="text-xs text-zinc-200 break-all">
                                            {dd.pdfOriginalName || "pdf-dosya.pdf"}
                                          </p>
                                        </div>

                                        <button
                                          onClick={() =>
                                            downloadByUrl(
                                              dd.pdfFileUrl,
                                              `PDF_${orderShort}_${itemName}.pdf`
                                            )
                                          }
                                          className="w-full bg-amber-900/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-800/50 rounded py-2 text-[10px] font-bold transition flex items-center justify-center gap-1"
                                        >
                                          <Download size={10} /> PDF İNDİR
                                        </button>

                                        <div className="rounded-lg border border-zinc-700 bg-black/40 p-3 text-[11px] text-zinc-300 space-y-1">
                                          <p>
                                            <span className="text-zinc-500 uppercase text-[10px]">Yüzey:</span>{" "}
                                            {pdfPlacement?.side === "back" ? "Arka" : "Ön"}
                                          </p>
                                          <p>
                                            <span className="text-zinc-500 uppercase text-[10px]">X:</span>{" "}
                                            {Number(pdfPlacement?.x || 0).toFixed(3)}
                                          </p>
                                          <p>
                                            <span className="text-zinc-500 uppercase text-[10px]">Y:</span>{" "}
                                            {Number(pdfPlacement?.y || 0).toFixed(3)}
                                          </p>
                                          <p>
                                            <span className="text-zinc-500 uppercase text-[10px]">Scale:</span>{" "}
                                            {Number(pdfPlacement?.scale || pdfPlacement?.w || 0).toFixed(3)}
                                          </p>
                                          <p>
                                            <span className="text-zinc-500 uppercase text-[10px]">Rotation:</span>{" "}
                                            {Math.round(Number(pdfPlacement?.rotation || 0))}°
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-500 italic">PDF dosyası yok.</p>
                                    )}
                                  </div>

                                  {/* A.3) Text-only */}
                                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3 text-cyan-300">
                                      <ImageIcon size={16} />
                                      <h5 className="text-xs font-black uppercase tracking-wider">
                                        Yazı Dosyaları (Sadece Metin)
                                      </h5>
                                    </div>

                                    {Object.keys(textFiles).length > 0 ? (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.entries(textFiles).map(([side, url]) => (
                                          <div key={side} className="bg-black border border-zinc-700 rounded-lg p-2 text-center">
                                            <div className="aspect-square mb-2 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
                                              <img src={url} className="max-w-full max-h-full object-contain" alt="" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">{side}</p>
                                            <button
                                              onClick={() =>
                                                downloadByUrl(url, `YAZI_${orderShort}_${itemName}_${side}.png`)
                                              }
                                              className="w-full bg-cyan-900/30 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-800/50 rounded py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1"
                                            >
                                              <Download size={10} /> İNDİR
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-zinc-500 italic">Yazı dosyası yok.</p>
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
