"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, ShieldCheck, ShoppingBag, MapPin, Phone, User, Lock, AlertCircle } from 'lucide-react';
// Firebase
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function OdemeSayfasi() {
  const router = useRouter();
  
  const [sepet, setSepet] = useState([]);
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemSuruyor, setIslemSuruyor] = useState(false);
  const [hataMesaji, setHataMesaji] = useState('');

  // Form Bilgileri
  const [form, setForm] = useState({
    adSoyad: '',
    adres: '',
    sehir: '',
    telefon: '',
    // Kart bilgileri (Sadece API'ye gidecek, veritabanına kaydedilmeyecek)
    kartNo: '',
    skt: '',
    cvv: ''
  });

  // Kullanıcı ve Sepet Kontrolü
  useEffect(() => {
    // Sepeti LocalStorage'dan al
    const kayitliSepet = localStorage.getItem('sepet');
    if (kayitliSepet) {
        setSepet(JSON.parse(kayitliSepet));
    } else {
        router.push('/');
    }

    // Oturum kontrolü
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setKullanici(user);
            // Varsa kullanıcının ismini otomatik doldur
            setForm(prev => ({...prev, adSoyad: user.displayName || ''}));
        } else {
            alert("Ödeme yapmak için giriş yapmalısınız.");
            router.push('/giris');
        }
        setYukleniyor(false);
    });

    return () => unsubscribe();
  }, [router]);

  const sepetToplami = sepet.reduce((total, item) => total + Number(item.fiyat), 0);

  // KART FORMATLAMA (Görsel Düzeltme: 0000 0000 0000 0000)
  const kartNoFormatla = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // ÖDEME İŞLEMİ (GÜVENLİ YOL)
  const odemeyiTamamla = async (e) => {
    e.preventDefault();
    setIslemSuruyor(true);
    setHataMesaji('');

    try {
        // 1. Backend API'ye İsteği Gönder (Kart bilgileri sunucuda işlenir)
        const apiResponse = await fetch('/api/odeme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                kartBilgileri: {
                    no: form.kartNo,
                    skt: form.skt,
                    cvv: form.cvv
                },
                sepet: sepet,
                tutar: sepetToplami
            })
        });

        const sonuc = await apiResponse.json();

        if (!sonuc.success) {
            throw new Error(sonuc.message || "Ödeme banka tarafından reddedildi.");
        }

        // 2. Ödeme Başarılıysa Siparişi Firestore'a Kaydet
        // (Dikkat: Kart bilgilerini BURAYA KAYDETMİYORUZ)
        await addDoc(collection(db, "siparisler"), {
            kullaniciId: kullanici.uid,
            kullaniciEmail: kullanici.email,
            siparisNo: sonuc.siparisNo, // API'den gelen banka referans no
            adSoyad: form.adSoyad,
            adres: form.adres,
            sehir: form.sehir,
            telefon: form.telefon,
            urunler: sepet,
            toplamTutar: sepetToplami,
            odemeDurumu: "Ödendi",
            durum: "Hazırlanıyor",
            tarih: Timestamp.now()
        });

        // 3. Temizlik ve Yönlendirme
        localStorage.removeItem('sepet');
        alert("Siparişiniz onaylandı! Sipariş Numaranız: " + sonuc.siparisNo);
        router.push('/');

    } catch (error) {
        console.error("Ödeme hatası:", error);
        setHataMesaji(error.message);
    } finally {
        setIslemSuruyor(false);
    }
  };

  if (yukleniyor) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Üst Başlık */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition">
                <ArrowLeft size={20}/>
            </Link>
            <h1 className="text-2xl font-black">Güvenli Ödeme</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SOL TARAF: FORM */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Teslimat Bilgileri */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <MapPin className="text-blue-600"/> Teslimat Adresi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">AD SOYAD</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" required className="w-full border border-gray-200 rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-black" value={form.adSoyad} onChange={e => setForm({...form, adSoyad: e.target.value})} />
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">TELEFON</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="tel" required className="w-full border border-gray-200 rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-black" value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})} />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">ADRES</label>
                            <textarea required rows="2" className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black" value={form.adres} onChange={e => setForm({...form, adres: e.target.value})}></textarea>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">ŞEHİR / İLÇE</label>
                            <input type="text" required className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black" value={form.sehir} onChange={e => setForm({...form, sehir: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* 2. Ödeme Bilgileri */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <CreditCard className="text-blue-600"/> Kart Bilgileri
                        </h2>
                        <div className="flex gap-2">
                            {/* Kart Logoları (Temsili) */}
                            <div className="h-6 w-10 bg-gray-200 rounded"></div>
                            <div className="h-6 w-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 flex items-start gap-3">
                        <Lock size={20} className="text-green-600 mt-0.5 flex-shrink-0"/>
                        <p className="text-xs text-gray-600">
                            Ödemeniz <strong>256-bit SSL</strong> sertifikası ile korunmaktadır. Kart bilgileriniz sunucularımızda saklanmaz, doğrudan bankaya şifreli olarak iletilir.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">KART NUMARASI</label>
                            <input 
                                type="text" 
                                maxLength="19" 
                                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black font-mono" 
                                placeholder="0000 0000 0000 0000" 
                                value={form.kartNo}
                                onChange={e => setForm({...form, kartNo: kartNoFormatla(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">SON KULLANMA (AY/YIL)</label>
                            <input 
                                type="text" 
                                maxLength="5" 
                                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black text-center" 
                                placeholder="MM/YY" 
                                value={form.skt}
                                onChange={e => setForm({...form, skt: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">GÜVENLİK KODU (CVV)</label>
                            <input 
                                type="text" 
                                maxLength="3" 
                                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black text-center" 
                                placeholder="123" 
                                value={form.cvv}
                                onChange={e => setForm({...form, cvv: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* SAĞ TARAF: SİPARİŞ ÖZETİ */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <ShoppingBag className="text-blue-600"/> Sipariş Özeti
                    </h2>
                    
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {sepet.map((urun, index) => (
                            <div key={index} className="flex gap-3 text-sm">
                                <img src={urun.resim} className="w-12 h-12 rounded-lg bg-gray-100 object-cover flex-shrink-0" alt=""/>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 line-clamp-1">{urun.isim}</p>
                                    <p className="text-gray-500">₺{urun.fiyat}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                        <div className="flex justify-between text-gray-500">
                            <span>Ara Toplam</span>
                            <span>₺{sepetToplami}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Kargo</span>
                            <span className="text-green-600 font-bold">Ücretsiz</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-100 mt-2">
                            <span>Toplam</span>
                            <span>₺{sepetToplami}</span>
                        </div>
                    </div>
                    
                    {/* Hata Mesajı Alanı */}
                    {hataMesaji && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0"/>
                            <span>{hataMesaji}</span>
                        </div>
                    )}

                    <button 
                        onClick={odemeyiTamamla}
                        disabled={islemSuruyor || !form.kartNo || !form.cvv}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {islemSuruyor ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                İşleniyor...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={20}/> {sepetToplami} TL Öde
                            </>
                        )}
                    </button>
                    
                    <div className="mt-4 flex justify-center gap-4 text-gray-300">
                        {/* Güvenlik Logoları (İkonlar) */}
                        <Lock size={16}/>
                        <span className="text-xs">256-Bit SSL Secure</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}