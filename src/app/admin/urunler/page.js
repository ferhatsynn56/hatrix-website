"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Trash2, Plus, Edit, X, Save, LogOut, ArrowLeft, Tag, Link as LinkIcon, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
  apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
  authDomain: "hatrix-db.firebaseapp.com",
  projectId: "hatrix-db",
  storageBucket: "hatrix-db.firebasestorage.app",
  messagingSenderId: "903710965804",
  appId: "1:903710965804:web:5dc754a337a1d9d7951189",
  measurementId: "G-C03LWY68K7"
};

// --- FIREBASE BAŞLATMA ---
let app, db, auth;
try {
  if (Object.keys(firebaseConfig).length > 0) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (e) { console.error("Firebase Başlatılamadı:", e); }

export default function UrunYonetimi() {
  const router = useRouter();
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [duzenlemeModu, setDuzenlemeModu] = useState(null);

  // Form State
  const [yeniUrun, setYeniUrun] = useState({
    isim: '',
    fiyat: '',
    resim: '',
    kategori: 'tshirt', // Küçük harf (URL uyumu için)
    koleksiyon: 'steni'
  });

  // --- VERİLERİ GETİR ---
  const verileriGetir = async () => {
    if (!db) return;
    setYukleniyor(true);
    try {
      const querySnapshot = await getDocs(collection(db, "urunler"));
      const veriler = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // En son eklenen en üstte görünsün
      veriler.sort((a, b) => (b.eklenmeTarihi?.seconds || 0) - (a.eklenmeTarihi?.seconds || 0));
      setUrunler(veriler);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
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
    if (!yeniUrun.isim || !yeniUrun.fiyat || !yeniUrun.resim) return alert("Lütfen tüm alanları doldurun!");

    try {
      await addDoc(collection(db, "urunler"), {
        isim: yeniUrun.isim,
        fiyat: Number(yeniUrun.fiyat),
        resim: yeniUrun.resim,
        kategori: yeniUrun.kategori,
        koleksiyon: yeniUrun.koleksiyon,
        eklenmeTarihi: new Date()
      });

      alert("Ürün Başarıyla Eklendi!");
      setYeniUrun({ isim: '', fiyat: '', resim: '', kategori: 'tshirt', koleksiyon: 'steni' }); // Formu temizle
      verileriGetir(); // Listeyi yenile
    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  // --- SİLME ---
  const urunSil = async (id) => {
    if (!confirm("Bu ürünü silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "urunler", id));
      setUrunler(urunler.filter(u => u.id !== id));
    } catch (error) { console.error(error); }
  };

  // --- GÜNCELLEME ---
  const urunGuncelle = async (id) => {
    const isim = document.getElementById(`edit-isim-${id}`).value;
    const fiyat = document.getElementById(`edit-fiyat-${id}`).value;
    const kategori = document.getElementById(`edit-kategori-${id}`).value;
    const koleksiyon = document.getElementById(`edit-koleksiyon-${id}`).value;

    try {
      await updateDoc(doc(db, "urunler", id), { 
        isim, 
        fiyat: Number(fiyat),
        kategori,
        koleksiyon
      });
      setDuzenlemeModu(null);
      verileriGetir();
    } catch (error) { console.error(error); }
  };

  const cikisYap = async () => { await signOut(auth); router.push('/'); };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">

      {/* BAŞLIK */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="hover:bg-zinc-800 p-2 rounded-full transition"><ArrowLeft /></button>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Admin Paneli</h1>
        </div>
        <button onClick={cikisYap} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold text-sm transition">
          <LogOut size={16} /> ÇIKIŞ
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- SOL TARAF: EKLEME FORMU --- */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl sticky top-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white"><Plus size={20} className="text-blue-500" /> Yeni Ürün Ekle</h2>

            <form onSubmit={urunEkle} className="space-y-5">
              
              {/* İSİM */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Ürün İsmi</label>
                <input
                  type="text"
                  placeholder="Örn: Oversize T-Shirt"
                  className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white placeholder-zinc-700"
                  value={yeniUrun.isim}
                  onChange={e => setYeniUrun({ ...yeniUrun, isim: e.target.value })}
                />
              </div>

              {/* FİYAT & KOLEKSİYON */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Fiyat (₺)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white placeholder-zinc-700"
                    value={yeniUrun.fiyat}
                    onChange={e => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Koleksiyon</label>
                  <select
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white"
                    value={yeniUrun.koleksiyon}
                    onChange={e => setYeniUrun({ ...yeniUrun, koleksiyon: e.target.value })}
                  >
                    <option value="steni">STENI (Mağaza)</option>
                    <option value="ozel">ÖZEL (Tasarım)</option>
                  </select>
                </div>
              </div>

              {/* KATEGORİ */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Kategori
                </label>
                <select
                  className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white"
                  value={yeniUrun.kategori}
                  onChange={e => setYeniUrun({ ...yeniUrun, kategori: e.target.value })}
                >
                  <option value="tshirt">T-SHIRT</option>
                  <option value="sweatshirt">SWEATSHIRT</option>
                  <option value="hoodie">HOODIE</option>
                  <option value="pantolon">PANTOLON</option>
                  <option value="aksesuar">AKSESUAR</option>
                </select>
              </div>

              {/* RESİM LİNKİ & ÖNİZLEME */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon size={12} /> Resim Linki
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-blue-400 placeholder-zinc-700"
                  value={yeniUrun.resim}
                  onChange={e => setYeniUrun({ ...yeniUrun, resim: e.target.value })}
                />
                
                {/* CANLI ÖNİZLEME ALANI */}
                {yeniUrun.resim && (
                  <div className="mt-3 border border-zinc-800 rounded-lg p-2 bg-black">
                    <span className="text-[10px] text-zinc-500 block mb-2 text-center uppercase tracking-widest">Önizleme</span>
                    <div className="aspect-[3/4] w-full overflow-hidden rounded bg-zinc-900 relative flex items-center justify-center">
                      <img 
                        src={yeniUrun.resim} 
                        alt="Önizleme" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <ImageIcon className="text-zinc-700 absolute -z-10" size={32} />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-lg hover:bg-zinc-200 transition mt-4 shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                <Plus size={18} /> YAYINLA
              </button>
            </form>
          </div>
        </div>

        {/* --- SAĞ TARAF: LİSTE ALANI --- */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-bold flex items-center gap-2"><ImageIcon size={18} className="text-zinc-500"/> Mevcut Ürünler</h2>
              <span className="bg-zinc-800 px-3 py-1 rounded-full text-xs font-mono text-white">{urunler.length} Adet</span>
            </div>

            {yukleniyor ? (
              <div className="p-12 text-center text-zinc-500 animate-pulse">Veriler yükleniyor...</div>
            ) : (
              <div className="divide-y divide-zinc-800 max-h-[800px] overflow-y-auto">
                {urunler.map((urun) => (
                  <div key={urun.id} className="p-4 flex flex-col sm:flex-row items-center gap-4 hover:bg-zinc-900/80 transition group">
                    
                    {/* Resim */}
                    <div className="w-16 h-20 bg-zinc-800 rounded overflow-hidden flex-shrink-0 border border-zinc-700">
                         <img src={urun.resim} className="w-full h-full object-cover" alt="ürün" onError={(e) => { e.target.src = 'https://placehold.co/100x150?text=Yok' }} />
                    </div>

                    {/* Bilgiler (Normal Mod veya Düzenleme Modu) */}
                    {duzenlemeModu === urun.id ? (
                      <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                        <input type="text" defaultValue={urun.isim} id={`edit-isim-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white col-span-2" placeholder="İsim" />
                        <input type="number" defaultValue={urun.fiyat} id={`edit-fiyat-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white" placeholder="Fiyat" />
                        <select defaultValue={urun.koleksiyon} id={`edit-koleksiyon-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white">
                           <option value="steni">STENI</option>
                           <option value="ozel">ÖZEL</option>
                        </select>
                        <select defaultValue={urun.kategori} id={`edit-kategori-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white col-span-2">
                          <option value="tshirt">T-SHIRT</option>
                          <option value="sweatshirt">SWEATSHIRT</option>
                          <option value="hoodie">HOODIE</option>
                          <option value="pantolon">PANTOLON</option>
                          <option value="aksesuar">AKSESUAR</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex-1 text-center sm:text-left w-full">
                        <h3 className="font-bold text-sm text-white mb-1">{urun.isim}</h3>
                        <div className="flex gap-2 justify-center sm:justify-start mb-2">
                          <span className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30 uppercase tracking-wide font-bold">{urun.kategori}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${urun.koleksiyon === 'ozel' ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                            {urun.koleksiyon}
                          </span>
                        </div>
                        <p className="text-white text-sm font-mono font-bold">₺{urun.fiyat}</p>
                      </div>
                    )}

                    {/* Butonlar */}
                    <div className="flex gap-2">
                      {duzenlemeModu === urun.id ? (
                        <>
                          <button onClick={() => urunGuncelle(urun.id)} className="p-2 bg-green-600 hover:bg-green-700 rounded text-white transition"><Save size={16} /></button>
                          <button onClick={() => setDuzenlemeModu(null)} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setDuzenlemeModu(urun.id)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition" title="Düzenle"><Edit size={16} /></button>
                          <button onClick={() => urunSil(urun.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition" title="Sil"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {urunler.length === 0 && !yukleniyor && (
                    <div className="p-10 text-center text-zinc-600 flex flex-col items-center">
                        <AlertCircle size={32} className="mb-2 opacity-50"/>
                        <p>Henüz hiç ürün eklenmemiş.</p>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}