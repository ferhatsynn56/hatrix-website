"use client";

import Link from "next/link";
import React, {
  useState,
  Suspense,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  X,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  "sweat-yeni": "/models/yeni sweat 331231.glb",
  "sweat-deneme": "/models/Deneme 4.glb",
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
  polar: "/models/polar.glb",
};

const AVAILABLE_MODELS = [
  "tshirt",
  "sweatshirt",
  "sweat-yeni",
  "sweat-deneme",
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
  "polar",
];

const MODEL_LABELS = {
  tshirt: "Normal Tişört",
  sweatshirt: "Normal Sweat",
  "sweat-yeni": "Yeni Sweat",
  "sweat-deneme": "Deneme Sweat",
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
  polar: "Polar",
};

/* ================= PRINT BOUNDS ================= */
const MODEL_PRINT_BOUNDS = {
  tshirt: {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "oversize-tshirt": {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.265, yBot: -0.30, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  sweatshirt: {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.275, yBot: -0.24, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.245, z: -0.148, rotY: Math.PI },
  },
  "sweat-deneme": {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.275, yBot: -0.24, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.245, z: -0.148, rotY: Math.PI },
  },
  "oversize-sweat": {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.270, yBot: -0.255, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.26, z: -0.148, rotY: Math.PI },
  },
  hoodie: {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "hoodie-ipli": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "hoodie-oversize": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "hoodie-oversize-ipli": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "hoodie-oversize-cepli": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "hoodie-oversize-ceplipli": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },

  // İstisnalar (sonraki isteğinde özel değerler gelecek)
  polar: {
    front: { xMin: -0.15, xMax: 0.18, yTop: 0.28, yBot: -0.25, z: 0.139, rotY: 0 },
    back: { xMin: -0.15, xMax: 0.19, yTop: 0.31, yBot: -0.25, z: -0.14, rotY: Math.PI },
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
  "sweat-yeni": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "sweat-deneme": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  hoodie: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-cepli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-ceplipli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "oversize-tshirt": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "oversize-sweat": { front: { w: 58, h: 58 }, back: { w: 58, h: 58 } },
  fermuarli: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  polar: { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
};

/* ================= FİYAT SISTEMI ================= */
const BASE_PRICE = 750;
const EXTRA_SIDE_PRICE = 150;

/* ================= BRAND / UI ================= */
const SCENE_BG_COLOR = "#f3f3f3";
const PANEL_BG_COLOR = "#e8e8e8";
const PANEL_BORDER_COLOR = "#d0d0d0";
const DESKTOP_DRAWER_HEIGHT = 300;
const DESKTOP_DRAWER_PEEK = 56;
const LEFT_PRINT_AREA_WIDTH = 420;
const LEFT_PRINT_AREA_GAP = 0;
const BRAND_COLORS = ["#1A1A1A", "#F0F0F0", "#D2C6B6", "#3F432C", "#191C25", "#363636", "#1EF292", "#3E191D"];
const BRAND_DEFAULT_COLOR = BRAND_COLORS[0];
const FONT_OPTIONS = [
  { label: "Arial Black", value: "Arial Black, Arial, sans-serif" },
  { label: "Impact", value: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { label: "Trebuchet", value: "Trebuchet MS, Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times", value: "'Times New Roman', Times, serif" },
];

const splitLogoLayers = (logos) => {
  const back = [];
  const front = [];
  logos.forEach((l, idx) => {
    const z = l?.z ?? 0;
    (z < 0 ? back : front).push({ l, idx });
  });
  const sortFn = (a, b) => {
    const za = a.l?.z ?? 0;
    const zb = b.l?.z ?? 0;
    if (za !== zb) return za - zb;
    return a.idx - b.idx;
  };
  return {
    back: back.sort(sortFn).map((i) => i.l),
    front: front.sort(sortFn).map((i) => i.l),
  };
};

/* ================= HELPERS ================= */
const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clamp01 = (v) => clamp(v, 0, 1);
const pct = (v01) => `${Math.round(v01 * 100)}%`;

const createSideData = () => ({
  logos: [],
  activeLogoId: null,
  customText: { text: "", color: "#ffffff", size: 150, scaleX: 1, scaleY: 1, font: FONT_OPTIONS[0].value },
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

  const drawLogo = async (l) => {
    const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
    const rotation = (l.rotation || 0) * (Math.PI / 180);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = l.url;
      img.onload = () => {
        const bw = box.w * SIZE;
        const bh = box.h * SIZE;
        const cx = box.x * SIZE;
        const cy = box.y * SIZE;
        ctx.save();
        ctx.translate(cx, cy);
        if (rotation) ctx.rotate(rotation);
        ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
        ctx.restore();
        res();
      };
      img.onerror = () => res();
    });
  };

  // LOGOS (TEXT ALT/ÜST)
  const { back: logosBack, front: logosFront } = splitLogoLayers(logos);
  for (const l of logosBack) {
    // eslint-disable-next-line no-await-in-loop
    await drawLogo(l);
  }

  // TEXT
  if ((t.text || "").trim()) {
    const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420) * (SIZE / 1024);
    ctx.save();
    ctx.translate(textPos.x * SIZE, textPos.y * SIZE);
    ctx.scale(clamp(t.scaleX || 1, 0.3, 3), clamp(t.scaleY || 1, 0.3, 3));
    ctx.font = `900 ${fontSize}px ${t.font || FONT_OPTIONS[0].value}`;
    ctx.fillStyle = t.color || "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }

  for (const l of logosFront) {
    // eslint-disable-next-line no-await-in-loop
    await drawLogo(l);
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

/* ================= ADJUSTED LOGO EXPORT (PER LOGO) ================= */
async function makeAdjustedLogoDataUrls(sideData) {
  const logos = sideData?.logos || [];
  if (!logos.length) return [];

  const SIZE = 2048;
  const results = [];

  for (const l of logos) {
    const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
    const bw = Math.max(1, Math.round(box.w * SIZE));
    const bh = Math.max(1, Math.round(box.h * SIZE));
    const rotation = (l.rotation || 0) * (Math.PI / 180);

    const c = document.createElement("canvas");
    c.width = bw;
    c.height = bh;
    const ctx = c.getContext("2d");
    if (!ctx) {
      results.push(null);
      continue;
    }

    ctx.clearRect(0, 0, bw, bh);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // eslint-disable-next-line no-await-in-loop
    await new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = l.url;
      img.onload = () => {
        ctx.save();
        ctx.translate(bw / 2, bh / 2);
        if (rotation) ctx.rotate(rotation);
        ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
        ctx.restore();
        res();
      };
      img.onerror = () => res();
    });

    results.push(c.toDataURL("image/png"));
  }

  return results.filter(Boolean);
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
  const extra = Math.min(1.2, Math.max(0, (count - 1) * 0.3));

  const positions = useMemo(
    () => ({
      front: new THREE.Vector3(0, 0.24, 2.05 + extra),
      back: new THREE.Vector3(0, 0.24, -(2.05 + extra)),
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
      camera.lookAt(0, -0.08, 0);
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
function useDesignCanvas(sideData, opts = {}) {
  const [canvas, setCanvas] = useState(null);

  const logos = sideData?.logos || [];
  const logoSignature = logos
    .map(
      (l) =>
        `${l.id}_${l.box.x.toFixed(3)}_${l.box.y.toFixed(3)}_${l.box.w.toFixed(3)}_${l.box.h.toFixed(3)}_${l.rotation || 0}_${l.z || 0}`
    )
    .join("|");
  const customText = sideData?.customText;
  const textSignature = `${customText?.text}_${customText?.color}_${customText?.size}_${customText?.scaleX}_${customText?.scaleY}_${customText?.font}`;
  const posSignature = `${sideData?.textPos?.x}_${sideData?.textPos?.y}`;

  const CANVAS_SIZE = 2048;

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
        ctx.font = `900 ${fontSize}px ${t.font || FONT_OPTIONS[0].value}`;
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

      const drawLogo = async (l) => {
        const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
        const rotation = (l.rotation || 0) * (Math.PI / 180);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = l.url;
          img.onload = () => {
            const bw = box.w * CANVAS_SIZE;
            const bh = box.h * CANVAS_SIZE;
            const cx = box.x * CANVAS_SIZE;
            const cy = box.y * CANVAS_SIZE;
            ctx.save();
            ctx.translate(cx, cy);
            if (rotation) ctx.rotate(rotation);
            ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
            ctx.restore();
            res();
          };
          img.onerror = () => res();
        });
      };

      const drawAll = async () => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const { back: logosBack, front: logosFront } = splitLogoLayers(logos);
        for (const l of logosBack) {
          // eslint-disable-next-line no-await-in-loop
          await drawLogo(l);
        }

        drawText();

        for (const l of logosFront) {
          // eslint-disable-next-line no-await-in-loop
          await drawLogo(l);
        }
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
  tex.flipY = true; // Canvas Y ekseni ile model UV yönünü eşleştir
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

  const bodyMaterial = useMemo(() => {
    const base = new THREE.Color(color || BRAND_DEFAULT_COLOR);
    const lum = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
    const boost = clamp((0.35 - lum) / 0.35, 0, 1);

    return new THREE.MeshStandardMaterial({
      color: base,
      roughness: 0.9 - 0.18 * boost,
      metalness: 0.03 + 0.08 * boost,
      emissive: base,
      emissiveIntensity: 0.12 * boost,
      side: THREE.FrontSide,
    });
  }, [color]);

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
    setBackTex(t);
    return () => {
      if (t) t.dispose();
    };
  }, [backCanvas, isMobile]);

  const decalHost = useMemo(() => pickDecalHostMesh(root, modelType), [root, modelType]);
  const decalHostRef = useMemo(() => ({ current: decalHost }), [decalHost]);

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
    <group dispose={null} position={[0, -0.08, 0]}>
      <Center>
        <primitive object={root} />

        {decalHost && (
          <>
            {showFront && frontTex && (
              <Decal
                mesh={decalHostRef}
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
                mesh={decalHostRef}
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
          </>
        )}
      </Center>
    </group>
  );
}

/* ================= RESIZE FRAME ================= */
function ResizeFrame({ box, onChange, containerRef, onDragStateChange }) {
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
    onDragStateChange?.(true);

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
    onDragStateChange?.(false);
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
  const clampRotX = (v) => Math.max(-0.75, Math.min(0.75, v));
  const clampRotY = (v) => Math.max(-0.85, Math.min(0.85, v));

  useEffect(() => {
    userRotRef.current = { x: 0, y: 0 };
  }, [view]);

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

  const frontCanvas = useDesignCanvas(design.sides.front || EMPTY_SIDE, isZipper ? { clearCenterStripe01: gap01 } : {});
  const backCanvas = useDesignCanvas(design.sides.back || EMPTY_SIDE, {});

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

        const invertY = view === "back" ? -1 : 1;
        const invertX = view === "back" ? -1 : 1;
        const nextY =
          dragRef.current.startRotY + (e.clientX - dragRef.current.startX) * ROT_SPEED * invertY;
        const nextX =
          dragRef.current.startRotX + (e.clientY - dragRef.current.startY) * ROT_SPEED * invertX;
        userRotRef.current.y = clampRotY(nextY);
        userRotRef.current.x = clampRotX(nextX);
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
  layout = "standard",
  onRequestDrawerCollapse,
  onRequestShowEditorOverlay,
  forceShowEditorOverlay = false,
  suppressEditorInPanel = false,
  designs = [],
  activeId = null,
  onSelectModel,
  onRemoveModel,
  onOpenModelPicker,
}) {
  const isZipperFront = design.modelType === "fermuarli" && view === "front";
  const gap01 = MODEL_PRINT_BOUNDS?.fermuarli?.front?.zipGap01 ?? 0.08;
  const isDrawerLayout = layout === "drawer";

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

  const checkoutCard = (
    <div className="shrink-0 w-[220px] rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
        <span>Toplam</span>
        <span className="text-gray-900 font-black">{totalPrice} ₺</span>
      </div>
      <button
        onClick={onAddToCartAll}
        disabled={loading}
        className={`mt-2 w-full bg-black text-white py-2 rounded-full font-black uppercase tracking-[0.12em] text-[10px] hover:bg-zinc-800 transition ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "HAZIRLANIYOR..." : "SEPETE EKLE"}
      </button>
    </div>
  );

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

        <div className="flex-1 flex flex-col items-start justify-center p-4 bg-zinc-900/30">
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

            {(() => {
              const { back, front } = splitLogoLayers(logos || []);
              const renderLogo = (l) => {
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
                    <img
                      src={l.url}
                      alt=""
                      className="w-full h-full object-fill pointer-events-none"
                      style={{ transform: `rotate(${l.rotation || 0}deg)` }}
                    />
                  </div>
                );
              };
              const textEl = customText?.text ? (
                <div
                  className="absolute"
                  style={{
                    left: `${(sideData?.textPos?.x ?? 0.5) * 100}%`,
                    top: `${(sideData?.textPos?.y ?? 0.85) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
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
                    style={{ color: sideData.customText.color, fontFamily: sideData.customText.font || FONT_OPTIONS[0].value }}
                  >
                    {sideData.customText.text}
                  </span>
                </div>
              ) : null;

              return (
                <>
                  {back.map(renderLogo)}
                  {textEl}
                  {front.map(renderLogo)}
                </>
              );
            })()}

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

          </div>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-[#111111]">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase mb-2">
            <span>Toplam</span>
            <span className="text-white font-black">{totalPrice} ₺</span>
          </div>

          <button
            onClick={onAddToCartAll}
            disabled={loading}
            className={`w-full bg-white text-black py-3 rounded-full font-black uppercase tracking-[0.18em] transition flex items-center justify-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShoppingBag size={18} />}
            {loading ? "HAZIRLANIYOR..." : "SEPETE EKLE"}
          </button>
        </div>
      </div>
    );
  }

  const shellClass = isDrawerLayout
    ? "bg-white border-t border-gray-200"
    : "bg-[#111111] shadow-2xl border-t md:border-t-0 md:border-l border-zinc-800";
  const contentBackground = isDrawerLayout ? "#f3f5f8" : PANEL_BG_COLOR;

  return (
    <div
      className={`w-full ${isMobile ? "h-full flex flex-col" : isDrawerLayout ? "h-full" : "md:w-[420px]"} ${shellClass} z-20`}
      style={isMobile || isDrawerLayout ? { touchAction: "pan-y" } : {}}
    >
      {!isDrawerLayout && (
        <>
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
              { id: "upload", icon: ImageIcon, label: "Baskı" },
              { id: "text", icon: Type, label: "Yazı" },
              { id: "color", icon: Palette, label: "Renk" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "upload") onRequestDrawerCollapse?.();
                }}
                className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${
                  activeTab === tab.id ? "text-white border-b-2 border-white" : "text-zinc-500"
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Content */}
      <div
        className={`flex-1 ${isDrawerLayout ? "p-2.5 flex items-start gap-2.5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" : "p-4 overflow-y-auto"}`}
        style={{ touchAction: "pan-y", minHeight: 0, backgroundColor: contentBackground }}
      >
        {isDrawerLayout && (
          <div className="shrink-0 w-[320px] rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Model Yönetimi</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab("editor");
                    onRequestDrawerCollapse?.();
                    onRequestShowEditorOverlay?.();
                  }}
                  className="px-2.5 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-black uppercase tracking-wide"
                >
                  Yerleşim
                </button>
                <button
                  onClick={onOpenModelPicker}
                  className="px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-wide"
                >
                  + Model
                </button>
              </div>
            </div>

            <div className="mt-2 flex gap-1.5 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {(designs || []).map((item) => {
                const selected = item.id === activeId;
                return (
                  <div
                    key={item.id}
                    className={`shrink-0 flex items-center justify-between gap-2 rounded-lg border px-2 py-1 ${
                      selected ? "border-black bg-gray-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <button
                      onClick={() => onSelectModel?.(item.id)}
                      className="text-left"
                    >
                      <p className={`text-[10px] font-black uppercase tracking-wide ${selected ? "text-black" : "text-gray-700"}`}>
                        {MODEL_LABELS[item.modelType] || item.modelType}
                      </p>
                    </button>

                    {(designs || []).length > 1 && (
                      <button
                        onClick={() => onRemoveModel?.(item.id)}
                        className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                        title="Modeli kaldır"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {activeTab === "upload" && (
          <div className={`${isDrawerLayout ? "shrink-0 flex items-start gap-2" : "space-y-2.5"}`}>
            <div className={`rounded-xl border border-gray-200 bg-white p-2 ${isDrawerLayout ? "shrink-0 w-[230px]" : ""}`}>
              <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Çalışma Alanı</p>
              <p className="text-xs text-gray-900 mt-1">
                {sideLabel} {isZipperFront ? " • Fermuar boşluğu aktif" : ""}
              </p>
            </div>

            <div className={`rounded-xl border border-gray-200 bg-white p-2 space-y-1.5 ${isDrawerLayout ? "shrink-0 w-[230px]" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Dosya</p>
                <p className="text-[10px] text-gray-500">{(sideData?.logos || []).length}/3 katman</p>
              </div>

              <label
                className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition"
                onClick={() => {
                  onRequestDrawerCollapse?.();
                  onRequestShowEditorOverlay?.();
                }}
              >
                <Upload className="w-4 h-4 mb-1 text-gray-400" />
                <p className="text-[10px] text-gray-700 font-semibold">Baskı Görseli Ekle</p>
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
                        rotation: 0,
                        z: 0,
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
            </div>

            {(sideData?.logos || []).length > 0 && (
              <div className={`rounded-xl border border-gray-200 bg-white p-2 space-y-1.5 ${isDrawerLayout ? "shrink-0 w-[230px]" : ""}`}>
                <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Katmanlar</p>
                <div className="flex flex-wrap gap-1.5">
                  {(sideData.logos || []).map((l, idx) => {
                    const selected = (sideData.activeLogoId || sideData.logos?.[0]?.id) === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => updateSide({ activeLogoId: l.id })}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          selected ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        Katman {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => setActiveTab("editor")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2"
                  >
                    <Move size={14} /> Konum / Boyut
                  </button>

                  <button
                    onClick={() => {
                      const currentId = sideData.activeLogoId || sideData.logos?.[0]?.id;
                      const next = (sideData.logos || []).filter((l) => l.id !== currentId);
                      updateSide({ logos: next, activeLogoId: next[0]?.id || null });
                    }}
                    className="w-full py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100"
                  >
                    <Trash2 size={14} /> Seçili Katmanı Sil
                  </button>

                  <button
                    onClick={() => updateSide({ logos: [], activeLogoId: null })}
                    className="w-full py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100"
                  >
                    <Trash2 size={14} /> Tüm Katmanları Temizle
                  </button>
                </div>
              </div>
            )}
            {isDrawerLayout && checkoutCard}
          </div>
        )}

        {/* EDITOR (KONUM/BOYUT) - Panel içinde değil, ayrı overlay */}
        {false && (activeTab === "editor" || forceShowEditorOverlay) && (() => {
          const editorInner = (
            <>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">
                Konum / Boyut — <span className="text-white">{sideLabel}</span>
              </p>

              <div
                ref={previewRef}
                className={`w-full max-w-[520px] mr-auto bg-zinc-900 rounded-xl border border-zinc-600 relative overflow-hidden shadow-2xl touch-none ${
                  isMobile ? "aspect-[4/5] h-64" : "aspect-square"
                }`}
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
            </>
          );

          if (isDrawerLayout && !isMobile) {
            return (
              <>
                <div className="space-y-3">{editorInner}</div>
              </>
            );
          }

          return <div className="space-y-3">{editorInner}</div>;
        })()}


        {/* TEXT */}
        {activeTab === "text" && (
          <div className={`${isDrawerLayout ? "shrink-0 flex items-start gap-2" : "space-y-2.5"}`}>
            <div className={`rounded-xl border border-gray-200 bg-white p-1.5 space-y-1 shadow-sm ${isDrawerLayout ? "shrink-0 w-[220px]" : ""}`}>
              <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Metin İçeriği</p>
              <input
                type="text"
                value={t.text || ""}
                onChange={(e) => bumpText({ text: e.target.value })}
                placeholder="Metni yaz..."
                className="w-full bg-white border border-gray-300 p-1.5 rounded-lg text-[11px] text-gray-900 focus:border-black outline-none"
              />
            </div>

            <div className={`rounded-xl border border-gray-200 bg-white p-1.5 space-y-1 shadow-sm ${isDrawerLayout ? "shrink-0 w-[220px]" : ""}`}>
              <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Tipografi</p>
              <div>
                <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Font</label>
                <select
                  value={t.font || FONT_OPTIONS[0].value}
                  onChange={(e) => bumpText({ font: e.target.value })}
                  className="w-full bg-white border border-gray-300 p-1 rounded-lg text-[10px] text-gray-900 focus:border-black outline-none"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Renk</label>
                <div className="flex gap-1 flex-wrap">
                  {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff"].map((c) => (
                    <button
                      key={c}
                      onClick={() => bumpText({ color: c })}
                      className={`w-5 h-5 rounded-full border-2 ${t.color === c ? "border-black scale-110" : "border-gray-300"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Boyut</p>
                  <p className="text-gray-900 text-[10px] font-mono">{t.size || 150}px</p>
                </div>
                <input
                  type="range"
                  min="30"
                  max="420"
                  step="2"
                  value={t.size || 150}
                  onChange={(e) => bumpText({ size: Number(e.target.value) })}
                  className="w-full accent-black h-1.5"
                />
              </div>
            </div>

            <div className={`rounded-xl border border-gray-200 bg-white p-1.5 space-y-1 shadow-sm ${isDrawerLayout ? "shrink-0 w-[220px]" : ""}`}>
              <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Dönüşüm</p>
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-gray-600 font-bold uppercase">Yatay Ölçek</p>
                <p className="text-[10px] text-gray-900 font-mono">x{(t.scaleX || 1).toFixed(2)}</p>
              </div>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.05"
                value={t.scaleX || 1}
                onChange={(e) => bumpText({ scaleX: Number(e.target.value) })}
                className="w-full accent-black h-1.5"
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-[9px] text-gray-600 font-bold uppercase">Dikey Ölçek</p>
                <p className="text-[10px] text-gray-900 font-mono">y{(t.scaleY || 1).toFixed(2)}</p>
              </div>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.05"
                value={t.scaleY || 1}
                onChange={(e) => bumpText({ scaleY: Number(e.target.value) })}
                className="w-full accent-black h-1.5"
              />

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => bumpText({ scaleX: 1, scaleY: 1 })}
                  className="flex-1 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-[10px] font-black uppercase"
                >
                  Ölçeği Sıfırla
                </button>
                <button
                  onClick={() => updateSide({ textPos: { x: 0.5, y: 0.85 } })}
                  className="flex-1 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-[10px] font-black uppercase"
                >
                  Konumu Ortala
                </button>
              </div>
            </div>

            {t.text && (
              <button
                onClick={() => bumpText({ text: "", color: "#ffffff", size: 150, scaleX: 1, scaleY: 1 })}
                className={`${isDrawerLayout ? "shrink-0 w-[220px]" : "w-full"} py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100`}
              >
                <Trash2 size={14} /> Yazıyı Sil
              </button>
            )}
            {isDrawerLayout && checkoutCard}
          </div>
        )}

        {/* COLOR */}
        {activeTab === "color" && (
          <div className={`${isDrawerLayout ? "shrink-0 flex items-start gap-2.5" : "space-y-2.5"}`}>
            <div className={`rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm ${isDrawerLayout ? "shrink-0 w-[260px]" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Ürün Rengi</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Seçili</span>
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: design.color }}
                    title={design.color}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateDesign({ color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${
                      design.color === c ? "border-black scale-110" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {design.modelType.includes("hoodie") && (
              <div className={`rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm ${isDrawerLayout ? "shrink-0 w-[260px]" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black tracking-wider text-gray-500 uppercase">İp Rengi</p>
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: design.stringColor || "#e6e6e6" }}
                    title={design.stringColor || "#e6e6e6"}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {stringPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateDesign({ stringColor: c })}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        (design.stringColor || "#e6e6e6") === c ? "border-black scale-110" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
            {isDrawerLayout && checkoutCard}
          </div>
        )}

        {/* Desktop editor preview is intentionally omitted here because you already have focus-mode for mobile;
            If you want desktop editor preview back, tell me, eklerim. */}
      </div>

      {!isDrawerLayout && (
        <div
          className={`p-3 flex-shrink-0 ${isMobile ? "pb-[calc(env(safe-area-inset-bottom)+12px)]" : ""} border-t border-zinc-800 bg-[#111111]`}
        >
          <div className="mb-2 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Ana Fiyat</span>
              <span className="text-xs font-mono text-zinc-300">{BASE_PRICE} ₺</span>
            </div>

            {activeSides.length > 1 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500">Ek Taraf ({activeSides.length - 1}×)</span>
                <span className="text-xs font-mono text-zinc-300">+{(activeSides.length - 1) * EXTRA_SIDE_PRICE} ₺</span>
              </div>
            )}

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-bold uppercase text-white">Toplam</span>
              <span className="text-sm font-black font-mono text-white">{totalPrice} ₺</span>
            </div>
          </div>

          <button
            onClick={onAddToCartAll}
            disabled={loading}
            className={`w-full bg-black text-white py-3 rounded-full font-black uppercase tracking-[0.15em] hover:bg-zinc-800 transition flex items-center justify-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20} />}
            {loading ? "HAZIRLANIYOR..." : "SEPETE EKLE"}
          </button>
        </div>
      )}
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
  const router = useRouter();

  // ✅ activeTab artık burada (hata bitti)
  const [activeTab, setActiveTab] = useState("upload");
  const [forceEditorOverlay, setForceEditorOverlay] = useState(false);

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
  const [lockAspect, setLockAspect] = useState(true);
  const [cmInputW, setCmInputW] = useState("");
  const [cmInputH, setCmInputH] = useState("");

  const glRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [captureView, setCaptureView] = useState(null);
  const [captureId, setCaptureId] = useState(null);
  const [camAnimating, setCamAnimating] = useState(false);
  const previewRef = useRef(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);

  // Editor overlay için gerekli değişkenler
  const currentActiveDesign = designs.find(d => d.id === activeId);
  const currentSide = view;
  const sideLabel = currentSide === "front" ? "ÖN" : "ARKA";
  const sideData = currentActiveDesign?.sides?.[currentSide] || {};
  const printCm = CM_LABELS[currentActiveDesign?.modelType]?.[currentSide] || { w: 0, h: 0 };
  const logos = sideData?.logos || [];
  const customText = sideData?.customText || {};
  const activeLogo = logos.find(l => l.id === (sideData?.activeLogoId || logos[0]?.id));
  const isPrintAreaOpen = !isMobile && activeTab === "editor";
  const activeLogoBox = activeLogo?.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
  const snapThreshold = 0.02;
  const guideStops = [0.25, 0.5, 0.75];
  const activeVGuides = isLogoDragging
    ? guideStops.filter((p) => Math.abs((activeLogoBox?.x ?? 0.5) - p) <= snapThreshold)
    : [];
  const activeHGuides = isLogoDragging
    ? guideStops.filter((p) => Math.abs((activeLogoBox?.y ?? 0.5) - p) <= snapThreshold)
    : [];
  const isZipperFront = currentActiveDesign?.modelType === "fermuarli" && currentSide === "front";
  const gap01 = MODEL_PRINT_BOUNDS[currentActiveDesign?.modelType]?.front?.zipGap01 || 0;

  // Editor overlay için updateSide fonksiyonu
  const updateSide = (patch) => {
    setDesigns(prev => prev.map(d => 
      d.id === activeId ? {
        ...d,
        sides: {
          ...d.sides,
          [currentSide]: { ...d.sides[currentSide], ...patch }
        }
      } : d
    ));
  };

  const sanitizeLogoBox = (nextBox) => {
    const minW = 0.12;
    const minH = 0.12;
    const rawW = clamp(nextBox.w ?? activeLogoBox.w, minW, 1);
    const rawH = clamp(nextBox.h ?? activeLogoBox.h, minH, 1);
    const x = clamp(nextBox.x ?? activeLogoBox.x, rawW / 2, 1 - rawW / 2);
    const y = clamp(nextBox.y ?? activeLogoBox.y, rawH / 2, 1 - rawH / 2);
    const snappedX = Math.abs(x - 0.5) <= snapThreshold ? 0.5 : x;
    const snappedY = Math.abs(y - 0.5) <= snapThreshold ? 0.5 : y;
    return { x: snappedX, y: snappedY, w: rawW, h: rawH };
  };

  const updateActiveLogoBox = (nextBox) => {
    if (!activeLogo) return;
    const safe = sanitizeLogoBox(nextBox);
    const nextLogos = (logos || []).map((l) => (l.id === activeLogo.id ? { ...l, box: safe } : l));
    updateSide({ logos: nextLogos });
  };

  const updateActiveLogo = (patch) => {
    if (!activeLogo) return;
    const nextLogos = (logos || []).map((l) => (l.id === activeLogo.id ? { ...l, ...patch } : l));
    updateSide({ logos: nextLogos });
  };

  const setActiveLogoLayer = (layer) => {
    if (!activeLogo) return;
    const z = layer === "front" ? 1 : layer === "back" ? -1 : 0;
    updateActiveLogo({ z });
  };

  const toNumber = (raw) => {
    if (raw === "" || raw == null) return NaN;
    const norm = String(raw).replace(",", ".");
    return parseFloat(norm);
  };

  useEffect(() => {
    if (!activeLogo || !printCm.w || !printCm.h) {
      setCmInputW("");
      setCmInputH("");
      return;
    }
    setCmInputW((activeLogoBox.w * printCm.w).toFixed(1));
    setCmInputH((activeLogoBox.h * printCm.h).toFixed(1));
  }, [activeLogo?.id, activeLogoBox.w, activeLogoBox.h, printCm.w, printCm.h, activeId, currentSide]);

  const modelCount = designs.length;
  const perf = useMemo(() => {
    const heavy = modelCount > 2;
    return {
      dpr: isMobile ? 2 : heavy ? 1.3 : 1.6,
      antialias: isMobile ? true : !heavy,
      shadowMap: heavy ? 512 : 768,
      powerPreference: "high-performance",
    };
  }, [isMobile, modelCount]);

  // Mobile drawer
  const DRAWER_PEEK = 76;
  const CONTROLS_GAP = 56;
  const MAX_OPEN = 0;
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerY, setDrawerY] = useState(0);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [drawerMaxClosed, setDrawerMaxClosed] = useState(500);
  const dragState = useRef({ dragging: false, startY: 0, startDrawerY: 0 });

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
  const DRAWER_TABS = ["upload", "text", "color"];
  const tabIndex = DRAWER_TABS.indexOf(activeTab);
  const tabLabelMap = {
    upload: "Baskı",
    text: "Yazı",
    editor: "Yerleşim",
    color: "Renk",
  };
  const goPrevTab = () => {
    if (tabIndex < 0) {
      setActiveTab("upload");
      return;
    }
    setActiveTab(DRAWER_TABS[(tabIndex - 1 + DRAWER_TABS.length) % DRAWER_TABS.length]);
  };
  const goNextTab = () => {
    if (tabIndex < 0) {
      setActiveTab("upload");
      return;
    }
    setActiveTab(DRAWER_TABS[(tabIndex + 1) % DRAWER_TABS.length]);
  };

  useEffect(() => {
    if (activeTab !== "upload") setForceEditorOverlay(false);
  }, [activeTab]);

  useEffect(() => {
    setIsLogoDragging(false);
  }, [activeTab, currentSide, activeId]);

  // Desktop'ta baskı alanı açıldığında drawer otomatik aşağı (kapalı) konuma geçer.
  useEffect(() => {
    if (!isMobile && isPrintAreaOpen) setDrawerOpen(false);
  }, [isMobile, isPrintAreaOpen]);

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

    if (designId === activeId) {
      return { hidden: false, x: 0, z: 0, rotY: 0, scale: 1.03 };
    }

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
        const adjustedUploads = {};
        for (const [sideKey, sideData] of activeSides) {
          if (d.modelType === "fermuarli" && sideKey === "front") {
            const g = MODEL_PRINT_BOUNDS.fermuarli.front.zipGap01 ?? 0.08;
            // eslint-disable-next-line no-await-in-loop
            printFiles[sideKey] = await makePrintDataUrl(sideData, { clearCenterStripe01: g });
          } else {
            // eslint-disable-next-line no-await-in-loop
            printFiles[sideKey] = await makePrintDataUrl(sideData);
          }
          // eslint-disable-next-line no-await-in-loop
          adjustedUploads[sideKey] = await makeAdjustedLogoDataUrls(sideData);
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
            adjustedUploads,
            sides: d.sides,
          },
        });
      }

      router.push("/");
    } catch (err) {
      console.error("Sepete ekle hata:", err);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
      setCaptureId(null);
      setCaptureView(null);
    }
  };

  // drawer sizing (iPhone-safe)
  useEffect(() => {
    if (!isMobile) return;
    const calc = () => {
      const h = Math.min(window.innerHeight * 0.72, 560);
      const maxClosed = Math.max(0, h - DRAWER_PEEK);
      setDrawerHeight(h);
      setDrawerMaxClosed(maxClosed);
      setDrawerY((y) => clamp(y, MAX_OPEN, maxClosed));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [isMobile]);

  // drawer behavior
  useEffect(() => {
    if (!isMobile) return;
    setDrawerY(drawerOpen ? MAX_OPEN : drawerMaxClosed);
  }, [drawerOpen, isMobile, drawerMaxClosed]);

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
    const next = clamp(dragState.current.startDrawerY + dy, MAX_OPEN, drawerMaxClosed);
    setDrawerY(next);
  };

  const onDrawerPointerUp = () => {
    dragState.current.dragging = false;
    window.removeEventListener("pointermove", onDrawerPointerMove);
    window.removeEventListener("pointerup", onDrawerPointerUp);
    const mid = (drawerMaxClosed - MAX_OPEN) * 0.55;
    setDrawerOpen(drawerY < mid);
  };

  const toggleDrawer = () => {
    if (isMobile) setDrawerOpen((s) => !s);
    else setDrawerOpen((s) => !s);
  };

  const effectiveView = captureView || view;
  const drawerHeightStyle = isMobile
    ? drawerHeight
      ? `${drawerHeight}px`
      : "72vh"
    : `${DESKTOP_DRAWER_HEIGHT}px`;
  const drawerTopGap = isMobile && drawerHeight ? Math.max(0, drawerHeight - drawerY) : 0;
  const controlsBottom = isMobile
    ? drawerHeight
      ? `calc(${drawerTopGap}px + ${CONTROLS_GAP}px + env(safe-area-inset-bottom))`
      : `calc(72vh + ${CONTROLS_GAP}px + env(safe-area-inset-bottom))`
    : `calc(${drawerOpen ? DESKTOP_DRAWER_HEIGHT : DESKTOP_DRAWER_PEEK}px + ${CONTROLS_GAP}px)`;

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
      layout="drawer"
      onRequestDrawerCollapse={() => setDrawerOpen(false)}
      onRequestShowEditorOverlay={() => setForceEditorOverlay(true)}
      forceShowEditorOverlay={forceEditorOverlay}
      suppressEditorInPanel={!isMobile && forceEditorOverlay}
      designs={designs}
      activeId={activeId}
      onSelectModel={setActiveId}
      onRemoveModel={removeModel}
      onOpenModelPicker={() => {
        setPickerStep("root");
        setPickerOpen(true);
      }}
    />
  );

  return (
    <div className="fixed inset-0 h-screen w-full text-white overflow-hidden font-sans" style={{ background: SCENE_BG_COLOR, overscrollBehavior: "none", touchAction: "none" }}>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-[90] px-4 pt-4 pb-3 flex items-start justify-between pointer-events-none">
        <div className="flex items-start gap-3 pointer-events-auto">
          <Link href="/" className="px-2 py-2 rounded-full border border-zinc-300 bg-white/80 backdrop-blur-md hover:bg-white transition text-xs text-black">
            ←
          </Link>
          <div>
            <p className="text-sm font-bold text-black">{MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}</p>
            <p className="text-xs text-zinc-600">{getPrice(activeDesign || createDesign("tshirt"))} ₺</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleAddToCartAll}
            disabled={loading}
            className={`px-4 py-2 rounded-full border border-zinc-300 bg-white text-black text-xs font-black uppercase tracking-widest shadow-lg ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-zinc-100"
            }`}
          >
            {loading ? "HAZIRLANIYOR..." : "BİTTİ"}
          </button>
        </div>
      </div>

      <div className="w-full h-full relative" style={{ background: SCENE_BG_COLOR }}>
        {/* Floating Controls */}
        {activeTab !== "editor" && (
          <div
            className="absolute right-4 z-[90] pointer-events-none transition-all duration-300"
            style={{ bottom: controlsBottom }}
          >
            <div className="flex justify-center pointer-events-auto">
              <div className="flex flex-col bg-zinc-900/90 backdrop-blur rounded-full p-1 border border-zinc-700 shadow-lg">
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
          </div>
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
                    <button onClick={() => addModel("sweat-yeni")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Yeni Sweat
                    </button>
                    <button onClick={() => addModel("sweat-deneme")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Deneme Sweat
                    </button>
                    <button onClick={() => setPickerStep("hoodie")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Hoodie
                    </button>
                    <button onClick={() => addModel("fermuarli")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Fermuarlı
                    </button>
                    <button onClick={() => addModel("polar")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Polar
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
                    <button onClick={() => addModel("sweat-yeni")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Yeni Sweat
                    </button>
                    <button onClick={() => addModel("sweat-deneme")} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                      Deneme Sweat
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

        {/* Editor Overlay - Sol Taraf */}
        {isPrintAreaOpen && (
          <div
            className="absolute z-[90] backdrop-blur-md rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: "#f7f8fa",
              left: `${LEFT_PRINT_AREA_GAP}px`,
              width: `${LEFT_PRINT_AREA_WIDTH}px`,
              top: "72px",
              bottom: `${(drawerOpen ? DESKTOP_DRAWER_HEIGHT : DESKTOP_DRAWER_PEEK) + 12}px`,
            }}
          >
            <div className="p-4 border-b border-gray-200 bg-white/85">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Yerleşim Ayarı</h3>
              <p className="text-[10px] text-gray-500 mt-1">{sideLabel}</p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div
                ref={previewRef}
                className="w-full h-[56vh] rounded-xl border border-gray-300 relative overflow-hidden shadow-xl touch-none"
                style={{ touchAction: "none", backgroundColor: "#eef1f5" }}
              >
                {/* hafif grid */}
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(#7b8794 1px, transparent 1px)",
                    backgroundSize: "10px 10px",
                  }}
                />
                {/* model sınırlarını okumayı kolaylaştıran yumuşak katman */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 100%)" }}
                />

                {activeVGuides.map((p) => (
                  <div
                    key={`vg-${p}`}
                    className={`absolute top-0 bottom-0 w-px pointer-events-none ${p === 0.5 ? "bg-cyan-300/90" : "bg-cyan-200/70"}`}
                    style={{ left: `${p * 100}%` }}
                  />
                ))}
                {activeHGuides.map((p) => (
                  <div
                    key={`hg-${p}`}
                    className={`absolute left-0 right-0 h-px pointer-events-none ${p === 0.5 ? "bg-cyan-300/90" : "bg-cyan-200/70"}`}
                    style={{ top: `${p * 100}%` }}
                  />
                ))}

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
                  const isSelected = l.id === (sideData?.activeLogoId || sideData?.logos?.[0]?.id);
                  const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
                  const pct = (v) => `${v * 100}%`;
                  return (
                    <div
                      key={l.id}
                      className={`absolute border-2 transition-all ${
                        isSelected ? "border-white" : "border-transparent"
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
                        style={{ transform: `rotate(${l.rotation || 0}deg)` }}
                      />
                    </div>
                  );
                })}

                {/* seçili logo resize/drag çerçevesi */}
                {activeLogo && (
                  <ResizeFrame
                    box={activeLogo.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 }}
                    containerRef={previewRef}
                    onChange={updateActiveLogoBox}
                    onDragStateChange={setIsLogoDragging}
                  />
                )}

              </div>

              {activeLogo && (
                <div className="mt-3 p-3 rounded-xl border border-zinc-700 bg-zinc-800/60 space-y-3">
                  <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Görsel Ayarları</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Ölçü (cm)</p>
                      <button
                        onClick={() => setLockAspect((v) => !v)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          lockAspect ? "bg-white text-black" : "bg-zinc-700 text-zinc-200"
                        }`}
                      >
                        {lockAspect ? "Kilit Açık" : "Kilit Kapalı"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400">En</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          min="0"
                          step="0.1"
                          value={cmInputW}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setCmInputW(raw);
                            const nextCm = toNumber(raw);
                            if (!Number.isFinite(nextCm) || !printCm.w) return;
                            const ratio = activeLogoBox.h / activeLogoBox.w;
                            const nextW = clamp(nextCm / printCm.w, 0.12, 0.95);
                            const nextH = lockAspect ? clamp(nextW * ratio, 0.12, 0.95) : activeLogoBox.h;
                            updateActiveLogoBox({ ...activeLogoBox, w: nextW, h: nextH });
                          }}
                          className="w-full rounded-md border border-zinc-600 bg-zinc-900/60 px-2 py-1 text-[11px] text-white"
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onBlur={() => {
                            if (!activeLogo || !printCm.w) return;
                            const nextCm = toNumber(cmInputW);
                            if (!Number.isFinite(nextCm)) {
                              setCmInputW((activeLogoBox.w * printCm.w).toFixed(1));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400">Boy</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          min="0"
                          step="0.1"
                          value={cmInputH}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setCmInputH(raw);
                            const nextCm = toNumber(raw);
                            if (!Number.isFinite(nextCm) || !printCm.h) return;
                            const ratio = activeLogoBox.h / activeLogoBox.w;
                            const nextH = clamp(nextCm / printCm.h, 0.12, 0.95);
                            const nextW = lockAspect ? clamp(nextH / ratio, 0.12, 0.95) : activeLogoBox.w;
                            updateActiveLogoBox({ ...activeLogoBox, w: nextW, h: nextH });
                          }}
                          className="w-full rounded-md border border-zinc-600 bg-zinc-900/60 px-2 py-1 text-[11px] text-white"
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.currentTarget.select()}
                          onBlur={() => {
                            if (!activeLogo || !printCm.h) return;
                            const nextCm = toNumber(cmInputH);
                            if (!Number.isFinite(nextCm)) {
                              setCmInputH((activeLogoBox.h * printCm.h).toFixed(1));
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>X Konum</span>
                      <span>{Math.round(activeLogoBox.x * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={activeLogoBox.w / 2}
                      max={1 - activeLogoBox.w / 2}
                      step="0.005"
                      value={activeLogoBox.x}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, x: Number(e.target.value) })}
                      className="w-full accent-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Y Konum</span>
                      <span>{Math.round(activeLogoBox.y * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={activeLogoBox.h / 2}
                      max={1 - activeLogoBox.h / 2}
                      step="0.005"
                      value={activeLogoBox.y}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, y: Number(e.target.value) })}
                      className="w-full accent-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Genişlik</span>
                      <span>{Math.round(activeLogoBox.w * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.12"
                      max="0.95"
                      step="0.005"
                      value={activeLogoBox.w}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, w: Number(e.target.value) })}
                      className="w-full accent-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Yükseklik</span>
                      <span>{Math.round(activeLogoBox.h * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.12"
                      max="0.95"
                      step="0.005"
                      value={activeLogoBox.h}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, h: Number(e.target.value) })}
                      className="w-full accent-cyan-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Döndürme</span>
                      <span>{Math.round(activeLogo?.rotation || 0)}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={activeLogo?.rotation || 0}
                      onChange={(e) => updateActiveLogo({ rotation: Number(e.target.value) })}
                      className="w-full accent-cyan-300"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveLogoLayer("front")}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-[10px] font-bold uppercase"
                    >
                      Öne Al
                    </button>
                    <button
                      onClick={() => setActiveLogoLayer("back")}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-[10px] font-bold uppercase"
                    >
                      Arkaya Al
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateActiveLogoBox({ ...activeLogoBox, x: 0.5, y: 0.5 })}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-[10px] font-bold uppercase"
                    >
                      Ortala
                    </button>
                    <button
                      onClick={() => updateActiveLogoBox({ x: 0.5, y: 0.6, w: 0.7, h: 0.45 })}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-[10px] font-bold uppercase"
                    >
                      Sıfırla
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-zinc-500 mt-3">
                İpucu: Görseli ortadan sürükle, köşelerden büyüt/küçült.
              </p>
            </div>
          </div>
        )}

        {/* THREE.js Canvas */}
        {/** Drawer state'e göre desktop'ta da model ölçeklenir: açıkken küçük, kapalıyken büyük */}
        {(() => {
          const desktopClosedScale = isPrintAreaOpen ? 0.96 : 1.06;
          const desktopOpenScale = isPrintAreaOpen ? 0.86 : 0.95;
          const desktopScale = drawerOpen ? desktopOpenScale : desktopClosedScale;
          const desktopWidth = isPrintAreaOpen ? "56vw" : "62vw";
          const desktopHeight = isPrintAreaOpen ? "82vh" : "86vh";
          const desktopTop = "50%";
          const desktopShiftY = drawerOpen ? (isPrintAreaOpen ? "-18%" : "-12%") : "0%";
          const minZoomDistance = !isMobile ? (isPrintAreaOpen ? 2.35 : drawerOpen ? 2.2 : 1.95) : 1.85;
          const controlsTargetY = !isMobile ? (isPrintAreaOpen ? -0.12 : drawerOpen ? -0.2 : -0.1) : -0.1;
          return (
        <Canvas
          style={{
            position: "absolute",
            left: isMobile ? "50%" : isPrintAreaOpen ? "63%" : "50%",
            top: isMobile ? "50%" : desktopTop,
            transform: `translate(-50%, -50%) translateY(${isMobile ? "0%" : desktopShiftY}) scale(${isMobile ? (drawerOpen ? 0.7 : 1) : desktopScale})`,
            width: isMobile ? "80vw" : desktopWidth,
            height: isMobile ? "80vh" : desktopHeight,
            display: "block",
            backgroundColor: SCENE_BG_COLOR,
            willChange: "transform",
            transformOrigin: "center center",
            transition: "transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)",
            zIndex: 10,
          }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: perf.antialias,
            alpha: false,
            powerPreference: perf.powerPreference,
          }}
          dpr={perf.dpr}
          onCreated={({ gl, scene, camera }) => {
            glRef.current = gl;
            sceneRef.current = scene;
            cameraRef.current = camera;
            const bgColor = new THREE.Color(SCENE_BG_COLOR);
            scene.background = bgColor;
            gl.setClearColor(bgColor, 1);
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.9;
          }}
          camera={{ position: [0, 0.36, 2.34], fov: 30 }}
          shadows={!isMobile}
        >
          <SceneBackgroundLock />

          <ambientLight intensity={0.9} />
          <hemisphereLight intensity={0.35} groundColor={"#1a1a1a"} />
          <directionalLight
            position={[6, 10, 8]}
            intensity={0.9}
            castShadow={!isMobile}
            shadow-mapSize-width={perf.shadowMap}
            shadow-mapSize-height={perf.shadowMap}
          />
          <directionalLight position={[-6, 6, -6]} intensity={0.35} />
          <pointLight position={[0, 2.6, 2.2]} intensity={0.3} />
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
                  disableDrag={false}
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
            enableRotate={false}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.7}
            minDistance={minZoomDistance}
            maxDistance={4.2}
            zoomToCursor={false}
            enabled={!camAnimating}
            target={[0, controlsTargetY, 0]}
            mouseButtons={{ LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null }}
            touches={{ ONE: THREE.TOUCH.NONE, TWO: THREE.TOUCH.DOLLY }}
          />
        </Canvas>
          );
        })()}

        {/* LEFT OVERLAY EDITOR (DESKTOP ONLY) */}
        {!isMobile && forceEditorOverlay && (
          <div
            className="absolute left-6 z-[88] w-[360px] pointer-events-auto"
            style={{
              top: "96px",
              bottom: `${(drawerOpen ? DESKTOP_DRAWER_HEIGHT : DESKTOP_DRAWER_PEEK) + 24}px`,
            }}
          >
            <div className="h-full overflow-y-auto">
              <EditorPanel
                design={activeDesign}
                updateDesign={updateActive}
                loading={loading}
                onAddToCartAll={handleAddToCartAll}
                view={view}
                isMobile={isMobile}
                activeTab="editor"
                setActiveTab={setActiveTab}
                layout="standard"
                onRequestDrawerCollapse={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {!isMobile && !drawerOpen && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="fixed bottom-5 right-5 z-[89] w-11 h-11 rounded-full border border-gray-300 bg-white text-gray-700 shadow-md hover:bg-gray-50 flex items-center justify-center"
            aria-label="Paneli aç"
          >
            <ChevronUp size={18} />
          </button>
        )}

        {/* DRAWER (MOBILE + DESKTOP) - Nike Style */}
        {activeDesign && (
          <div
            className={`fixed left-0 right-0 z-[85] pointer-events-auto transition-all duration-300 ${
              isMobile ? "bottom-0" : "bottom-0"
            }`}
            style={{
              transform: isMobile
                ? `translateY(${drawerY}px)`
                : drawerOpen
                  ? "translateY(0)"
                  : `translateY(${DESKTOP_DRAWER_HEIGHT - DESKTOP_DRAWER_PEEK}px)`,
              transition: isMobile && dragState.current.dragging ? "none" : "transform 220ms ease",
              maxHeight: drawerHeightStyle,
              height: drawerHeightStyle,
              paddingBottom: "env(safe-area-inset-bottom)",
              backgroundColor: "#ffffff",
              borderTopLeftRadius: isMobile ? "24px" : "0",
              borderTopRightRadius: isMobile ? "24px" : "0",
              boxShadow: isMobile ? "0 -4px 20px rgba(0,0,0,0.15)" : drawerOpen ? "0 -2px 10px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <div
              className="w-full h-full overflow-hidden flex flex-col pointer-events-auto"
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* Nike Style Drawer Handle */}
              <div
                className="w-full flex items-center justify-between px-3 py-2 flex-shrink-0"
                onPointerDown={isMobile ? onDrawerPointerDown : undefined}
                style={isMobile ? { touchAction: "none" } : {}}
              >
                <div className="w-10 h-1.5 rounded-full bg-gray-300" />
                <button
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Paneli aç/kapa"
                >
                  {drawerOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>

              {/* Drawer Tab Navigation */}
              <div className="px-3 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <button
                      onClick={goPrevTab}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                      aria-label="Önceki adım"
                    >
                      <ChevronLeft size={16} />
                    </button>

                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">
                      {tabLabelMap[activeTab] || "Baskı"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}
                    </p>
                  </div>

                    <button
                      onClick={goNextTab}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                      aria-label="Sonraki adım"
                    >
                      <ChevronRight size={16} />
                    </button>
                </div>
              </div>

              {renderPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* preload */
useGLTF.preload(toSafeUrl(MODEL_PATHS.tshirt));
useGLTF.preload(toSafeUrl(MODEL_PATHS.hoodie));
useGLTF.preload(toSafeUrl(MODEL_PATHS.sweatshirt));
useGLTF.preload(toSafeUrl(MODEL_PATHS["sweat-yeni"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["sweat-deneme"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-cepli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-ceplipli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["oversize-sweat"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["oversize-tshirt"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS.fermuarli));
useGLTF.preload(toSafeUrl(MODEL_PATHS.polar));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-ipli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize-ipli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize-cepli"]));
useGLTF.preload(toSafeUrl(MODEL_PATHS["hoodie-oversize-ceplipli"]));
