"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, ShieldCheck, ShoppingBag, MapPin, Phone, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
// Context Bağlantısı (EN ÖNEMLİ KISIM)
import { useCart } from '@/context/CartContext';

export default function OdemeSayfasi() {
  const router = useRouter();
  
  // Context'ten verileri çekiyoruz
  const { cart, user, completeOrder } = useCart();
  
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
    // Sepet boşsa anasayfaya at
    if (cart.length === 0) {
       // router.push('/'); // Test ederken zorluk çıkarmaması için kapattım, istersen açabilirsin.
    }

    // Kullanıcı varsa ismini doldur
    if (user) {
        setForm(prev => ({...prev, adSoyad: user.displayName || user.email || ''}));
    }
    
    setYukleniyor(false);
  }, [cart, user, router]);

  const sepetToplami = cart.reduce((total, item) => total + Number(item.price), 0);

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
    if(!form.adSoyad || !form.adres || !form.kartNo) {
        setHataMesaji("Lütfen tüm alanları doldurunuz.");
        return;
    }

    setIslemSuruyor(true);
    setHataMesaji('');

    try {
        // 1. ÖDEME SİMÜLASYONU (Burası banka API'sine gider)
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle

        // 2. SİPARİŞİ KAYDET (Context üzerinden - GÜVENLİ)
        const musteriBilgileri = {
            adSoyad: form.adSoyad,
            adres: form.adres,
            sehir: form.sehir,
            telefon: form.telefon,
            odemeYontemi: "Kredi Kartı"
        };

        const sonuc = await completeOrder(musteriBilgileri);

        if (sonuc.success) {
            alert(`Siparişiniz Başarıyla Alındı! Sipariş No: ${sonuc.orderId}`);
            router.push('/'); // Anasayfaya yönlendir
        } else {
            throw new Error(sonuc.error || "Sipariş kaydedilemedi.");
        }

    } catch (error) {
        console.error("Ödeme hatası:", error);
        setHataMesaji("Bir hata oluştu: " + error.message);
    } finally {
        setIslemSuruyor(false);
    }
  };

  if (yukleniyor) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 py-10 px-4">
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <ShoppingBag className="text-blue-600"/> Sipariş Özeti
                    </h2>
                    
                    <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Sepetiniz boş.</p>
                        ) : (
                            cart.map((urun, index) => (
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
                            <span className="text-green-600 font-bold">Ücretsiz</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
                            <span>Toplam</span>
                            <span>₺{sepetToplami}</span>
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
                        disabled={islemSuruyor || cart.length === 0}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {islemSuruyor ? (
                            <>
                                <Loader2 className="animate-spin" size={20}/>
                                İşleniyor...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={20}/> {sepetToplami} TL Öde
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