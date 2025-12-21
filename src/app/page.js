"use client";

import React from 'react';
// Link bileşeni yerine standart a etiketi kullanıyoruz
import { ShoppingBag, PenTool, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* --- NAVBAR (ÜST MENÜ) --- */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 transition-all duration-300">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo */}
          <div className="text-2xl font-black tracking-tighter cursor-pointer flex items-center gap-2">
            HATRIX
          </div>
          
          {/* Orta Linkler (Masaüstü) */}
          <div className="hidden md:flex gap-8 font-medium text-sm text-gray-600">
            <a href="#" className="hover:text-black transition">Koleksiyon</a>
            <a href="#" className="hover:text-black transition">Hakkımızda</a>
            <a href="#" className="hover:text-black transition">İletişim</a>
          </div>

          {/* Aksiyon Butonu */}
          <div className="flex gap-4">
            <a href="/tasarim">
              <button className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200">
                Tasarlamaya Başla
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (GİRİŞ BANNER) --- */}
      <header className="pt-32 pb-20 px-6 bg-[#f6f6f6] overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
          
          {/* Sol Yazı Alanı */}
          <div className="flex-1 space-y-6 text-center md:text-left z-10 animate-in slide-in-from-bottom-10 duration-700 fade-in">
            <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-2">
              🚀 YENİ NESİL OTO AKSESUAR
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-gray-900">
              Tarzını <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Araban</span> Yansıtsın.
            </h1>
            <p className="text-lg text-gray-500 max-w-lg mx-auto md:mx-0 leading-relaxed font-medium">
              Sıradan kokulardan sıkıldın mı? Arabanın camına asabileceğin, tamamen sana özel tasarlanmış mini tişörtlerle fark yarat.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <a href="/tasarim">
                <button className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 hover:scale-105 transition transform shadow-xl w-full sm:w-auto justify-center">
                  <PenTool size={20} />
                  Kendin Tasarla
                </button>
              </a>
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
               
               {/* Temsili Ürün Görseli (Placeholder) */}
               <div className="relative z-20 w-3/4 transition-transform duration-500 group-hover:scale-110">
                   {/* Buraya gerçek tişört PNG'nizi koyabilirsiniz: src="/tshirt-kalip.png" */}
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

      {/* --- POPÜLER TASARIMLAR VİTRİNİ --- */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
               <h2 className="text-4xl font-black mb-3 tracking-tight">Popüler Tasarımlar</h2>
               <p className="text-gray-500 text-lg">Kullanıcılarımızın en çok tercih ettiği hazır modeller.</p>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 font-bold hover:underline group">
              Tümünü Gör <ArrowRight size={18} className="group-hover:translate-x-1 transition"/>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="group cursor-pointer">
                <div className="bg-[#f0f0f0] rounded-3xl h-[350px] mb-5 overflow-hidden relative border border-gray-100 group-hover:border-gray-300 transition-colors">
                  {/* Ürün Resmi */}
                  <img 
                    src={`https://placehold.co/400x500/eee/333?text=Design+${item}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700 mix-blend-multiply"
                    alt="Ürün"
                  />
                  {/* Hover Butonu */}
                  <button className="absolute bottom-4 right-4 bg-black text-white p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition duration-300 hover:bg-gray-800">
                    <ShoppingBag size={20} />
                  </button>
                  {/* Etiket */}
                  {item === 1 && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Çok Satan</span>}
                </div>
                <h3 className="font-bold text-xl text-gray-900">JDM Style No.{item}</h3>
                <p className="text-gray-500 mt-1 font-medium">₺180.00</p>
              </div>
            ))}
          </div>
          
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
                <a href="/tasarim">
                  <button className="bg-white text-black px-12 py-5 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-2xl shadow-white/10 hover:shadow-white/20 transform hover:-translate-y-1">
                      Hemen Tasarla
                  </button>
                </a>
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
                <li><a href="#" className="hover:text-black transition">Yeni Gelenler</a></li>
                <li><a href="#" className="hover:text-black transition">Çok Satanlar</a></li>
                <li><a href="#" className="hover:text-black transition">Kişiye Özel</a></li>
                <li><a href="#" className="hover:text-black transition">Kampanyalar</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-gray-900">Kurumsal</h5>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-black transition">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-black transition">İletişim</a></li>
                <li><a href="#" className="hover:text-black transition">Bayilik Başvurusu</a></li>
                <li><a href="#" className="hover:text-black transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-gray-900">Yardım</h5>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-black transition">Sipariş Takibi</a></li>
                <li><a href="#" className="hover:text-black transition">İade Koşulları</a></li>
                <li><a href="#" className="hover:text-black transition">Sıkça Sorulan Sorular</a></li>
                <li><a href="#" className="hover:text-black transition">Beden Tablosu</a></li>
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