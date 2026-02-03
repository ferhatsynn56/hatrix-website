"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";
import { Trash2, Plus, Edit, X, Save, LogOut, ArrowLeft, Tag, Link as LinkIcon, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminShell from "@/components/AdminShell";

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
  const [hataMesaji, setHataMesaji] = useState(null);

  const modelKoduUret = (v) => {
    return String(v || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/[^A-Z0-9\-]/g, "")
      .slice(0, 40);
  };

  useEffect(() => {
    try {
      const ok = localStorage.getItem('hatrix_admin_auth') === '1';
      if (!ok) router.push('/admin');
    } catch {
      router.push('/admin');
    }
  }, [router]);

  // Form State
  const [yeniUrun, setYeniUrun] = useState({
    isim: '',
    fiyat: '',
    kategori: 'tshirt', // Küçük harf (URL uyumu için)
    koleksiyon: 'steni',
    modelKodu: '',
    renk: '',
    stok: 0,
    aktif: true,
    resim: '',
  });

  const varyantOlustur = (urun) => {
    const baseModel = urun?.modelKodu || modelKoduUret(urun?.isim);
    setYeniUrun({
      isim: urun?.isim || '',
      fiyat: String(urun?.fiyat ?? ''),
      kategori: urun?.kategori || 'tshirt',
      koleksiyon: urun?.koleksiyon || 'steni',
      modelKodu: baseModel,
      renk: '',
      stok: Number(urun?.stok ?? 0),
      aktif: urun?.aktif ?? true,
      resim: urun?.resim || '',
    });
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

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
      setHataMesaji(null);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      if (error?.code === 'permission-denied') {
        setHataMesaji("Firestore izin hatası: 'urunler' koleksiyonuna erişim reddedildi. Firebase Console > Firestore Database > Rules kısmında bu koleksiyon için read/write izni vermen gerekiyor (en azından admin hesabı için). ");
      } else {
        setHataMesaji("Ürünler çekilemedi.");
      }
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
        return;
      }

      // Firebase'de user yoksa anon giriş deneyelim (enabled değilse hata alır, yine de sayfa çalışır)
      signInAnonymously(auth)
        .then(() => verileriGetir())
        .catch(() => verileriGetir());
    });
    return () => unsubscribe();
  }, [router]);

  // --- ÜRÜN EKLEME ---
  const urunEkle = async (e) => {
    e.preventDefault();
    if (!yeniUrun.isim || !yeniUrun.fiyat) return alert("Lütfen tüm alanları doldurun!");

    const finalModelKodu = (yeniUrun.modelKodu || '').trim() || modelKoduUret(yeniUrun.isim);

    try {
      await addDoc(collection(db, "urunler"), {
        isim: yeniUrun.isim,
        fiyat: Number(yeniUrun.fiyat),
        kategori: yeniUrun.kategori,
        koleksiyon: yeniUrun.koleksiyon,
        modelKodu: finalModelKodu,
        renk: String(yeniUrun.renk || '').trim(),
        stok: Number(yeniUrun.stok || 0),
        aktif: Boolean(yeniUrun.aktif),
        resim: String(yeniUrun.resim || '').trim(),
        eklenmeTarihi: new Date()
      });

      alert("Ürün Başarıyla Eklendi!");
      setYeniUrun({ isim: '', fiyat: '', kategori: 'tshirt', koleksiyon: 'steni', modelKodu: '', renk: '', stok: 0, aktif: true, resim: '' }); // Formu temizle
      verileriGetir(); // Listeyi yenile
    } catch (error) {
      if (error?.code === 'permission-denied') {
        setHataMesaji("Firestore izin hatası: Ürün ekleme yetkisi yok. (Rules) ");
        alert("Yetki hatası: Firestore kuralları izin vermiyor.");
      } else {
        alert("Hata: " + error.message);
      }
    }
  };

  // --- SİLME ---
  const urunSil = async (id) => {
    if (!confirm("Bu ürünü silmek istediğine emin misin?")) return;
    try {
      await deleteDoc(doc(db, "urunler", id));
      setUrunler(urunler.filter(u => u.id !== id));
      setHataMesaji(null);
    } catch (error) {
      console.error(error);
      if (error?.code === 'permission-denied') {
        setHataMesaji("Firestore izin hatası: Ürün silme yetkisi yok. (Rules)");
      }
    }
  };

  // --- GÜNCELLEME ---
  const urunGuncelle = async (id) => {
    const isim = document.getElementById(`edit-isim-${id}`).value;
    const fiyat = document.getElementById(`edit-fiyat-${id}`).value;
    const kategori = document.getElementById(`edit-kategori-${id}`).value;
    const koleksiyon = document.getElementById(`edit-koleksiyon-${id}`).value;
    const modelKodu = document.getElementById(`edit-modelKodu-${id}`).value;
    const renk = document.getElementById(`edit-renk-${id}`).value;
    const stok = document.getElementById(`edit-stok-${id}`).value;
    const aktif = document.getElementById(`edit-aktif-${id}`).checked;
    const resim = document.getElementById(`edit-resim-${id}`).value;

    try {
      await updateDoc(doc(db, "urunler", id), { 
        isim, 
        fiyat: Number(fiyat),
        kategori,
        koleksiyon,
        modelKodu: (modelKodu || '').trim() || modelKoduUret(isim),
        renk: String(renk || '').trim(),
        stok: Number(stok || 0),
        aktif: Boolean(aktif),
        resim: String(resim || '').trim(),
      });
      setDuzenlemeModu(null);
      verileriGetir();
      setHataMesaji(null);
    } catch (error) {
      console.error(error);
      if (error?.code === 'permission-denied') {
        setHataMesaji("Firestore izin hatası: Ürün güncelleme yetkisi yok. (Rules)");
      }
    }
  };

  const cikisYap = async () => {
    try {
      localStorage.removeItem('hatrix_admin_auth');
    } catch {}
    try {
      if (auth) await signOut(auth);
    } catch {}
    router.push('/admin');
  };

  return (
    <AdminShell title="Ürün Yönetimi">
      <div className="max-w-7xl mx-auto">
        {hataMesaji && (
          <div className="mb-6 p-4 rounded-2xl border border-red-900/40 bg-red-950/20 text-red-200 text-xs leading-relaxed">
            {hataMesaji}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Model Kodu</label>
                  <input
                    type="text"
                    placeholder="Örn: START-SAY"
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white placeholder-zinc-700"
                    value={yeniUrun.modelKodu}
                    onChange={e => setYeniUrun({ ...yeniUrun, modelKodu: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Renk</label>
                  <input
                    type="text"
                    placeholder="Örn: Siyah"
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white placeholder-zinc-700"
                    value={yeniUrun.renk}
                    onChange={e => setYeniUrun({ ...yeniUrun, renk: e.target.value })}
                  />
                </div>
              </div>

              {/* FİYAT & KOLEKSİYON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* RESİM LİNKİ */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={12} /> Resim Linki
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white placeholder-zinc-700"
                  value={yeniUrun.resim}
                  onChange={e => setYeniUrun({ ...yeniUrun, resim: e.target.value })}
                />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">Stok</label>
                  <input
                    type="number"
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm focus:border-white outline-none transition text-white placeholder-zinc-700"
                    value={yeniUrun.stok}
                    onChange={e => setYeniUrun({ ...yeniUrun, stok: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(yeniUrun.aktif)}
                      onChange={e => setYeniUrun({ ...yeniUrun, aktif: e.target.checked })}
                      className="accent-white"
                    />
                    Aktif
                  </label>
                </div>
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
                    {urun.resim && (
                      <img 
                        src={urun.resim} 
                        alt={urun.isim}
                        className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                      />
                    )}
                    
                    {/* Bilgiler (Normal Mod veya Düzenleme Modu) */}
                    {duzenlemeModu === urun.id ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <input type="text" defaultValue={urun.isim} id={`edit-isim-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white sm:col-span-2 col-span-1" placeholder="İsim" />
                        <input type="text" defaultValue={urun.modelKodu || ''} id={`edit-modelKodu-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white" placeholder="Model Kodu" />
                        <input type="text" defaultValue={urun.renk || ''} id={`edit-renk-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white" placeholder="Renk" />
                        <input type="url" defaultValue={urun.resim || ''} id={`edit-resim-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white sm:col-span-2 col-span-1" placeholder="Resim Linki" />
                        <input type="number" defaultValue={urun.fiyat} id={`edit-fiyat-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white" placeholder="Fiyat" />
                        <input type="number" defaultValue={urun.stok ?? 0} id={`edit-stok-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white" placeholder="Stok" />
                        <select defaultValue={urun.koleksiyon} id={`edit-koleksiyon-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white">
                           <option value="steni">STENI</option>
                           <option value="ozel">ÖZEL</option>
                        </select>
                        <select defaultValue={urun.kategori} id={`edit-kategori-${urun.id}`} className="bg-black border border-zinc-600 rounded px-3 py-2 text-xs text-white">
                          <option value="tshirt">T-SHIRT</option>
                          <option value="sweatshirt">SWEATSHIRT</option>
                          <option value="hoodie">HOODIE</option>
                          <option value="pantolon">PANTOLON</option>
                          <option value="aksesuar">AKSESUAR</option>
                        </select>
                        <label className="sm:col-span-2 col-span-1 flex items-center gap-2 text-[10px] font-bold text-zinc-300">
                          <input id={`edit-aktif-${urun.id}`} type="checkbox" defaultChecked={urun.aktif ?? true} className="accent-white" />
                          Aktif
                        </label>
                      </div>
                    ) : (
                      <div className="flex-1 text-center sm:text-left w-full">
                        <h3 className="font-bold text-sm text-white mb-1">{urun.isim}</h3>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-2">
                          <span className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30 uppercase tracking-wide font-bold">{urun.kategori}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${urun.koleksiyon === 'ozel' ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                            {urun.koleksiyon}
                          </span>
                          {(urun.modelKodu || '').trim() && (
                            <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                              {urun.modelKodu}
                            </span>
                          )}
                          {(urun.renk || '').trim() && (
                            <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                              {urun.renk}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${Number(urun.stok ?? 0) > 0 ? 'bg-emerald-900/20 text-emerald-300 border border-emerald-900/30' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
                            STOK: {Number(urun.stok ?? 0)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${urun.aktif ?? true ? 'bg-white/10 text-white border border-white/10' : 'bg-red-900/20 text-red-300 border border-red-900/30'}`}>
                            {urun.aktif ?? true ? 'AKTİF' : 'PASİF'}
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
                          <button onClick={() => varyantOlustur(urun)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition" title="Varyant oluştur (yeni renk)"><Plus size={16} /></button>
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
    </AdminShell>
  );
}