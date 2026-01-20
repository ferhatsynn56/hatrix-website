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
  ShoppingBag,
  Palette,
  Move,
  Loader2,
  Type,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ================= MODEL PATHS ================= */

const MODEL_PATHS = {
  tshirt: "/models/Meshy_AI_Black_T_Shirt_0116154220_generate.glb",
  hoodie: "/models/Meshy_AI_Hoody_in_Black_0116161358_generate.glb",
  sweatshirt: "/models/Meshy_AI_Black_Sweatshirt_Disp_0116152203_generate.glb",
};

const AVAILABLE_MODELS = ["tshirt", "hoodie", "sweatshirt"];

/**
 * ✅ Eski çalışan “baskı bandı” değerleri (en iyi duran buydu)
 */
const MODEL_PRINT_BOUNDS = {
  tshirt: {
    front: { xMin: -0.787, xMax: 0.787, yTop: 0.946, yBot: -0.949, z: 0.383, rotY: 0 },
    back:  { xMin: -0.787, xMax: 0.787, yTop: 0.946, yBot: -0.949, z: -0.414, rotY: Math.PI },
  },
  hoodie: {
    front: { xMin: -0.570, xMax: 0.570, yTop: 0.949, yBot: -0.951, z: 0.273, rotY: 0 },
    back:  { xMin: -0.570, xMax: 0.570, yTop: 0.949, yBot: -0.951, z: -0.265, rotY: Math.PI },
  },
  sweatshirt: {
    front: { xMin: -0.724, xMax: 0.724, yTop: 0.948, yBot: -0.951, z: 0.346, rotY: 0 },
    back:  { xMin: -0.724, xMax: 0.724, yTop: 0.948, yBot: -0.951, z: -0.356, rotY: Math.PI },
  },
};

/** UI etiketi (cm) */
const CM_LABELS = {
  tshirt: { front: { w: 40, h: 54 }, back: { w: 40, h: 54 } },
  sweatshirt: { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  hoodie: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
};

/* ================= HELPERS ================= */

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clamp01 = (v) => clamp(v, 0, 1);
const pct = (v01) => `${Math.round(v01 * 100)}%`;

const createDesign = (type = "tshirt") => ({
  id: makeId(),
  modelType: type,
  color: "#050505", // ilk model gri görünmesin
  size: "M",
  logoUrl: null,
  customText: {
    text: "",
    color: "#ffffff",
    size: 150,    // ✅ büyüt/küçült
    scaleX: 1,    // ✅ en esnet
    scaleY: 1,    // ✅ boy esnet
  },

  imageBox: { x: 0.5, y: 0.6, w: 0.7, h: 0.45 }, // 0..1
  textPos: { x: 0.5, y: 0.85 },                 // 0..1
});

/* ================= KAMERA KONTROLCÜSÜ ================= */
function CameraController({ view, count }) {
  const isAnimating = useRef(false);
  const extra = Math.min(4, Math.max(0, (count - 1) * 1.2));

  const positions = useMemo(
    () => ({
      front: new THREE.Vector3(0, 0, 4.8 + extra),
      back: new THREE.Vector3(0, 0, -(4.8 + extra)),
      left: new THREE.Vector3(-(4.8 + extra), 0, 0),
      right: new THREE.Vector3(4.8 + extra, 0, 0),
    }),
    [extra]
  );

  useEffect(() => {
    isAnimating.current = true;
  }, [view]);

  useFrame((state, delta) => {
    if (!isAnimating.current) return;
    const targetPos = positions[view];
    state.camera.position.lerp(targetPos, delta * 4);
    state.camera.lookAt(0, 0, 0);
    if (state.camera.position.distanceTo(targetPos) < 0.05) {
      isAnimating.current = false;
    }
  });

  return null;
}

/* ================= CANVAS TEXTURE ================= */
/**
 * ✅ Görsel kutuya göre esner (fill)
 * ✅ Text: size + scaleX/scaleY ile büyüt/uzat
 */
function useDesignCanvas(logoUrl, customText, imageBox, textPos) {
  const [canvas, setCanvas] = useState(null);

  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const drawText = () => {
      const t = customText || {};
      if (t.text) {
        const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420);

        ctx.save();
        ctx.translate(textPos.x * 1024, textPos.y * 1024);
        ctx.scale(clamp(t.scaleX || 1, 0.3, 3), clamp(t.scaleY || 1, 0.3, 3));
        ctx.font = `900 ${fontSize}px Arial`;
        ctx.fillStyle = t.color || "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      }
      setCanvas(c);
    };

    const drawAll = () => {
      ctx.clearRect(0, 0, 1024, 1024);

      if (logoUrl) {
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => {
          const boxW = imageBox.w * 1024;
          const boxH = imageBox.h * 1024;
          const boxX = imageBox.x * 1024 - boxW / 2;
          const boxY = imageBox.y * 1024 - boxH / 2;

          // fill (esnet)
          ctx.drawImage(img, boxX, boxY, boxW, boxH);
          drawText();
        };
        img.onerror = () => drawText();
      } else {
        drawText();
      }
    };

    drawAll();
  }, [
    logoUrl,
    customText?.text,
    customText?.color,
    customText?.size,
    customText?.scaleX,
    customText?.scaleY,
    imageBox.x,
    imageBox.y,
    imageBox.w,
    imageBox.h,
    textPos.x,
    textPos.y,
  ]);

  return canvas;
}

/* ================= 3D MODEL ================= */
function Real3DModel({ color, finalTextureCanvas, modelType, view }) {
  const { nodes } = useGLTF(MODEL_PATHS[modelType] || MODEL_PATHS.tshirt);

  const side = view === "back" ? "back" : "front";
  const profile = useMemo(
    () => MODEL_PRINT_BOUNDS[modelType]?.[side] || MODEL_PRINT_BOUNDS.tshirt.front,
    [modelType, side]
  );

  const decalTexture = useMemo(() => {
    if (!finalTextureCanvas) return null;
    const tex = new THREE.CanvasTexture(finalTextureCanvas);
    tex.anisotropy = 16;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [finalTextureCanvas]);

  const mainNode = useMemo(() => {
    const validNodes = Object.values(nodes).filter(
      (n) => n.isMesh && n.geometry && n.geometry.attributes?.position
    );
    if (!validNodes.length) return null;
    return validNodes.sort(
      (a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count
    )[0];
  }, [nodes]);

  const safeGeometry = useMemo(() => {
    if (!mainNode?.geometry) return null;
    let g = mainNode.geometry.clone();
    if (!g.attributes?.position) return null;
    if (g.getAttribute("color")) g.deleteAttribute("color");
    try { g = mergeVertices(g, 1e-4); } catch (e) {}
    g.computeVertexNormals();
    return g;
  }, [mainNode]);

  const customMaterial = useMemo(() => {
    if (!mainNode) return null;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color || "#050505"),
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.35,
    });
  }, [mainNode, color]);

  if (!mainNode || !customMaterial || !safeGeometry) return null;

  const width = profile.xMax - profile.xMin;
  const height = profile.yTop - profile.yBot;
  const centerY = (profile.yTop + profile.yBot) / 2;

  return (
    <group dispose={null}>
      <Center top>
        <mesh castShadow receiveShadow geometry={safeGeometry} material={customMaterial}>
          {decalTexture && (
            <Decal
              position={[0, centerY, profile.z * 0.98]}
              rotation={[0, profile.rotY, 0]}
              scale={[width, height, 0.6]}
              map={decalTexture}
              depthTest={true}
              depthWrite={false}
            />
          )}
        </mesh>
      </Center>
    </group>
  );
}

/* ================= TEK MODEL ITEM ================= */
function DesignModelItem({
  design,
  isActive,
  isHovered,
  onSelect,
  onHover,
  onUnhover,
  view,
  targetX,
  targetZ,
  targetRotY,
  targetScale,
  hidden,
}) {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const g = groupRef.current;

    g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, Math.min(1, delta * 6));
    g.position.z = THREE.MathUtils.lerp(g.position.z, targetZ, Math.min(1, delta * 6));
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, Math.min(1, delta * 6));

    // ✅ Hover büyüme: click değil
    const base = targetScale;
    const hoverBoost = isHovered ? 0.06 : 0;
    const activeBoost = isActive ? 0.05 : 0;
    const nextS = base + hoverBoost + activeBoost;

    const cur = g.scale.x;
    const lerped = THREE.MathUtils.lerp(cur, nextS, Math.min(1, delta * 10));
    g.scale.setScalar(lerped);
  });

  const finalTextureCanvas = useDesignCanvas(
    design.logoUrl,
    design.customText,
    design.imageBox,
    design.textPos
  );

  if (hidden) return null;

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(design.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onUnhover(design.id);
        document.body.style.cursor = "default";
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(design.id);
      }}
    >
      <Real3DModel
        color={design.color}
        finalTextureCanvas={finalTextureCanvas}
        modelType={design.modelType}
        view={view}
      />
    </group>
  );
}

/* ================= RESIZE FRAME ================= */
/**
 * ✅ Handle imleci takip eder (nereye çekersen o tarafa büyür)
 */
function ResizeFrame({ box, onChange, containerRef }) {
  const dragRef = useRef(null);

  const getPointer01 = (e, rect) => {
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    return { x, y };
  };

  const begin = (mode, e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const { x: px, y: py } = getPointer01(e, rect);

    const left = box.x - box.w / 2;
    const right = box.x + box.w / 2;
    const top = box.y - box.h / 2;
    const bottom = box.y + box.h / 2;

    dragRef.current = {
      mode,
      rect,
      startBox: { ...box },
      startEdges: { left, right, top, bottom },
      moveOffset: { dx: box.x - px, dy: box.y - py },
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  };

  const move = (e) => {
    const s = dragRef.current;
    if (!s) return;

    const { x: px, y: py } = getPointer01(e, s.rect);

    const minW = 0.12;
    const minH = 0.12;

    let left = s.startEdges.left;
    let right = s.startEdges.right;
    let top = s.startEdges.top;
    let bottom = s.startEdges.bottom;

    if (s.mode === "move") {
      let nx = px + s.moveOffset.dx;
      let ny = py + s.moveOffset.dy;

      nx = clamp(nx, s.startBox.w / 2, 1 - s.startBox.w / 2);
      ny = clamp(ny, s.startBox.h / 2, 1 - s.startBox.h / 2);

      onChange({ x: nx, y: ny, w: s.startBox.w, h: s.startBox.h });
      return;
    }

    if (s.mode.includes("l")) left = px;
    if (s.mode.includes("r")) right = px;
    if (s.mode.includes("t")) top = py;
    if (s.mode.includes("b")) bottom = py;

    if (right < left) [left, right] = [right, left];
    if (bottom < top) [top, bottom] = [bottom, top];

    if (right - left < minW) {
      const mid = (left + right) / 2;
      left = mid - minW / 2;
      right = mid + minW / 2;
    }
    if (bottom - top < minH) {
      const mid = (top + bottom) / 2;
      top = mid - minH / 2;
      bottom = mid + minH / 2;
    }

    left = clamp(left, 0, 1);
    right = clamp(right, 0, 1);
    top = clamp(top, 0, 1);
    bottom = clamp(bottom, 0, 1);

    const w = clamp(right - left, minW, 1);
    const h = clamp(bottom - top, minH, 1);

    const x = clamp((left + right) / 2, w / 2, 1 - w / 2);
    const y = clamp((top + bottom) / 2, h / 2, 1 - h / 2);

    onChange({ x, y, w, h });
  };

  const end = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
  };

  return (
    <div
      className="absolute border-2 border-white/70 rounded-lg"
      style={{
        left: pct(box.x - box.w / 2),
        top: pct(box.y - box.h / 2),
        width: pct(box.w),
        height: pct(box.h),
      }}
      onPointerDown={(e) => begin("move", e)}
    >
      {[
        ["lt", 0, 0],
        ["t", 50, 0],
        ["rt", 100, 0],
        ["r", 100, 50],
        ["rb", 100, 100],
        ["b", 50, 100],
        ["lb", 0, 100],
        ["l", 0, 50],
      ].map(([key, lx, ty]) => (
        <div
          key={key}
          className="absolute w-3 h-3 bg-white rounded-sm"
          style={{
            left: `${lx}%`,
            top: `${ty}%`,
            transform: "translate(-50%, -50%)",
            cursor:
              key === "t" || key === "b"
                ? "ns-resize"
                : key === "l" || key === "r"
                ? "ew-resize"
                : key === "lt" || key === "rb"
                ? "nwse-resize"
                : "nesw-resize",
          }}
          onPointerDown={(e) => begin(key, e)}
        />
      ))}
    </div>
  );
}

/* ================= EDITOR PANELİ ================= */
function EditorPanel({ design, updateDesign, loading, addToCart, view }) {
  const [activeTab, setActiveTab] = useState("editor");
  const previewRef = useRef(null);

  const sizes = ["S", "M", "L", "XL"];
  const colorPresets = ["#ffffff", "#050505", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#800080", "#00ffff"];

  const side = view === "back" ? "back" : "front";
  const cm = CM_LABELS[design.modelType]?.[side] || { w: 0, h: 0 };

  const t = design.customText || {};

  const bumpText = (patch) => updateDesign({ customText: { ...t, ...patch } });

  return (
    <div className="w-full md:w-[420px] bg-[#111111] flex flex-col z-20 shadow-2xl h-[55vh] md:h-full border-t md:border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 bg-[#111111] flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold">BASKI ALANI</p>
            <h2 className="text-sm font-mono text-white">
              {cm.w}×{cm.h} CM ({side === "front" ? "ÖN" : "ARKA"})
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">
              SEÇİLİ: {design.modelType}
            </p>
          </div>

          <div className="text-right">
            <p className="text-zinc-500 text-[10px] font-bold mb-1">BEDEN</p>
            <div className="flex gap-1">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => updateDesign({ size: s })}
                  className={`w-7 h-7 text-[10px] font-bold rounded border transition ${
                    design.size === s ? "bg-white text-black border-white" : "text-zinc-500 border-zinc-700"
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
            activeTab === "editor" ? "text-white border-b-2 border-white" : "text-zinc-500"
          }`}
        >
          <Move size={14} /> Yerleşim
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
            activeTab === "upload" ? "text-white border-b-2 border-white" : "text-zinc-500"
          }`}
        >
          <Upload size={14} /> Görsel
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
            activeTab === "text" ? "text-white border-b-2 border-white" : "text-zinc-500"
          }`}
        >
          <Type size={14} /> Yazı
        </button>
        <button
          onClick={() => setActiveTab("color")}
          className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
            activeTab === "color" ? "text-white border-b-2 border-white" : "text-zinc-500"
          }`}
        >
          <Palette size={14} /> Renk
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#111111]">
        {activeTab === "editor" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-xs font-bold text-zinc-400">BASKI ALANI ÖNİZLEME</h3>

            <div
              ref={previewRef}
              className="w-full aspect-square bg-zinc-900 rounded-xl border border-zinc-700 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                  backgroundSize: "10px 10px",
                }}
              />

              {design.logoUrl && (
                <div
                  className="absolute rounded-lg overflow-hidden"
                  style={{
                    left: pct(design.imageBox.x - design.imageBox.w / 2),
                    top: pct(design.imageBox.y - design.imageBox.h / 2),
                    width: pct(design.imageBox.w),
                    height: pct(design.imageBox.h),
                  }}
                >
                  <img src={design.logoUrl} alt="" className="w-full h-full object-fill pointer-events-none" />
                </div>
              )}

              <ResizeFrame
                box={design.imageBox}
                containerRef={previewRef}
                onChange={(next) => updateDesign({ imageBox: next })}
              />

              {design.customText?.text && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/30 border border-white/20"
                  style={{ left: pct(design.textPos.x), top: pct(design.textPos.y) }}
                  title="Yazı konumu"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = previewRef.current.getBoundingClientRect();

                    const move = (ev) => {
                      const x = clamp01((ev.clientX - rect.left) / rect.width);
                      const y = clamp01((ev.clientY - rect.top) / rect.height);
                      updateDesign({ textPos: { x, y } });
                    };
                    const up = () => {
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                  }}
                >
                  <span className="text-xs font-black" style={{ color: design.customText.color }}>
                    {design.customText.text}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-500">
              Kutuyu sürükle = taşı. Handle = imleci takip ederek büyüt/küçült.
            </p>
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
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    updateDesign({ logoUrl: ev.target.result });
                    setActiveTab("editor");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            {design.logoUrl && (
              <button
                onClick={() => updateDesign({ logoUrl: null })}
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
              <label className="text-xs font-bold text-zinc-500 block mb-2">METİN</label>
              <input
                type="text"
                value={t.text || ""}
                onChange={(e) => bumpText({ text: e.target.value })}
                placeholder="Buraya yazın..."
                className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 block mb-2">RENGİ</label>
              <div className="flex gap-2">
                {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff"].map((c) => (
                  <button
                    key={c}
                    onClick={() => bumpText({ color: c })}
                    className={`w-8 h-8 rounded-full border ${
                      t.color === c ? "border-white scale-110" : "border-zinc-700"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* ✅ Font size */}
            <div className="flex items-center justify-between gap-2 bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Boyut</p>
                <p className="text-white text-sm font-mono">{t.size || 150}px</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => bumpText({ size: clamp((t.size || 150) - 10, 30, 420) })}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black"
                >
                  -
                </button>
                <button
                  onClick={() => bumpText({ size: clamp((t.size || 150) + 10, 30, 420) })}
                  className="px-3 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-black"
                >
                  +
                </button>
              </div>
            </div>

            {/* ✅ Stretch */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">EN (Stretch)</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => bumpText({ scaleX: clamp((t.scaleX || 1) - 0.1, 0.3, 3) })}
                    className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black"
                  >
                    -
                  </button>
                  <button
                    onClick={() => bumpText({ scaleX: clamp((t.scaleX || 1) + 0.1, 0.3, 3) })}
                    className="flex-1 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-black"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">BOY (Stretch)</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => bumpText({ scaleY: clamp((t.scaleY || 1) - 0.1, 0.3, 3) })}
                    className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black"
                  >
                    -
                  </button>
                  <button
                    onClick={() => bumpText({ scaleY: clamp((t.scaleY || 1) + 0.1, 0.3, 3) })}
                    className="flex-1 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-black"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {t.text && (
              <button
                onClick={() => bumpText({ text: "", color: "#ffffff", size: 150, scaleX: 1, scaleY: 1 })}
                className="w-full py-2 bg-red-900/30 text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/50"
              >
                <Trash2 size={14} /> Yazıyı Sil
              </button>
            )}
          </div>
        )}

        {activeTab === "color" && (
          <div className="grid grid-cols-4 gap-3 animate-in fade-in">
            {colorPresets.map((c) => (
              <button
                key={c}
                onClick={() => updateDesign({ color: c })}
                className={`w-full aspect-square rounded-full border-2 transition hover:scale-110 ${
                  design.color === c ? "border-white scale-110" : "border-transparent"
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
          className={`w-full bg-white text-black py-4 rounded-full font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition flex items-center justify-center gap-2 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}
          {loading ? "HAZIRLANIYOR..." : "SEPETE EKLE"}
        </button>
      </div>
    </div>
  );
}

/* ================= ANA SAYFA ================= */
export default function TasarimSayfasi() {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  const initialModel = (searchParams.get("model") || searchParams.get("product") || "tshirt").toLowerCase();
  const safeInitial = AVAILABLE_MODELS.includes(initialModel) ? initialModel : "tshirt";

  const [view, setView] = useState("front");
  const [designs, setDesigns] = useState([createDesign(safeInitial)]);
  const [activeId, setActiveId] = useState(designs[0]?.id);
  const [hoveredId, setHoveredId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // ✅ screenshot için
  const glRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

  // ✅ screenshot sırasında sadece tek modeli göster
  const [captureId, setCaptureId] = useState(null);

  const activeDesign = useMemo(() => designs.find((d) => d.id === activeId) || designs[0], [designs, activeId]);

  useEffect(() => {
    if (!activeId && designs[0]) setActiveId(designs[0].id);
  }, [activeId, designs]);

  const updateActive = (patch) => {
    setDesigns((prev) => prev.map((d) => (d.id === activeId ? { ...d, ...patch } : d)));
  };

  const addModel = (type) => {
    const t = AVAILABLE_MODELS.includes(type) ? type : "tshirt";
    const newDesign = createDesign(t);
    setDesigns((prev) => [...prev, newDesign]);
    setActiveId(newDesign.id);
    setPickerOpen(false);
  };

  const removeModel = (id) => {
    setDesigns((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (id === activeId) {
        const fallback = next[next.length - 1] || null;
        setActiveId(fallback?.id);
      }
      return next.length ? next : [createDesign(safeInitial)];
    });
  };

  /** ✅ layout: sadece aktif önde, diğerleri solda */
  const layoutFor = (designId) => {
    // capture sırasında sadece o model ortada
    if (captureId) {
      if (designId !== captureId) return { hidden: true, x: -999, z: -999, rotY: 0, scale: 1 };
      return { hidden: false, x: 0, z: 0, rotY: 0, scale: 1.05 };
    }

    if (designId === activeId) {
      return { hidden: false, x: 0, z: 0, rotY: 0, scale: 1.03 };
    }

    const others = designs.filter((d) => d.id !== activeId);
    const idx = others.findIndex((d) => d.id === designId);

    const x = -2.6 - idx * 0.95;
    return { hidden: false, x, z: -0.35, rotY: 0.85, scale: 0.92 };
  };

  /** print PNG (baskı dosyası) */
  const makePrintDataUrl = async (d) =>
    new Promise((resolve) => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 1024;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(null);

      const drawText = () => {
        const t = d.customText || {};
        if (t.text) {
          const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420);

          ctx.save();
          ctx.translate(d.textPos.x * 1024, d.textPos.y * 1024);
          ctx.scale(clamp(t.scaleX || 1, 0.3, 3), clamp(t.scaleY || 1, 0.3, 3));
          ctx.font = `900 ${fontSize}px Arial`;
          ctx.fillStyle = t.color || "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(t.text, 0, 0);
          ctx.restore();
        }
        resolve(c.toDataURL("image/png"));
      };

      ctx.clearRect(0, 0, 1024, 1024);

      if (d.logoUrl) {
        const img = new Image();
        img.src = d.logoUrl;
        img.onload = () => {
          const boxW = d.imageBox.w * 1024;
          const boxH = d.imageBox.h * 1024;
          const boxX = d.imageBox.x * 1024 - boxW / 2;
          const boxY = d.imageBox.y * 1024 - boxH / 2;
          ctx.drawImage(img, boxX, boxY, boxW, boxH);
          drawText();
        };
        img.onerror = () => drawText();
      } else {
        drawText();
      }
    });

  /** ✅ model üstünde görünen PNG (mockup screenshot) */
  const captureMockupPng = async (designIdToCapture) => {
    if (!glRef.current || !sceneRef.current || !cameraRef.current) return null;

    const prevView = view;
    setView("front");
    setCaptureId(designIdToCapture);

    // React commit + r3f render için 2 frame bekle
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const gl = glRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL("image/png");

    setCaptureId(null);
    setView(prevView);

    // bir frame daha (temiz geri dönüş)
    await new Promise((r) => requestAnimationFrame(r));

    return dataUrl;
  };

  /** Sepete ekle: print + mockup birlikte */
  const handleAddToCartAll = async () => {
    const emptyOnes = designs.filter((d) => !d.logoUrl && !(d.customText?.text || "").trim());
    if (emptyOnes.length === designs.length) {
      alert("Lütfen en az bir üründe logo veya yazı ekleyin.");
      return;
    }

    setLoading(true);

    try {
      for (const d of designs) {
        if (!d.logoUrl && !(d.customText?.text || "").trim()) continue;

        const printFile = await makePrintDataUrl(d);
        const mockupFile = await captureMockupPng(d.id);

        addToCart({
          id: Date.now() + Math.random(),
          name: `Özel Tasarım ${d.modelType.toUpperCase()}`,
          price: 750,
          size: d.size,
          image: mockupFile || printFile, // sepet kartında mockup göster
          color: d.color,
          designDetails: {
            model: d.modelType,
            baseColor: d.color,
            printFile,   // ✅ baskı png
            mockupFile,  // ✅ model üstü png
            imageBox: d.imageBox,
            textPos: d.textPos,
            text: d.customText,
          },
        });
      }

      alert("Seçtiğin tüm modeller sepete eklendi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0b0b0b] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* ✅ küçük geri (paneli kapatmasın) */}
      <a
        href="/"
        className="absolute top-2 left-2 z-50 flex items-center gap-2 text-zinc-300 hover:text-white transition uppercase text-[10px] font-bold tracking-widest bg-black/40 border border-zinc-800 rounded-full px-3 py-2 backdrop-blur-md"
      >
        <span className="text-xs">←</span> Geri
      </a>

      {/* 3D ALAN */}
      <div className="w-full h-[45vh] md:h-full md:flex-1 relative bg-gradient-to-b from-[#0b0b0b] to-[#000000]">
        {/* View butonları */}
        <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-full border border-zinc-700 shadow-xl">
          {["front", "back", "left", "right"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                view === v ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {v === "front" ? "Ön" : v === "back" ? "Arka" : v === "left" ? "Sol" : "Sağ"}
            </button>
          ))}
        </div>

        {/* + Butonu */}
        <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          <button
            onClick={() => setPickerOpen(true)}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-black shadow-xl hover:bg-zinc-200 transition"
            title="Model Ekle"
          >
            <Plus size={18} />
          </button>

          <div className="flex items-center gap-2 bg-zinc-900/70 border border-zinc-700 rounded-full px-3 py-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              MODELLER: {designs.length}
            </span>
            <span className="text-[10px] text-white font-bold uppercase tracking-widest">
              SEÇİLİ: {activeDesign?.modelType}
            </span>
            {designs.length > 1 && (
              <button
                onClick={() => removeModel(activeId)}
                className="ml-1 w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                title="Seçili modeli kaldır"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Picker modal */}
        {pickerOpen && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black tracking-widest uppercase">Model Seç</h3>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m}
                    onClick={() => addModel(m)}
                    className="py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-widest"
                  >
                    {m}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-zinc-500 mt-3">
                Tıkladığın model öne gelir, diğerleri solda yan durur.
              </p>
            </div>
          </div>
        )}

        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 4.8], fov: 45 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          onCreated={({ gl, scene, camera }) => {
            glRef.current = gl;
            sceneRef.current = scene;
            cameraRef.current = camera;
          }}
        >
          <ambientLight intensity={0.35} />
          <directionalLight position={[5, 10, 7]} intensity={1.2} castShadow shadow-bias={-0.0005} />
          <Environment preset="city" />

          <CameraController view={view} count={designs.length} />

          <Suspense fallback={null}>
            {designs.map((d) => {
              const L = layoutFor(d.id);
              return (
                <DesignModelItem
                  key={d.id}
                  design={d}
                  isActive={d.id === activeId}
                  isHovered={d.id === hoveredId}
                  onSelect={setActiveId}
                  onHover={setHoveredId}
                  onUnhover={() => setHoveredId(null)}
                  view={view}
                  targetX={L.x}
                  targetZ={L.z}
                  targetRotY={L.rotY}
                  targetScale={L.scale}
                  hidden={L.hidden}
                />
              );
            })}
          </Suspense>

          <ContactShadows position={[0, -1.6, 0]} opacity={0.45} scale={12} blur={2} far={6} />

          <OrbitControls
            makeDefault
            enableZoom={true}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.6}
            minDistance={1.8}
            maxDistance={14}
            minPolarAngle={Math.PI / 2 - 0.65}
            maxPolarAngle={Math.PI / 2 + 0.65}
            // ✅ imleç neredeyse oraya zoom
            zoomToCursor={true}
          />
        </Canvas>
      </div>

      {/* SAĞ PANEL */}
      {activeDesign && (
        <EditorPanel
          design={activeDesign}
          updateDesign={updateActive}
          loading={loading}
          addToCart={handleAddToCartAll}
          view={view}
        />
      )}
    </div>
  );
}

useGLTF.preload(MODEL_PATHS.tshirt);
useGLTF.preload(MODEL_PATHS.hoodie);
useGLTF.preload(MODEL_PATHS.sweatshirt);
