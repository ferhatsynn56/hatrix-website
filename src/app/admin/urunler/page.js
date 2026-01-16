"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app"; // getApps eklendi
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Trash2, Plus, Edit, X, Save, LogOut, ArrowLeft, Tag, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- FIREBASE AYARLARI (BURAYI DOLDURMAN ŞART) ---
const firebaseConfig = {
  apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
  authDomain: "hatrix-db.firebaseapp.com",
  projectId: "hatrix-db",
  storageBucket: "hatrix-db.firebasestorage.app",
  messagingSenderId: "903710965804",
  appId: "1:903710965804:web:5dc754a337a1d9d7951189",
  measurementId: "G-C03LWY68K7"
};

// --- FIREBASE BAŞLATMA (GARANTİ YÖNTEM) ---
let app;
let db;
let auth;

try {
  // Eğer config boşsa hata vermesin diye kontrol, ama sen doldurmalısın.
  if (Object.keys(firebaseConfig).length === 0) {
    console.error("LÜTFEN KODUN BAŞINDAKİ firebaseConfig ALANINI DOLDURUNUZ!");
  } else {
    // App daha önce başlatıldıysa onu kullan, yoksa yenisini başlat
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (e) {
  console.error("Firebase Başlatılamadı:", e);
}

export default function UrunYonetimi() {
  const router = useRouter();
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [duzenlemeModu, setDuzenlemeModu] = useState(null);

  const [yeniUrun, setYeniUrun] = useState({
    isim: '',
    fiyat: '',
    resim: '',
    kategori: 'TSHIRT',
    koleksiyon: 'steni'
  });

  // --- VERİLERİ GETİR ---
  const verileriGetir = async () => {
    if (!db) {
      console.error("Veritabanı bağlantısı yok. firebaseConfig ayarını yaptın mı?");
      setYukleniyor(false);
      return;
    }
    setYukleniyor(true);
    try {
      const querySnapshot = await getDocs(collection(db, "urunler"));
      const veriler = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      veriler.sort((a, b) => (b.eklenmeTarihi?.seconds || 0) - (a.eklenmeTarihi?.seconds || 0));
      setUrunler(veriler);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      alert("Veri çekilemedi: " + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  // --- GÜVENLİK KONTROLÜ ---
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        verileriGetir();
      } else {
        router.push('/giris');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- ÜRÜN EKLEME ---
  const urunEkle = async (e) => {
    e.preventDefault();

    if (!db) return alert("HATA: Firebase ayarları yapılmamış! Kodun en üstüne bak.");

    if (!yeniUrun.isim || !yeniUrun.fiyat) return alert("İsim ve Fiyat zorunludur!");

    const resimLink = yeniUrun.resim.trim() === "" ? "https://placehold.co/600x800?text=Resim+Yok" : yeniUrun.resim;

    try {
      await addDoc(collection(db, "urunler"), {
        isim: yeniUrun.isim,
        fiyat: Number(yeniUrun.fiyat),
        resim: resimLink,
        kategori: yeniUrun.kategori,
        koleksiyon: yeniUrun.koleksiyon,
        eklenmeTarihi: new Date()
      });

      alert("Ürün Eklendi!");
      setYeniUrun({ isim: '', fiyat: '', resim: '', kategori: 'TSHIRT', koleksiyon: 'steni' });
      verileriGetir();
    } catch (error) {
      console.error("Ekleme hatası:", error);
      alert("Hata: " + error.message);
    }
  };

  // --- SİLME VE GÜNCELLEME ---
  const urunSil = async (id) => {
    if (!confirm("Silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "urunler", id));
      setUrunler(urunler.filter(u => u.id !== id));
    } catch (error) { console.error(error); }
  };

  const urunGuncelle = async (id, guncelVeri) => {
    try {
      await updateDoc(doc(db, "urunler", id), { ...guncelVeri, fiyat: Number(guncelVeri.fiyat) });
      setDuzenlemeModu(null);
      verileriGetir();
    } catch (error) { console.error(error); }
  };

  const cikisYap = async () => { await signOut(auth); router.push('/'); };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">

      {/* BAŞLIK */}
      <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="hover:bg-zinc-800 p-2 rounded-full transition"><ArrowLeft /></button>
          <h1 className="text-3xl font-black tracking-tighter">ADMİN PANELİ</h1>
        </div>
        <button onClick={cikisYap} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold text-sm transition">
          <LogOut size={16} /> ÇIKIŞ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- FORM ALANI --- */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl sticky top-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus size={20} /> Yeni Ürün Ekle</h2>

            <form onSubmit={urunEkle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Ürün İsmi</label>
                <input
                  type="text"
                  placeholder="Örn: Oversize T-Shirt"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white"
                  value={yeniUrun.isim}
                  onChange={e => setYeniUrun({ ...yeniUrun, isim: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Fiyat (₺)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white"
                    value={yeniUrun.fiyat}
                    onChange={e => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Koleksiyon</label>
                  <select
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white"
                    value={yeniUrun.koleksiyon}
                    onChange={e => setYeniUrun({ ...yeniUrun, koleksiyon: e.target.value })}
                  >
                    <option value="steni">STENI (Giyim)</option>
                    <option value="ozel">ÖZEL (Tasarım/Lab)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase flex items-center gap-2">
                  <Tag size={12} /> Kategori (Önemli)
                </label>
                <select
                  className="w-full bg-zinc-900 border border-blue-900/50 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none transition font-bold"
                  value={yeniUrun.kategori}
                  onChange={e => setYeniUrun({ ...yeniUrun, kategori: e.target.value })}
                >
                  <option value="TSHIRT">T-SHIRT</option>
                  <option value="SWEATSHIRT">SWEATSHIRT</option>
                  <option value="HOODIE">HOODIE</option>
                  <option value="PANTS">PANTOLON / CARGO</option>
                  <option value="AKSESUAR">AKSESUAR / MİNİ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase flex items-center gap-2">
                  <LinkIcon size={12} /> Resim Linki
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-blue-400"
                  value={yeniUrun.resim}
                  onChange={e => setYeniUrun({ ...yeniUrun, resim: e.target.value })}
                />
                <p className="text-[10px] text-zinc-600 mt-1">Hızlıresim vb. bir siteye yükleyip direkt linkini yapıştır.</p>
              </div>

              <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-lg hover:bg-zinc-200 transition mt-4 shadow-lg shadow-white/10">
                YAYINLA
              </button>
            </form>
          </div>
        </div>

        {/* --- LİSTE ALANI (SAĞ) --- */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Mevcut Ürünler ({urunler.length})</h2>
              <span className="bg-zinc-800 px-3 py-1 rounded-full text-xs font-mono">{urunler.length} Adet</span>
            </div>

            {yukleniyor ? (
              <div className="p-8 text-center text-zinc-500">Yükleniyor...</div>
            ) : (
              <div className="divide-y divide-zinc-800 max-h-[80vh] overflow-y-auto">
                {urunler.map((urun) => (
                  <div key={urun.id} className="p-4 flex items-center gap-4 hover:bg-zinc-900/50 transition group">
                    <img src={urun.resim} className="w-12 h-16 object-cover rounded bg-zinc-800" alt="ürün" onError={(e) => { e.target.src = 'https://placehold.co/100x150?text=Hata' }} />

                    {duzenlemeModu === urun.id ? (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input type="text" defaultValue={urun.isim} id={`edit-isim-${urun.id}`} className="bg-black border border-zinc-600 rounded px-2 py-1 text-xs text-white" />
                        <input type="number" defaultValue={urun.fiyat} id={`edit-fiyat-${urun.id}`} className="bg-black border border-zinc-600 rounded px-2 py-1 text-xs text-white" />
                        <select defaultValue={urun.kategori} id={`edit-kategori-${urun.id}`} className="bg-black border border-zinc-600 rounded px-2 py-1 text-xs text-white col-span-2">
                          <option value="TSHIRT">T-SHIRT</option>
                          <option value="SWEATSHIRT">SWEATSHIRT</option>
                          <option value="HOODIE">HOODIE</option>
                          <option value="PANTS">PANTOLON</option>
                          <option value="AKSESUAR">AKSESUAR</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-white">{urun.isim}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50">{urun.kategori || 'BELİRSİZ'}</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{urun.koleksiyon}</span>
                        </div>
                        <p className="text-zinc-500 text-xs font-mono mt-1">₺{urun.fiyat}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {duzenlemeModu === urun.id ? (
                        <>
                          <button
                            onClick={() => urunGuncelle(urun.id, {
                              isim: document.getElementById(`edit-isim-${urun.id}`).value,
                              fiyat: document.getElementById(`edit-fiyat-${urun.id}`).value,
                              kategori: document.getElementById(`edit-kategori-${urun.id}`).value
                            })}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded text-white"
                          >
                            <Save size={14} />
                          </button>
                          <button onClick={() => setDuzenlemeModu(null)} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setDuzenlemeModu(urun.id)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => urunSil(urun.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}