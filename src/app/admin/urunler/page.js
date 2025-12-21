"use client";

import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function UrunYonetimi() {
  // Örnek Ürünler
  const [urunler, setUrunler] = useState([
    { id: 1, isim: "JDM Style No.1", fiyat: 180, resim: "https://placehold.co/100x100?text=JDM1" },
    { id: 2, isim: "JDM Style No.2", fiyat: 180, resim: "https://placehold.co/100x100?text=JDM2" },
    { id: 3, isim: "Phantom Custom", fiyat: 250, resim: "https://placehold.co/100x100?text=Phantom" },
  ]);

  const [yeniUrunModu, setYeniUrunModu] = useState(false);
  const [yeniUrun, setYeniUrun] = useState({ isim: '', fiyat: '', resim: '' });

  // Yeni Ürün Ekleme
  const urunEkle = () => {
    if (!yeniUrun.isim || !yeniUrun.fiyat) return alert("Lütfen isim ve fiyat girin!");
    
    setUrunler([
      ...urunler, 
      { 
        id: Date.now(), 
        isim: yeniUrun.isim, 
        fiyat: Number(yeniUrun.fiyat),
        resim: yeniUrun.resim || "https://placehold.co/100x100?text=Urun"
      }
    ]);
    setYeniUrunModu(false);
    setYeniUrun({ isim: '', fiyat: '', resim: '' });
  };

  // Ürün Silme
  const urunSil = (id) => {
    if(confirm("Bu ürünü silmek istiyor musunuz?")) {
      setUrunler(urunler.filter(u => u.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* SOL MENÜ (AYNI) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-black tracking-tighter">HATRIX</h2>
          <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">YÖNETİM PANELİ</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/panel">
            <div className="flex items-center gap-3 text-gray-500 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <Package size={20} /> <span className="font-medium text-sm">Siparişler</span>
            </div>
          </Link>
          <Link href="/admin/urunler">
            <div className="flex items-center gap-3 bg-black text-white p-3 rounded-lg cursor-pointer shadow-lg transition">
              <Package size={20} /> <span className="font-bold text-sm">Ürün Yönetimi</span>
            </div>
          </Link>
        </nav>
      </aside>

      {/* İÇERİK */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-gray-500 text-sm">Mağazadaki ürünleri düzenleyin veya yeni ekleyin.</p>
          </div>
          <button 
            onClick={() => setYeniUrunModu(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg"
          >
            <Plus size={20}/> Yeni Ürün Ekle
          </button>
        </header>

        {/* YENİ ÜRÜN MODALI (FORMU) */}
        {yeniUrunModu && (
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xl mb-8 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Yeni Ürün Ekle</h3>
              <button onClick={() => setYeniUrunModu(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ürün Adı</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded" 
                  placeholder="Örn: JDM Siyah"
                  value={yeniUrun.isim}
                  onChange={(e) => setYeniUrun({...yeniUrun, isim: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Fiyat (TL)</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded" 
                  placeholder="250"
                  value={yeniUrun.fiyat}
                  onChange={(e) => setYeniUrun({...yeniUrun, fiyat: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Resim URL (Opsiyonel)</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded" 
                  placeholder="https://..."
                  value={yeniUrun.resim}
                  onChange={(e) => setYeniUrun({...yeniUrun, resim: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={urunEkle} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition flex items-center gap-2">
                <Save size={18}/> Kaydet
              </button>
            </div>
          </div>
        )}

        {/* ÜRÜN LİSTESİ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {urunler.map((urun) => (
            <div key={urun.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
              <div className="relative h-48 bg-gray-100">
                <img src={urun.resim} className="w-full h-full object-cover" alt={urun.isim} />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="bg-white p-2 rounded-full shadow text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
                  <button onClick={() => urunSil(urun.id)} className="bg-white p-2 rounded-full shadow text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900">{urun.isim}</h3>
                <p className="text-blue-600 font-bold mt-1">₺{urun.fiyat}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}