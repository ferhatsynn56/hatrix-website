"use client";

import React, { useState } from 'react';
// DÜZELTME: 'Truck' ikonunu buraya ekledik
import { Package, Users, DollarSign, Search, CheckCircle, Clock, XCircle, Trash2, LogOut, Truck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function AdminPanel() {
  // --- ÖRNEK VERİLER ---
  const [siparisler, setSiparisler] = useState([
    { id: 101, musteri: "Ahmet Yılmaz", urun: "Phantom T-Shirt (Kırmızı)", fiyat: 250, durum: "Bekliyor", tarih: "2024-03-20" },
    { id: 102, musteri: "Ayşe Demir", urun: "JDM Style No.1", fiyat: 180, durum: "Kargolandı", tarih: "2024-03-19" },
    { id: 103, musteri: "Mehmet Öz", urun: "Kişiye Özel Tasarım", fiyat: 250, durum: "Tamamlandı", tarih: "2024-03-18" },
    { id: 104, musteri: "Zeynep Kaya", urun: "Phantom T-Shirt (Siyah)", fiyat: 250, durum: "İptal", tarih: "2024-03-18" },
  ]);

  const durumDegistir = (id) => {
    setSiparisler(siparisler.map(siparis => {
      if (siparis.id === id) {
        if (siparis.durum === "Bekliyor") return { ...siparis, durum: "Kargolandı" };
        if (siparis.durum === "Kargolandı") return { ...siparis, durum: "Tamamlandı" };
      }
      return siparis;
    }));
  };

  const siparisSil = (id) => {
    if(confirm("Bu siparişi silmek istediğinize emin misiniz?")) {
      setSiparisler(siparisler.filter(s => s.id !== id));
    }
  };

  const toplamCiro = siparisler.reduce((acc, curr) => acc + curr.fiyat, 0);
  const toplamSiparis = siparisler.length;
  const bekleyenSiparis = siparisler.filter(s => s.durum === "Bekliyor").length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      
      {/* --- SOL MENÜ --- */}
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
          
          {/* YENİ LİNK: Ürünler Sayfası */}
          <Link href="/admin/urunler">
            <div className="flex items-center gap-3 text-gray-500 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <ShoppingBag size={20} /> <span className="font-medium text-sm">Ürün Yönetimi</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-gray-500 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition">
            <Users size={20} /> <span className="font-medium text-sm">Müşteriler</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition">
            <DollarSign size={20} /> <span className="font-medium text-sm">Finans</span>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
            <Link href="/admin">
                <button className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 p-3 w-full rounded-lg transition">
                    <LogOut size={18}/> Çıkış Yap
                </button>
            </Link>
        </div>
      </aside>

      {/* --- İÇERİK --- */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
            <p className="text-gray-500 text-sm">Güncel sipariş durumu ve istatistikler.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">A</div>
            <span className="text-sm font-bold text-gray-700 pr-2">Admin</span>
          </div>
        </header>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Ciro</p>
              <h3 className="text-3xl font-black text-gray-900">₺{toplamCiro}</h3>
            </div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><DollarSign size={24}/></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Tüm Siparişler</p>
              <h3 className="text-3xl font-black text-black-900">{toplamSiparis}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Package size={24}/></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Bekleyen</p>
              <h3 className="text-3xl font-black text-gray-900">{bekleyenSiparis}</h3>
            </div>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><Clock size={24}/></div>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900">Son Siparişler</h3>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input type="text" placeholder="Ara..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"/>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                <tr>
                  <th className="p-4">Sipariş No</th>
                  <th className="p-4">Müşteri</th>
                  <th className="p-4">Ürün</th>
                  <th className="p-4">Tutar</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {siparisler.map((siparis) => (
                  <tr key={siparis.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold">#{siparis.id}</td>
                    <td className="p-4 text-gray-600">{siparis.musteri}</td>
                    <td className="p-4 font-medium">{siparis.urun}</td>
                    <td className="p-4 font-bold">₺{siparis.fiyat}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold 
                        ${siparis.durum === 'Bekliyor' ? 'bg-orange-100 text-orange-600' : ''}
                        ${siparis.durum === 'Kargolandı' ? 'bg-blue-100 text-blue-600' : ''}
                        ${siparis.durum === 'Tamamlandı' ? 'bg-green-100 text-green-600' : ''}
                        ${siparis.durum === 'İptal' ? 'bg-red-100 text-red-600' : ''}
                      `}>
                        {siparis.durum === 'Bekliyor' && <Clock size={12}/>}
                        {siparis.durum === 'Kargolandı' && <Truck size={12}/>}
                        {siparis.durum === 'Tamamlandı' && <CheckCircle size={12}/>}
                        {siparis.durum === 'İptal' && <XCircle size={12}/>}
                        {siparis.durum}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => durumDegistir(siparis.id)} className="p-2 hover:bg-gray-100 rounded text-blue-600"><CheckCircle size={18}/></button>
                      <button onClick={() => siparisSil(siparis.id)} className="p-2 hover:bg-red-50 rounded text-red-500"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}