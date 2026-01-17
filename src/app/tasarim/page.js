"use client";
import { useCart } from '@/context/CartContext';
import React, { useState, Suspense, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  useTexture,
  Decal,
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
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ================= AYARLAR ================= */

const MODEL_PATHS = {
  tshirt: '/models/Meshy_AI_Black_T_Shirt_0116154220_generate.glb',
  hoodie: '/models/Meshy_AI_Hoody_in_Black_0116161358_generate.glb',
  sweatshirt: '/models/Meshy_AI_Black_Sweatshirt_Disp_0116152203_generate.glb'
};

// Baskı Alanı (Decal için)
const PRINT_AREA = {
  x: { min: -0.15, max: 0.15 },
  y: { min: 0.1, max: 0.4 }
};

/* ================= KAMERA KONTROLCÜSÜ ================= */
function CameraController({ view }) {
  const { camera } = useThree();
  const isAnimating = useRef(false);

  const positions = useMemo(() => ({
    front: new THREE.Vector3(0, 0, 4.2),
    back: new THREE.Vector3(0, 0, -4.2),
    left: new THREE.Vector3(-4.2, 0, 0),
    right: new THREE.Vector3(4.2, 0, 0)
  }), []);

  useEffect(() => {
    isAnimating.current = true;
  }, [view]);

  useFrame((state, delta) => {
    if (isAnimating.current) {
      const targetPos = positions[view];
      state.camera.position.lerp(targetPos, delta * 3);
      state.camera.lookAt(0, 0, 0);
      if (state.camera.position.distanceTo(targetPos) < 0.05) {
        isAnimating.current = false;
      }
    }
  });

  return null;
}

/* ================= 3D MODEL BİLEŞENİ ================= */
function Real3DModel({ color, texturePath, logoStats, modelType }) {
  const { nodes } = useGLTF(MODEL_PATHS[modelType] || MODEL_PATHS.tshirt);

  const userTexture = useTexture(texturePath || 'https://placehold.co/10x10/transparent/transparent.png');
  userTexture.anisotropy = 16;
  userTexture.colorSpace = THREE.SRGBColorSpace;

  useEffect(() => {
    if (!userTexture) return;
    userTexture.flipY = true;
    userTexture.needsUpdate = true;
  }, [userTexture, texturePath]);

  // 1. Ana Parçayı Bul
  const mainNode = useMemo(() => {
    const validNodes = Object.values(nodes).filter(
      (n) => n.isMesh && n.geometry && n.geometry.attributes && n.geometry.attributes.position
    );
    if (!validNodes.length) return null;
    return validNodes.sort((a, b) =>
      b.geometry.attributes.position.count - a.geometry.attributes.position.count
    )[0];
  }, [nodes]);

  const safeGeometry = useMemo(() => {
    if (!mainNode?.geometry) return null;

    let g = mainNode.geometry.clone();

    if (!g.attributes?.position) return null;

    if (g.getAttribute('color')) g.deleteAttribute('color');
    if (g.getAttribute('normal')) g.deleteAttribute('normal');

    try {
      g = mergeVertices(g, 1e-4);
    } catch (e) {
      // hata durumunda devam et
    }

    g.computeVertexNormals();
    if (typeof g.normalizeNormals === 'function') g.normalizeNormals();

    if (!g.boundingBox) g.computeBoundingBox();
    if (!g.boundingSphere) g.computeBoundingSphere();

    return g;
  }, [mainNode]);

  const customMaterial = useMemo(() => {
    if (!mainNode) return null;

    const mat = mainNode.material?.clone?.() || new THREE.MeshStandardMaterial();

    mat.color.set(color);
    mat.roughness = 0.9;
    mat.metalness = 0;

    mat.map = null;
    mat.aoMap = null;
    mat.normalMap = null;
    mat.roughnessMap = null;
    mat.metalnessMap = null;
    mat.emissiveMap = null;
    mat.alphaMap = null;

    mat.vertexColors = false;
    mat.flatShading = false;

    mat.needsUpdate = true;
    return mat;
  }, [mainNode, color]);

  const meshRef = useRef(null);
  const [meshReady, setMeshReady] = useState(false);

  useEffect(() => {
    setMeshReady(false);
  }, [modelType]);

  useLayoutEffect(() => {
    if (meshRef.current && safeGeometry) {
      meshRef.current.updateMatrixWorld(true);
      setMeshReady(true);
    }
  }, [safeGeometry]);

  if (!mainNode || !customMaterial || !safeGeometry) return null;

  const mapX = PRINT_AREA.x.min + (logoStats.x / 100) * (PRINT_AREA.x.max - PRINT_AREA.x.min);
  const mapY = PRINT_AREA.y.max - (logoStats.y / 100) * (PRINT_AREA.y.max - PRINT_AREA.y.min);

  return (
    <group dispose={null}>
      <Center top>
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          geometry={safeGeometry}
          material={customMaterial}
          rotation={[0, 0, 0]}
        >
          {meshReady && texturePath && meshRef.current && safeGeometry?.attributes?.normal && (
            <Decal
              mesh={meshRef.current}
              position={[mapX, mapY, 0.17]}
              rotation={[0, 0, 0]}
              scale={[logoStats.scale * 0.25, logoStats.scale * 0.25, 0.5]}
              map={userTexture}
            >
              <meshStandardMaterial
                map={userTexture}
                transparent
                polygonOffset
                polygonOffsetFactor={-10}
                polygonOffsetUnits={-10}
                depthTest
                depthWrite={false}
                roughness={1}
              />
            </Decal>
          )}
        </mesh>
      </Center>
      <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
    </group>
  );
}

/* ================= SAĞ PANEL ================= */
function EditorPanel({ activeTab, setActiveTab, color, setColor, textureUrl, handleUpload, logoStats, setLogoStats, loading, addToCart, sizes, size, setSize }) {
  const editorRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => setIsDragging(false);

  const updateLogoPos = (clientX, clientY) => {
    if (!editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let percentX = (x / rect.width) * 100;
    let percentY = (y / rect.height) * 100;

    percentX = Math.max(0, Math.min(100, percentX));
    percentY = Math.max(0, Math.min(100, percentY));

    setLogoStats(prev => ({ ...prev, x: percentX, y: percentY }));
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateLogoPos(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    updateLogoPos(touch.clientX, touch.clientY);
  };

  return (
    <div className="w-full md:w-[350px] bg-[#111111] border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col z-20 shadow-2xl h-[45vh] md:h-full">
      <div className="p-4 md:p-6 border-b border-zinc-800 bg-[#111111]">
        <div className="flex justify-between items-center mb-2 md:mb-4">
          <div><p className="text-zinc-500 text-[9px] md:text-[10px] font-bold">TOPLAM</p><h2 className="text-xl md:text-2xl font-mono text-white">₺750.00</h2></div>
          <div className="text-right">
            <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold mb-1">BEDEN</p>
            <div className="flex gap-1 justify-end">
              {sizes.map(s => (
                <button key={s} onClick={() => setSize(s)} className={`w-6 h-6 text-[10px] font-bold rounded flex items-center justify-center border transition ${size === s ? 'bg-white text-black border-white' : 'text-zinc-500 border-zinc-700 hover:border-zinc-500'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-zinc-800 bg-[#111111]">
        <button onClick={() => setActiveTab('editor')} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase transition ${activeTab === 'editor' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}><Move size={16} /> Düzenle</button>
        <button onClick={() => setActiveTab('color')} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase transition ${activeTab === 'color' ? 'text-white border-b-2 border-white' : 'text-zinc-500'}`}><Palette size={16} /> Renk</button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#111111]">
        {activeTab === 'editor' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {!textureUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-white hover:bg-zinc-900 transition group">
                <div className="flex flex-col items-center justify-center pt-4 pb-5">
                  <Upload className="w-6 h-6 mb-2 text-zinc-500 group-hover:text-white transition" />
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
                  className="w-full aspect-[3/4] bg-zinc-800 rounded-lg border border-zinc-700 relative overflow-hidden cursor-crosshair select-none touch-none"
                  onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                  onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <div
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
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

      <div className="p-4 border-t border-zinc-800 bg-[#111111]">
        <button onClick={addToCart} disabled={loading} className={`w-full bg-white text-black py-3 rounded-full font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}>
          {loading ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />} {loading ? 'EKLENİYOR' : 'SEPETE EKLE'}
        </button>
      </div>
    </div>
  );
}

/* ================= ANA SAYFA (LAYOUT) ================= */
export default function TasarimSayfasiWrapper() {
  const { addToCart } = useCart();
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

  const handleAddToCart = () => {
    if (!textureUrl) { alert("Lütfen logo yükleyiniz."); return; }

    setLoading(true);

    addToCart({
      id: Date.now(),
      name: `Özel Tasarım ${modelType.toUpperCase()}`,
      price: 750,
      size: size,
      image: textureUrl,
      color: color
    });

    setTimeout(() => {
      setLoading(false);
      alert("Sepete eklendi!");
    }, 800);
  };

  return (
    <div className="h-screen w-full bg-[#1a1a1a] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      <Link href="/" className="absolute top-4 left-4 z-50 flex items-center gap-2 text-zinc-400 hover:text-white transition uppercase text-xs font-bold tracking-widest"><ArrowLeft size={16} /> ÇIKIŞ</Link>

      <div className="w-full h-[55vh] md:h-full md:flex-1 relative bg-gradient-to-b from-[#1a1a1a] to-[#000000]">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center opacity-50 pointer-events-none"><h1 className="text-3xl md:text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">{modelType}</h1></div>

        <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-zinc-900/90 backdrop-blur-md p-1 rounded-full border border-zinc-700 shadow-2xl">
          {['front', 'back', 'left', 'right'].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition ${view === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
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
          <directionalLight
            position={[5, 10, 7]}
            intensity={1.5}
            castShadow
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
          />
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

        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-4 text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
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
        loading={loading} addToCart={handleAddToCart}
        sizes={sizes} size={size} setSize={setSize}
      />
    </div>
  );
}

useGLTF.preload(MODEL_PATHS.tshirt);
useGLTF.preload(MODEL_PATHS.hoodie);
useGLTF.preload(MODEL_PATHS.sweatshirt);