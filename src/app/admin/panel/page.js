"use client";

import React, { useState, useEffect } from 'react';
import { Package, Users, Truck, CheckCircle, Clock, Search, ChevronRight } from 'lucide-react';
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
        const q = query(collection(db, "siparisler"), orderBy("tarih", "desc"));
        const querySnapshot = await getDocs(q);
        const veriler = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Tarihi okunabilir formata çevir (Timestamp to Date)
          tarih: doc.data().tarih?.toDate().toLocaleDateString('tr-TR') + ' ' + doc.data().tarih?.toDate().toLocaleTimeString('tr-TR').slice(0,5)
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
        durum: yeniDurum
      });
      
      // Ekrandaki veriyi de güncelle (tekrar sorgu atmadan)
      setSiparisler(siparisler.map(siparis => 
        siparis.id === id ? { ...siparis, durum: yeniDurum } : siparis
      ));
      
      alert("Sipariş durumu güncellendi: " + yeniDurum);
    } catch (error) {
      console.error("Hata:", error);
      alert("Güncelleme başarısız.");
    }
  };

  // Renk belirleme yardımcı fonksiyonu
  const durumRengi = (durum) => {
    switch(durum) {
      case 'Hazırlanıyor': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Kargolandı': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Teslim Edildi': return 'bg-green-100 text-green-700 border-green-200';
      case 'İptal': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* SOL MENÜ (SIDEBAR) - Diğer sayfa ile uyumlu */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-black tracking-tighter">HATRIX</h2>
          <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">YÖNETİM PANELİ</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
            <p className="text-gray-500 text-sm">
              Toplam {siparisler.length} sipariş bulundu.
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
                    <th className="p-5">Ürünler</th>
                    <th className="p-5">Tutar</th>
                    <th className="p-5">Durum</th>
                    <th className="p-5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {siparisler.map((siparis) => (
                    <tr key={siparis.id} className="hover:bg-gray-50 transition">
                      
                      {/* ID ve Tarih */}
                      <td className="p-5">
                        <div className="font-bold text-gray-900">#{siparis.id.slice(0,6)}...</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={12}/> {siparis.tarih}
                        </div>
                      </td>

                      {/* Müşteri Bilgisi */}
                      <td className="p-5">
                        <div className="font-bold">{siparis.adSoyad}</div>
                        <div className="text-xs text-gray-500">{siparis.sehir}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{siparis.telefon}</div>
                      </td>

                      {/* Ürünler (Özet) */}
                      <td className="p-5">
                        <div className="space-y-1">
                            {siparis.urunler.map((u, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    <span>{u.isim}</span>
                                </div>
                            ))}
                        </div>
                      </td>

                      {/* Tutar */}
                      <td className="p-5 font-black text-gray-900">
                        ₺{siparis.toplamTutar}
                      </td>

                      {/* Durum */}
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${durumRengi(siparis.durum)}`}>
                          {siparis.durum}
                        </span>
                      </td>

                      {/* İşlemler (Durum Değiştirme) */}
                      <td className="p-5 text-right">
                        <select 
                            onChange={(e) => durumGuncelle(siparis.id, e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg focus:ring-black focus:border-black block p-2 cursor-pointer outline-none"
                            defaultValue={siparis.durum}
                        >
                            <option value="Hazırlanıyor">Hazırlanıyor</option>
                            <option value="Kargolandı">Kargolandı</option>
                            <option value="Teslim Edildi">Teslim Edildi</option>
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