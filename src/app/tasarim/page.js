"use client";

import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Decal, Environment, Center, ContactShadows } from '@react-three/drei';
import { Upload, Type, ArrowRight, Palette, ArrowLeft, ShoppingBag } from 'lucide-react';
import * as THREE from 'three';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Firebase
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- 3D GÖRSEL YÜKLEYİCİ BİLEŞENİ ---
function UrunResmi({ imgUrl }) {
  const texture = useTexture(imgUrl);
  return (
    <Decal 
      position={[0, 0.2, 0.85]} 
      rotation={[0, 0, 0]} 
      scale={[1, 1, 1]} 
      map={texture} 
    />
  );
}

// --- 3D YAZI BİLEŞENİ ---
function YaziDecal({ text, color }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 140px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, color]);

  return (
    <Decal 
      position={[0, -0.4, 0.85]} 
      rotation={[0, 0, 0]} 
      scale={[1.8, 0.45, 1]} 
      map={texture} 
      depthTest={true} 
    />
  );
}

// --- 3D MODEL BİLEŞENİ ---
function UrunModeli({ renk, kaplamaResmi, yazi, yaziRengi, scale = 1 }) {
  return (
    <group dispose={null}>
      <Center top>
        <mesh castShadow receiveShadow scale={scale}>
          <capsuleGeometry args={[0.8, 2, 4, 16]} />
          <meshStandardMaterial 
            color={renk} 
            roughness={0.3} 
            metalness={0.1} 
          />
          {kaplamaResmi && <UrunResmi imgUrl={kaplamaResmi} />}
          {yazi && <YaziDecal text={yazi} color={yaziRengi} />}
        </mesh>
      </Center>
    </group>
  );
}

// --- ANA SAYFA ---
export default function TasarimSayfasi() {
  const router = useRouter();
  const [kullanici, setKullanici] = useState(null);
  const [authYuklendi, setAuthYuklendi] = useState(false);

  const [renk, setRenk] = useState('#ffffff');
  const [yuklenenResim, setYuklenenResim] = useState(null);
  const [yazi, setYazi] = useState('');
  const [yaziRengi, setYaziRengi] = useState('#000000');
  const [aktifTab, setAktifTab] = useState('renk'); 
  
  const [yukleniyor, setYukleniyor] = useState(false);

  // Kullanıcı Kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setKullanici(user);
      setAuthYuklendi(true);
    });
    return () => unsubscribe();
  }, []);

  const resimYukle = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setYuklenenResim(reader.result); // Base64 olarak kaydet
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SEPETE EKLEME İŞLEMİ ---
  const sepeteEkle = async () => {
    if (!authYuklendi) return; 

    // 1. Giriş Kontrolü
    if (!kullanici) {
        alert("Tasarımınızı kaydetmek için lütfen önce giriş yapınız.");
        router.push('/giris');
        return;
    }

    setYukleniyor(true);
    
    try {
        // 2. Sipariş Verisini Hazırla
        const yeniUrun = {
            id: `ozel-${Date.now()}`, // Benzersiz ID
            isim: 'Kişiye Özel Phantom T-Shirt',
            fiyat: 250,
            // Sepette görünecek resim
            resim: yuklenenResim || 'https://placehold.co/600x600?text=Ozel+Tasarim', 
            ozellikler: {
                renk: renk,
                yazi: yazi,
                ozelResim: yuklenenResim ? 'Var' : 'Yok'
            },
            adet: 1
        };

        // 3. LocalStorage'a Kaydet
        // Mevcut sepeti al, yoksa boş dizi oluştur
        const mevcutSepetStr = localStorage.getItem('sepet');
        let mevcutSepet = [];
        if (mevcutSepetStr) {
            try {
                mevcutSepet = JSON.parse(mevcutSepetStr);
            } catch (e) {
                mevcutSepet = [];
            }
        }

        // Yeni ürünü ekle
        const guncelSepet = [...mevcutSepet, yeniUrun];
        
        // Geri kaydet
        localStorage.setItem('sepet', JSON.stringify(guncelSepet));

        // 4. Yönlendir (Tam Sayfa Yenileme ile)
        // Bu yöntem, ana sayfanın sepeti %100 görmesini sağlar.
        setTimeout(() => {
            setYukleniyor(false);
            alert("Tasarımınız başarıyla sepete eklendi!");
            window.location.href = '/'; 
        }, 500);

    } catch (error) {
        console.error("Sepet Hatası:", error);
        alert("Sepete eklenirken bir hata oluştu.");
        setYukleniyor(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
      
      <Link href="/" className="absolute top-6 right-6 z-50 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition md:hidden">
         <ArrowLeft size={24} className="text-black"/>
      </Link>

      {/* --- SOL TARAF: 3D SAHNE --- */}
      <div className="w-full md:w-[70%] h-[50vh] md:h-full bg-[#f6f6f6] relative cursor-move">
        
        <div className="absolute top-8 left-8 z-10 hidden md:block">
           <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-black transition mb-4">
                <ArrowLeft size={18}/> Ana Sayfaya Dön
           </Link>
          <h2 className="text-2xl font-bold tracking-tighter text-gray-900">Hatrix <span className="text-gray-400">By You</span></h2>
          <p className="text-sm text-gray-500 font-medium">Mini T-Shirt Edition</p>
        </div>

        <Canvas shadows camera={{ position: [0, 0, 4.5], fov: 50 }}>
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-bias={-0.0001} />
          <Environment preset="city" />

          <group position={[0, -0.5, 0]}>
            <Suspense fallback={null}>
              <UrunModeli 
                renk={renk} 
                kaplamaResmi={yuklenenResim} 
                yazi={yazi}
                yaziRengi={yaziRengi}
                scale={1.2} 
              />
            </Suspense>
            
            <ContactShadows 
              position={[0, -1.5, 0]} 
              opacity={0.5} 
              scale={10} 
              blur={1.5} 
              far={4.5} 
            />
          </group>

          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 2.5} 
            maxPolarAngle={Math.PI / 2}
            enableZoom={true}
          />
        </Canvas>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest pointer-events-none select-none">
          <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
          Çevirmek İçin Sürükle
        </div>
      </div>

      {/* --- SAĞ TARAF: PANEL --- */}
      <div className="w-full md:w-[30%] bg-white h-auto md:h-full flex flex-col shadow-2xl z-20">
        
        <div className="p-8 border-b hidden md:block">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phantom T-Shirt</h1>
          <p className="text-gray-600">Oto Cam Aksesuarı</p>
          <div className="mt-4 text-lg font-medium text-gray-900">₺250.00</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Renk Tab */}
          <div className={`border-b transition-all duration-300 ${aktifTab === 'renk' ? 'bg-gray-50' : ''}`}>
            <button 
              onClick={() => setAktifTab('renk')}
              className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <span className="font-bold flex items-center gap-3 text-gray-800"><Palette size={20}/> Kumaş Rengi</span>
              <span className={`transform transition-transform ${aktifTab === 'renk' ? 'rotate-90' : ''}`}><ArrowRight size={16}/></span>
            </button>
            
            {aktifTab === 'renk' && (
              <div className="px-6 pb-8 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="grid grid-cols-5 gap-3">
                  {['#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#78350f'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setRenk(color)}
                      className={`w-10 h-10 rounded-full border border-gray-200 shadow-sm transition-transform hover:scale-110 ${renk === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Görsel Tab */}
          <div className={`border-b transition-all duration-300 ${aktifTab === 'gorsel' ? 'bg-gray-50' : ''}`}>
            <button 
              onClick={() => setAktifTab('gorsel')}
              className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <span className="font-bold flex items-center gap-3 text-gray-800"><Upload size={20}/> Görsel / Logo</span>
              <span className={`transform transition-transform ${aktifTab === 'gorsel' ? 'rotate-90' : ''}`}><ArrowRight size={16}/></span>
            </button>
            
            {aktifTab === 'gorsel' && (
              <div className="px-6 pb-8 animate-in slide-in-from-top-2 fade-in duration-200">
                <p className="text-sm text-gray-500 mb-4">Tişörtün üzerine basılacak görseli yükleyin.</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-white hover:border-black transition group bg-white">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400 group-hover:text-black transition"/>
                    <p className="text-sm text-gray-500 font-medium group-hover:text-black">Yüklemek için tıklayın</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={resimYukle} />
                </label>
                {yuklenenResim && (
                    <div className="mt-4 p-2 border rounded flex items-center gap-3 bg-white">
                        <img src={yuklenenResim} className="w-10 h-10 object-cover rounded" />
                        <span className="text-xs text-green-600 font-bold">Görsel Yüklendi</span>
                    </div>
                )}
              </div>
            )}
          </div>

           {/* Yazı Tab */}
           <div className={`border-b transition-all duration-300 ${aktifTab === 'yazi' ? 'bg-gray-50' : ''}`}>
            <button 
              onClick={() => setAktifTab('yazi')}
              className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <span className="font-bold flex items-center gap-3 text-gray-800"><Type size={20}/> Yazı / Slogan</span>
              <span className={`transform transition-transform ${aktifTab === 'yazi' ? 'rotate-90' : ''}`}><ArrowRight size={16}/></span>
            </button>
            
            {aktifTab === 'yazi' && (
              <div className="px-6 pb-8 animate-in slide-in-from-top-2 fade-in duration-200">
                <p className="text-sm text-gray-500 mb-3">Tişörtün üzerine yazılacak metni girin.</p>
                <input 
                  type="text" 
                  value={yazi}
                  onChange={(e) => setYazi(e.target.value)}
                  placeholder="Buraya yazın..." 
                  maxLength={15}
                  className="w-full p-4 border border-gray-300 rounded-lg text-gray-900 font-bold focus:outline-black mb-4 placeholder:font-normal"
                />
                
                <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">Yazı Rengi</p>
                <div className="flex gap-2">
                  {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#f59e0b', '#10b981'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setYaziRengi(color)}
                      className={`w-8 h-8 rounded-full border border-gray-200 shadow-sm transition-transform hover:scale-110 ${yaziRengi === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="p-6 border-t bg-white safe-area-bottom">
          <button 
            onClick={sepeteEkle}
            disabled={yukleniyor || !authYuklendi}
            className={`w-full bg-black text-white py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform active:scale-95 duration-200 ${yukleniyor ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {yukleniyor ? 'İşleniyor...' : <><ShoppingBag size={20}/> Sepete Ekle — ₺250.00</>}
          </button>
        </div>

      </div>
    </div>
  );
}