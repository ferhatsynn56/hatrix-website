"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, ShieldCheck, ShoppingBag, MapPin, Phone, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
// Context Bağlantısı (EN ÖNEMLİ KISIM)
import { useCart } from '@/context/CartContext';
import { getCheckoutData, clearCheckoutData } from '@/lib/checkoutStore';

const FREE_SHIPPING_THRESHOLD = 1500;
const SHIPPING_FEE = 70;

export default function OdemeSayfasi() {
  const router = useRouter();
  
  // Context'ten verileri çekiyoruz
  const { cart, user, completeOrder, completeOrderWithItems, clearCart } = useCart();
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [orderNote, setOrderNote] = useState("");
  
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemSuruyor, setIslemSuruyor] = useState(false);
  const [hataMesaji, setHataMesaji] = useState('');

  // Form Bilgileri
  const [form, setForm] = useState({
    adSoyad: '',
    adres: '',
    sehir: '',
    telefon: '',
    kartNo: '',
    skt: '',
    cvv: ''
  });

  // Sayfa Yüklenince
  useEffect(() => {
    const payload = getCheckoutData();
    const parsedCheckoutItems = Array.isArray(payload?.designs)
      ? payload.designs.map((d, idx) => ({
          id: d.id || `checkout_${idx}`,
          name: d.name || `Tasarım ${idx + 1}`,
          price: Number(d.price || 0),
          size: d.size || "M",
          color: d.color || "#000000",
          quantity: Math.max(1, Number(d.quantity || 1)),
          image: d.image || d.preview || d.mockupFiles?.front || null,
          designDetails: d.designDetails || {
            model: d.modelType || "tshirt",
            baseColor: d.color || "#000000",
            stringColor: d.stringColor || "#e6e6e6",
            printTypes: Array.isArray(d.printTypes) ? d.printTypes : [],
            hasPdf: Boolean(d.hasPdf),
            pdfFileUrl: d.pdfFileUrl || null,
            pdfOriginalName: d.pdfOriginalName || "",
            pdfPlacement: d.pdfPlacement || null,
            printFiles: d.printFiles || {},
            textFiles: d.textFiles || {},
            mockupFiles: d.mockupFiles || {},
            userUploads: Array.isArray(d.userUploads) ? d.userUploads : [],
            adjustedUploads: d.adjustedUploads || {},
            sides: d.sides || {},
          },
        }))
      : [];
    setCheckoutItems(parsedCheckoutItems);
    setOrderNote(String(payload?.orderNote || "").trim());

    // Kullanıcı varsa ismini doldur
    if (user) {
        setForm(prev => ({...prev, adSoyad: user.displayName || user.email || ''}));
    }
    
    setYukleniyor(false);
  }, [cart, user, router]);

  const sourceItems = cart.length > 0 ? cart : checkoutItems;
  const normalizedSourceItems = sourceItems.map((item, index) => ({
    id: item?.id || `itm_${index}`,
    name: item?.name || item?.isim || `Ürün ${index + 1}`,
    price: Number(item?.price ?? item?.fiyat ?? 0),
    size: item?.size || item?.beden || "M",
    color: item?.color || item?.renk || "Standart",
    quantity: Math.max(1, Number(item?.quantity || 1)),
    image: item?.image || item?.resim || item?.preview || "https://placehold.co/100x100",
    designDetails: item?.designDetails,
  }));

  const sepetToplami = normalizedSourceItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const shippingPrice = sepetToplami >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const orderTotal = sepetToplami + shippingPrice;

  // KART FORMATLAMA (0000 0000 0000 0000)
  const kartNoFormatla = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(' ');
    return value;
  };

  // ÖDEME İŞLEMİ
  const odemeyiTamamla = async () => {
    if (!form.adSoyad || !form.adres || !form.sehir || !form.telefon || !form.kartNo || !form.skt || !form.cvv) {
      setHataMesaji("Lütfen tüm alanları doldurunuz.");
      return;
    }

    if (normalizedSourceItems.length === 0) {
      setHataMesaji("Sepetiniz boş.");
      return;
    }

    setIslemSuruyor(true);
    setHataMesaji('');

    try {
      const paymentPayload = {
        kartBilgileri: {
          adSoyad: form.adSoyad,
          kartNo: form.kartNo,
          skt: form.skt,
          cvv: form.cvv,
        },
        sepet: normalizedSourceItems.map((item, index) => ({
          id: item.id || `itm-${index + 1}`,
          name: item.name || `Urun ${index + 1}`,
          price: Number(item.price || 0),
          quantity: Math.max(1, Number(item.quantity || 1)),
          modelType: item?.designDetails?.model || item?.designDetails?.modelType || item?.modelType || null,
          designDetails: item?.designDetails || null,
        })),
        tutar: Number(orderTotal.toFixed(2)),
        musteri: {
          adSoyad: form.adSoyad,
          adres: form.adres,
          sehir: form.sehir,
          telefon: form.telefon,
          email: user?.email || "",
          siparisNotu: orderNote,
        },
      };

      const paymentResponse = await fetch("/api/odeme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const paymentJson = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentJson?.success) {
        throw new Error(paymentJson?.message || "Ödeme işlemi başarısız.");
      }

      const musteriBilgileri = {
        adSoyad: form.adSoyad,
        adres: form.adres,
        sehir: form.sehir,
        telefon: form.telefon,
        odemeYontemi: "Kredi Kartı",
        siparisNotu: orderNote,
      };

      const usingCheckoutFlow = cart.length === 0 && checkoutItems.length > 0;
      const sonuc = usingCheckoutFlow
        ? await completeOrderWithItems(checkoutItems, musteriBilgileri)
        : await completeOrder(musteriBilgileri);

      if (usingCheckoutFlow) setCheckoutItems([]);
      clearCheckoutData();
      clearCart();

      console.log("completeOrder sonucu:", sonuc);
      router.push('/');

    } catch (error) {
        console.error("Ödeme hatası:", error);
        setHataMesaji("Bir hata oluştu: " + error.message);
    } finally {
        setIslemSuruyor(false);
    }
  };

  if (yukleniyor) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 py-8 sm:py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Üst Başlık */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition">
                <ArrowLeft size={20}/>
            </Link>
            <h1 className="text-2xl font-black tracking-tight">Güvenli Ödeme</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SOL TARAF: FORM */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Teslimat Bilgileri */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <MapPin className="text-blue-600"/> Teslimat Adresi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">AD SOYAD</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-medium" 
                                    value={form.adSoyad} onChange={e => setForm({...form, adSoyad: e.target.value})} placeholder="Adınız Soyadınız" />
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">TELEFON</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-medium" 
                                    value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})} placeholder="05XX XXX XX XX" />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">ADRES</label>
                            <textarea rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-medium" 
                                value={form.adres} onChange={e => setForm({...form, adres: e.target.value})} placeholder="Mahalle, Sokak, No..."></textarea>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">ŞEHİR / İLÇE</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-medium" 
                                value={form.sehir} onChange={e => setForm({...form, sehir: e.target.value})} placeholder="İstanbul / Kadıköy" />
                        </div>
                    </div>
                </div>

                {/* 2. Ödeme Bilgileri */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <CreditCard className="text-blue-600"/> Kart Bilgileri
                        </h2>
                        <div className="flex gap-2 opacity-50">
                            <div className="h-6 w-10 bg-gray-200 rounded"></div>
                            <div className="h-6 w-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex items-start gap-3">
                        <Lock size={18} className="text-blue-600 mt-0.5 flex-shrink-0"/>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            Ödemeniz <strong>256-bit SSL</strong> sertifikası ile korunmaktadır. Kart bilgileriniz sunucularımızda asla saklanmaz.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">KART NUMARASI</label>
                            <input 
                                type="text" maxLength="19" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono text-sm" 
                                placeholder="0000 0000 0000 0000" 
                                value={form.kartNo} onChange={e => setForm({...form, kartNo: kartNoFormatla(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">SON KULLANMA</label>
                            <input 
                                type="text" maxLength="5" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-center text-sm" 
                                placeholder="MM/YY" 
                                value={form.skt} onChange={e => setForm({...form, skt: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">CVV</label>
                            <input 
                                type="text" maxLength="3" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-center text-sm" 
                                placeholder="123" 
                                value={form.cvv} onChange={e => setForm({...form, cvv: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* SAĞ TARAF: SİPARİŞ ÖZETİ */}
            <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:sticky lg:top-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <ShoppingBag className="text-blue-600"/> Sipariş Özeti
                    </h2>
                    
                    <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {normalizedSourceItems.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Sepetiniz boş.</p>
                        ) : (
                            normalizedSourceItems.map((urun, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                                        <img src={urun.image || "https://placehold.co/100x100"} className="w-full h-full object-cover" alt=""/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{urun.name}</p>
                                        <p className="text-xs text-gray-500 mb-1">{urun.size} - {urun.color}</p>
                                        <p className="text-sm font-bold text-black">₺{urun.price}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Ara Toplam</span>
                            <span>₺{sepetToplami}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Kargo</span>
                            {shippingPrice === 0 ? (
                                <span className="text-green-600 font-bold">Ücretsiz</span>
                            ) : (
                                <span>₺{shippingPrice}</span>
                            )}
                        </div>
                        <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
                            <span>Toplam</span>
                            <span>₺{orderTotal}</span>
                        </div>
                    </div>
                    
                    {/* Hata Mesajı */}
                    {hataMesaji && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold mb-4 flex items-start gap-2">
                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>
                            <span>{hataMesaji}</span>
                        </div>
                    )}

                    <button 
                        onClick={odemeyiTamamla}
                        disabled={islemSuruyor || normalizedSourceItems.length === 0}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {islemSuruyor ? (
                            <>
                                <Loader2 className="animate-spin" size={20}/>
                                İşleniyor...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={20}/> {orderTotal} TL Öde
                            </>
                        )}
                    </button>
                    
                    <div className="mt-4 flex justify-center items-center gap-2 text-gray-400">
                        <Lock size={12}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payment</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
