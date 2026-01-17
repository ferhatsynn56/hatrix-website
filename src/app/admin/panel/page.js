"use client";

import React, { useState, useEffect } from 'react';
import { Package, Users, Truck, CheckCircle, Clock, Search, ChevronRight, Download, AlertCircle } from 'lucide-react';
import Link from 'next/link';
// Firebase
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, orderBy, query } from 'firebase/firestore';

export default function SiparisPaneli() {
  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Verileri Çek
  useEffect(() => {
    const verileriGetir = async () => {
      try {
        // Siparişleri tarihe göre yeniden eskiye sırala
        const q = query(collection(db, "siparisler"), orderBy("createdAt", "desc"));
        // Not: Eğer 'createdAt' ile sıralamada hata alırsan 'tarih' alanını kullanmayı dene
        
        const querySnapshot = await getDocs(q);
        const veriler = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Tarih formatlama (Hata önleyici kontrol ile)
          tarihStr: doc.data().createdAt 
            ? new Date(doc.data().createdAt).toLocaleString('tr-TR') 
            : 'Tarih Yok'
        }));
        setSiparisler(veriler);
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setYukleniyor(false);
      }
    };
    verileriGetir();
  }, []);

  // Durum Güncelleme Fonksiyonu
  const durumGuncelle = async (id, yeniDurum) => {
    try {
      const siparisRef = doc(db, "siparisler", id);
      await updateDoc(siparisRef, {
        status: yeniDurum // CartContext'te 'status' olarak kaydetmiştik
      });
      
      setSiparisler(siparisler.map(siparis => 
        siparis.id === id ? { ...siparis, status: yeniDurum } : siparis
      ));
      
      alert("Sipariş durumu güncellendi: " + yeniDurum);
    } catch (error) {
      console.error("Hata:", error);
      alert("Güncelleme başarısız.");
    }
  };

  // Renk belirleme
  const durumRengi = (durum) => {
    switch(durum) {
      case 'Hazırlanıyor': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Kargolandı': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Tamamlandı': return 'bg-green-100 text-green-700 border-green-200';
      case 'İptal': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* SOL MENÜ */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-black tracking-tighter">STENIST</h2>
          <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">ADMİN PANELİ</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/panel">
            <div className="flex items-center gap-3 bg-black text-white p-3 rounded-lg cursor-pointer shadow-lg transition">
              <Package size={20} /> <span className="font-bold text-sm">Siparişler</span>
            </div>
          </Link>
          <Link href="/admin/urunler">
            <div className="flex items-center gap-3 text-gray-500 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <Package size={20} /> <span className="font-medium text-sm">Ürün Yönetimi</span>
            </div>
          </Link>
        </nav>
      </aside>

      {/* İÇERİK */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
            <p className="text-gray-500 text-sm">
              Toplam {siparisler.length} sipariş listeleniyor.
            </p>
          </div>
        </header>

        {/* Sipariş Tablosu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {yukleniyor ? (
            <div className="p-10 text-center text-gray-400">Yükleniyor...</div>
          ) : siparisler.length === 0 ? (
            <div className="p-10 text-center text-gray-400">Henüz hiç sipariş yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-5">Sipariş ID & Tarih</th>
                    <th className="p-5">Müşteri</th>
                    <th className="p-5 w-1/3">Ürünler & Tasarımlar</th> {/* Genişlik artırıldı */}
                    <th className="p-5">Tutar</th>
                    <th className="p-5">Durum</th>
                    <th className="p-5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {siparisler.map((siparis) => (
                    <tr key={siparis.id} className="hover:bg-gray-50 transition align-top">
                      
                      {/* ID ve Tarih */}
                      <td className="p-5">
                        <div className="font-bold text-gray-900 text-xs font-mono">#{siparis.id.slice(0,6)}...</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={12}/> {siparis.tarihStr}
                        </div>
                      </td>

                      {/* Müşteri Bilgisi */}
                      <td className="p-5">
                        <div className="font-bold">{siparis.customer?.adSoyad || siparis.adSoyad}</div>
                        <div className="text-xs text-gray-500">{siparis.customer?.sehir || siparis.sehir}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{siparis.customer?.telefon || siparis.telefon}</div>
                      </td>

                      {/* Ürünler & BASKI DOSYALARI (ÖNEMLİ KISIM) */}
                      <td className="p-5">
                        <div className="space-y-4">
                            {/* CartContext 'items' olarak kaydediyor, eski kod 'urunler' diyordu. İkisini de kontrol edelim */}
                            {(siparis.items || siparis.urunler || []).map((u, i) => (
                                <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                            <img src={u.image} alt="" className="w-full h-full object-cover"/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-xs">{u.name || u.isim}</div>
                                            <div className="text-[10px] text-gray-500">{u.size} - {u.color}</div>
                                        </div>
                                    </div>

                                    {/* --- BASKI DOSYASI İNDİRME BUTONU --- */}
                                    {u.designDetails?.printFile && (
                                        <div className="mt-2 ml-10">
                                            <a 
                                                href={u.designDetails.printFile} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded transition shadow-sm"
                                            >
                                                <Download size={12} /> BASKI DOSYASI (.PNG)
                                            </a>
                                            {/* Baskı Koordinatları */}
                                            <div className="mt-1 text-[9px] text-gray-400 font-mono">
                                                X: {Math.round(u.designDetails.printPosition?.x)}% | 
                                                Y: {Math.round(u.designDetails.printPosition?.y)}% | 
                                                Boyut: {u.designDetails.printScale}x
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                      </td>

                      {/* Tutar */}
                      <td className="p-5 font-black text-gray-900">
                        ₺{siparis.total || siparis.toplamTutar}
                      </td>

                      {/* Durum */}
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${durumRengi(siparis.status || siparis.durum)}`}>
                          {siparis.status || siparis.durum}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td className="p-5 text-right">
                        <select 
                            onChange={(e) => durumGuncelle(siparis.id, e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg focus:ring-black focus:border-black block p-2 cursor-pointer outline-none w-full"
                            value={siparis.status || siparis.durum || 'Sipariş Alındı'}
                        >
                            <option value="Sipariş Alındı">Sipariş Alındı</option>
                            <option value="Hazırlanıyor">Hazırlanıyor</option>
                            <option value="Kargolandı">Kargolandı</option>
                            <option value="Tamamlandı">Tamamlandı</option>
                            <option value="İptal">İptal</option>
                        </select>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}