"use client";

import React, { useState, Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  useTexture,
  Environment,
  Center,
  ContactShadows,
  useGLTF
} from '@react-three/drei';
import {
  Upload,
  ArrowLeft,
  ShoppingBag,
  Palette,
  Move,
  ZoomIn,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import * as THREE from 'three';

/* ================= AYARLAR ================= */

// 1. Model Yolları
const MODEL_PATHS = {
  tshirt: '/models/Meshy_AI_Black_T_Shirt_0116154220_generate.glb',
  hoodie: '/models/Meshy_AI_Hoody_in_Black_0116161358_generate.glb',
  sweatshirt: '/models/Meshy_AI_Black_Sweatshirt_Disp_0116152203_generate.glb'
};

// 2. Baskı Alanı Sınırları (Kalıp)
// Logonun model üzerinde gidebileceği maksimum X ve Y sınırları.
const PRINT_AREA = {
  x: { min: -0.20, max: 0.20 }, // Sağ-Sol genişliği
  y: { min: -0.35, max: 0.25 }  // Aşağı-Yukarı yüksekliği
};

/* ================= KAMERA KONTROLCÜSÜ (AKILLI) ================= */
function CameraController({ view }) {
  const { camera } = useThree();
  const isAnimating = useRef(false);

  // Kamera Pozisyonları
  const positions = useMemo(() => ({
    front: new THREE.Vector3(0, 0, 4.5),
    back: new THREE.Vector3(0, 0, -4.5),
    left: new THREE.Vector3(-4.5, 0, 0),
    right: new THREE.Vector3(4.5, 0, 0)
  }), []);

  // Görünüm değiştiğinde animasyonu tetikle
  useEffect(() => {
    isAnimating.current = true;
  }, [view]);

  useFrame((state, delta) => {
    if (isAnimating.current) {
      const targetPos = positions[view];
      state.camera.position.lerp(targetPos, delta * 4); // Hız
      state.camera.lookAt(0, 0, 0);

      // Hedefe varınca kontrolü OrbitControls'e bırak
      if (state.camera.position.distanceTo(targetPos) < 0.05) {
        isAnimating.current = false;
      }
    }
  });

  return null;
}

/* ================= 3D MODEL & LOGO (KATMAN TEKNİĞİ) ================= */
function Real3DModel({ color, texturePath, logoStats, modelType }) {
  // Modeli Yükle
  const { nodes } = useGLTF(MODEL_PATHS[modelType] || MODEL_PATHS.tshirt);

  // Logoyu Yükle
  const userTexture = useTexture(texturePath || 'https://placehold.co/10x10/transparent/transparent.png');
  userTexture.anisotropy = 16;
  userTexture.colorSpace = THREE.SRGBColorSpace;

  // Ana Parçayı Bul
  const mainNode = useMemo(() => {
    const allMeshes = Object.values(nodes).filter(n => n.isMesh && n.geometry);
    if (!allMeshes.length) return null;
    return allMeshes.sort((a, b) =>
      b.geometry.attributes.position.count - a.geometry.attributes.position.count
    )[0];
  }, [nodes]);

  // Materyal Rengini Ayarla (Orijinal dokuyu bozmadan)
  useEffect(() => {
    if (mainNode) {
      mainNode.material.color.set(color);
      mainNode.material.roughness = 0.7;
      mainNode.material.needsUpdate = true;
    }
  }, [color, mainNode]);

  if (!mainNode) return null;

  // --- LOGO POZİSYON HESABI (KALIP İÇİNDE) ---
  // Panelden gelen 0-100 verisini PRINT_AREA sınırlarına çeviriyoruz.
  const mapX = PRINT_AREA.x.min + (logoStats.x / 100) * (PRINT_AREA.x.max - PRINT_AREA.x.min);
  // Y ekseni ters çalışır (0 üsttür), bu yüzden max'tan çıkarıyoruz.
  const mapY = PRINT_AREA.y.max - (logoStats.y / 100) * (PRINT_AREA.y.max - PRINT_AREA.y.min);

  // Derinlik Ayarı (Modele göre ne kadar önde duracak?)
  const zOffset = modelType === 'hoodie' ? 0.35 : 0.28;

  return (
    <group dispose={null}>
      <Center top>
        {/* GERÇEK MODEL */}
        <primitive
          object={mainNode}
          rotation={[0, 0, 0]} // Düz duruş
          castShadow
          receiveShadow
        />

        {/* LOGO (MODELİN ÖNÜNE KOYULAN LEVHA) */}
        {/* Bu yöntem hata vermez ve resim her zaman görünür */}
        {texturePath && (
          <mesh
            position={[mapX, mapY, zOffset]}
            rotation={[0, 0, 0]}
            scale={[logoStats.scale * 0.4, logoStats.scale * 0.4, 1]}
            renderOrder={999} // En öne çiz
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={userTexture}
              transparent={true}
              depthTest={false} // Modelin içinden geçse bile göster
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </Center>

      <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
    </group>
  );
}

/* ================= SAĞ PANEL (EDİTÖR) ================= */
function EditorPanel({ activeTab, setActiveTab, color, setColor, textureUrl, handleUpload, logoStats, setLogoStats, loading, addToCart, sizes, size, setSize }) {
  const editorRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging || !editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let percentX = (x / rect.width) * 100;
    let percentY = (y / rect.height) * 100;

    percentX = Math.max(0, Math.min(100, percentX));
    percentY = Math.max(0, Math.min(100, percentY));

    setLogoStats(prev => ({ ...prev, x: percentX, y: percentY }));
  };

  return (
    <div className="w-[350px] bg-[#111111] border-l border-zinc-800 flex flex-col z-20 shadow-2xl h-full">
      {/* Üst Kısım */}
      <div className="p-6 border-b border-zinc-800 bg-[#111111]">
        <div className="flex justify-between items-center mb-4">
          <div><p className="text-zinc-500 text-[10px] font-bold">TOPLAM</p><h2 className="text-2xl font-mono text-white">₺750.00</h2></div>
          <div className="text-right">
            <p className="text-zinc-500 text-[10px] font-bold mb-1">BEDEN</p>
            <div className="flex gap-1 justify-end">
              {sizes.map(s => (
                <button key={s} onClick={() => setSize(s)} className={`w-6 h-6 text-[10px] font-bold rounded flex items-center justify-center border transition ${size === s ? 'bg-white text-black border-white' : 'text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tablar */}
      <div className="flex border-b border-zinc-800 bg-[#111111]">
        <button onClick={() => setActiveTab('editor')} className={`flex-1 py-4 flex flex-col items-center gap-1 text-[10px] font-bold uppercase transition ${activeTab === 'editor' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}><Move size={18} /> Düzenle</button>
        <button onClick={() => setActiveTab('color')} className={`flex-1 py-4 flex flex-col items-center gap-1 text-[10px] font-bold uppercase transition ${activeTab === 'color' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}><Palette size={18} /> Renk</button>
      </div>

      {/* İçerik Alanı */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#111111]">
        {activeTab === 'editor' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {!textureUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-white hover:bg-zinc-900 transition group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-zinc-500 group-hover:text-white transition" />
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Logo Yükle</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <span className="text-xs text-white font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Logo Yüklü</span>
                <label className="text-[10px] text-zinc-400 hover:text-white cursor-pointer underline"><input type="file" className="hidden" onChange={handleUpload} />Değiştir</label>
              </div>
            )}

            {textureUrl && (
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase">Yerleşim</h3>
                  <button onClick={() => setLogoStats({ x: 50, y: 30, scale: 0.5 })} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><RefreshCcw size={10} /> Sıfırla</button>
                </div>
                <div
                  ref={editorRef}
                  className="w-full aspect-[3/4] bg-zinc-800 rounded-lg border border-zinc-700 relative overflow-hidden cursor-crosshair select-none"
                  onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <div
                    onMouseDown={handleMouseDown}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10"
                    style={{
                      left: `${logoStats.x}%`,
                      top: `${logoStats.y}%`,
                      width: `${logoStats.scale * 120}px`,
                    }}
                  >
                    <img src={textureUrl} className="w-full h-full object-contain pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {textureUrl && (
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase mb-3">Boyut</h3>
                <div className="flex items-center gap-3">
                  <ZoomIn size={14} className="text-zinc-500" />
                  <input type="range" min="0.1" max="1.5" step="0.05" value={logoStats.scale} onChange={(e) => setLogoStats(prev => ({ ...prev, scale: parseFloat(e.target.value) }))} className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'color' && (
          <div className="grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
            {["#ffffff", "#111111", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"].map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`w-full aspect-square rounded-full border-2 transition hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-800 bg-[#111111]">
        <button onClick={addToCart} disabled={loading} className={`w-full bg-white text-black py-4 rounded-full font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}>
          {loading ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />} {loading ? 'EKLENİYOR' : 'SEPETE EKLE'}
        </button>
      </div>
    </div>
  );
}

/* ================= ANA SAYFA (LAYOUT) ================= */
export default function TasarimSayfasi() {
  const [activeTab, setActiveTab] = useState('editor');
  const [color, setColor] = useState('#ffffff');
  const [textureUrl, setTextureUrl] = useState(null);
  const [logoStats, setLogoStats] = useState({ x: 50, y: 30, scale: 0.5 });
  const [view, setView] = useState('front');
  const [modelType, setModelType] = useState('tshirt');
  const [size, setSize] = useState('M');
  const [loading, setLoading] = useState(false);
  const sizes = ['S', 'M', 'L', 'XL'];

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTextureUrl(e.target.result);
        setActiveTab('editor');
        setLogoStats({ x: 50, y: 30, scale: 0.5 });
      };
      reader.readAsDataURL(file);
    }
  };

  const addToCart = () => {
    if (!textureUrl) { alert("Lütfen logo yükleyiniz."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); alert("Sepete eklendi!"); }, 800);
  };

  return (
    <div className="h-screen w-full bg-[#1a1a1a] text-white flex overflow-hidden font-sans">
      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-zinc-400 hover:text-white transition uppercase text-xs font-bold tracking-widest"><ArrowLeft size={16} /> ÇIKIŞ</Link>

      <div className="flex-1 relative bg-gradient-to-b from-[#1a1a1a] to-[#000000]">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center opacity-50 pointer-events-none"><h1 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">{modelType}</h1></div>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-full border border-zinc-700 shadow-2xl">
          {['front', 'back', 'left', 'right'].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${view === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              {v === 'front' ? 'Ön' : v === 'back' ? 'Arka' : v === 'left' ? 'Sol' : 'Sağ'}
            </button>
          ))}
        </div>

        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 7]} intensity={1.5} castShadow />
          <Environment preset="city" />

          <CameraController view={view} />

          <Suspense fallback={null}>
            <Real3DModel
              color={color}
              texturePath={textureUrl}
              logoStats={logoStats}
              modelType={modelType}
            />
          </Suspense>

          <OrbitControls
            makeDefault
            enableZoom={true}
            minDistance={1.5}
            maxDistance={10}
          />
        </Canvas>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {['tshirt', 'hoodie', 'sweatshirt'].map(m => (
            <button key={m} onClick={() => setModelType(m)} className={`hover:text-white transition ${modelType === m ? 'text-white border-b border-white' : ''}`}>{m.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <EditorPanel
        activeTab={activeTab} setActiveTab={setActiveTab}
        color={color} setColor={setColor}
        textureUrl={textureUrl} handleUpload={handleUpload}
        logoStats={logoStats} setLogoStats={setLogoStats}
        loading={loading} addToCart={addToCart}
        sizes={sizes} size={size} setSize={setSize}
      />
    </div>
  );
}

useGLTF.preload(MODEL_PATHS.tshirt);
useGLTF.preload(MODEL_PATHS.hoodie);
useGLTF.preload(MODEL_PATHS.sweatshirt);