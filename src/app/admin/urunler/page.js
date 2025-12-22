"use client";

import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
// Firebase bağlantılarını çağırıyoruz (Oluşturduğun firebase.js dosyasından)
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function UrunYonetimi() {
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [yeniUrunModu, setYeniUrunModu] = useState(false);
  const [yeniUrun, setYeniUrun] = useState({ isim: '', fiyat: '', resim: '' });

  // SAYFA AÇILINCA: Verileri Google'dan Çek
  useEffect(() => {
    verileriGetir();
  }, []);

  const verileriGetir = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "urunler"));
      const veriler = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUrunler(veriler);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      alert("Veriler yüklenirken hata oluştu! Lütfen firebase.js dosyasındaki ayarları kontrol edin.");
    } finally {
      setYukleniyor(false);
    }
  };

  // YENİ ÜRÜN EKLEME (Google'a Kaydet)
  const urunEkle = async () => {
    if (!yeniUrun.isim || !yeniUrun.fiyat) return alert("Lütfen isim ve fiyat girin!");
    
    try {
      setYukleniyor(true); // Yükleniyor moduna al
      
      // Firestore'a kaydet
      await addDoc(collection(db, "urunler"), {
        isim: yeniUrun.isim,
        fiyat: Number(yeniUrun.fiyat),
        resim: yeniUrun.resim || "https://placehold.co/100x100?text=Urun",
        tarih: new Date() // Ekleme tarihini de tutalım
      });
      
      alert("Ürün başarıyla veritabanına eklendi!");
      setYeniUrunModu(false);
      setYeniUrun({ isim: '', fiyat: '', resim: '' });
      verileriGetir(); // Listeyi yenile ki yeni ürün görünsün

    } catch (error) {
      console.error("Ekleme hatası:", error);
      alert("Ürün eklenemedi: " + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  // ÜRÜN SİLME (Google'dan Sil)
  const urunSil = async (id) => {
    if(confirm("Bu ürünü kalıcı olarak silmek istiyor musunuz?")) {
      try {
        await deleteDoc(doc(db, "urunler", id));
        // Ekrandan da silelim (tekrar sorgu atmaya gerek kalmadan)
        setUrunler(urunler.filter(u => u.id !== id));
      } catch (error) {
        console.error("Silme hatası:", error);
        alert("Silinirken hata oluştu.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* SOL MENÜ (SIDEBAR) */}
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

      {/* İÇERİK (CONTENT) */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-gray-500 text-sm">
              {yukleniyor ? "Veritabanına bağlanılıyor..." : `${urunler.length} adet ürün listeleniyor.`}
            </p>
          </div>
          <button 
            onClick={() => setYeniUrunModu(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg"
          >
            <Plus size={20}/> Yeni Ürün Ekle
          </button>
        </header>

        {/* YENİ ÜRÜN MODALI (Açılır Pencere) */}
        {yeniUrunModu && (
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xl mb-8 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Yeni Ürün Ekle</h3>
              <button onClick={() => setYeniUrunModu(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* İsim Girişi */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ürün Adı</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-blue-500 transition" 
                  placeholder="Örn: JDM Siyah"
                  value={yeniUrun.isim}
                  onChange={(e) => setYeniUrun({...yeniUrun, isim: e.target.value})}
                />
              </div>
              
              {/* Fiyat Girişi */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Fiyat (TL)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-blue-500 transition" 
                  placeholder="250"
                  value={yeniUrun.fiyat}
                  onChange={(e) => setYeniUrun({...yeniUrun, fiyat: e.target.value})}
                />
              </div>
              
              {/* Resim URL Girişi */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Resim URL (Link)</label>
                <div className="relative">
                    <ImageIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                    type="text" 
                    className="w-full border border-gray-300 pl-10 pr-2 py-2.5 rounded-lg focus:outline-blue-500 transition" 
                    placeholder="https://..."
                    value={yeniUrun.resim}
                    onChange={(e) => setYeniUrun({...yeniUrun, resim: e.target.value})}
                    />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={urunEkle} 
                disabled={yukleniyor} 
                className={`bg-green-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-md ${yukleniyor ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Save size={18}/> {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}

        {/* ÜRÜN LİSTESİ */}
        {yukleniyor && urunler.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
             <p>Veritabanına bağlanılıyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {urunler.length === 0 ? (
                <div className="col-span-3 text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                    <Package size={40} className="mx-auto mb-2 opacity-20"/>
                    <p>Henüz hiç ürün eklenmemiş.</p>
                </div>
            ) : (
                urunler.map((urun) => (
                <div key={urun.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group">
                    <div className="relative h-56 bg-gray-100 group-hover:scale-105 transition duration-500">
                    <img src={urun.resim} className="w-full h-full object-cover" alt={urun.isim} onError={(e) => {e.target.src='https://placehold.co/400x300?text=Resim+Yok'}} />
                    
                    {/* Silme Butonu (Hover'da çıkar) */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition duration-300">
                        <button 
                            onClick={() => urunSil(urun.id)} 
                            className="bg-white p-2.5 rounded-full shadow-md text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                            title="Ürünü Sil"
                        >
                            <Trash2 size={18}/>
                        </button>
                    </div>
                    </div>
                    
                    <div className="p-5 border-t border-gray-50 relative bg-white z-10">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{urun.isim}</h3>
                        <p className="text-blue-600 font-black text-xl">₺{urun.fiyat}</p>
                    </div>
                </div>
                ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}