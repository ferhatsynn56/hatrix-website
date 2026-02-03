"use client";

import Link from "next/link";
import React, {
  useState,
  Suspense,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Decal,
  Center,
  ContactShadows,
  useGLTF,
  Html,
  useProgress,
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
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";

import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useCart } from "@/context/CartContext";

/* ================= LOADER (SUSPENSE FALLBACK) ================= */
function ThreeDotsLoader() {
  const { active } = useProgress();
  if (!active) return null;

  return (
    <Html center>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.60)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
          fontWeight: 900,
          fontSize: 12,
          letterSpacing: "0.18em",
        }}
      >
        YÜKLENİYOR<span className="dotty">...</span>
        <style>{`
          .dotty { display:inline-block; width:18px; text-align:left; }
          .dotty::after { content: ""; animation: dots 1.1s infinite steps(4, end); }
          @keyframes dots {
            0% { content:""; }
            25%{ content:"."; }
            50%{ content:".."; }
            75%{ content:"..."; }
            100%{ content:""; }
          }
        `}</style>
      </div>
    </Html>
  );
}

/* ================= PATH HELPERS ================= */
const toSafeUrl = (p) => (typeof window !== "undefined" ? encodeURI(p) : p);

/* ================= MODEL PATHS ================= */
const MODEL_PATHS = {
  tshirt: "/models/NormalTshirt.glb",
  sweatshirt: "/models/NormalSweat.glb",
  "oversize-tshirt": "/models/OversizeTshirt.glb",
  "oversize-sweat": "/models/OversizeSweat.glb",
  hoodie: "/models/Hoodie.glb",
  "hoodie-ipli": "/models/HoodieIpli.glb",
  "hoodie-cepli": "/models/HoodieCepli.glb",
  "hoodie-ceplipli": "/models/HoodieCepliIpli.glb",
  "hoodie-oversize": "/models/HoodieOversize.glb",
  "hoodie-oversize-ipli": "/models/HoodieOversizeIpli.glb",
  "hoodie-oversize-cepli": "/models/HoodieOversizeCepli.glb",
  "hoodie-oversize-ceplipli": "/models/HoodieOversizeCepliIpli.glb",
  fermuarli: "/models/Fermuarli.glb",
};

const AVAILABLE_MODELS = [
  "tshirt",
  "sweatshirt",
  "oversize-tshirt",
  "oversize-sweat",
  "hoodie",
  "hoodie-ipli",
  "hoodie-cepli",
  "hoodie-ceplipli",
  "hoodie-oversize",
  "hoodie-oversize-ipli",
  "hoodie-oversize-cepli",
  "hoodie-oversize-ceplipli",
  "fermuarli",
];

const MODEL_LABELS = {
  tshirt: "Normal Tişört",
  sweatshirt: "Normal Sweat",
  "oversize-tshirt": "Oversize Tişört",
  "oversize-sweat": "Oversize Sweat",
  hoodie: "Hoodie",
  "hoodie-ipli": "Hoodie İpli",
  "hoodie-cepli": "Hoodie Cepli",
  "hoodie-ceplipli": "Hoodie Cepli İpli",
  "hoodie-oversize": "Oversize Hoodie",
  "hoodie-oversize-ipli": "Oversize Hoodie İpli",
  "hoodie-oversize-cepli": "Oversize Hoodie Cepli",
  "hoodie-oversize-ceplipli": "Oversize Hoodie Cepli İpli",
  fermuarli: "Fermuarlı",
};

/* ================= PRINT BOUNDS ================= */
const MODEL_PRINT_BOUNDS = {
  tshirt: {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "oversize-tshirt": {
    front: { xMin: -0.207, xMax: 0.206, yTop: 0.28, yBot: -0.3, z: 0.153, rotY: 0 },
    back: { xMin: -0.207, xMax: 0.206, yTop: 0.28, yBot: -0.3, z: -0.153, rotY: Math.PI },
  },
  sweatshirt: {
    front: { xMin: -0.15, xMax: 0.18, yTop: 0.28, yBot: -0.25, z: 0.139, rotY: 0 },
    back: { xMin: -0.15, xMax: 0.19, yTop: 0.31, yBot: -0.25, z: -0.14, rotY: Math.PI },
  },
  "oversize-sweat": {
    front: { xMin: -0.168, xMax: 0.168, yTop: 0.275, yBot: -0.26, z: 0.138, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.26, z: -0.138, rotY: Math.PI },
  },
  hoodie: {
    front: { xMin: -0.13, xMax: 0.13, yTop: 0.13, yBot: -0.27, z: 0.104, rotY: 0 },
    back: { xMin: -0.125, xMax: 0.125, yTop: 0.15, yBot: -0.287, z: -0.104, rotY: Math.PI },
  },
  "hoodie-cepli": {
    front: { xMin: -0.13, xMax: 0.13, yTop: 0.13, yBot: -0.135, z: 0.112, rotY: 0 },
    back: { xMin: -0.125, xMax: 0.125, yTop: 0.15, yBot: -0.3, z: -0.113, rotY: Math.PI },
  },
  "hoodie-ceplipli": {
    front: { xMin: -0.135, xMax: 0.135, yTop: 0.11, yBot: -0.118, z: 0.112, rotY: 0 },
    back: { xMin: -0.125, xMax: 0.125, yTop: 0.13, yBot: -0.28, z: -0.113, rotY: Math.PI },
  },
  fermuarli: {
    front: {
      xMin: -0.16,
      xMax: 0.165,
      yTop: 0.22,
      yBot: -0.24,
      z: 0.131,
      rotY: 0.1,
      zipGap01: 0.02, // Yakadan biraz aşağı kadar
    },
    back: { xMin: -0.155, xMax: 0.155, yTop: 0.28, yBot: -0.24, z: -0.132, rotY: Math.PI },
  },
};

const CM_LABELS = {
  tshirt: { front: { w: 40, h: 54 }, back: { w: 40, h: 54 } },
  sweatshirt: { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  hoodie: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-cepli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-ceplipli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "oversize-tshirt": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "oversize-sweat": { front: { w: 58, h: 58 }, back: { w: 58, h: 58 } },
  fermuarli: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
};

/* ================= FİYAT SISTEMI ================= */
const BASE_PRICE = 750;
const EXTRA_SIDE_PRICE = 150;

/* ================= BRAND / UI ================= */
const SCENE_BG_COLOR = "#252525";
const BRAND_COLORS = ["#1A1A1A", "#F0F0F0", "#D2C6B6", "#3F432C", "#191C25", "#363636", "#1EF292", "#3E191D"];
const BRAND_DEFAULT_COLOR = BRAND_COLORS[0];

/* ================= HELPERS ================= */
const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clamp01 = (v) => clamp(v, 0, 1);
const pct = (v01) => `${Math.round(v01 * 100)}%`;

const createSideData = () => ({
  logos: [],
  activeLogoId: null,
  customText: { text: "", color: "#ffffff", size: 150, scaleX: 1, scaleY: 1 },
  textPos: { x: 0.5, y: 0.85 },
});

const EMPTY_SIDE = createSideData();

const hasSideContent = (sd) => {
  if (!sd) return false;
  if (Array.isArray(sd.logos) && sd.logos.length > 0) return true;
  if ((sd.customText?.text || "").trim()) return true;
  return false;
};

const UI_SIDES = ["front", "back"];
const UI_VIEWS = ["front", "back"];

const createDesign = (type = "tshirt") => ({
  id: makeId(),
  modelType: type,
  color: BRAND_DEFAULT_COLOR,
  stringColor: "#e6e6e6",
  size: "M",
  sides: {
    front: createSideData(),
    back: createSideData(),
    left: createSideData(),
    right: createSideData(),
  },
});

const getActiveSides = (design) =>
  Object.entries(design.sides)
    .filter(([k]) => UI_SIDES.includes(k))
    .filter(([_, sd]) => hasSideContent(sd));

const getPrice = (design) => {
  const activeSides = getActiveSides(design);
  if (activeSides.length === 0) return BASE_PRICE;
  return BASE_PRICE + (activeSides.length - 1) * EXTRA_SIDE_PRICE;
};

/* ================= PRINT CANVAS (FOR CART / EXPORT) ================= */
async function makePrintDataUrl(sideData, opts = {}) {
  const logos = sideData?.logos || [];
  const t = sideData?.customText || {};
  const textPos = sideData?.textPos || { x: 0.5, y: 0.85 };
  const hasContent = logos.length > 0 || (t.text || "").trim();
  if (!hasContent) return null;

  const SIZE = 2048; // baskı için yüksek tut
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // LOGOS
  for (const l of logos) {
    const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = l.url;
      img.onload = () => {
        const bw = box.w * SIZE;
        const bh = box.h * SIZE;
        const bx = box.x * SIZE - bw / 2;
        const by = box.y * SIZE - bh / 2;
        ctx.drawImage(img, bx, by, bw, bh);
        res();
      };
      img.onerror = () => res();
    });
  }

  // TEXT
  if ((t.text || "").trim()) {
    const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420) * (SIZE / 1024);
    ctx.save();
    ctx.translate(textPos.x * SIZE, textPos.y * SIZE);
    ctx.scale(clamp(t.scaleX || 1, 0.3, 3), clamp(t.scaleY || 1, 0.3, 3));
    ctx.font = `900 ${fontSize}px Arial`;
    ctx.fillStyle = t.color || "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }

  // ZIP STRIPE CLEAR
  const gap01 = opts?.clearCenterStripe01;
  if (gap01) {
    const stripeW = Math.round(SIZE * gap01);
    const x0 = SIZE / 2 - stripeW / 2;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(x0, 0, stripeW, SIZE);
    ctx.restore();
  }

  return c.toDataURL("image/png");
}

/* ================= SCENE BACKGROUND ================= */
function SceneBackgroundLock() {
  const { gl, scene } = useThree();
  const bg = useMemo(() => new THREE.Color(SCENE_BG_COLOR), []);

  useEffect(() => {
    scene.background = bg;
    gl.setClearColor(bg, 1);
  }, [bg, gl, scene]);

  return null;
}

/* ================= KAMERA KONTROLCÜSÜ ================= */
function CameraController({ view, count, onAnimatingChange }) {
  const { camera } = useThree();
  const isAnimating = useRef(false);
  const extra = Math.min(2.5, Math.max(0, (count - 1) * 0.8));

  const positions = useMemo(
    () => ({
      front: new THREE.Vector3(0, 0, 2.55 + extra),
      back: new THREE.Vector3(0, 0, -(2.55 + extra)),
    }),
    [extra]
  );

  useEffect(() => {
    isAnimating.current = true;
    onAnimatingChange?.(true);
    const targetPos = positions[view] || positions.front;
    const startPos = camera.position.clone();
    const start = Date.now();
    const dur = 2400;
    const tick = () => {
      if (!isAnimating.current) return;
      const t = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 5);
      camera.position.lerpVectors(startPos, targetPos, eased);
      camera.lookAt(0, 0, 0);
      if (t < 1) requestAnimationFrame(tick);
      else {
        isAnimating.current = false;
        onAnimatingChange?.(false);
      }
    };
    tick();
    return () => {
      isAnimating.current = false;
      onAnimatingChange?.(false);
    };
  }, [view, camera, positions, onAnimatingChange]);

  return null;
}

/* ================= CANVAS TEXTURE (OPTIMIZED) ================= */
function useDesignCanvas(sideData, opts = {}, isMobile) {
  const [canvas, setCanvas] = useState(null);

  const logos = sideData?.logos || [];
  const logoSignature = logos
    .map(
      (l) =>
        `${l.id}_${l.box.x.toFixed(3)}_${l.box.y.toFixed(3)}_${l.box.w.toFixed(3)}_${l.box.h.toFixed(3)}`
    )
    .join("|");
  const customText = sideData?.customText;
  const textSignature = `${customText?.text}_${customText?.color}_${customText?.size}_${customText?.scaleX}_${customText?.scaleY}`;
  const posSignature = `${sideData?.textPos?.x}_${sideData?.textPos?.y}`;

  const CANVAS_SIZE = isMobile ? 512 : 2048;

  useEffect(() => {
    const hasContent = logos.length > 0 || (customText?.text || "").trim();
    if (!hasContent) {
      setCanvas(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const c = document.createElement("canvas");
      c.width = CANVAS_SIZE;
      c.height = CANVAS_SIZE;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const drawText = () => {
        const t = customText || {};
        if (!t.text) return;

        const scaleFactor = CANVAS_SIZE / 1024;
        const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420) * scaleFactor;

        ctx.save();
        ctx.translate((sideData?.textPos?.x ?? 0.5) * CANVAS_SIZE, (sideData?.textPos?.y ?? 0.85) * CANVAS_SIZE);
        ctx.scale(clamp(t.scaleX || 1, 0.3, 3), clamp(t.scaleY || 1, 0.3, 3));
        ctx.font = `900 ${fontSize}px Arial`;
        ctx.fillStyle = t.color || "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      };

      const clearCenterStripe = () => {
        const gap01 = opts?.clearCenterStripe01;
        if (!gap01) return;
        const stripeW = Math.round(CANVAS_SIZE * gap01);
        const x0 = CANVAS_SIZE / 2 - stripeW / 2;
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(x0, 0, stripeW, CANVAS_SIZE);
        ctx.restore();
      };

      const drawAll = async () => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        for (const l of logos) {
          const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = l.url;
            img.onload = () => {
              const bw = box.w * CANVAS_SIZE;
              const bh = box.h * CANVAS_SIZE;
              const bx = box.x * CANVAS_SIZE - bw / 2;
              const by = box.y * CANVAS_SIZE - bh / 2;
              ctx.drawImage(img, bx, by, bw, bh);
              res();
            };
            img.onerror = () => res();
          });
        }

        drawText();
        clearCenterStripe();
        setCanvas(c);
      };

      drawAll();
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoSignature, textSignature, posSignature, opts?.clearCenterStripe01, CANVAS_SIZE]);

  return canvas;
}

/* ================= 3D MODEL HELPERS ================= */
function pickDecalHostMesh(root, modelType) {
  const candidates = [];

  root.traverse((o) => {
    if (!(o && (o.isMesh || o.isSkinnedMesh) && o.geometry?.attributes?.position)) return;

    o.geometry.computeBoundingBox?.();
    const bb = o.geometry.boundingBox;
    if (!bb) return;

    const size = new THREE.Vector3();
    bb.getSize(size);

    const hoodYMaxLimit =
      modelType.includes("hoodie") || modelType.includes("fermuarli") ? 0.52 : 0.65;

    const isTorsoLike =
      size.y > 0.6 &&
      size.x > 0.25 &&
      bb.max.y < hoodYMaxLimit &&
      bb.min.y < -0.15;

    if (isTorsoLike) {
      candidates.push({ o, score: size.x * size.y * size.z });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.o || null;
}

function makeCanvasTexture(canvas) {
  if (!canvas) return null;
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16; // Netlik için yüksek değer
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true; // Görselin doğru yönde olması için
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function Real3DModel({ color, stringColor, frontCanvas, backCanvas, modelType, view, isMobile }) {
  const modelPathRaw = MODEL_PATHS[modelType] || MODEL_PATHS.tshirt;
  const gltf = useGLTF(toSafeUrl(modelPathRaw));

  const hasSkinned = useMemo(() => {
    let found = false;
    gltf.scene.traverse((o) => {
      if (o?.isSkinnedMesh) found = true;
    });
    return found;
  }, [gltf.scene]);

  const root = useMemo(() => {
    const cloned = hasSkinned ? SkeletonUtils.clone(gltf.scene) : gltf.scene.clone(true);
    return cloned;
  }, [gltf.scene, hasSkinned]);

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color || BRAND_DEFAULT_COLOR),
        roughness: 0.9,
        metalness: 0.03,
        side: THREE.FrontSide,
      }),
    [color]
  );

  const laceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(stringColor || "#e6e6e6"),
        roughness: 0.85,
        metalness: 0.02,
        side: THREE.FrontSide,
      }),
    [stringColor]
  );

  useEffect(() => {
    if (!root) return;

    const looksLikeLace = (o) => {
      const n = (o?.name || "").toLowerCase();
      const mn = (o?.material?.name || "").toLowerCase();
      return (
        n.includes("string") ||
        n.includes("lace") ||
        n.includes("draw") ||
        n.includes("ip") ||
        n.includes("cord") ||
        mn.includes("string") ||
        mn.includes("lace") ||
        mn.includes("draw") ||
        mn.includes("ip") ||
        mn.includes("cord")
      );
    };

    root.traverse((o) => {
      if (!(o && (o.isMesh || o.isSkinnedMesh) && o.geometry)) return;
      if (o.geometry.getAttribute?.("color")) o.geometry.deleteAttribute("color");
      o.material = looksLikeLace(o) ? laceMaterial : bodyMaterial;
    });
  }, [root, bodyMaterial, laceMaterial]);

  // Texture disposal
  const [frontTex, setFrontTex] = useState(null);
  const [backTex, setBackTex] = useState(null);

  useEffect(() => {
    if (!frontCanvas) {
      setFrontTex(null);
      return;
    }
    const t = makeCanvasTexture(frontCanvas);
    if (isMobile) t.anisotropy = 8; // Mobilde daha yüksek netlik
    setFrontTex(t);
    return () => {
      if (t) t.dispose();
    };
  }, [frontCanvas, isMobile]);

  useEffect(() => {
    if (!backCanvas) {
      setBackTex(null);
      return;
    }
    const t = makeCanvasTexture(backCanvas);
    if (isMobile) t.anisotropy = 8; // Mobilde daha yüksek netlik
    setBackTex(t);
    return () => {
      if (t) t.dispose();
    };
  }, [backCanvas, isMobile]);

  const decalHost = useMemo(() => pickDecalHostMesh(root, modelType), [root, modelType]);
  const decalHostMat = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    []
  );

  const TORSO_DEPTH = 0.3;

  const frontProfile = MODEL_PRINT_BOUNDS[modelType]?.front || MODEL_PRINT_BOUNDS.tshirt.front;
  const backProfile = MODEL_PRINT_BOUNDS[modelType]?.back || MODEL_PRINT_BOUNDS.tshirt.back;

  const frontW = frontProfile.xMax - frontProfile.xMin;
  const frontH = frontProfile.yTop - frontProfile.yBot;
  const frontCY = (frontProfile.yTop + frontProfile.yBot) / 2;

  const backW = backProfile.xMax - backProfile.xMin;
  const backH = backProfile.yTop - backProfile.yBot;
  const backCY = (backProfile.yTop + backProfile.yBot) / 2;

  const torsoZOffsetFront = 0.001;
  const torsoZOffsetBack = -0.001;

  const showFront = view === "front";
  const showBack = view === "back";

  return (
    <group dispose={null}>
      <Center top>
        <primitive object={root} />

        {decalHost && (
          <mesh geometry={decalHost.geometry} material={decalHostMat}>
            {showFront && frontTex && (
              <Decal
                position={[0, frontCY, frontProfile.z + torsoZOffsetFront]}
                rotation={[0, frontProfile.rotY || 0, 0]}
                scale={[frontW, frontH, TORSO_DEPTH]}
              >
                <meshStandardMaterial
                  map={frontTex}
                  transparent
                  alphaTest={0.02}
                  depthWrite={false}
                  polygonOffset
                  polygonOffsetFactor={-10}
                  side={THREE.FrontSide}
                  roughness={1}
                  metalness={0}
                />
              </Decal>
            )}

            {showBack && backTex && (
              <Decal
                position={[0, backCY, backProfile.z + torsoZOffsetBack]}
                rotation={[0, backProfile.rotY || Math.PI, 0]}
                scale={[backW, backH, TORSO_DEPTH]}
              >
                <meshStandardMaterial
                  map={backTex}
                  transparent
                  alphaTest={0.02}
                  depthWrite={false}
                  polygonOffset
                  polygonOffsetFactor={-10}
                  side={THREE.FrontSide}
                  roughness={1}
                  metalness={0}
                />
              </Decal>
            )}
          </mesh>
        )}
      </Center>
    </group>
  );
}

/* ================= RESIZE FRAME ================= */
function ResizeFrame({ box, onChange, containerRef }) {
  const dragRef = useRef(null);

  const getPointer01 = (e, rect) => ({
    x: clamp01((e.clientX - rect.left) / rect.width),
    y: clamp01((e.clientY - rect.top) / rect.height),
  });

  const begin = (mode, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target?.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {}
    }

    const rect = containerRef.current.getBoundingClientRect();
    const { x: px, y: py } = getPointer01(e, rect);

    dragRef.current = {
      mode,
      rect,
      startBox: { ...box },
      startEdges: {
        left: box.x - box.w / 2,
        right: box.x + box.w / 2,
        top: box.y - box.h / 2,
        bottom: box.y + box.h / 2,
      },
      moveOffset: { dx: box.x - px, dy: box.y - py },
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  };

  const move = (e) => {
    const s = dragRef.current;
    if (!s) return;
    e.preventDefault();

    const { x: px, y: py } = getPointer01(e, s.rect);
    const minW = 0.12;
    const minH = 0.12;

    if (s.mode === "move") {
      const halfW = s.startBox.w / 2;
      const halfH = s.startBox.h / 2;
      onChange({
        x: clamp(px + s.moveOffset.dx, halfW, 1 - halfW),
        y: clamp(py + s.moveOffset.dy, halfH, 1 - halfH),
        w: s.startBox.w,
        h: s.startBox.h,
      });
      return;
    }

    let { left, right, top, bottom } = s.startEdges;
    if (s.mode.includes("l")) left = clamp(px, 0, right - minW);
    if (s.mode.includes("r")) right = clamp(px, left + minW, 1);
    if (s.mode.includes("t")) top = clamp(py, 0, bottom - minH);
    if (s.mode.includes("b")) bottom = clamp(py, top + minH, 1);

    const w = right - left;
    const h = bottom - top;
    onChange({ x: left + w / 2, y: top + h / 2, w, h });
  };

  const end = (e) => {
    if (e.target?.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch {}
    }
    dragRef.current = null;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
  };

  return (
    <div
      className="absolute border-2 border-white/70 rounded-lg group"
      style={{
        left: pct(box.x - box.w / 2),
        top: pct(box.y - box.h / 2),
        width: pct(box.w),
        height: pct(box.h),
        touchAction: "none",
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
          className="absolute w-6 h-6 bg-white rounded-full border border-zinc-400 shadow-sm opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            left: `${lx}%`,
            top: `${ty}%`,
            transform: "translate(-50%, -50%)",
            touchAction: "none",
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

/* ================= DESIGN MODEL ITEM ================= */
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
  disableDrag,
  isMobile,
}) {
  const groupRef = useRef(null);
  const userRotRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, pid: null, startX: 0, startY: 0, startRotY: 0, startRotX: 0 });

  const ROT_SPEED = 0.01;
  const clampRotX = (v) => Math.max(-0.9, Math.min(0.9, v));

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;

    g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, Math.min(1, delta * 6));
    g.position.z = THREE.MathUtils.lerp(g.position.z, targetZ, Math.min(1, delta * 6));

    const desiredRotY = targetRotY + (isActive ? userRotRef.current.y : 0);
    const desiredRotX = isActive ? userRotRef.current.x : 0;

    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, desiredRotY, Math.min(1, delta * 10));
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, desiredRotX, Math.min(1, delta * 10));

    const nextS = targetScale + (isHovered ? 0.06 : 0) + (isActive ? 0.05 : 0);
    const lerped = THREE.MathUtils.lerp(g.scale.x || 1, nextS, Math.min(1, delta * 10));
    g.scale.setScalar(lerped);
  });

  const isZipper = design.modelType === "fermuarli";
  const gap01 = MODEL_PRINT_BOUNDS?.fermuarli?.front?.zipGap01 ?? 0.08;

  const frontCanvas = useDesignCanvas(design.sides.front || EMPTY_SIDE, isZipper ? { clearCenterStripe01: gap01 } : {}, isMobile);
  const backCanvas = useDesignCanvas(design.sides.back || EMPTY_SIDE, {}, isMobile);

  if (hidden) return null;

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(design.id);
        document.body.style.cursor = "grab";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onUnhover();
        document.body.style.cursor = "default";
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(design.id);
        if (!isActive) return;
        if (disableDrag) return;

        dragRef.current = {
          active: true,
          pid: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startRotY: userRotRef.current.y,
          startRotX: userRotRef.current.x,
        };

        document.body.style.cursor = "grabbing";
        if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (disableDrag) return;
        if (!dragRef.current.active || dragRef.current.pid !== e.pointerId) return;
        e.stopPropagation();

        const invert = 1;
        userRotRef.current.y = dragRef.current.startRotY + (e.clientX - dragRef.current.startX) * ROT_SPEED * invert;
        userRotRef.current.x = clampRotX(dragRef.current.startRotX + (e.clientY - dragRef.current.startY) * ROT_SPEED * invert);
      }}
      onPointerUp={(e) => {
        if (disableDrag) return;
        if (dragRef.current.pid !== e.pointerId) return;
        dragRef.current.active = false;
        document.body.style.cursor = "grab";
        if (e.target?.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
      }}
    >
      <Real3DModel
        color={design.color}
        stringColor={design.stringColor}
        frontCanvas={frontCanvas}
        backCanvas={backCanvas}
        modelType={design.modelType}
        view={view}
        isMobile={isMobile}
      />
    </group>
  );
}

/* ================= EDITOR PANEL ================= */
function EditorPanel({
  design,
  updateDesign,
  loading,
  onAddToCartAll,
  view,
  isMobile,
  activeTab,
  setActiveTab,
}) {
  const isZipperFront = design.modelType === "fermuarli" && view === "front";
  const gap01 = MODEL_PRINT_BOUNDS?.fermuarli?.front?.zipGap01 ?? 0.08;

  const currentSide = view === "back" ? "back" : "front";
  const sideData = useMemo(() => design?.sides?.[currentSide] || createSideData(), [design, currentSide]);

  // içerik varsa editor'e geç, yoksa upload
  useEffect(() => {
    const sideHasAny =
      (sideData?.logos?.length ?? 0) > 0 || ((sideData?.customText?.text ?? "").trim().length > 0);

    // setActiveTab yoksa patlamasın
    if (typeof setActiveTab === "function") {
      setActiveTab(sideHasAny ? "editor" : "upload");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design?.id, currentSide]);

  const previewRef = useRef(null);

  const sizes = ["S", "M", "L", "XL"];
  const colorPresets = BRAND_COLORS;
  const stringPresets = ["#e6e6e6", "#ffffff", "#000000", "#c8b08a", "#a0a0a0"];

  if (!design) return null;

  const sideLabel = currentSide === "front" ? "ÖN" : "ARKA";
  const cm = CM_LABELS[design.modelType]?.[currentSide] || { w: 0, h: 0 };

  const t = sideData?.customText || {};

  const updateSide = (patch) => {
    updateDesign({
      sides: {
        ...design.sides,
        [currentSide]: { ...design.sides[currentSide], ...patch },
      },
    });
  };

  const bumpText = (patch) => updateSide({ customText: { ...t, ...patch } });

  const activeSides = getActiveSides(design);
  const totalPrice = getPrice(design);

  const logos = sideData?.logos || [];
  const activeLogo = logos.find((l) => l.id === sideData.activeLogoId) || logos[0] || null;

  const isFocusMode = isMobile && activeTab === "editor";

  if (isFocusMode) {
    return (
      <div className="w-full h-full flex flex-col bg-[#111111]" style={{ touchAction: "none" }}>
        <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-[#0f0f0f]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yerleşim Ayarı</h3>
          <button
            onClick={() => setActiveTab("upload")}
            className="px-4 py-1.5 bg-green-600 text-white text-xs font-black rounded-full shadow-lg active:scale-95 transition flex items-center gap-1"
          >
            <Check size={14} /> TAMAM
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-900/30">
          <p className="text-[10px] text-zinc-400 mb-2">Görseli köşelerden boyutlandır, ortadan taşı.</p>

          <div
            className="w-full max-w-[320px] aspect-square bg-zinc-900 rounded-xl border border-zinc-600 relative overflow-hidden shadow-2xl touch-none"
            ref={previewRef}
            style={{ touchAction: "none" }}
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            />

            {isZipperFront && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: "50%",
                  width: `${Math.round(gap01 * 100)}%`,
                  transform: "translateX(-50%)",
                  background: "rgba(255,255,255,0.07)",
                  borderLeft: "1px dashed rgba(255,255,255,0.20)",
                  borderRight: "1px dashed rgba(255,255,255,0.20)",
                }}
              />
            )}

            {(logos || []).map((l) => {
              const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
              const isSel = (sideData.activeLogoId || logos[0]?.id) === l.id;
              return (
                <div
                  key={l.id}
                  className={`absolute rounded-lg overflow-hidden border ${isSel ? "border-white" : "border-white/10"}`}
                  style={{
                    left: pct(box.x - box.w / 2),
                    top: pct(box.y - box.h / 2),
                    width: pct(box.w),
                    height: pct(box.h),
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    updateSide({ activeLogoId: l.id });
                  }}
                >
                  <img src={l.url} alt="" className="w-full h-full object-fill pointer-events-none" />
                </div>
              );
            })}

            {activeLogo && (
              <ResizeFrame
                box={activeLogo.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 }}
                containerRef={previewRef}
                onChange={(next) => {
                  const nextLogos = (logos || []).map((l) => (l.id === activeLogo.id ? { ...l, box: next } : l));
                  updateSide({ logos: nextLogos });
                }}
              />
            )}

            {sideData?.customText?.text && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/30 border border-white/20"
                style={{ left: pct(sideData.textPos.x), top: pct(sideData.textPos.y), touchAction: "none" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = previewRef.current.getBoundingClientRect();
                  const move = (ev) =>
                    updateSide({
                      textPos: {
                        x: clamp01((ev.clientX - rect.left) / rect.width),
                        y: clamp01((ev.clientY - rect.top) / rect.height),
                      },
                    });
                  const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up);
                }}
              >
                <span className="text-xs font-black" style={{ color: sideData.customText.color }}>
                  {sideData.customText.text}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${isMobile ? "h-full flex flex-col" : "md:w-[420px]"} bg-[#111111] z-20 shadow-2xl border-t md:border-t-0 md:border-l border-zinc-800`}
      style={isMobile ? { touchAction: "pan-y" } : {}}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-[#111111] flex-shrink-0">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold">BASKI ALANI — {sideLabel}</p>
            <h2 className="text-sm font-mono text-white">
              {cm.w}×{cm.h} CM
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">
              SEÇİLİ: {MODEL_LABELS[design.modelType] || design.modelType}
            </p>
            {isZipperFront && (
              <p className="text-[10px] text-zinc-400 mt-2">
                Fermuar boşluğu aktif: <span className="text-white font-black">{Math.round(gap01 * 100)}%</span>
              </p>
            )}
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

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-[#111111] flex-shrink-0">
        {[
          { id: "editor", icon: Move, label: "Yerleşim" },
          { id: "upload", icon: ImageIcon, label: "Baskı" },
          { id: "text", icon: Type, label: "Yazı" },
          { id: "color", icon: Palette, label: "Renk" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
              activeTab === tab.id ? "text-white border-b-2 border-white" : "text-zinc-500"
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#111111]" style={{ touchAction: "pan-y" }}>
        {/* UPLOAD */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase">
              Şu an düzenlenen alan: <span className="text-white">{sideLabel}</span>
              {isZipperFront && <span className="text-zinc-500"> (fermuar boşluğu açık)</span>}
            </p>

            <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-white hover:bg-zinc-900 transition">
              <Upload className="w-8 h-8 mb-2 text-zinc-500" />
              <p className="text-xs text-zinc-400 font-bold uppercase">Baskı Görseli Ekle</p>
              {isZipperFront && (
                <p className="text-[10px] text-zinc-500 mt-1">Not: Fermuar şeridi otomatik boş kalır.</p>
              )}

              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const id = makeId();
                    const nextLogo = {
                      id,
                      url: ev.target.result,
                      box: { x: 0.5, y: 0.6, w: 0.7, h: 0.45 },
                    };

                    if ((sideData.logos || []).length >= 3) {
                      alert("Bu alanda en fazla 3 baskı görseli yükleyebilirsin.");
                      e.target.value = "";
                      return;
                    }

                    const nextLogos = [...(sideData.logos || []), nextLogo];
                    updateSide({ logos: nextLogos, activeLogoId: id });
                    setActiveTab("editor");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            {(sideData?.logos || []).length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("editor")}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2"
                >
                  <Move size={14} /> Konum/Boyut Ayarla
                </button>

                <button
                  onClick={() => {
                    const currentId = sideData.activeLogoId || sideData.logos?.[0]?.id;
                    const next = (sideData.logos || []).filter((l) => l.id !== currentId);
                    updateSide({ logos: next, activeLogoId: next[0]?.id || null });
                  }}
                  className="w-full py-2 bg-red-900/30 text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/50"
                >
                  <Trash2 size={14} /> Seçili Baskıyı Kaldır
                </button>

                <button
                  onClick={() => updateSide({ logos: [], activeLogoId: null })}
                  className="w-full py-2 bg-red-900/20 text-red-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/40"
                >
                  <Trash2 size={14} /> Bu Alandaki TÜM Baskıları Kaldır
                </button>
              </div>
            )}
          </div>
        )}

                {/* EDITOR (KONUM/BOYUT) */}
        {activeTab === "editor" && (
          <div className="space-y-3">
            <p className="text-[10px] text-zinc-400 font-bold uppercase">
              Konum / Boyut — <span className="text-white">{sideLabel}</span>
            </p>

            <div
              ref={previewRef}
              className="w-full aspect-square bg-zinc-900 rounded-xl border border-zinc-600 relative overflow-hidden shadow-2xl touch-none"
              style={{ touchAction: "none" }}
            >
              {/* hafif grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                  backgroundSize: "10px 10px",
                }}
              />

              {/* fermuar boşluğu görünsün */}
              {isZipperFront && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: "50%",
                    width: `${Math.round(gap01 * 100)}%`,
                    transform: "translateX(-50%)",
                    background: "rgba(255,255,255,0.07)",
                    borderLeft: "1px dashed rgba(255,255,255,0.20)",
                    borderRight: "1px dashed rgba(255,255,255,0.20)",
                  }}
                />
              )}

              {/* logolar */}
              {(logos || []).map((l) => {
                const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
                const isSel = (sideData.activeLogoId || logos[0]?.id) === l.id;

                return (
                  <div
                    key={l.id}
                    className={`absolute rounded-lg overflow-hidden border ${
                      isSel ? "border-white" : "border-white/10"
                    }`}
                    style={{
                      left: pct(box.x - box.w / 2),
                      top: pct(box.y - box.h / 2),
                      width: pct(box.w),
                      height: pct(box.h),
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      updateSide({ activeLogoId: l.id });
                    }}
                  >
                    <img
                      src={l.url}
                      alt=""
                      className="w-full h-full object-fill pointer-events-none"
                    />
                  </div>
                );
              })}

              {/* seçili logo resize/drag çerçevesi */}
              {activeLogo && (
                <ResizeFrame
                  box={activeLogo.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 }}
                  containerRef={previewRef}
                  onChange={(next) => {
                    const nextLogos = (logos || []).map((l) =>
                      l.id === activeLogo.id ? { ...l, box: next } : l
                    );
                    updateSide({ logos: nextLogos });
                  }}
                />
              )}

              {/* yazı: sürükle */}
              {sideData?.customText?.text && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/30 border border-white/20"
                  style={{
                    left: pct(sideData.textPos.x),
                    top: pct(sideData.textPos.y),
                    touchAction: "none",
                    cursor: "grab",
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = previewRef.current.getBoundingClientRect();
                    const move = (ev) =>
                      updateSide({
                        textPos: {
                          x: clamp01((ev.clientX - rect.left) / rect.width),
                          y: clamp01((ev.clientY - rect.top) / rect.height),
                        },
                      });
                    const up = () => {
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                  }}
                >
                  <span
                    className="text-xs font-black select-none"
                    style={{ color: sideData.customText.color }}
                  >
                    {sideData.customText.text}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-500">
              İpucu: Görseli ortadan sürükle, köşelerden büyüt/küçült. (Mobilde de çalışır)
            </p>
          </div>
        )}


        {/* TEXT */}
        {activeTab === "text" && (
          <div className="space-y-4">
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
              <div className="flex gap-2 flex-wrap">
                {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff"].map((c) => (
                  <button
                    key={c}
                    onClick={() => bumpText({ color: c })}
                    className={`w-8 h-8 rounded-full border ${t.color === c ? "border-white scale-110" : "border-zinc-700"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

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

        {/* COLOR */}
        {activeTab === "color" && (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-400 font-bold">Ürün rengi (tüm taraflar için geçerli)</p>
            <div className="grid grid-cols-4 gap-3">
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

            {design.modelType.includes("hoodie") && (
              <div className="pt-3 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-400 font-bold mb-2">İp rengi (sadece hoodie)</p>
                <div className="flex gap-2 flex-wrap">
                  {stringPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateDesign({ stringColor: c })}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        (design.stringColor || "#e6e6e6") === c ? "border-white scale-110" : "border-zinc-700"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop editor preview is intentionally omitted here because you already have focus-mode for mobile;
            If you want desktop editor preview back, tell me, eklerim. */}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 bg-[#111111] flex-shrink-0">
        <div className="mb-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Ana Fiyat</span>
            <span className="text-xs text-zinc-300 font-mono">{BASE_PRICE} ₺</span>
          </div>

          {activeSides.length > 1 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Ek Taraf ({activeSides.length - 1}×)</span>
              <span className="text-xs text-zinc-300 font-mono">+{(activeSides.length - 1) * EXTRA_SIDE_PRICE} ₺</span>
            </div>
          )}

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800">
            <span className="text-[10px] text-white font-bold uppercase">Toplam</span>
            <span className="text-sm text-white font-black font-mono">{totalPrice} ₺</span>
          </div>
        </div>

        <button
          onClick={onAddToCartAll}
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

/* ================= ANA EXPORT ================= */
export default function TasarimClient() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 1024 || (width < 768 && height < 1024));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-screen bg-[#252525] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return <TasarimClientContent isMobile={isMobile} />;
}

/* ================= CONTENT ================= */
function TasarimClientContent({ isMobile }) {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  // ✅ activeTab artık burada (hata bitti)
  const [activeTab, setActiveTab] = useState("upload");

  // ✅ designs/activeId init bug fix
  const initialDesignRef = useRef(null);
  if (!initialDesignRef.current) initialDesignRef.current = createDesign("tshirt");

  const safeInitial = useMemo(() => {
    if (!searchParams) return "tshirt";
    const initialModel = (searchParams.get("model") || searchParams.get("product") || "tshirt").toLowerCase();
    return AVAILABLE_MODELS.includes(initialModel) ? initialModel : "tshirt";
  }, [searchParams]);

  const [view, setView] = useState("front");
  const [designs, setDesigns] = useState(() => [
    { ...initialDesignRef.current, modelType: safeInitial },
  ]);
  const [activeId, setActiveId] = useState(() => initialDesignRef.current.id);

  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState("root");

  const glRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [captureView, setCaptureView] = useState(null);
  const [captureId, setCaptureId] = useState(null);
  const [camAnimating, setCamAnimating] = useState(false);

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerY, setDrawerY] = useState(0);
  const dragState = useRef({ dragging: false, startY: 0, startDrawerY: 0 });

  const MAX_OPEN = 0;
  const MAX_CLOSED = 280;

  useEffect(() => {
    document.documentElement.style.backgroundColor = SCENE_BG_COLOR;
    document.body.style.backgroundColor = SCENE_BG_COLOR;
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setDesigns((prev) => {
      if (!prev.length) return [createDesign(safeInitial)];
      if (prev.length === 1 && prev[0].modelType !== safeInitial) {
        const sd = prev[0].sides;
        const hasAny = Object.values(sd).some((s) => hasSideContent(s));
        if (!hasAny) return [{ ...prev[0], modelType: safeInitial }];
      }
      return prev;
    });
  }, [safeInitial]);

  useEffect(() => {
    if (!activeId && designs[0]) setActiveId(designs[0].id);
  }, [activeId, designs]);

  const activeDesign = useMemo(() => designs.find((d) => d.id === activeId) || designs[0], [designs, activeId]);

  const updateActive = (patch) => {
    if (patch?.__setView) {
      setView(patch.__setView);
      const { __setView, ...rest } = patch;
      patch = rest;
    }
    setDesigns((prev) => prev.map((d) => (d.id === activeId ? { ...d, ...patch } : d)));
  };

  const addModel = (type) => {
    const t = AVAILABLE_MODELS.includes(type) ? type : "tshirt";
    const nd = createDesign(t);
    setDesigns((prev) => [...prev, nd]);
    setActiveId(nd.id);
    setPickerOpen(false);
  };

  const removeModel = (id) => {
    setDesigns((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (id === activeId) setActiveId(next[next.length - 1]?.id || null);
      return next.length ? next : [createDesign(safeInitial)];
    });
  };

  const layoutFor = (designId) => {
    if (captureId) {
      if (designId !== captureId) return { hidden: true, x: -999, z: -999, rotY: 0, scale: 1 };
      return { hidden: false, x: 0, z: 0, rotY: 0, scale: 1.05 };
    }

    if (designId === activeId) return { hidden: false, x: 0, z: 0, rotY: 0, scale: 1.03 };

    const others = designs.filter((d) => d.id !== activeId);
    const idx = others.findIndex((d) => d.id === designId);

    if (isMobile) return { hidden: false, x: -1.2 - idx * 0.5, z: -0.5, rotY: 0.6, scale: 0.8 };
    return { hidden: false, x: -2.2 - idx * 0.85, z: -0.35, rotY: 0.85, scale: 0.92 };
  };

  const captureMockupForSide = async (designId, sideView) => {
    if (!glRef.current || !sceneRef.current || !cameraRef.current) return null;
    setCaptureId(designId);
    setCaptureView(sideView);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
    const gl = glRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    gl.render(scene, camera);
    return gl.domElement.toDataURL("image/png");
  };

  const handleAddToCartAll = async () => {
    const hasAnyContent = designs.some((d) => Object.values(d.sides).some((sd) => hasSideContent(sd)));
    if (!hasAnyContent) {
      alert("Lütfen en az bir üründe (ÖN/ARKA) logo/yazı ekleyin.");
      return;
    }

    setLoading(true);
    try {
      for (const d of designs) {
        const activeSides = getActiveSides(d);
        if (activeSides.length === 0) continue;

        const printFiles = {};
        for (const [sideKey, sideData] of activeSides) {
          if (d.modelType === "fermuarli" && sideKey === "front") {
            const g = MODEL_PRINT_BOUNDS.fermuarli.front.zipGap01 ?? 0.08;
            // eslint-disable-next-line no-await-in-loop
            printFiles[sideKey] = await makePrintDataUrl(sideData, { clearCenterStripe01: g });
          } else {
            // eslint-disable-next-line no-await-in-loop
            printFiles[sideKey] = await makePrintDataUrl(sideData);
          }
        }

        const mockupFiles = {};
        for (const [sideKey] of activeSides) {
          // eslint-disable-next-line no-await-in-loop
          mockupFiles[sideKey] = await captureMockupForSide(d.id, sideKey);
        }

        setCaptureId(null);
        setCaptureView(null);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const previewMockup = mockupFiles.front || mockupFiles[activeSides[0][0]] || null;
        const cartItemId = `cart_${d.id}_${Date.now()}`;

        addToCart({
          id: cartItemId,
          name: `Özel Tasarım — ${(MODEL_LABELS[d.modelType] || d.modelType).toUpperCase()}`,
          price: getPrice(d),
          size: d.size,
          image: previewMockup,
          color: d.color,
          designDetails: {
            model: d.modelType,
            baseColor: d.color,
            stringColor: d.stringColor,
            printFiles,
            mockupFiles,
            sides: d.sides,
          },
        });
      }

      alert("Tüm ürünler sepete eklendi!");
    } catch (err) {
      console.error("Sepete ekle hata:", err);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
      setCaptureId(null);
      setCaptureView(null);
    }
  };

  // drawer behavior
  useEffect(() => {
    if (!isMobile) return;
    setDrawerY(drawerOpen ? MAX_OPEN : MAX_CLOSED);
  }, [drawerOpen, isMobile]);

  const onDrawerPointerDown = (e) => {
    dragState.current.dragging = true;
    dragState.current.startY = e.clientY;
    dragState.current.startDrawerY = drawerY;
    window.addEventListener("pointermove", onDrawerPointerMove);
    window.addEventListener("pointerup", onDrawerPointerUp);
  };

  const onDrawerPointerMove = (e) => {
    if (!dragState.current.dragging) return;
    const dy = e.clientY - dragState.current.startY;
    const next = clamp(dragState.current.startDrawerY + dy, MAX_OPEN, MAX_CLOSED);
    setDrawerY(next);
  };

  const onDrawerPointerUp = () => {
    dragState.current.dragging = false;
    window.removeEventListener("pointermove", onDrawerPointerMove);
    window.removeEventListener("pointerup", onDrawerPointerUp);
    const mid = (MAX_CLOSED - MAX_OPEN) * 0.55;
    setDrawerOpen(drawerY < mid);
  };

  const effectiveView = captureView || view;

  const renderPanel = (
    <EditorPanel
      design={activeDesign}
      updateDesign={updateActive}
      loading={loading}
      onAddToCartAll={handleAddToCartAll}
      view={view}
      isMobile={isMobile}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );

  return (
    <div className="fixed inset-0 h-screen w-full text-white flex flex-col md:flex-row overflow-hidden font-sans" style={{ background: SCENE_BG_COLOR, overscrollBehavior: "none", touchAction: "none" }}>
      <Link href="/" className="absolute top-2 left-2 z-[90]">
        <div className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900/70 backdrop-blur-md hover:bg-zinc-800 transition flex items-center gap-2">
          <span className="text-xs">←</span>
          <span className="text-xs font-bold">Geri</span>
        </div>
      </Link>

      <div className="w-full h-full md:flex-1 relative" style={{ background: SCENE_BG_COLOR }}>
        {/* DESKTOP CONTROLS */}
        {!isMobile && (
          <>
            <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-full border border-zinc-700 shadow-xl">
              {UI_VIEWS.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    view === v ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {v === "front" ? "Ön" : "Arka"}
                </button>
              ))}
            </div>

            <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
              <button
                onClick={() => {
                  setPickerStep("root");
                  setPickerOpen(true);
                }}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-black shadow-xl hover:bg-zinc-200 transition"
                title="Model Ekle"
              >
                <Plus size={18} />
              </button>

              <div className="flex items-center gap-2 bg-zinc-900/70 border border-zinc-700 rounded-full px-3 py-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">MODELLER: {designs.length}</span>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                  SEÇİLİ: {MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}
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
          </>
        )}

        {/* Model picker modal */}
        {pickerOpen && (
          <div className="absolute inset-0 z-[95] bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {pickerStep !== "root" && (
                    <button
                      onClick={() => setPickerStep("root")}
                      className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                      title="Geri"
                    >
                      <span className="text-sm">←</span>
                    </button>
                  )}
                  <h3 className="text-sm font-black tracking-widest uppercase">Model Seç</h3>
                </div>

                <button
                  onClick={() => {
                    setPickerStep("root");
                    setPickerOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {pickerStep === "root" && (
                  <>
                    <button onClick={() => setPickerStep("tshirt")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Tişört
                    </button>
                    <button onClick={() => setPickerStep("sweat")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Sweatshirt
                    </button>
                    <button onClick={() => setPickerStep("hoodie")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Hoodie
                    </button>
                    <button onClick={() => addModel("fermuarli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Fermuarlı
                    </button>
                  </>
                )}
                {pickerStep === "tshirt" && (
                  <>
                    <button onClick={() => addModel("tshirt")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Düz Tişört
                    </button>
                    <button onClick={() => addModel("oversize-tshirt")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Oversize Tişört
                    </button>
                  </>
                )}
                {pickerStep === "sweat" && (
                  <>
                    <button onClick={() => addModel("sweatshirt")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Normal Sweat
                    </button>
                    <button onClick={() => addModel("oversize-sweat")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Oversize Sweat
                    </button>
                  </>
                )}
                {pickerStep === "hoodie" && (
                  <>
                    <button onClick={() => addModel("hoodie")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Hoodie
                    </button>
                    <button onClick={() => addModel("hoodie-ipli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Hoodie İpli
                    </button>
                    <button onClick={() => addModel("hoodie-cepli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Hoodie Cepli
                    </button>
                    <button onClick={() => addModel("hoodie-ceplipli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Hoodie Cepli İpli
                    </button>
                    <button onClick={() => addModel("hoodie-oversize")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Oversize Hoodie
                    </button>
                    <button onClick={() => addModel("hoodie-oversize-ipli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Oversize Hoodie İpli
                    </button>
                    <button onClick={() => addModel("hoodie-oversize-cepli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Oversize Hoodie Cepli
                    </button>
                    <button onClick={() => addModel("hoodie-oversize-ceplipli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Oversize Hoodie Cepli İpli
                    </button>
                  </>
                )}
              </div>

              <p className="text-[10px] text-zinc-500 mt-3">Tıkladığın model öne gelir, diğerleri solda yan durur.</p>
            </div>
          </div>
        )}

        {/* THREE.js Canvas */}
        <Canvas
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: SCENE_BG_COLOR,
          }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: false,
            alpha: false,
            powerPreference: "default",
          }}
          onCreated={({ gl, scene, camera }) => {
            glRef.current = gl;
            sceneRef.current = scene;
            cameraRef.current = camera;
            const bgColor = new THREE.Color(SCENE_BG_COLOR);
            scene.background = bgColor;
            gl.setClearColor(bgColor, 1);
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
          camera={{ position: [0, 0, 2.55], fov: 36 }}
          shadows={!isMobile}
          dpr={isMobile ? 1 : [1, 1.5]}
        >
          <SceneBackgroundLock />

          <ambientLight intensity={1.4} />
          <hemisphereLight intensity={0.6} groundColor={"#1a1a1a"} />
          <directionalLight position={[6, 10, 8]} intensity={1.0} castShadow={!isMobile} shadow-mapSize-width={768} shadow-mapSize-height={768} />
          <directionalLight position={[-6, 6, -6]} intensity={0.45} />
          <pointLight position={[0, 2.6, 2.2]} intensity={0.45} />
          {!isMobile && <ContactShadows position={[0, -1.4, 0]} opacity={0.16} scale={7} blur={2.2} far={3.2} />}

          <CameraController view={effectiveView} count={designs.length} onAnimatingChange={setCamAnimating} />

          <Suspense fallback={<ThreeDotsLoader />}>
            {designs.map((design) => {
              const layout = layoutFor(design.id);
              return (
                <DesignModelItem
                  key={design.id}
                  design={design}
                  isActive={design.id === activeId}
                  isHovered={design.id === hoveredId}
                  onSelect={setActiveId}
                  onHover={setHoveredId}
                  onUnhover={() => setHoveredId(null)}
                  view={effectiveView}
                  targetX={layout.x}
                  targetZ={layout.z}
                  targetRotY={layout.rotY}
                  targetScale={layout.scale}
                  hidden={layout.hidden}
                  disableDrag={isMobile}
                  isMobile={isMobile}
                />
              );
            })}
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableZoom
            enablePan={false}
            enableRotate={false} // Döndürmeyi kapat
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.9}
            minDistance={1.5}
            maxDistance={10}
            zoomToCursor={true}
            enabled={!camAnimating}
          />
        </Canvas>

        {/* MOBILE CONTROLS */}
        {isMobile && (
          <div 
            className="absolute left-0 right-0 z-[80] px-4 pointer-events-none transition-all duration-300"
            style={{ bottom: drawerOpen ? '280px' : '62vh' }}
          >
            <div className="flex justify-center mb-3 pointer-events-auto">
              <div className="flex bg-zinc-900/90 backdrop-blur rounded-full p-1 border border-zinc-700 shadow-lg">
                {UI_VIEWS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      view === v ? "bg-white text-black shadow-md" : "text-zinc-400"
                    }`}
                  >
                    {v === "front" ? "ÖN" : "ARKA"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pointer-events-auto">
              <button
                onClick={() => {
                  setPickerStep("root");
                  setPickerOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-black shadow-xl active:scale-95 transition"
                title="Model Ekle"
              >
                <Plus size={20} />
              </button>

              <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700 rounded-full pl-4 pr-2 py-3 backdrop-blur shadow-lg">
                <div className="flex flex-col leading-tight">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">SEÇİLİ MODEL ({designs.length})</span>
                  <span className="text-[11px] text-white font-black uppercase tracking-widest">
                    {MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}
                  </span>
                </div>
                {designs.length > 1 && (
                  <button
                    onClick={() => removeModel(activeId)}
                    className="ml-2 w-8 h-8 rounded-full bg-zinc-800 active:scale-95 transition flex items-center justify-center text-zinc-300 hover:text-white"
                    title="Seçili modeli kaldır"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE DRAWER */}
        {isMobile && activeDesign && (
          <div
            className="absolute left-0 right-0 bottom-0 z-[85]"
            style={{
              transform: `translateY(${drawerY}px)`,
              transition: dragState.current.dragging ? "none" : "transform 220ms ease",
              maxHeight: "60vh",
              height: "60vh",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="w-full h-full rounded-t-3xl overflow-hidden border-t border-zinc-700 shadow-2xl bg-[#111111] flex flex-col">
              {!(activeTab === "editor") && (
                <div
                  className="w-full flex items-center justify-center py-3 border-b border-zinc-800 bg-[#0f0f0f] flex-shrink-0"
                  onPointerDown={onDrawerPointerDown}
                  style={{ touchAction: "none" }}
                >
                  <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
                  <button
                    onClick={() => setDrawerOpen((s) => !s)}
                    className="ml-3 text-zinc-300 hover:text-white"
                    aria-label="panel toggle"
                  >
                    {drawerOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>
              )}

              {renderPanel}
            </div>
          </div>
        )}
      </div>

      {!isMobile && activeDesign && renderPanel}
    </div>
  );
}

/* preload */
useGLTF.preload(toSafeUrl(MODEL_PATHS.tshirt));
useGLTF.preload(toSafeUrl(MODEL_PATHS.hoodie));
useGLTF.preload(toSafeUrl(MODEL_PATHS.sweatshirt));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-cepli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-ceplipli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["oversize-sweat"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["oversize-tshirt"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS.fermuarli));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-ipli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize-ipli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize-cepli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize-ceplipli"]));
