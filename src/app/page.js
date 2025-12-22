"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, PenTool, Truck, ShieldCheck, ArrowRight, LogIn, UserPlus, LogOut, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
// Firebase bağlantılarını çağırıyoruz
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function AnaSayfa() {
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // --- STATE'LER ---
  const [kullanici, setKullanici] = useState(null);
  const [sepet, setSepet] = useState([]);
  const [sepetAcik, setSepetAcik] = useState(false);

  // 1. Kullanıcı Takibi (Giriş/Çıkış)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setKullanici(user);
      } else {
        setKullanici(null);
        setSepet([]); // Çıkış yaparsa sepeti boşalt
        localStorage.removeItem('sepet');
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Sepeti LocalStorage'dan Yükle (Sayfa Yenilenince Kaybolmasın)
  useEffect(() => {
    const kayıtlıSepet = localStorage.getItem('sepet');
    if (kayıtlıSepet) {
      setSepet(JSON.parse(kayıtlıSepet));
    }
  }, []);

  // 3. Sepet Değişince LocalStorage'a Kaydet
  useEffect(() => {
    localStorage.setItem('sepet', JSON.stringify(sepet));
  }, [sepet]);

  // 4. Verileri Firebase'den Çek
  useEffect(() => {
    const urunleriGetir = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "urunler"));
        const veriler = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUrunler(veriler);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setYukleniyor(false);
      }
    };

    urunleriGetir();
  }, []);

  // --- İŞLEVLER ---

  const cikisYap = async () => {
    if(confirm("Çıkış yapmak istediğinize emin misiniz?")) {
        await signOut(auth);
    }
  };

  const sepeteEkle = (urun) => {
    if (!kullanici) {
        alert("Sepete ürün eklemek için lütfen önce giriş yapınız.");
        return;
    }
    // Sepete ekle (State güncellenince useEffect otomatik kaydedecek)
    setSepet([...sepet, urun]);
    setSepetAcik(true); 
  };

  const sepettenCikar = (index) => {
    const yeniSepet = [...sepet];
    yeniSepet.splice(index, 1);
    setSepet(yeniSepet);
  };

  const sepetToplami = sepet.reduce((total, item) => total + Number(item.fiyat), 0);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* --- NAVBAR (ÜST MENÜ) --- */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-black tracking-tighter cursor-pointer flex items-center gap-2">
            HATRIX
          </Link>
          
          {/* Orta Linkler (Masaüstü) */}
          <div className="hidden md:flex gap-8 font-medium text-sm text-gray-600">
            <Link href="#" className="hover:text-black transition">Koleksiyon</Link>
            <Link href="#" className="hover:text-black transition">Hakkımızda</Link>
            <Link href="#" className="hover:text-black transition">İletişim</Link>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-3">
             
             {/* AKILLI KULLANICI ALANI */}
             {kullanici ? (
                // Giriş Yapılmışsa
                <div className="hidden sm:flex items-center gap-4 border-r border-gray-200 pr-4">
                    <div className="text-right hidden lg:block">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hoş geldin</p>
                        <p className="text-sm font-bold text-black leading-none">{kullanici.displayName || "Kullanıcı"}</p>
                    </div>
                    <button onClick={cikisYap} className="text-gray-400 hover:text-red-600 transition" title="Çıkış Yap">
                        <LogOut size={20} />
                    </button>
                </div>
             ) : (
                // Giriş Yapılmamışsa
                <div className="hidden sm:flex items-center gap-3 mr-2 border-r border-gray-200 pr-4">
                    <Link href="/giris" className="text-gray-500 hover:text-black transition flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                        <LogIn size={16}/> Giriş
                    </Link>
                    <Link href="/kayit" className="text-gray-500 hover:text-black transition flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                        <UserPlus size={16}/> Kayıt
                    </Link>
                </div>
             )}

             {/* SEPET İKONU */}
            <button 
                onClick={() => setSepetAcik(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition group mr-2"
            >
                <ShoppingBag size={22} className="text-gray-600 group-hover:text-black transition" />
                {sepet.length > 0 && (
                    <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                        {sepet.length}
                    </span>
                )}
            </button>

            <Link href="/tasarim">
              <button className="hidden md:flex bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200 items-center gap-2">
                <PenTool size={16} /> Tasarla
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- SEPET SIDEBAR (YAN PANEL) --- */}
      {sepetAcik && (
        <div className="fixed inset-0 z-[60]" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            {/* Arkaplan Karartma */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSepetAcik(false)}></div>
            
            <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md transform transition duration-500 sm:duration-700">
                    <div className="h-full flex flex-col bg-white shadow-2xl">
                        {/* Başlık */}
                        <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-gray-100">
                            <h2 className="text-lg font-black text-gray-900" id="slide-over-title">Alışveriş Sepeti ({sepet.length})</h2>
                            <button onClick={() => setSepetAcik(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Kapat</span>
                                <X size={24} />
                            </button>
                        </div>

                        {/* İçerik */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {sepet.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <ShoppingBag size={48} className="text-gray-200" />
                                    <p className="text-gray-500 font-medium">Sepetiniz şuan boş.</p>
                                    <button onClick={() => setSepetAcik(false)} className="text-black font-bold underline">Alışverişe Dön</button>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {sepet.map((urun, index) => (
                                        <li key={index} className="flex py-2">
                                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                                                <img src={urun.resim} alt={urun.isim} className="h-full w-full object-cover object-center" />
                                            </div>
                                            <div className="ml-4 flex flex-1 flex-col">
                                                <div>
                                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                                        <h3><a href="#">{urun.isim}</a></h3>
                                                        <p className="ml-4">₺{urun.fiyat}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-1 items-end justify-between text-sm">
                                                    <p className="text-gray-500">Adet: 1</p>
                                                    <button onClick={() => sepettenCikar(index)} type="button" className="font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                                                        <Trash2 size={14}/> Kaldır
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Alt Kısım */}
                        {sepet.length > 0 && (
                            <div className="border-t border-gray-100 px-4 py-6 sm:px-6 bg-gray-50">
                                <div className="flex justify-between text-base font-black text-gray-900 mb-4">
                                    <p>Ara Toplam</p>
                                    <p>₺{sepetToplami}</p>
                                </div>
                                <div className="mt-6">
                                    <Link href="/odeme" onClick={() => setSepetAcik(false)} className="flex items-center justify-center rounded-full border border-transparent bg-black px-6 py-4 text-base font-bold text-white shadow-sm hover:bg-gray-800 transition">
                                        Ödemeye Geç
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- HERO SECTION (GİRİŞ BANNER) --- */}
      <header className="pt-32 pb-20 px-6 bg-[#f6f6f6] overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
          
          {/* Sol Yazı Alanı */}
          <div className="flex-1 space-y-6 text-center md:text-left z-10 animate-in slide-in-from-bottom-10 duration-700 fade-in">
            <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-2">
               YENİ NESİL OTO AKSESUAR
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-gray-900">
              Tarzını <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Araban</span> Yansıtsın.
            </h1>
            <p className="text-lg text-gray-500 max-w-lg mx-auto md:mx-0 leading-relaxed font-medium">
              Sıradan kokulardan sıkıldın mı? Arabanın camına asabileceğin, tamamen sana özel tasarlanmış mini tişörtlerle fark yarat.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <Link href="/tasarim" className="w-full sm:w-auto">
                <button className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 hover:scale-105 transition transform shadow-xl w-full justify-center">
                  <PenTool size={20} />
                  Kendin Tasarla
                </button>
              </Link>
              <button className="flex items-center gap-2 bg-white text-black border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition w-full sm:w-auto justify-center">
                Koleksiyonu Gör
              </button>
            </div>
          </div>

          {/* Sağ Görsel Alanı */}
          <div className="flex-1 relative w-full flex justify-center perspective-1000">
            {/* Görsel Alanı - 3D hissi veren kart */}
            <div className="relative z-10 w-full max-w-[400px] aspect-[4/5] bg-gradient-to-tr from-gray-200 to-white rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden group hover:rotate-1 transition-transform duration-500">
               {/* Arkaplan Deseni */}
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent"></div>
               
               {/* Temsili Ürün Görseli */}
               <div className="relative z-20 w-3/4 transition-transform duration-500 group-hover:scale-110">
                   <img 
                    src="https://placehold.co/600x800/transparent/333?text=Mini+T-Shirt" 
                    alt="Mini T-Shirt" 
                    className="drop-shadow-2xl"
                   />
               </div>
               
               {/* Ürün Etiketi */}
               <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50">
                 <div className="flex justify-between items-center">
                   <div>
                     <p className="font-bold text-gray-900 leading-tight">Phantom Edition</p>
                     <p className="text-xs text-gray-500 font-medium">Kişiselleştirilebilir</p>
                   </div>
                   <span className="text-blue-600 font-black text-lg">₺250</span>
                 </div>
               </div>
            </div>

            {/* Arkaplan Dekoratif Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-400/20 rounded-full blur-[100px] -z-0 pointer-events-none"></div>
          </div>

        </div>
      </header>

      {/* --- ÖZELLİKLER (NEDEN BİZ?) --- */}
      <section className="py-20 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Kart 1 */}
            <div className="p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <PenTool size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Tamamen Senin Tasarımın</h3>
              <p className="text-gray-500 leading-relaxed">İstediğin fotoğrafı yükle, yazını yaz. Arabanda seni yansıtan eşsiz bir parça olsun.</p>
            </div>
            {/* Kart 2 */}
            <div className="p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Truck size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Hızlı & Ücretsiz Kargo</h3>
              <p className="text-gray-500 leading-relaxed">Tasarladığın ürünler 2 iş günü içinde profesyonelce üretilir ve sigortalı kargolanır.</p>
            </div>
            {/* Kart 3 */}
            <div className="p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">100% Memnuniyet</h3>
              <p className="text-gray-500 leading-relaxed">Baskı kalitesini beğenmezsen koşulsuz iade ve anında değişim garantisi veriyoruz.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- POPÜLER TASARIMLAR VİTRİNİ (Firebase Entegrasyonlu) --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
               <h2 className="text-4xl font-black mb-3 tracking-tight">Popüler Tasarımlar</h2>
               <p className="text-gray-500 text-lg">
                 {yukleniyor ? "Ürünler yükleniyor..." : `Kullanıcılarımızın en çok tercih ettiği ${urunler.length} hazır model.`}
               </p>
            </div>
            <Link href="#" className="hidden md:flex items-center gap-2 font-bold hover:underline group">
              Tümünü Gör <ArrowRight size={18} className="group-hover:translate-x-1 transition"/>
            </Link>
          </div>

          {yukleniyor ? (
             /* Yükleniyor Animasyonu */
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 h-[350px] rounded-3xl mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                ))}
             </div>
          ) : urunler.length === 0 ? (
             /* Ürün Yoksa */
             <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4"/>
                <p className="text-gray-500 text-lg">Henüz vitrine ürün eklenmemiş.</p>
             </div>
          ) : (
             /* Ürün Listesi */
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {urunler.map((urun) => (
                 <div key={urun.id} className="group cursor-pointer">
                   <div className="bg-[#f0f0f0] rounded-3xl h-[350px] mb-5 overflow-hidden relative border border-gray-100 group-hover:border-gray-300 transition-colors">
                     {/* Ürün Resmi */}
                     <img 
                       src={urun.resim} 
                       className="w-full h-full object-cover group-hover:scale-105 transition duration-700 mix-blend-multiply"
                       alt={urun.isim}
                       onError={(e) => {e.target.src='https://placehold.co/400x500/eee/333?text=Resim+Yok'}}
                     />
                     {/* Hover Butonu (GÜNCELLENDİ: Sepete Ekle) */}
                     <button 
                       onClick={() => sepeteEkle(urun)}
                       className="absolute bottom-4 right-4 bg-black text-white p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition duration-300 hover:bg-gray-800"
                       title="Sepete Ekle"
                     >
                       <ShoppingBag size={20} />
                     </button>
                     {/* Etiket */}
                     {Number(urun.fiyat) > 200 && (
                        <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Çok Satan</span>
                     )}
                   </div>
                   <h3 className="font-bold text-xl text-gray-900">{urun.isim}</h3>
                   <p className="text-gray-500 mt-1 font-medium">₺{urun.fiyat}</p>
                 </div>
               ))}
             </div>
          )}
          
          <div className="mt-12 text-center md:hidden">
            <button className="border-2 border-black px-8 py-3 rounded-full font-bold w-full hover:bg-black hover:text-white transition">Tümünü Gör</button>
          </div>
        </div>
      </section>

      {/* --- ALT BANNER (CALL TO ACTION) --- */}
      <section className="py-20 px-6">
        <div className="container mx-auto bg-black rounded-[3rem] text-white p-12 md:p-32 text-center relative overflow-hidden group">
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
              Kendi Tarzını Yaratmaya Hazır Mısın?
            </h2>
            <p className="text-gray-400 text-xl font-light">
              Gelişmiş 3D editörümüz ile saniyeler içinde tasarımını yap, anında sipariş ver. Kargo bizden.
            </p>
            <div className="pt-4">
                <Link href="/tasarim">
                  <button className="bg-white text-black px-12 py-5 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-2xl shadow-white/10 hover:shadow-white/20 transform hover:-translate-y-1">
                      Hemen Tasarla
                  </button>
                </Link>
            </div>
          </div>
          
          {/* Hareketli Arkaplan Efekti */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-40 group-hover:opacity-60 transition duration-1000"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-[150px] opacity-40 group-hover:opacity-60 transition duration-1000"></div>
        </div>
      </section>

      {/* --- FOOTER (ALT BİLGİ) --- */}
      <footer className="bg-white pt-20 pb-10 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <h4 className="text-2xl font-black tracking-tighter">HATRIX</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Türkiye'nin en yenilikçi oto aksesuar ve kişiselleştirme platformu. Tarzını yola yansıt.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-gray-900">Alışveriş</h5>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-black transition">Yeni Gelenler</Link></li>
                <li><Link href="#" className="hover:text-black transition">Çok Satanlar</Link></li>
                <li><Link href="#" className="hover:text-black transition">Kişiye Özel</Link></li>
                <li><Link href="#" className="hover:text-black transition">Kampanyalar</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-gray-900">Kurumsal</h5>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-black transition">Hakkımızda</Link></li>
                <li><Link href="#" className="hover:text-black transition">İletişim</Link></li>
                <li><Link href="#" className="hover:text-black transition">Bayilik Başvurusu</Link></li>
                <li><Link href="#" className="hover:text-black transition">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-gray-900">Yardım</h5>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-black transition">Sipariş Takibi</Link></li>
                <li><Link href="#" className="hover:text-black transition">İade Koşulları</Link></li>
                <li><Link href="#" className="hover:text-black transition">Sıkça Sorulan Sorular</Link></li>
                <li><Link href="#" className="hover:text-black transition">Beden Tablosu</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 text-xs text-gray-400 font-medium">
            <p>&copy; 2025 Hatrix Oto Aksesuar. Tüm hakları saklıdır.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="cursor-pointer hover:text-gray-600">Gizlilik Politikası</span>
              <span className="cursor-pointer hover:text-gray-600">Kullanım Şartları</span>
              <span className="cursor-pointer hover:text-gray-600">Çerez Politikası</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}