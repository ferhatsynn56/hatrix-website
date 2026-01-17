"use client";

import { useCart } from "@/context/CartContext";
import React, { useState, Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Decal,
  Environment,
  Center,
  ContactShadows,
  useGLTF,
} from "@react-three/drei";
import {
  Upload,
  ArrowLeft,
  ShoppingBag,
  Palette,
  Move,
  RefreshCcw,
  Loader2,
  Type,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ================= AYARLAR ================= */

const MODEL_PATHS = {
  tshirt: "/models/Meshy_AI_Black_T_Shirt_0116154220_generate.glb",
  hoodie: "/models/Meshy_AI_Hoody_in_Black_0116161358_generate.glb",
  sweatshirt: "/models/Meshy_AI_Black_Sweatshirt_Disp_0116152203_generate.glb",
};

const PRINT_AREA = {
  x: { min: -0.12, max: 0.12 },
  y: { min: 0.05, max: 0.35 },
};

/* ================= KAMERA KONTROLCÜSÜ ================= */
function CameraController({ view }) {
  const isAnimating = useRef(false);

  const positions = useMemo(
    () => ({
      front: new THREE.Vector3(0, 0, 4.5),
      back: new THREE.Vector3(0, 0, -4.5),
      left: new THREE.Vector3(-4.5, 0, 0),
      right: new THREE.Vector3(4.5, 0, 0),
    }),
    []
  );

  useEffect(() => {
    isAnimating.current = true;
  }, [view]);

  useFrame((state, delta) => {
    if (isAnimating.current) {
      const targetPos = positions[view];
      state.camera.position.lerp(targetPos, delta * 4);
      state.camera.lookAt(0, 0, 0);
      if (state.camera.position.distanceTo(targetPos) < 0.05) {
        isAnimating.current = false;
      }
    }
  });

  return null;
}

/* ================= 3D MODEL ================= */
function Real3DModel({ color, finalTextureCanvas, logoStats, modelType }) {
  const { nodes } = useGLTF(MODEL_PATHS[modelType] || MODEL_PATHS.tshirt);

  const decalTexture = useMemo(() => {
    if (!finalTextureCanvas) return null;
    const tex = new THREE.CanvasTexture(finalTextureCanvas);
    tex.anisotropy = 16;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [finalTextureCanvas]);

  const mainNode = useMemo(() => {
    const validNodes = Object.values(nodes).filter(
      (n) => n.isMesh && n.geometry && n.geometry.attributes?.position
    );
    if (!validNodes.length) return null;
    return validNodes.sort(
      (a, b) =>
        b.geometry.attributes.position.count - a.geometry.attributes.position.count
    )[0];
  }, [nodes]);

  const safeGeometry = useMemo(() => {
    if (!mainNode?.geometry) return null;
    let g = mainNode.geometry.clone();
    if (!g.attributes?.position) return null;
    if (g.getAttribute("color")) g.deleteAttribute("color");
    try {
      g = mergeVertices(g, 1e-4);
    } catch (e) {}
    g.computeVertexNormals();
    return g;
  }, [mainNode]);

  const customMaterial = useMemo(() => {
    if (!mainNode) return null;
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.1,
    });
  }, [mainNode, color]);

  const mapX =
    PRINT_AREA.x.min +
    (logoStats.x / 100) * (PRINT_AREA.x.max - PRINT_AREA.x.min);
  const mapY =
    PRINT_AREA.y.max -
    (logoStats.y / 100) * (PRINT_AREA.y.max - PRINT_AREA.y.min);

  if (!mainNode || !customMaterial || !safeGeometry) return null;

  return (
    <group dispose={null}>
      <Center top>
        <mesh castShadow receiveShadow geometry={safeGeometry} material={customMaterial}>
          {decalTexture && (
            <Decal
              position={[mapX, mapY, 0.2]}
              rotation={[0, 0, 0]}
              scale={[logoStats.scale * 0.3, logoStats.scale * 0.3, 0.5]}
              map={decalTexture}
              depthTest={true}
              depthWrite={false}
            />
          )}
        </mesh>
      </Center>
      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={4}
      />
    </group>
  );
}

/* ================= EDITOR PANELİ ================= */
function EditorPanel({
  activeTab,
  setActiveTab,
  color,
  setColor,
  logoUrl,
  setLogoUrl,
  customText,
  setCustomText,
  logoStats,
  setLogoStats,
  imageOffset,
  setImageOffset,
  textOffset,
  setTextOffset,
  loading,
  addToCart,
  sizes,
  size,
  setSize,
}) {
  const editorRef = useRef(null);
  const printBoxRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // "print" | "image" | "text"

  const clamp01_100 = (v) => Math.max(0, Math.min(100, v));

  const handleMove = (clientX, clientY) => {
    if (!isDragging || !dragMode) return;

    // Print alanı sürükleme (editorRef içinde)
    if (dragMode === "print") {
      if (!editorRef.current) return;
      const rect = editorRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      let percentX = (x / rect.width) * 100;
      let percentY = (y / rect.height) * 100;

      percentX = clamp01_100(percentX);
      percentY = clamp01_100(percentY);

      setLogoStats((prev) => ({ ...prev, x: percentX, y: percentY }));
      return;
    }

    // Görsel / Yazı sürükleme (printBoxRef içinde)
    if (dragMode === "image" || dragMode === "text") {
      if (!printBoxRef.current) return;
      const rect = printBoxRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      let percentX = (x / rect.width) * 100;
      let percentY = (y / rect.height) * 100;

      percentX = clamp01_100(percentX);
      percentY = clamp01_100(percentY);

      if (dragMode === "image") setImageOffset({ x: percentX, y: percentY });
      if (dragMode === "text") setTextOffset({ x: percentX, y: percentY });
    }
  };

  const stopDrag = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  return (
    <div className="w-full md:w-[380px] bg-[#111111] flex flex-col z-20 shadow-2xl h-[50vh] md:h-full border-t md:border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 bg-[#111111] flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold">FİYAT</p>
            <h2 className="text-xl font-mono text-white">₺750.00</h2>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-[10px] font-bold mb-1">BEDEN</p>
            <div className="flex gap-1">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-7 h-7 text-[10px] font-bold rounded border transition ${
                    size === s
                      ? "bg-white text-black border-white"
                      : "text-zinc-500 border-zinc-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-zinc-800 bg-[#111111] flex-shrink-0">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
            activeTab === "editor"
              ? "text-white border-b-2 border-white"
              : "text-zinc-500"
          }`}
        >
          <Move size={14} /> Yerleşim
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
            activeTab === "upload"
              ? "text-white border-b-2 border-white"
              : "text-zinc-500"
          }`}
        >
          <Upload size={14} /> Görsel
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
            activeTab === "text"
              ? "text-white border-b-2 border-white"
              : "text-zinc-500"
          }`}
        >
          <Type size={14} /> Yazı
        </button>
        <button
          onClick={() => setActiveTab("color")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
            activeTab === "color"
              ? "text-white border-b-2 border-white"
              : "text-zinc-500"
          }`}
        >
          <Palette size={14} /> Renk
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#111111]">
        {activeTab === "editor" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-400">CANLI ÖNİZLEME</h3>
              <button
                onClick={() => {
                  setLogoStats({ x: 50, y: 30, scale: 0.5 });
                  setImageOffset({ x: 50, y: 45 });
                  setTextOffset({ x: 50, y: 85 });
                }}
                className="text-[10px] text-blue-400 flex items-center gap-1"
              >
                <RefreshCcw size={10} /> Ortala
              </button>
            </div>

            <div
              ref={editorRef}
              className="w-full aspect-[3/4] bg-zinc-800 rounded-lg border border-zinc-700 relative overflow-hidden touch-none"
              onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
              onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              onTouchEnd={stopDrag}
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                  backgroundSize: "10px 10px",
                }}
              ></div>

              {/* PRINT ALANI (genel konum + genel ölçek) */}
              <div
                ref={printBoxRef}
                onMouseDown={() => {
                  setIsDragging(true);
                  setDragMode("print");
                }}
                onTouchStart={() => {
                  setIsDragging(true);
                  setDragMode("print");
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-blue-500/50 hover:border-blue-500 z-10 bg-black/10"
                style={{
                  left: `${logoStats.x}%`,
                  top: `${logoStats.y}%`,
                  width: `${logoStats.scale * 220}px`,
                  height: `${logoStats.scale * 280}px`,
                  minWidth: "160px",
                  minHeight: "200px",
                }}
              >
                {/* Görsel ayrı */}
                {logoUrl && (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      setDragMode("image");
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      setDragMode("image");
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 border border-white/30 rounded p-1 cursor-move bg-black/20"
                    style={{
                      left: `${imageOffset.x}%`,
                      top: `${imageOffset.y}%`,
                      width: `65%`,
                    }}
                  >
                    <img
                      src={logoUrl}
                      className="w-full h-auto object-contain pointer-events-none"
                      alt=""
                    />
                  </div>
                )}

                {/* Yazı ayrı */}
                {customText?.text && (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      setDragMode("text");
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      setDragMode("text");
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 border border-white/30 rounded px-2 py-1 cursor-move bg-black/30"
                    style={{
                      left: `${textOffset.x}%`,
                      top: `${textOffset.y}%`,
                    }}
                  >
                    <p
                      className="text-center font-bold whitespace-pre-wrap pointer-events-none"
                      style={{
                        color: customText.color,
                        fontSize: `${14 + logoStats.scale * 10}px`,
                      }}
                    >
                      {customText.text}
                    </p>
                  </div>
                )}

                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-bold text-zinc-400 mb-2">BÜYÜKLÜK</h3>
              <input
                type="range"
                min="0.2"
                max="2"
                step="0.1"
                value={logoStats.scale}
                onChange={(e) =>
                  setLogoStats((prev) => ({
                    ...prev,
                    scale: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="space-y-4 animate-in fade-in">
            <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-white hover:bg-zinc-900 transition">
              <Upload className="w-8 h-8 mb-2 text-zinc-500" />
              <p className="text-xs text-zinc-400 font-bold uppercase">Görsel Seç</p>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setLogoUrl(ev.target.result);
                      setActiveTab("editor");
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            {logoUrl && (
              <button
                onClick={() => setLogoUrl(null)}
                className="w-full py-2 bg-red-900/30 text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/50"
              >
                <Trash2 size={14} /> Görseli Kaldır
              </button>
            )}
          </div>
        )}

        {activeTab === "text" && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="text-xs font-bold text-zinc-500 block mb-2">
                METİN
              </label>
              <input
                type="text"
                value={customText?.text || ""}
                onChange={(e) =>
                  setCustomText((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="Buraya yazın..."
                className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 block mb-2">
                RENGİ
              </label>
              <div className="flex gap-2">
                {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff"].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setCustomText((prev) => ({ ...prev, color: c }))
                      }
                      className={`w-8 h-8 rounded-full border ${
                        customText?.color === c
                          ? "border-white scale-110"
                          : "border-zinc-700"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  )
                )}
              </div>
            </div>

            {customText?.text && (
              <button
                onClick={() => setCustomText({ text: "", color: "#ffffff" })}
                className="w-full py-2 bg-red-900/30 text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/50"
              >
                <Trash2 size={14} /> Yazıyı Sil
              </button>
            )}
          </div>
        )}

        {activeTab === "color" && (
          <div className="grid grid-cols-4 gap-3 animate-in fade-in">
            {[
              "#ffffff",
              "#111111",
              "#ff0000",
              "#00ff00",
              "#0000ff",
              "#ffff00",
              "#800080",
              "#00ffff",
            ].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-full aspect-square rounded-full border-2 transition hover:scale-110 ${
                  color === c ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-[#111111] flex-shrink-0">
        <button
          onClick={addToCart}
          disabled={loading}
          className={`w-full bg-white text-black py-4 rounded-full font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}{" "}
          {loading ? "HAZIRLANIYOR..." : "SEPETE EKLE"}
        </button>
      </div>
    </div>
  );
}

/* ================= ANA SAYFA ================= */
export default function TasarimSayfasi() {
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState("editor");
  const [color, setColor] = useState("#111111");
  const [view, setView] = useState("front");
  const [modelType, setModelType] = useState("tshirt");
  const [size, setSize] = useState("M");
  const [loading, setLoading] = useState(false);

  const [logoUrl, setLogoUrl] = useState(null);
  const [customText, setCustomText] = useState({ text: "", color: "#ffffff" });

  // print alanı (genel)
  const [logoStats, setLogoStats] = useState({ x: 50, y: 30, scale: 0.5 });

  // ✅ yeni: görsel ve yazı birbirinden bağımsız
  const [imageOffset, setImageOffset] = useState({ x: 50, y: 45 });
  const [textOffset, setTextOffset] = useState({ x: 50, y: 85 });

  const [finalTextureCanvas, setFinalTextureCanvas] = useState(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawTextOnly = () => {
      if (customText.text) {
        ctx.font = "bold 150px Arial";
        ctx.fillStyle = customText.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const tx = (textOffset.x / 100) * 1024;
        const ty = (textOffset.y / 100) * 1024;

        ctx.fillText(customText.text, tx, ty);
      }
      setFinalTextureCanvas(canvas);
    };

    const drawAll = () => {
      ctx.clearRect(0, 0, 1024, 1024);

      if (logoUrl) {
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => {
          const aspect = img.width / img.height;

          const drawW = 800;
          const drawH = drawW / aspect;

          const cx = (imageOffset.x / 100) * 1024;
          const cy = (imageOffset.y / 100) * 1024;

          ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);

          drawTextOnly();
        };
        img.onerror = () => drawTextOnly();
      } else {
        drawTextOnly();
      }
    };

    drawAll();
  }, [logoUrl, customText, imageOffset, textOffset]);

  const handleAddToCart = () => {
    if (!logoUrl && !customText.text) {
      alert("Lütfen bir logo veya yazı ekleyin.");
      return;
    }
    setLoading(true);

    const printFile = finalTextureCanvas
      ? finalTextureCanvas.toDataURL("image/png")
      : null;

    addToCart({
      id: Date.now(),
      name: `Özel Tasarım ${modelType.toUpperCase()}`,
      price: 750,
      size: size,
      image: printFile,
      color: color,
      designDetails: {
        model: modelType,
        baseColor: color,
        printPosition: { x: logoStats.x, y: logoStats.y },
        printScale: logoStats.scale,
        imageOffset: { x: imageOffset.x, y: imageOffset.y },
        textOffset: { x: textOffset.x, y: textOffset.y },
        printFile: printFile,
      },
    });

    setTimeout(() => {
      setLoading(false);
      alert("Tasarım kaydedildi ve sepete eklendi!");
    }, 1000);
  };

  return (
    <div className="h-screen w-full bg-[#1a1a1a] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      <Link
        href="/"
        className="absolute top-4 left-4 z-50 flex items-center gap-2 text-zinc-400 hover:text-white transition uppercase text-xs font-bold tracking-widest"
      >
        <ArrowLeft size={16} /> ÇIKIŞ
      </Link>

      <div className="w-full h-[45vh] md:h-full md:flex-1 relative bg-gradient-to-b from-[#1a1a1a] to-[#000000]">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 opacity-50 pointer-events-none">
          <h1 className="text-2xl md:text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent">
            {modelType}
          </h1>
        </div>

        <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-full border border-zinc-700 shadow-xl">
          {["front", "back", "left", "right"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                view === v
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {v === "front" ? "Ön" : v === "back" ? "Arka" : v === "left" ? "Sol" : "Sağ"}
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
          />
          <Environment preset="city" />
          <CameraController view={view} />
          <Suspense fallback={null}>
            <Real3DModel
              color={color}
              finalTextureCanvas={finalTextureCanvas}
              logoStats={logoStats}
              modelType={modelType}
            />
          </Suspense>
          <OrbitControls makeDefault enableZoom={true} minDistance={1.5} maxDistance={10} />
        </Canvas>

        <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-4 text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest z-40">
          {["tshirt", "hoodie", "sweatshirt"].map((m) => (
            <button
              key={m}
              onClick={() => setModelType(m)}
              className={`hover:text-white transition px-2 py-1 ${
                modelType === m ? "text-white border-b border-white" : ""
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <EditorPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        color={color}
        setColor={setColor}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        customText={customText}
        setCustomText={setCustomText}
        logoStats={logoStats}
        setLogoStats={setLogoStats}
        imageOffset={imageOffset}
        setImageOffset={setImageOffset}
        textOffset={textOffset}
        setTextOffset={setTextOffset}
        loading={loading}
        addToCart={handleAddToCart}
        sizes={["S", "M", "L", "XL"]}
        size={size}
        setSize={setSize}
      />
    </div>
  );
}

useGLTF.preload(MODEL_PATHS.tshirt);
useGLTF.preload(MODEL_PATHS.hoodie);
useGLTF.preload(MODEL_PATHS.sweatshirt);
