"use client";

import Link from "next/link";
import React, {
  useState,
  Suspense,
  useRef,
  useEffect,
  useLayoutEffect,
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
  useTexture,
  Html,
  useProgress,
} from "@react-three/drei";

import {
  Upload,
  Palette,
  Move,
  Menu,
  Plus,
  Minus,
  Trash2,
  X,
  Image as ImageIcon,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  Pencil,
  Lock,
  LockOpen,
} from "lucide-react";

import * as THREE from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { getCheckoutData, setCheckoutData } from "@/lib/checkoutStore";

THREE.Mesh.prototype.raycast = acceleratedRaycast;

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
const NEW_MODELS_ROOT = "/models/newModels";
const NEW_MODELS_DIR_A = `${NEW_MODELS_ROOT}/drive-download-20260208T203457Z-3-001`;
const NEW_MODELS_DIR_B = `${NEW_MODELS_ROOT}/drive-download-20260210T163425Z-3-001`;
const MODELS_WITH_HOODIE_PARTS = new Set(["hoodie-v12-canavari", "oversize-hoodie-parcali"]);
const DEFAULT_MODEL_TYPE = "yeni-duz-tshirt";

/* ================= MODEL PATHS ================= */
const PRIMARY_MODEL_PATHS = Object.freeze({
  "yeni-duz-tshirt": `${NEW_MODELS_DIR_A}/duz-tisort.glb`,
  "yeni-oversize-tshirt": `${NEW_MODELS_DIR_A}/oversize-tshirt.glb`,
  "yeni-duz-sweat": `${NEW_MODELS_DIR_A}/duz-sweat.glb`,
  "yeni-oversize-sweat": `${NEW_MODELS_DIR_A}/oversize-sweat.glb`,
  "yeni-fermuarli": `${NEW_MODELS_DIR_A}/fermuarli.glb`,
  "polar-son": `${NEW_MODELS_DIR_B}/polar-son.glb`,
  "hoodie-v12-canavari": `${NEW_MODELS_ROOT}/hoodie-v12-canavari.glb`,
  "oversize-hoodie-parcali": `${NEW_MODELS_DIR_B}/oversize-hoodie-parcali.glb`,
});

const MODEL_TYPE_ALIASES = Object.freeze({
  tshirt: "yeni-duz-tshirt",
  "normal-tshirt": "yeni-duz-tshirt",
  "normal-tisort": "yeni-duz-tshirt",
  "duz-tshirt": "yeni-duz-tshirt",
  "duz-tisort": "yeni-duz-tshirt",
  sweatshirt: "yeni-duz-sweat",
  "sweat-yeni": "yeni-duz-sweat",
  "sweat-deneme": "yeni-duz-sweat",
  "oversize-tshirt": "yeni-oversize-tshirt",
  "oversize-tshirt-efektli": "yeni-oversize-tshirt",
  "oversize-sweat": "yeni-oversize-sweat",
  hoodie: "hoodie-v12-canavari",
  "hoodie-ipli": "hoodie-v12-canavari",
  "hoodie-cepli": "hoodie-v12-canavari",
  "hoodie-ceplipli": "hoodie-v12-canavari",
  "hoodie-oversize": "oversize-hoodie-parcali",
  "hoodie-oversize-ipli": "oversize-hoodie-parcali",
  "hoodie-oversize-cepli": "oversize-hoodie-parcali",
  "hoodie-oversize-ceplipli": "oversize-hoodie-parcali",
  fermuarli: "yeni-fermuarli",
  polar: "polar-son",
  "duz tisort": "yeni-duz-tshirt",
  "duz tshirt": "yeni-duz-tshirt",
});

const normalizeModelType = (type) => {
  const raw = String(type || "")
    .toLowerCase()
    .trim();
  if (!raw) return DEFAULT_MODEL_TYPE;
  const slug = raw.replace(/\s+/g, "-").replace(/_/g, "-");
  const resolved = MODEL_TYPE_ALIASES[raw] || MODEL_TYPE_ALIASES[slug] || raw;
  return PRIMARY_MODEL_PATHS[resolved] ? resolved : DEFAULT_MODEL_TYPE;
};

const getDefaultFabricType = (modelType) => {
  const safe = normalizeModelType(modelType);
  if (safe.includes("tshirt")) return "supreme-24x1";
  return "iplik-3-sardonsuz";
};

const normalizeFabricType = (fabricType, modelType) => {
  const raw = String(fabricType || "").trim().toLowerCase();
  // backward compatibility
  if (raw === "standart") return getDefaultFabricType(modelType);
  if (raw === "pamuk") return "supreme-30x1";
  if (raw === "soft") return "iplik-3-sardonlu";
  if (FABRIC_PRESETS[raw]) return raw;
  return getDefaultFabricType(modelType);
};

const getFabricOptionsForModel = (modelType) => {
  const safe = normalizeModelType(modelType);
  if (safe.includes("tshirt")) {
    return [FABRIC_PRESETS["supreme-24x1"], FABRIC_PRESETS["supreme-30x1"]];
  }
  return [FABRIC_PRESETS["iplik-3-sardonsuz"], FABRIC_PRESETS["iplik-3-sardonlu"]];
};

const MODEL_PATHS = {
  ...PRIMARY_MODEL_PATHS,
  ...Object.fromEntries(
    Object.entries(MODEL_TYPE_ALIASES).map(([legacyType, canonicalType]) => [
      legacyType,
      PRIMARY_MODEL_PATHS[canonicalType] || PRIMARY_MODEL_PATHS[DEFAULT_MODEL_TYPE],
    ])
  ),
};

const AVAILABLE_MODELS = [
  "yeni-duz-tshirt",
  "yeni-oversize-tshirt",
  "yeni-duz-sweat",
  "yeni-oversize-sweat",
  "yeni-fermuarli",
  "polar-son",
  "hoodie-v12-canavari",
  "oversize-hoodie-parcali",
];

const MODEL_LABELS = {
  tshirt: "Normal Tshirt",
  sweatshirt: "Normal Sweat",
  "sweat-yeni": "Yeni Sweat",
  "sweat-deneme": "Deneme Sweat",
  "oversize-tshirt": "Oversize Tshirt",
  "oversize-tshirt-efektli": "Oversize Tshirt Efektli",
  "oversize-sweat": "Oversize Sweat",
  hoodie: "Hoodie",
  "hoodie-ipli": "Hoodie İpli",
  "hoodie-cepli": "Hoodie Cepli",
  "hoodie-ceplipli": "Hoodie Cepli İpli",
  "hoodie-oversize": "Oversize Hoodie",
  "hoodie-oversize-ipli": "Oversize Hoodie İpli",
  "hoodie-oversize-cepli": "Oversize Hoodie Cepli",
  "hoodie-oversize-ceplipli": "Oversize Hoodie Cepli İpli",
  "hoodie-v12-canavari": "Yeni Hoodie V12",
  "oversize-hoodie-parcali": "Oversize Hoodie Parçalı",
  fermuarli: "Fermuarlı",
  polar: "Polar",
  "polar-son": "Polar Son",
  "yeni-duz-tshirt": "Yeni Düz Tshirt",
  "yeni-oversize-tshirt": "Yeni Oversize Tshirt",
  "yeni-duz-sweat": "Yeni Düz Sweat",
  "yeni-oversize-sweat": "Yeni Oversize Sweat",
  "yeni-fermuarli": "Yeni Fermuarlı",
};

const MODEL_SELECTION_GROUPS = [
  {
    id: "tisort",
    title: "Tshirt",
    models: ["yeni-duz-tshirt", "yeni-oversize-tshirt"],
  },
  {
    id: "sweatshirt",
    title: "Sweatshirt",
    models: ["yeni-duz-sweat", "yeni-oversize-sweat", "yeni-fermuarli", "polar-son"],
  },
  {
    id: "hoodie",
    title: "Hoodie",
    models: ["hoodie-v12-canavari", "oversize-hoodie-parcali"],
  },
];

const MODEL_SELECTION_CARD_LABELS = Object.freeze({
  "yeni-duz-tshirt": "Klasik",
  "yeni-oversize-tshirt": "Oversize",
  "yeni-duz-sweat": "Klasik",
  "yeni-oversize-sweat": "Oversize",
  "yeni-fermuarli": "Fermuarlı Sweatshirt",
  "polar-son": "Polar",
  "hoodie-v12-canavari": "Klasik",
  "oversize-hoodie-parcali": "Oversize",
});

const getModelGroupTitle = (modelType) => {
  const safeType = normalizeModelType(modelType);
  const found = MODEL_SELECTION_GROUPS.find((group) => group.models.includes(safeType));
  return found?.title || "Model";
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
  "oversize-tshirt-efektli": {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.265, yBot: -0.30, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  sweatshirt: {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.275, yBot: -0.24, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.245, z: -0.148, rotY: Math.PI },
  },
  "yeni-duz-sweat": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.275, yBot: -0.24, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.245, z: -0.148, rotY: Math.PI },
  },
  "sweat-deneme": {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.275, yBot: -0.24, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.245, z: -0.148, rotY: Math.PI },
  },
  "oversize-sweat": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.270, yBot: -0.255, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.26, z: -0.148, rotY: Math.PI },
  },
  "yeni-oversize-sweat": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.270, yBot: -0.255, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.26, z: -0.148, rotY: Math.PI },
  },
  "yeni-duz-tshirt": {
    front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
    back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
  },
  "yeni-oversize-tshirt": {
    front: { xMin: -0.17, xMax: 0.17, yTop: 0.265, yBot: -0.30, z: 0.147, rotY: 0 },
    back: { xMin: -0.17, xMax: 0.17, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
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
  "hoodie-v12-canavari": {
    front: { xMin: -0.130, xMax: 0.130, yTop: 0.125, yBot: -0.265, z: 0.147, rotY: 0 },
    back: { xMin: -0.122, xMax: 0.125, yTop: 0.145, yBot: -0.285, z: -0.148, rotY: Math.PI },
  },
  "oversize-hoodie-parcali": {
    front: { xMin: -0.130, xMax: 0.130, yTop: 0.125, yBot: -0.265, z: 0.147, rotY: 0 },
    back: { xMin: -0.120, xMax: 0.120, yTop: 0.145, yBot: -0.275, z: -0.148, rotY: Math.PI },
  },

  // İstisnalar (sonraki isteğinde özel değerler gelecek)
  polar: {
    front: { xMin: -0.162, xMax: 0.162, yTop: 0.275, yBot: -0.242, z: 0.139, rotY: 0, zipGap01: 0.03 },
    back: { xMin: -0.162, xMax: 0.162, yTop: 0.305, yBot: -0.248, z: -0.14, rotY: Math.PI },
  },
  "polar-son": {
    front: { xMin: -0.162, xMax: 0.162, yTop: 0.275, yBot: -0.242, z: 0.139, rotY: 0, zipGap01: 0.10 },
    back: { xMin: -0.162, xMax: 0.162, yTop: 0.305, yBot: -0.248, z: -0.14, rotY: Math.PI },
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
      yBot: -0.21,
      z: 0.131,
      rotY: 0.1,
      zipGap01: 0.035, // Orta fermuar şeridi (daha belirgin)
    },
    back: { xMin: -0.155, xMax: 0.155, yTop: 0.28, yBot: -0.24, z: -0.132, rotY: Math.PI },
  },
  "yeni-fermuarli": {
    front: {
      xMin: -0.150,
      xMax: 0.150,
      yTop: 0.22,
      yBot: -0.205,
      z: 0.131,
      rotY: 0.1,
      zipGap01: 0.110,
    },
    back: { xMin: -0.153, xMax: 0.153, yTop: 0.27, yBot: -0.238, z: -0.132, rotY: Math.PI },
  },
};

const HOODIE_POCKET_FRONT_YBOT = Object.freeze({
  "hoodie-v12-canavari": -0.145,
  "oversize-hoodie-parcali": -0.15,
});

const CENTER_ZIP_MODEL_TYPES = new Set(["fermuarli", "yeni-fermuarli", "polar", "polar-son"]);
const ZIP_STRIPE_TOP01 = 0.0;
const ZIP_STRIPE_BOTTOM01 = 0.25; // 1'e yaklastikca asagiya uzar
const hasCenterZip = (modelType) => {
  const raw = String(modelType || "").toLowerCase().trim();
  if (!raw) return false;
  const normalized = normalizeModelType(raw);
  return CENTER_ZIP_MODEL_TYPES.has(raw) || CENTER_ZIP_MODEL_TYPES.has(normalized);
};

const getPrintProfile = (modelType, side = "front", hoodieParts = DEFAULT_HOODIE_PARTS) => {
  const base = MODEL_PRINT_BOUNDS[modelType]?.[side] || MODEL_PRINT_BOUNDS.tshirt[side];
  if (!base) return MODEL_PRINT_BOUNDS.tshirt.front;
  if (side !== "front") return base;
  if (!MODELS_WITH_HOODIE_PARTS.has(modelType)) return base;
  if (!hoodieParts?.pocket) return base;

  const pocketYBot = HOODIE_POCKET_FRONT_YBOT[modelType];
  if (!Number.isFinite(pocketYBot)) return base;
  return { ...base, yBot: Math.max(base.yBot, pocketYBot) };
};

const estimateTextHalfBounds01 = (textState = {}) => {
  const rawText = String(textState?.text || "").trim();
  const text = rawText || "W";
  const charCount = Math.max(1, text.length);
  const size = clamp(Number(textState?.size) || 150, 30, 420);
  const scaleX = clamp(Number(textState?.scaleX) || 1, 0.3, 3);
  const scaleY = clamp(Number(textState?.scaleY) || 1, 0.3, 3);
  const layout = String(textState?.layout || "straight");
  const curve = getTextCurveValue(textState);

  const avgGlyphW = size * 0.58 * scaleX;
  const spacing = size * 0.03 * scaleX;
  const baseW = Math.max(size * 0.75 * scaleX, charCount * avgGlyphW + (charCount - 1) * spacing);
  let boxW = baseW;
  let boxH = size * 1.15 * scaleY;

  if (layout === "wave") boxH += size * (curve / 100) * 0.9 * scaleY;
  if (layout === "zigzag") boxH += size * (curve / 100) * 1.45 * scaleY;
  if (layout === "stair-up" || layout === "stair-down") boxH += size * (curve / 100) * 1.7 * scaleY;
  if (layout === "arc-up" || layout === "arc-down") {
    boxH += size * (curve / 100) * 1.35 * scaleY;
    boxW += size * 0.2 * scaleX;
  }
  if (layout === "arc-up-strong" || layout === "arc-down-strong") {
    boxH += size * (curve / 100) * 1.8 * scaleY;
    boxW += size * 0.28 * scaleX;
  }

  const pad = size * 0.1;
  const halfW01 = clamp((boxW / 2 + pad) / 1024, 0.035, 0.49);
  const halfH01 = clamp((boxH / 2 + pad) / 1024, 0.035, 0.49);
  return { halfW01, halfH01 };
};

const clampTextPos = (textPos, textState = {}) => {
  const { halfW01, halfH01 } = estimateTextHalfBounds01(textState);
  const fallbackY = clamp(1 - halfH01, halfH01, 1 - halfH01);
  const x = clamp(Number.isFinite(Number(textPos?.x)) ? Number(textPos.x) : 0.5, halfW01, 1 - halfW01);
  const y = clamp(Number.isFinite(Number(textPos?.y)) ? Number(textPos.y) : fallbackY, halfH01, 1 - halfH01);
  return { x, y };
};

const CM_LABELS = {
  tshirt: { front: { w: 40, h: 54 }, back: { w: 40, h: 54 } },
  sweatshirt: { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "sweat-yeni": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "sweat-deneme": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  hoodie: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-cepli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-ceplipli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "hoodie-v12-canavari": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "oversize-hoodie-parcali": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  "oversize-tshirt": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "oversize-tshirt-efektli": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "oversize-sweat": { front: { w: 58, h: 58 }, back: { w: 58, h: 58 } },
  fermuarli: { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
  polar: { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "polar-son": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "yeni-duz-tshirt": { front: { w: 40, h: 54 }, back: { w: 40, h: 54 } },
  "yeni-oversize-tshirt": { front: { w: 45, h: 60 }, back: { w: 45, h: 60 } },
  "yeni-duz-sweat": { front: { w: 52, h: 52 }, back: { w: 43, h: 62 } },
  "yeni-oversize-sweat": { front: { w: 58, h: 58 }, back: { w: 58, h: 58 } },
  "yeni-fermuarli": { front: { w: 64, h: 55 }, back: { w: 64, h: 55 } },
};

/* ================= FİYAT SISTEMI ================= */
const MODEL_BASE_PRICES = Object.freeze({
  "yeni-duz-tshirt": 350,
  "yeni-oversize-tshirt": 400,
  "yeni-duz-sweat": 600,
  "yeni-oversize-sweat": 650,
  "yeni-fermuarli": 650,
  "hoodie-v12-canavari": 750,
  "oversize-hoodie-parcali": 800,
  "polar-son": 800,
});
const LAUNCH_DISCOUNT_RATE = 0.2; // Current visible prices are launch-discounted prices.
const LARGE_PRINT_AREA_THRESHOLD_01 = 0.4; // 5'te 2
const LARGE_PRINT_EXTRA_PRICE = 50;

/* ================= KUMAŞ ================= */
const FABRIC_PRESETS = Object.freeze({
  "supreme-24x1": {
    id: "supreme-24x1",
    label: "24x1 Süpreme",
    desc: "Tok duruşlu, kaliteli ve dayanıklı tişört kumaşı.",
  },
  "supreme-30x1": {
    id: "supreme-30x1",
    label: "30x1 Süpreme",
    desc: "İnce, hafif, yumuşak ve ekonomik tişört kumaşı.",
  },
  "iplik-3-sardonsuz": {
    id: "iplik-3-sardonsuz",
    label: "3 İplik Şardonsuz",
    desc: "Kalın, tok ve 4 mevsim kullanım için uygun kumaş.",
  },
  "iplik-3-sardonlu": {
    id: "iplik-3-sardonlu",
    label: "3 İplik Şardonlu",
    desc: "İçi tüylü, pofuduk ve kışlık kumaş.",
  },
});

/* ================= BRAND / UI ================= */
const SCENE_BG_COLOR = "#d6d9de";
const PANEL_BG_COLOR = "#e8e8e8";
const PANEL_BORDER_COLOR = "#d0d0d0";
const DESKTOP_DRAWER_HEIGHT = 312;
const DESKTOP_DRAWER_PEEK = 82;
const MAX_LOGOS_PER_SIDE = 3;
const LEFT_PRINT_AREA_WIDTH = 420;
const LEFT_PRINT_AREA_GAP = 0;
const BRAND_COLORS = ["#1A1A1A", "#F0F0F0", "#D2C6B6", "#3F432C", "#191C25", "#363636", "#1EF292", "#3E191D"];
const BRAND_DEFAULT_COLOR = BRAND_COLORS[0];
const FONT_OPTIONS = [
  { label: "Arial Black", value: "Arial Black, Arial, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet", value: "Trebuchet MS, Arial, sans-serif" },
  { label: "Segoe UI", value: "Segoe UI, Tahoma, sans-serif" },
  { label: "Calibri", value: "Calibri, Candara, Segoe, sans-serif" },
  { label: "Candara", value: "Candara, Calibri, Segoe, sans-serif" },
  { label: "Optima", value: "Optima, Segoe, sans-serif" },
  { label: "Franklin", value: "Franklin Gothic Medium, Arial Narrow, Arial, sans-serif" },
  { label: "Impact", value: "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif" },
  { label: "Georgia", value: "Georgia, Times New Roman, serif" },
  { label: "Times", value: "Times New Roman, Times, serif" },
  { label: "Garamond", value: "Garamond, Baskerville, serif" },
  { label: "Palatino", value: "Palatino Linotype, Book Antiqua, Palatino, serif" },
  { label: "Baskerville", value: "Baskerville, Palatino, serif" },
  { label: "Courier New", value: "Courier New, Courier, monospace" },
  { label: "Lucida Console", value: "Lucida Console, Monaco, monospace" },
  { label: "Brush Script", value: "Brush Script MT, Comic Sans MS, cursive" },
];
const HOODIE_DETAIL_OPTIONS = [
  { id: "strings", label: "İpli" },
  { id: "pocket", label: "Cepli" },
];
const DEFAULT_HOODIE_PARTS = Object.freeze({
  strings: false,
  pocket: false,
});
const DEFAULT_PDF_PLACEMENT = Object.freeze({
  x: 0.5,
  y: 0.56,
  w: 0.36,
  h: 0.18,
  rotation: 0,
  side: "front",
});
const TEXT_LAYOUT_OPTIONS = [
  { id: "straight", label: "Duz" },
  { id: "arc-up", label: "Yukari Yay" },
  { id: "arc-down", label: "Asagi Yay" },
  { id: "arc-up-strong", label: "Yukari Yay+" },
  { id: "arc-down-strong", label: "Asagi Yay+" },
  { id: "wave-soft", label: "Dalga Yumusak" },
  { id: "wave", label: "Dalga" },
  { id: "wave-strong", label: "Dalga Sert" },
  { id: "zigzag", label: "Zikzak" },
  { id: "stair-up", label: "Merdiven Yukari" },
  { id: "stair-down", label: "Merdiven Asagi" },
];

const HDR_ENV_DESKTOP_PATH = "/hdr/white_studio_06_4k.exr";
const HDR_ENV_MOBILE_PATH = "/hdr/white_studio_06_4k.exr";
const RUBBER_GLYPH_MODEL_PATH = `${NEW_MODELS_ROOT}/Harfler-isaretler.glb`;
const HDR_SOURCE_CACHE = new Map();

const getHdriSourceTexture = (url) => {
  const safeUrl = toSafeUrl(url);
  if (HDR_SOURCE_CACHE.has(safeUrl)) return HDR_SOURCE_CACHE.get(safeUrl);
  const lowerUrl = String(safeUrl).toLowerCase();
  const loader = lowerUrl.endsWith(".exr") ? new EXRLoader() : new RGBELoader();
  const promise = new Promise((resolve, reject) => {
    loader.load(
      safeUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
  HDR_SOURCE_CACHE.set(safeUrl, promise);
  return promise;
};

const GLYPH_TOKEN_MAP = {
  plus: "+",
  comma: ",",
  parenright: ")",
  slash: "/",
  hyphen: "-",
  question: "?",
  exclam: "!",
  asterisk: "*",
  equal: "=",
  at: "@",
  numbersign: "#",
  dollar: "$",
  percent: "%",
  ampersand: "&",
  period: ".",
};

const glyphTokenToChar = (tokenRaw, forceCase = null) => {
  const tokenOriginal = String(tokenRaw || "").trim();
  const token = tokenOriginal.toLowerCase();
  if (!token) return null;
  if (GLYPH_TOKEN_MAP[token]) return GLYPH_TOKEN_MAP[token];
  if (token === "ouml") return forceCase === "lower" ? "ö" : "Ö";
  if (token === "uuml") return forceCase === "lower" ? "ü" : "Ü";
  if (token === "ccedilla") return forceCase === "lower" ? "ç" : "Ç";
  if (token === "scedilla") return forceCase === "lower" ? "ş" : "Ş";
  if (token === "gbreve") return forceCase === "lower" ? "ğ" : "Ğ";
  if (token === "i_dotted") return forceCase === "lower" ? "i" : "İ";
  if (token === "i_nodot") return "ı";
  if (/^[0-9]$/.test(token)) return token;
  if (/^[a-z]$/i.test(tokenOriginal)) {
    if (forceCase === "lower") return token;
    return token.toUpperCase();
  }
  return null;
};

const glyphNodeNameToChar = (nameRaw) => {
  const normalized = String(nameRaw || "").trim().replace(/\.\d+$/g, "");
  if (!/^glyph_/i.test(normalized)) return null;

  let token = normalized.replace(/^glyph_/i, "");
  let forceCase = null;

  if (/^lower_/i.test(token)) {
    forceCase = "lower";
    token = token.replace(/^lower_/i, "");
  } else if (/^upper_/i.test(token)) {
    forceCase = "upper";
    token = token.replace(/^upper_/i, "");
  } else if (/_lower$/i.test(token)) {
    forceCase = "lower";
    token = token.replace(/_lower$/i, "");
  } else if (/_upper$/i.test(token)) {
    forceCase = "upper";
    token = token.replace(/_upper$/i, "");
  }

  return glyphTokenToChar(token, forceCase);
};

const PRINT_TYPE_OPTIONS = [
  {
    id: "dtf",
    label: "DTF",
    available: true,
    info: "Tasarim ozel filme basilir, toz yapistirici uygulanir ve sicak presle kumasa aktarilir.",
  },
  {
    id: "rubber",
    label: "Rubber",
    available: true,
    info: "Plastisol (PVC + plastiklestirici) bazli, isiyla kurlenen opak ve dayanikli baski.",
  },
  {
    id: "flock",
    label: "Flok",
    available: true,
    info: "Kisa lifler yapistirici kapli alana uygulanir, kadifemsi doku verir.",
  },
  {
    id: "emprime",
    label: "Emprime",
    available: false,
    info: "Serigrafi baskida boya kalip/screen uzerinden kumasa aktarilir; her renk icin ayri kalip gerekir.",
  },
  {
    id: "nakis",
    label: "Nakıs",
    available: false,
    info: "Iğne ve iplikle kumas uzerine isleme yapilarak desen olusturulur.",
  },
  {
    id: "tas",
    label: "Tas",
    available: false,
    info: "Kristal gorunumlu taslar isi transferiyle kumasa uygulanir.",
  },
  {
    id: "enjeksiyon",
    label: "Enjeksiyon",
    available: false,
    info: "Kaucuk/silikon benzeri kabartma parca isi ile kumasa sabitlenir; logo etkisi verir.",
  },
  {
    id: "gofre",
    label: "Gofre",
    available: false,
    info: "Isi ve basinc ile kabartmali (embossed) doku olusturma.",
  },
];

const STICKER_OPTIONS = [{ id: "sticker-ferhata-att", label: "Ferhata Att", src: "/urungorsel/ferhata%20atttttttt.png" }];

function PrintTypePickerCards({ selectedIds = [], onSelect, sourceLabel = "Sec", isMobile = false }) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-[#f4f6f8] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-600">Baski Cesitleri</p>
        <span className="text-[10px] font-bold uppercase text-gray-500">{sourceLabel}</span>
      </div>

      <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
        {PRINT_TYPE_OPTIONS.map((opt) => {
          const selected = selectedIds.includes(opt.id);
          const disabled = !opt.available;
          return (
            <button
              key={`print-type-${sourceLabel}-${opt.id}`}
              type="button"
              onClick={() => {
                if (!disabled) onSelect?.(opt.id);
              }}
              disabled={disabled}
              className={`rounded-xl border px-2 py-2 text-left transition ${disabled
                ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                : selected
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              <p className="text-[11px] font-black uppercase tracking-wide">{opt.label}</p>
              <p
                className={`mt-1 text-[12px] font-bold leading-snug ${disabled ? "text-zinc-400" : selected ? "text-zinc-200" : "text-gray-700"
                  }`}
              >
                {disabled ? "Yakinda" : opt.info}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

const LOGO_STYLE_DEFAULTS = Object.freeze({
  opacity: 1,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  flipX: false,
  flipY: false,
});

/* ================= HELPERS ================= */
const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clamp01 = (v) => clamp(v, 0, 1);
const pct = (v01) => `${Math.round(v01 * 100)}%`;
const MAX_UPLOAD_FILE_MB = 16;
const MAX_UPLOAD_RENDER_SIDE = 2304;
const getTextCurveValue = (t) => clamp(Number(t?.curve ?? 30), 6, 88);

const drawStyledText = (ctx, t, centerX, centerY, fontSize) => {
  const text = String(t?.text || "").trim();
  if (!text) return;

  const layout = t?.layout || "straight";
  const curve = getTextCurveValue(t);
  const scaleX = clamp(t?.scaleX || 1, 0.3, 3);
  const scaleY = clamp(t?.scaleY || 1, 0.3, 3);
  const rotationDeg = clamp(Number(t?.rotation) || 0, -180, 180);
  const baseColor = t?.color || "#ffffff";
  const embossEnabled = Boolean(t?.emboss);
  const embossDepthMul = clamp(Number(t?.embossDepth ?? 1.4), 0.6, 2.8);
  const embossStrength = clamp(Number(t?.embossStrength ?? 1.4), 0.6, 2.4);
  const strokeWidth = clamp(fontSize * 0.11 * embossStrength, 1.2, 14);
  const depth = clamp(fontSize * 0.07 * embossDepthMul, 2, 26);

  const renderPass = ({ fillStyle, strokeStyle = null, alpha = 1, offsetX = 0, offsetY = 0 }) => {
    ctx.save();
    ctx.translate(centerX + offsetX, centerY + offsetY);
    if (rotationDeg) {
      ctx.rotate((rotationDeg * Math.PI) / 180);
    }
    ctx.scale(scaleX, scaleY);
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${fontSize}px ${t?.font || FONT_OPTIONS[0].value}`;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (strokeStyle) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeStyle;
    }

    if (layout === "straight") {
      if (strokeStyle) ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
      return;
    }

    const chars = [...text];
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const spacing = fontSize * 0.06;
    const totalAdvance = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
    if (totalAdvance <= 0) {
      if (strokeStyle) ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
      return;
    }

    if (layout === "wave" || layout === "wave-soft" || layout === "wave-strong") {
      const waveAmpMul = layout === "wave-soft" ? 0.85 : layout === "wave-strong" ? 1.75 : 1.35;
      const amp = (curve / 100) * fontSize * waveAmpMul;
      const rotMul = layout === "wave-soft" ? 0.11 : layout === "wave-strong" ? 0.2 : 0.16;
      let cursor = -totalAdvance / 2;
      chars.forEach((ch, i) => {
        const w = widths[i];
        const x = cursor + w / 2;
        const phase = (i / Math.max(chars.length - 1, 1)) * Math.PI * 2;
        const y = Math.sin(phase) * amp;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.cos(phase) * (curve * rotMul) * (Math.PI / 180));
        if (strokeStyle) ctx.strokeText(ch, 0, 0);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        cursor += w + spacing;
      });
      ctx.restore();
      return;
    }

    if (layout === "zigzag" || layout === "stair-up" || layout === "stair-down") {
      let cursor = -totalAdvance / 2;
      const stepAmp = (curve / 100) * fontSize * 1.25;
      chars.forEach((ch, i) => {
        const w = widths[i];
        const x = cursor + w / 2;
        let y = 0;
        let rot = 0;
        if (layout === "zigzag") {
          y = (i % 2 === 0 ? -1 : 1) * stepAmp * 0.7;
          rot = (i % 2 === 0 ? -1 : 1) * curve * 0.2;
        } else {
          const p = chars.length > 1 ? i / (chars.length - 1) : 0.5;
          y = (layout === "stair-up" ? -1 : 1) * (p - 0.5) * 2 * stepAmp;
          rot = (layout === "stair-up" ? -1 : 1) * 6;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rot * Math.PI) / 180);
        if (strokeStyle) ctx.strokeText(ch, 0, 0);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        cursor += w + spacing;
      });
      ctx.restore();
      return;
    }

    const arcDown = layout === "arc-down" || layout === "arc-down-strong";
    const arcStrong = layout === "arc-up-strong" || layout === "arc-down-strong";
    const arcDir = arcDown ? 1 : -1;
    const totalAngle = ((curve * (arcStrong ? 3.1 : 2.2)) * Math.PI) / 180;
    const radius = Math.max(fontSize * 1.7, totalAdvance / Math.max(totalAngle, 0.1));
    let cursor = -totalAdvance / 2;

    chars.forEach((ch, i) => {
      const w = widths[i];
      const xMid = cursor + w / 2;
      const progress = xMid / (totalAdvance / 2 || 1);
      const angle = progress * (totalAngle / 2);
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, arcDir * radius);
      ctx.rotate(-angle * arcDir * 0.45);
      if (strokeStyle) ctx.strokeText(ch, 0, 0);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      cursor += w + spacing;
    });

    ctx.restore();
  };

  if (!embossEnabled) {
    renderPass({ fillStyle: baseColor, alpha: 1 });
    return;
  }

  // Güçlü kabartı efekti: çok katmanlı extrusion + highlight + top face
  const steps = Math.max(3, Math.round(depth * 1.2));
  for (let i = steps; i >= 1; i -= 1) {
    const f = i / steps;
    renderPass({
      fillStyle: "rgba(8,10,16,0.95)",
      alpha: (0.20 + f * 0.38) * embossStrength,
      offsetX: f * depth,
      offsetY: f * depth,
    });
  }
  renderPass({
    fillStyle: "rgba(255,255,255,0.34)",
    alpha: 0.72 + 0.16 * embossStrength,
    offsetX: -depth * 0.68,
    offsetY: -depth * 0.68,
  });
  renderPass({
    fillStyle: baseColor,
    strokeStyle: "rgba(12,15,24,0.52)",
    alpha: clamp(0.95 + (embossStrength - 1) * 0.08, 0.9, 1),
  });
};

const getLogoStyle = (logo) => ({
  opacity: clamp(logo?.opacity ?? LOGO_STYLE_DEFAULTS.opacity, 0, 1),
  brightness: clamp(logo?.brightness ?? LOGO_STYLE_DEFAULTS.brightness, 0, 200),
  contrast: clamp(logo?.contrast ?? LOGO_STYLE_DEFAULTS.contrast, 0, 200),
  saturation: clamp(logo?.saturation ?? LOGO_STYLE_DEFAULTS.saturation, 0, 250),
  grayscale: clamp(logo?.grayscale ?? LOGO_STYLE_DEFAULTS.grayscale, 0, 100),
  flipX: Boolean(logo?.flipX),
  flipY: Boolean(logo?.flipY),
});

const logoFilterCss = (logo) => {
  const fx = getLogoStyle(logo);
  return `brightness(${fx.brightness}%) contrast(${fx.contrast}%) saturate(${fx.saturation}%) grayscale(${fx.grayscale}%)`;
};

const isEmbossSticker = (logo) => Boolean(logo?.emboss || logo?.kind === "sticker");

const drawEmbossOverlay = (ctx, img, bw, bh) => {
  const shift = Math.max(1, Math.round(Math.max(bw, bh) * 0.01));
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = 0.18;
  ctx.filter = "brightness(132%) contrast(106%)";
  ctx.drawImage(img, -bw / 2 - shift, -bh / 2 - shift, bw, bh);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = 0.24;
  ctx.filter = "brightness(68%) contrast(122%)";
  ctx.drawImage(img, -bw / 2 + shift, -bh / 2 + shift, bw, bh);
  ctx.restore();
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Dosya okunamadi."));
    reader.readAsDataURL(file);
  });

const IMAGE_CACHE = new Map();
const loadImg = (src) =>
  new Promise((resolve, reject) => {
    const key = String(src || "");
    if (!key) {
      reject(new Error("Geçersiz görsel kaynağı."));
      return;
    }
    const cached = IMAGE_CACHE.get(key);
    if (cached?.img && cached.img.complete && cached.img.naturalWidth > 0) {
      resolve(cached.img);
      return;
    }
    if (cached?.promise) {
      cached.promise.then(resolve).catch(reject);
      return;
    }
    const img = new Image();
    const promise = new Promise((res, rej) => {
      img.onload = () => {
        IMAGE_CACHE.set(key, { img });
        res(img);
      };
      img.onerror = () => {
        IMAGE_CACHE.delete(key);
        rej(new Error("Görsel çözümlenemedi."));
      };
    });
    IMAGE_CACHE.set(key, { promise, img });
    promise.then(resolve).catch(reject);
    img.src = key;
  });

async function optimizeUploadDataUrl(file) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Desteklenmeyen dosya türü.");
  }
  if (file.size > MAX_UPLOAD_FILE_MB * 1024 * 1024) {
    throw new Error(`Dosya çok büyük. Maksimum ${MAX_UPLOAD_FILE_MB}MB.`);
  }

  const rawDataUrl = await fileToDataUrl(file);
  if (typeof document === "undefined") return rawDataUrl;

  try {
    const img = await loadImg(rawDataUrl);
    const srcW = img.naturalWidth || img.width || 1;
    const srcH = img.naturalHeight || img.height || 1;
    const scale = Math.min(1, MAX_UPLOAD_RENDER_SIDE / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const wantTransparent = /png|webp/i.test(file.type);
    try {
      return wantTransparent
        ? c.toDataURL("image/webp", 0.95)
        : c.toDataURL("image/jpeg", 0.93);
    } catch {
      return c.toDataURL("image/png");
    }
  } catch {
    return rawDataUrl;
  }
}

const decodePdfLiteral = (src) =>
  String(src || "")
    .replace(/\\([nrtbf()\\])/g, (_, ch) => {
      if (ch === "n") return "\n";
      if (ch === "r") return "\r";
      if (ch === "t") return "\t";
      if (ch === "b") return "\b";
      if (ch === "f") return "\f";
      return ch;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));

const sanitizePdfText = (src) =>
  String(src || "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, "")
    .trim();

const extractPdfTextBestEffort = (binaryText) => {
  if (!binaryText) return "";
  const chunks = [];
  const textBlocks = binaryText.match(/BT[\s\S]*?ET/g) || [];

  textBlocks.forEach((block) => {
    const singleMatches = block.match(/\((?:\\.|[^\\)])*\)\s*Tj/g) || [];
    singleMatches.forEach((entry) => {
      const literal = entry.match(/\(([\s\S]*)\)\s*Tj/);
      if (!literal?.[1]) return;
      chunks.push(decodePdfLiteral(literal[1]));
    });

    const arrayMatches = block.match(/\[(.*?)\]\s*TJ/g) || [];
    arrayMatches.forEach((entry) => {
      const body = entry.match(/\[(.*?)\]\s*TJ/);
      if (!body?.[1]) return;
      const literals = body[1].match(/\((?:\\.|[^\\)])*\)/g) || [];
      literals.forEach((lit) => {
        const content = lit.slice(1, -1);
        chunks.push(decodePdfLiteral(content));
      });
    });
  });

  if (!chunks.length) {
    const fallbackLiterals = binaryText.match(/\((?:\\.|[^\\)]){2,160}\)/g) || [];
    fallbackLiterals.slice(0, 20).forEach((lit) => chunks.push(decodePdfLiteral(lit.slice(1, -1))));
  }

  const merged = sanitizePdfText(chunks.join(" "));
  return merged.slice(0, 180);
};

async function importTextFromPdfFile(file) {
  const ext = String(file?.name || "").toLowerCase();
  if (!ext.endsWith(".pdf")) {
    throw new Error("Lutfen PDF dosyasi secin.");
  }
  const buf = await file.arrayBuffer();
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(new Uint8Array(buf));
  const text = extractPdfTextBestEffort(raw);
  if (!text) {
    throw new Error("PDF icinden yazi okunamadi. Metin iceren bir PDF deneyin.");
  }
  return text;
}

const createSideData = () => ({
  logos: [],
  activeLogoId: null,
  customText: {
    text: "",
    color: "#ffffff",
    size: 150,
    scaleX: 1,
    scaleY: 1,
    emboss: false,
    embossDepth: 1.4,
    embossStrength: 1.4,
    font: FONT_OPTIONS[0].value,
    layout: "straight",
    curve: 30,
    rotation: 0,
    rubberDepth: 0.2,
    rubberStick: 0.96,
    rubberLetterSpacing: 1,
    z: 0,
  },
  textPos: { x: 0.5, y: 0.85 },
});

const normalizeSideData = (sideData) => {
  const base = createSideData();
  const source = sideData && typeof sideData === "object" ? sideData : {};
  const logos = Array.isArray(source.logos) ? source.logos.filter(Boolean) : [];
  const customText = {
    ...base.customText,
    ...(source.customText && typeof source.customText === "object" ? source.customText : {}),
    rotation: clamp(Number(source?.customText?.rotation) || 0, -180, 180),
    embossDepth: clamp(Number(source?.customText?.embossDepth ?? base.customText.embossDepth), 0.6, 2.8),
    embossStrength: clamp(Number(source?.customText?.embossStrength ?? base.customText.embossStrength), 0.6, 2.4),
    rubberDepth: 0.2,
    rubberStick: clamp(Number(source?.customText?.rubberStick ?? base.customText.rubberStick), 0.7, 1),
    rubberLetterSpacing: clamp(
      Number(source?.customText?.rubberLetterSpacing ?? base.customText.rubberLetterSpacing),
      0.2,
      3
    ),
  };
  const textPos = clampTextPos(source.textPos || base.textPos, customText);

  return {
    ...base,
    ...source,
    logos,
    activeLogoId: source.activeLogoId || logos[0]?.id || null,
    customText,
    textPos,
  };
};

const EMPTY_SIDE = createSideData();

const hasSideContent = (sd) => {
  if (!sd) return false;
  if (Array.isArray(sd.logos) && sd.logos.length > 0) return true;
  if ((sd.customText?.text || "").trim()) return true;
  return false;
};

const UI_SIDES = ["front", "back"];
const UI_VIEWS = ["front", "back"];

const createDesign = (type = DEFAULT_MODEL_TYPE) => {
  const normalizedType = normalizeModelType(type);
  return {
    id: makeId(),
    modelType: normalizedType,
    color: BRAND_DEFAULT_COLOR,
    fabricType: getDefaultFabricType(normalizedType),
    stringColor: "#e6e6e6",
    hoodieV12Parts: { ...DEFAULT_HOODIE_PARTS },
    hasPdf: false,
    pdfFileUrl: "",
    pdfOriginalName: "",
    pdfPlacement: { ...DEFAULT_PDF_PLACEMENT },
    printTypes: [],
    printTypesBySide: {
      front: [],
      back: [],
    },
    size: "M",
    sides: {
      front: createSideData(),
      back: createSideData(),
      left: createSideData(),
      right: createSideData(),
    },
  };
};

const restoreDesignFromCheckoutItem = (item) => {
  const details = item?.designDetails || {};
  const modelType = normalizeModelType(item?.modelType || details?.model || DEFAULT_MODEL_TYPE);
  const base = createDesign(modelType);
  const srcSides = details?.sides || item?.sides || {};
  const restored = {
    ...base,
    id: item?.id || makeId(),
    modelType,
    color: item?.color || details?.baseColor || base.color,
    fabricType: normalizeFabricType(details?.fabricType || item?.fabricType || base.fabricType, modelType),
    stringColor: details?.stringColor || base.stringColor,
    size: item?.size || base.size,
    hoodieV12Parts: normalizeHoodieParts(details?.hoodieV12Parts || item?.hoodieV12Parts),
    hasPdf: Boolean(details?.hasPdf ?? item?.hasPdf),
    pdfFileUrl: details?.pdfFileUrl || item?.pdfFileUrl || "",
    pdfOriginalName: details?.pdfOriginalName || item?.pdfOriginalName || "",
    pdfPlacement: normalizePdfPlacement(details?.pdfPlacement || item?.pdfPlacement, (details?.pdfPlacement || item?.pdfPlacement)?.side || "front"),
    printTypes: Array.isArray(details?.printTypes || item?.printTypes) ? (details?.printTypes || item?.printTypes) : [],
    printTypesBySide: normalizePrintTypesBySide(details?.printTypesBySide || item?.printTypesBySide, details?.printTypes || item?.printTypes),
    sides: {
      front: normalizeSideData(srcSides.front),
      back: normalizeSideData(srcSides.back),
      left: normalizeSideData(srcSides.left),
      right: normalizeSideData(srcSides.right),
    },
  };
  return restored;
};

const normalizePrintTypesBySide = (bySide, legacy = []) => {
  const base = {
    front: [],
    back: [],
  };
  const legacyList = Array.isArray(legacy) ? legacy : [];
  const raw = bySide && typeof bySide === "object" ? bySide : {};
  const next = {
    ...base,
    ...raw,
  };
  const front = Array.from(new Set([...(Array.isArray(next.front) ? next.front : []), ...legacyList]));
  const back = Array.from(new Set(Array.isArray(next.back) ? next.back : []));
  return { front, back };
};

const getPrintTypesForSide = (design, side = "front") => {
  const safeSide = side === "back" ? "back" : "front";
  const bySide = normalizePrintTypesBySide(design?.printTypesBySide, design?.printTypes);
  return bySide[safeSide];
};

const normalizeHoodieParts = (parts) => ({
  ...DEFAULT_HOODIE_PARTS,
  ...(parts && typeof parts === "object" ? parts : {}),
});

const normalizePdfPlacement = (placement, side = "front") => {
  const p = placement && typeof placement === "object" ? placement : {};
  return {
    x: clamp(Number.isFinite(Number(p.x)) ? Number(p.x) : DEFAULT_PDF_PLACEMENT.x, 0.06, 0.94),
    y: clamp(Number.isFinite(Number(p.y)) ? Number(p.y) : DEFAULT_PDF_PLACEMENT.y, 0.06, 0.94),
    w: clamp(Number.isFinite(Number(p.w)) ? Number(p.w) : DEFAULT_PDF_PLACEMENT.w, 0.12, 0.9),
    h: clamp(Number.isFinite(Number(p.h)) ? Number(p.h) : DEFAULT_PDF_PLACEMENT.h, 0.08, 0.9),
    rotation: clamp(Number.isFinite(Number(p.rotation)) ? Number(p.rotation) : 0, -180, 180),
    side: p.side === "back" ? "back" : side === "back" ? "back" : "front",
  };
};

const getHoodieVariantLabel = (parts) => {
  const p = normalizeHoodieParts(parts);
  if (p.strings && p.pocket) return "İpli + Cepli";
  if (p.strings) return "İpli";
  if (p.pocket) return "Cepli";
  return "Standart";
};

const getActiveSides = (design) =>
  Object.entries(design.sides)
    .filter(([k]) => UI_SIDES.includes(k))
    .filter(([_, sd]) => hasSideContent(sd));

const getModelBasePrice = (modelType) => {
  const safe = normalizeModelType(modelType);
  return MODEL_BASE_PRICES[safe] ?? MODEL_BASE_PRICES[DEFAULT_MODEL_TYPE] ?? 350;
};

const isChargeableLargeLogo = (logo) => {
  if (!logo || isEmbossSticker(logo)) return false;
  const box = logo.box || {};
  const w = Number(box.w);
  const h = Number(box.h);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return false;
  return w * h >= LARGE_PRINT_AREA_THRESHOLD_01;
};

const getLargePrintChargeSummary = (design) => {
  const sides = design?.sides || {};
  let count = 0;
  UI_SIDES.forEach((sideKey) => {
    const logos = Array.isArray(sides?.[sideKey]?.logos) ? sides[sideKey].logos : [];
    count += logos.filter(isChargeableLargeLogo).length;
  });
  return {
    count,
    amount: count * LARGE_PRINT_EXTRA_PRICE,
  };
};

const getPrice = (design) => {
  const basePrice = getModelBasePrice(design?.modelType);
  const largePrintCharge = getLargePrintChargeSummary(design).amount;
  return basePrice + largePrintCharge;
};

const roundTo = (value, digits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

const getModelPrintCm = (modelType, side = "front") => {
  const safeModel = normalizeModelType(modelType);
  const sideKey = side === "back" ? "back" : "front";
  const modelCm = CM_LABELS[safeModel] || CM_LABELS[DEFAULT_MODEL_TYPE] || {};
  const cm = modelCm[sideKey] || modelCm.front || { w: 0, h: 0 };
  return {
    w: Number(cm.w) || 0,
    h: Number(cm.h) || 0,
  };
};

const buildRubberSpecsBySide = (design) => {
  const bySide = normalizePrintTypesBySide(design?.printTypesBySide, design?.printTypes);
  const out = {};

  UI_SIDES.forEach((side) => {
    const sideTypes = Array.isArray(bySide?.[side]) ? bySide[side] : [];
    if (!sideTypes.includes("rubber")) return;

    const sideData = design?.sides?.[side];
    const t = sideData?.customText || {};
    const rawText = String(t?.text || "").trim();
    if (!rawText) return;

    const cm = getModelPrintCm(design?.modelType, side);
    const textBounds = estimateTextHalfBounds01(t);
    const sizeWcm = cm.w > 0 ? roundTo(textBounds.halfW01 * 2 * cm.w, 2) : 0;
    const sizeHcm = cm.h > 0 ? roundTo(textBounds.halfH01 * 2 * cm.h, 2) : 0;

    const rubberDepth = 0.2;
    const letterSpacingFactor = clamp(Number(t?.rubberLetterSpacing ?? 1), 0.2, 3);
    const textSizePx = clamp(Number(t?.size) || 150, 30, 420);
    const textScaleX = clamp(Number(t?.scaleX) || 1, 0.3, 3);
    const approxSpacingCm =
      cm.w > 0 ? roundTo((((textSizePx * 0.03 * textScaleX) / 1024) * cm.w) * letterSpacingFactor, 2) : 0;

    out[side] = {
      side,
      text: rawText,
      color: t?.color || "#ffffff",
      font: t?.font || FONT_OPTIONS[0].value,
      sizeCm: { w: sizeWcm, h: sizeHcm },
      thicknessMm: roundTo(rubberDepth * 10, 2),
      letterSpacingCm: approxSpacingCm,
      letterSpacingFactor: roundTo(letterSpacingFactor, 2),
    };
  });

  return out;
};

const getListPriceBeforeLaunchDiscount = (discountedPrice) => {
  const p = Number(discountedPrice || 0);
  if (!Number.isFinite(p) || p <= 0) return 0;
  return Math.round((p / (1 - LAUNCH_DISCOUNT_RATE)) * 100) / 100;
};

const formatMoney = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0";
  if (Math.abs(num - Math.round(num)) < 0.0001) return String(Math.round(num));
  return num.toFixed(2);
};

/* ================= PRINT CANVAS (FOR CART / EXPORT) ================= */
async function makePrintDataUrl(sideData, opts = {}) {
  const logos = sideData?.logos || [];
  const t = sideData?.customText || {};
  const textPos = clampTextPos(sideData?.textPos || { x: 0.5, y: 0.85 }, t);
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
    const fx = getLogoStyle(l);
    const emboss = isEmbossSticker(l);
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
        ctx.scale(fx.flipX ? -1 : 1, fx.flipY ? -1 : 1);
        ctx.globalAlpha = fx.opacity;
        ctx.filter = logoFilterCss(fx);
        ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
        if (emboss) drawEmbossOverlay(ctx, img, bw, bh);
        ctx.restore();
        res();
      };
      img.onerror = () => res();
    });
  };

  const items = [
    ...logos.map((l, idx) => ({ kind: "logo", z: l?.z ?? 0, idx, payload: l })),
    ...(t.text || "").trim()
      ? [{ kind: "text", z: t?.z ?? 0, idx: 9999, payload: t }]
      : [],
  ].sort((a, b) => (a.z !== b.z ? a.z - b.z : a.idx - b.idx));

  for (const item of items) {
    if (item.kind === "logo") {
      // eslint-disable-next-line no-await-in-loop
      await drawLogo(item.payload);
      continue;
    }
    const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420) * (SIZE / 1024);
    drawStyledText(ctx, t, textPos.x * SIZE, textPos.y * SIZE, fontSize);
  }

  // ZIP STRIPE CLEAR
  const gap01 = opts?.clearCenterStripe01;
  if (gap01) {
    const stripeW = Math.round(SIZE * gap01);
    const x0 = SIZE / 2 - stripeW / 2;
    const y0 = Math.round(SIZE * ZIP_STRIPE_TOP01);
    const h = Math.max(1, Math.round(SIZE * (ZIP_STRIPE_BOTTOM01 - ZIP_STRIPE_TOP01)));
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(x0, y0, stripeW, h);
    ctx.restore();
  }

  return c.toDataURL("image/png");
}

/* ================= TEXT-ONLY EXPORT (PER SIDE) ================= */
async function makeTextDataUrl(sideData, opts = {}) {
  const t = sideData?.customText || {};
  const textPos = clampTextPos(sideData?.textPos || { x: 0.5, y: 0.85 }, t);
  if (!(t.text || "").trim()) return null;

  const SIZE = 2048;
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420) * (SIZE / 1024);
  drawStyledText(ctx, t, textPos.x * SIZE, textPos.y * SIZE, fontSize);

  const gap01 = opts?.clearCenterStripe01;
  if (gap01) {
    const stripeW = Math.round(SIZE * gap01);
    const x0 = SIZE / 2 - stripeW / 2;
    const y0 = Math.round(SIZE * ZIP_STRIPE_TOP01);
    const h = Math.max(1, Math.round(SIZE * (ZIP_STRIPE_BOTTOM01 - ZIP_STRIPE_TOP01)));
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(x0, y0, stripeW, h);
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
    const fx = getLogoStyle(l);
    const emboss = isEmbossSticker(l);

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
        ctx.scale(fx.flipX ? -1 : 1, fx.flipY ? -1 : 1);
        ctx.globalAlpha = fx.opacity;
        ctx.filter = logoFilterCss(fx);
        ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
        if (emboss) drawEmbossOverlay(ctx, img, bw, bh);
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

function HdriEnvironment({ urls = [], enabled = true }) {
  const { scene, gl } = useThree();
  const envQueue = useMemo(() => (Array.isArray(urls) ? urls : [urls]).filter(Boolean), [urls]);

  useEffect(() => {
    if (!enabled || envQueue.length === 0) {
      if (scene.environment) scene.environment = null;
      return undefined;
    }

    let disposed = false;
    let sourceTexture = null;
    let envRenderTarget = null;
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const loadAt = async (index) => {
      if (disposed) return;
      if (index >= envQueue.length) {
        if (scene.environment) scene.environment = null;
        return;
      }
      const url = envQueue[index];
      try {
        const cachedTexture = await getHdriSourceTexture(url);
        if (disposed) return;
        const texture = cachedTexture.clone();
        texture.needsUpdate = true;
        const nextTarget = pmrem.fromEquirectangular(texture);
        if (scene.environment === envRenderTarget?.texture) scene.environment = null;
        if (sourceTexture) sourceTexture.dispose();
        if (envRenderTarget) envRenderTarget.dispose();
        sourceTexture = texture;
        envRenderTarget = nextTarget;
        scene.environment = envRenderTarget.texture;
      } catch (err) {
        console.error(`HDR environment yuklenemedi (${url}):`, err);
        loadAt(index + 1);
      }
    };

    loadAt(0);

    return () => {
      disposed = true;
      if (scene.environment === envRenderTarget?.texture) scene.environment = null;
      if (sourceTexture) sourceTexture.dispose();
      if (envRenderTarget) envRenderTarget.dispose();
      pmrem.dispose();
    };
  }, [scene, gl, enabled, envQueue]);

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
      back: new THREE.Vector3(0, 0.24, 2.05 + extra),
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
  const logosForCanvas = useMemo(() => logos.filter((l) => !isEmbossSticker(l)), [logos]);
  const logoSignature = logos
    .map(
      (l) =>
        `${l.id}_${l.box.x.toFixed(3)}_${l.box.y.toFixed(3)}_${l.box.w.toFixed(3)}_${l.box.h.toFixed(3)}_${l.rotation || 0}_${l.z || 0}_${l.opacity ?? 1}_${l.brightness ?? 100}_${l.contrast ?? 100}_${l.saturation ?? 100}_${l.grayscale ?? 0}_${Number(Boolean(l.flipX))}_${Number(Boolean(l.flipY))}_${Number(Boolean(l.emboss))}_${l.kind || "logo"}`
    )
    .join("|");
  const customText = sideData?.customText;
  const textSignature = `${customText?.text}_${customText?.color}_${customText?.size}_${customText?.scaleX}_${customText?.scaleY}_${customText?.font}_${customText?.layout || "straight"}_${customText?.curve ?? 30}_${customText?.rotation ?? 0}_${customText?.z ?? 0}_${Number(Boolean(customText?.emboss))}_${customText?.embossDepth ?? 1.4}_${customText?.embossStrength ?? 1.4}`;
  const posSignature = `${sideData?.textPos?.x}_${sideData?.textPos?.y}`;

  const CANVAS_SIZE = 2048;
  const CANVAS_UPDATE_DEBOUNCE_MS = 6;
  const textEnabled = opts?.disableText !== true;

  useEffect(() => {
    const hasTextContent = textEnabled && (customText?.text || "").trim();
    const hasContent = logosForCanvas.length > 0 || hasTextContent;
    if (!hasContent) {
      setCanvas(null);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      const c = document.createElement("canvas");
      c.width = CANVAS_SIZE;
      c.height = CANVAS_SIZE;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const drawText = () => {
        if (!textEnabled) return;
        const t = customText || {};
        if (!t.text) return;
        const safeTextPos = clampTextPos(sideData?.textPos, t);

        const scaleFactor = CANVAS_SIZE / 1024;
        const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420) * scaleFactor;
        drawStyledText(
          ctx,
          t,
          safeTextPos.x * CANVAS_SIZE,
          safeTextPos.y * CANVAS_SIZE,
          fontSize
        );
      };

      const clearCenterStripe = () => {
        const gap01 = opts?.clearCenterStripe01;
        if (!gap01) return;
        const stripeW = Math.round(CANVAS_SIZE * gap01);
        const x0 = CANVAS_SIZE / 2 - stripeW / 2;
        const y0 = Math.round(CANVAS_SIZE * ZIP_STRIPE_TOP01);
        const h = Math.max(1, Math.round(CANVAS_SIZE * (ZIP_STRIPE_BOTTOM01 - ZIP_STRIPE_TOP01)));
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(x0, y0, stripeW, h);
        ctx.restore();
      };

      const drawLogo = async (l) => {
        const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
        const rotation = (l.rotation || 0) * (Math.PI / 180);
        const fx = getLogoStyle(l);
        const emboss = isEmbossSticker(l);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => {
          if (cancelled) {
            res();
            return;
          }
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = l.url;
          img.onload = () => {
            if (cancelled) {
              res();
              return;
            }
            const bw = box.w * CANVAS_SIZE;
            const bh = box.h * CANVAS_SIZE;
            const cx = box.x * CANVAS_SIZE;
            const cy = box.y * CANVAS_SIZE;
            ctx.save();
            ctx.translate(cx, cy);
            if (rotation) ctx.rotate(rotation);
            ctx.scale(fx.flipX ? -1 : 1, fx.flipY ? -1 : 1);
            ctx.globalAlpha = fx.opacity;
            ctx.filter = logoFilterCss(fx);
            ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
            if (emboss) drawEmbossOverlay(ctx, img, bw, bh);
            ctx.restore();
            res();
          };
          img.onerror = () => res();
        });
      };

      const drawAll = async () => {
        if (cancelled) return;
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const items = [
          ...logosForCanvas.map((l, idx) => ({ kind: "logo", z: l?.z ?? 0, idx, payload: l })),
          ...(hasTextContent
            ? [{ kind: "text", z: customText?.z ?? 0, idx: 9999, payload: customText }]
            : []),
        ].sort((a, b) => (a.z !== b.z ? a.z - b.z : a.idx - b.idx));

        for (const item of items) {
          if (item.kind === "logo") {
            // eslint-disable-next-line no-await-in-loop
            await drawLogo(item.payload);
          } else {
            drawText();
          }
        }
        if (cancelled) return;
        clearCenterStripe();
        setCanvas(c);
      };

      drawAll();
    }, CANVAS_UPDATE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoSignature, textSignature, posSignature, opts?.clearCenterStripe01, opts?.disableText, CANVAS_SIZE, logosForCanvas, customText?.text, textEnabled]);

  return canvas;
}

/* ================= 3D MODEL HELPERS ================= */
function pickDecalHostMesh(root, modelType) {
  const candidates = [];
  const fallbackCandidates = [];

  root.traverse((o) => {
    if (!(o && (o.isMesh || o.isSkinnedMesh) && o.geometry?.attributes?.position)) return;

    o.geometry.computeBoundingBox?.();
    const bb = o.geometry.boundingBox;
    if (!bb) return;

    const size = new THREE.Vector3();
    bb.getSize(size);
    const volume = size.x * size.y * size.z;
    if (!Number.isFinite(volume) || volume <= 0) return;

    const meshName = String(o?.name || "").toLowerCase();
    const isAccessoryLike =
      meshName.includes("hood") ||
      meshName.includes("kapuson") ||
      meshName.includes("sleeve") ||
      meshName.includes("kol") ||
      meshName.includes("draw") ||
      meshName.includes("cord") ||
      meshName.includes("ip") ||
      meshName.includes("pocket") ||
      meshName.includes("cep");

    const hoodYMaxLimit =
      modelType.includes("hoodie") || modelType.includes("fermuarli") ? 0.52 : 0.65;

    const isTorsoLike =
      size.y > 0.6 &&
      size.x > 0.25 &&
      bb.max.y < hoodYMaxLimit &&
      bb.min.y < -0.15;

    if (isTorsoLike) {
      candidates.push({ o, score: volume });
    }

    if (!isAccessoryLike && size.y > 0.35 && size.x > 0.15) {
      fallbackCandidates.push({ o, score: volume });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  if (candidates[0]?.o) return candidates[0].o;

  fallbackCandidates.sort((a, b) => b.score - a.score);
  if (fallbackCandidates[0]?.o) return fallbackCandidates[0].o;

  return null;
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

function shrinkwrapGlyphMeshToSurface(mesh, targetMesh, epsilon = 0.00002, depthBoost = 5.5) {
  if (!mesh?.geometry?.attributes?.position || !targetMesh?.geometry) return;
  const targetGeometry = targetMesh.geometry;
  if (!targetGeometry.boundsTree) {
    targetGeometry.boundsTree = new MeshBVH(targetGeometry);
  }

  targetMesh.updateWorldMatrix(true, true);
  mesh.updateWorldMatrix(true, false);

  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;
  raycaster.far = 5;

  const meshQuat = new THREE.Quaternion();
  mesh.getWorldQuaternion(meshQuat);
  const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(meshQuat).normalize();

  mesh.geometry.computeBoundingBox?.();
  const maxLocalDepth = Math.max(0.0001, mesh.geometry.boundingBox?.max?.z || 0.0001);
  const scaleZ = Math.max(0.0001, Math.abs(mesh.scale.z || 1));
  const worldDepth = maxLocalDepth * scaleZ * Math.max(0.1, depthBoost);

  const pos = mesh.geometry.attributes.position;
  const local = new THREE.Vector3();
  const world = new THREE.Vector3();
  const originA = new THREE.Vector3();
  const originB = new THREE.Vector3();
  const rayA = new THREE.Vector3();
  const rayB = new THREE.Vector3();
  const normalWorld = new THREE.Vector3();
  const snappedWorld = new THREE.Vector3();

  const castDist = 0.18;
  for (let i = 0; i < pos.count; i += 1) {
    local.fromBufferAttribute(pos, i);
    const localDepth = Math.max(0, local.z);
    world.copy(local);
    mesh.localToWorld(world);

    originA.copy(world).addScaledVector(dir, castDist);
    rayA.copy(dir).multiplyScalar(-1);
    raycaster.set(originA, rayA);
    const hitA = (raycaster.intersectObject(targetMesh, false) || [])[0] || null;

    originB.copy(world).addScaledVector(dir, -castDist);
    rayB.copy(dir);
    raycaster.set(originB, rayB);
    const hitB = (raycaster.intersectObject(targetMesh, false) || [])[0] || null;

    let hit = null;
    let usedOrigin = null;
    let usedRay = null;

    if (hitA && hitB) {
      const dA = hitA.point.distanceTo(world);
      const dB = hitB.point.distanceTo(world);
      if (dA <= dB) {
        hit = hitA;
        usedOrigin = originA;
        usedRay = rayA;
      } else {
        hit = hitB;
        usedOrigin = originB;
        usedRay = rayB;
      }
    } else if (hitA) {
      hit = hitA;
      usedOrigin = originA;
      usedRay = rayA;
    } else if (hitB) {
      hit = hitB;
      usedOrigin = originB;
      usedRay = rayB;
    }

    if (!hit) continue;

    if (hit.face?.normal) {
      normalWorld.copy(hit.face.normal).transformDirection(targetMesh.matrixWorld).normalize();
    } else {
      normalWorld.copy(usedRay).multiplyScalar(-1).normalize();
    }

    if (normalWorld.dot(dir) < 0) normalWorld.multiplyScalar(-1);

    const depthRatio = clamp(localDepth / maxLocalDepth, 0, 1);
    const depthOffset = depthRatio * worldDepth;
    snappedWorld.copy(hit.point).addScaledVector(normalWorld, epsilon + depthOffset);
    mesh.worldToLocal(snappedWorld);
    pos.setXYZ(i, snappedWorld.x, snappedWorld.y, snappedWorld.z);
  }

  pos.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

function ShrinkwrappedRubberGlyph({
  baseGeometry,
  targetMesh,
  position,
  rotationZ,
  scale,
  color,
  shrinkwrap = true,
  stick = 0.96,
  depthBoost = 5.5,
  placementKey = "",
}) {
  const meshRef = useRef(null);
  const [px, py, pz] = position;
  const [sx, sy, sz] = scale;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !baseGeometry) return;

    const wrapped = baseGeometry.clone();
    const prev = mesh.geometry;
    mesh.geometry = wrapped;
    if (prev && prev !== wrapped) prev.dispose?.();

    if (shrinkwrap && targetMesh?.geometry) {
      const eps = 0.000008 + (1 - clamp(stick, 0.7, 1)) * 0.00035;
      try {
        shrinkwrapGlyphMeshToSurface(mesh, targetMesh, eps, depthBoost);
      } catch (err) {
        console.warn("Rubber shrinkwrap failed:", err);
      }
    }
  }, [baseGeometry, targetMesh, px, py, pz, rotationZ, sx, sy, sz, shrinkwrap, stick, depthBoost, placementKey]);

  useEffect(
    () => () => {
      const mesh = meshRef.current;
      if (mesh?.geometry) mesh.geometry.dispose?.();
    },
    []
  );

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, 0, rotationZ]}
      scale={scale}
      renderOrder={42}
    >
      <bufferGeometry />
      <meshPhysicalMaterial
        color={color}
        roughness={0.86}
        metalness={0.02}
        clearcoat={0.08}
        clearcoatRoughness={0.75}
        reflectivity={0.15}
        sheen={0.14}
        envMapIntensity={0.26}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-8}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

function Real3DModel({
  color,
  stringColor,
  frontCanvas,
  backCanvas,
  modelType,
  hoodieV12Parts,
  fabricType,
  view,
  isMobile,
  frontSideData,
  backSideData,
  frontPrintTypes = [],
  backPrintTypes = [],
}) {
  const modelPathRaw = MODEL_PATHS[normalizeModelType(modelType)] || MODEL_PATHS[DEFAULT_MODEL_TYPE];
  const gltf = useGLTF(toSafeUrl(modelPathRaw));
  const glyphGltf = useGLTF(toSafeUrl(RUBBER_GLYPH_MODEL_PATH));

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
    // White/very light tones are gently compressed to avoid blown-out cloth.
    const whiteTaming = clamp((lum - 0.84) / 0.16, 0, 1);
    if (whiteTaming > 0) {
      base.multiplyScalar(1 - whiteTaming * 0.14);
    }
    const darkBoost = clamp((0.42 - lum) / 0.42, 0, 1);
    const lightBoost = clamp((lum - 0.72) / 0.28, 0, 1);
    const fabric = normalizeFabricType(fabricType, modelType);
    const fabricMap = {
      "supreme-24x1": { rough: 0.01, metal: 0, env: 0.01 },
      "supreme-30x1": { rough: 0.03, metal: 0, env: -0.01 },
      "iplik-3-sardonsuz": { rough: 0.02, metal: 0, env: -0.005 },
      "iplik-3-sardonlu": { rough: 0.045, metal: 0, env: -0.025 },
    };
    const fabricFx = fabricMap[fabric] || fabricMap["supreme-24x1"];

    return new THREE.MeshPhysicalMaterial({
      color: base,
      // Fabric feel (MeshPhysicalMaterial):
      // clearcoat: 0 (mat)
      // sheen: 1.0 (kadifemsi yuzey yansimasi)
      // sheenRoughness: 0.5 (liflerin daginikligi)
      clearcoat: 0,
      sheen: 1.0,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0xcccccc), // Hafif gri sheen
      roughness: clamp(0.92 + 0.02 * lightBoost + fabricFx.rough, 0.85, 0.98),
      metalness: 0.0,
      envMapIntensity: clamp(0.20 + 0.08 * darkBoost - 0.22 * lightBoost + fabricFx.env, 0.1, 0.4),
      emissive: base,
      emissiveIntensity: 0,
      side: THREE.FrontSide,
    });
  }, [color, fabricType]);

  const laceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(stringColor || "#e6e6e6"),
        roughness: 0.94,
        metalness: 0.008,
        envMapIntensity: 0.62,
        side: THREE.FrontSide,
      }),
    [stringColor]
  );

  const glyphLibrary = useMemo(() => {
    const source = glyphGltf?.scene;
    const next = {};
    if (!source) return next;
    source.traverse((o) => {
      if (!(o && (o.isMesh || o.isSkinnedMesh) && o.geometry)) return;
      const ch = glyphNodeNameToChar(o.name);
      if (!ch || next[ch]) return;
      const geometry = o.geometry.clone();
      geometry.computeBoundingBox?.();
      let bb = geometry.boundingBox;
      if (!bb) return;
      const cx = (bb.min.x + bb.max.x) / 2;
      const zMin = bb.min.z;
      // Baseline'i sabitle: tum harflerin alt zemini aynı seviyede dursun.
      geometry.translate(-cx, -bb.min.y, -zMin);
      geometry.computeBoundingBox?.();
      bb = geometry.boundingBox;
      if (!bb) return;
      const size = new THREE.Vector3();
      bb.getSize(size);
      next[ch] = {
        geometry,
        width: Math.max(0.001, size.x),
        height: Math.max(0.001, size.y),
        depth: Math.max(0.0002, size.z),
      };
    });
    return next;
  }, [glyphGltf]);

  useEffect(() => {
    return () => {
      Object.values(glyphLibrary).forEach((entry) => entry?.geometry?.dispose?.());
    };
  }, [glyphLibrary]);

  useLayoutEffect(() => {
    if (!root) return;
    const isHoodieWithParts = MODELS_WITH_HOODIE_PARTS.has(modelType);
    const showStrings = !!hoodieV12Parts?.strings;
    const showPocket = !!hoodieV12Parts?.pocket;

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
      if (isHoodieWithParts) {
        const meshName = (o?.name || "").toLowerCase();
        if (meshName.includes("hoodie_ipler") || meshName.includes("_ip") || meshName.includes("ipler")) {
          o.visible = showStrings;
          o.material = laceMaterial;
          return;
        }
        if (meshName.includes("hoodie_cep") || meshName.includes("_cep") || meshName.includes("cep")) {
          o.visible = showPocket;
          o.material = bodyMaterial;
          return;
        }
        o.visible = true;
        o.material = bodyMaterial;
        return;
      }
      o.visible = true;
      o.material = looksLikeLace(o) ? laceMaterial : bodyMaterial;
    });
  }, [root, bodyMaterial, laceMaterial, modelType, hoodieV12Parts?.strings, hoodieV12Parts?.pocket]);

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

  const frontProfile = getPrintProfile(modelType, "front", hoodieV12Parts);
  const backProfile = getPrintProfile(modelType, "back", hoodieV12Parts);

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
  const frontHasRubber = Array.isArray(frontPrintTypes) && frontPrintTypes.includes("rubber");
  const backHasRubber = Array.isArray(backPrintTypes) && backPrintTypes.includes("rubber");
  const frontEmbossLogos = useMemo(
    () => (frontSideData?.logos || []).filter((l) => isEmbossSticker(l)),
    [frontSideData?.logos]
  );
  const backEmbossLogos = useMemo(
    () => (backSideData?.logos || []).filter((l) => isEmbossSticker(l)),
    [backSideData?.logos]
  );
  const frontEmbossUrls = useMemo(() => frontEmbossLogos.map((l) => l.url), [frontEmbossLogos]);
  const backEmbossUrls = useMemo(() => backEmbossLogos.map((l) => l.url), [backEmbossLogos]);
  const frontEmbossTextures = useTexture(frontEmbossUrls);
  const backEmbossTextures = useTexture(backEmbossUrls);

  useEffect(() => {
    const all = [...frontEmbossTextures, ...backEmbossTextures];
    all.forEach((tex) => {
      if (!tex) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 12;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
    });
  }, [frontEmbossTextures, backEmbossTextures]);

  const renderRubberText = (side, sideData, profile, areaW, areaH, enabled) => {
    if (!enabled) return null;
    const textState = sideData?.customText || {};
    const rawText = String(textState?.text || "").trim();
    if (!rawText) return null;
    const chars = [...rawText];
    if (!chars.length) return null;
    const layout = String(textState?.layout || "straight");
    const curve = getTextCurveValue(textState);
    const scaleX = clamp(Number(textState?.scaleX) || 1, 0.3, 3);
    const scaleY = clamp(Number(textState?.scaleY) || 1, 0.3, 3);

    const resolveGlyphForChar = (ch) => {
      if (!ch) return null;
      if (glyphLibrary[ch]) return glyphLibrary[ch];

      const isLetter = /\p{L}/u.test(ch);
      if (isLetter) {
        const upper = ch.toUpperCase();
        const lower = ch.toLowerCase();
        if (ch === upper) {
          // Kullanici buyuk harf girdiyse once buyuk harf geometrisini zorla.
          return glyphLibrary[upper] || null;
        }
        if (ch === lower) {
          return glyphLibrary[lower] || glyphLibrary[upper] || null;
        }
        return glyphLibrary[ch] || glyphLibrary[upper] || glyphLibrary[lower] || null;
      }

      return glyphLibrary[ch.toUpperCase()] || glyphLibrary[ch.toLowerCase()] || null;
    };

    const entries = chars.map((ch) => {
      if (ch === " ") return { char: ch, width: 0.52, isSpace: true };
      const glyph = resolveGlyphForChar(ch);
      if (!glyph) return { char: ch, width: 0.52, isSpace: true };
      return { char: ch, ...glyph, isSpace: false };
    });

    const avgGlyphW = entries
      .filter((entry) => !entry.isSpace)
      .reduce((sum, entry, _, arr) => sum + entry.width / Math.max(1, arr.length), 0) || 0.58;
    const rubberLetterSpacing = clamp(Number(textState?.rubberLetterSpacing ?? 1), 0.2, 3);
    const spacingRaw = clamp(avgGlyphW * 0.18, 0.02, 0.9);

    const positions = [];
    let cursor = 0;
    entries.forEach((entry, idx) => {
      const stepW = entry.isSpace ? avgGlyphW * 0.55 : entry.width;
      positions[idx] = { x: cursor + stepW / 2, width: stepW };
      cursor += stepW + spacingRaw;
    });
    const totalRawW = Math.max(0.001, cursor - spacingRaw);
    const maxRawH = Math.max(
      0.001,
      ...entries.filter((entry) => !entry.isSpace).map((entry) => entry.height)
    );
    const maxRawD = Math.max(
      0.0002,
      ...entries.filter((entry) => !entry.isSpace).map((entry) => entry.depth || 0.0002)
    );
    const ampRaw = clamp((curve / 100) * maxRawH, 0, maxRawH * 2.8);
    const layoutRows = entries.map((entry, idx) => {
      const baseX = positions[idx].x - totalRawW / 2;
      const count = Math.max(entries.length, 1);
      const p = count > 1 ? idx / (count - 1) : 0.5;
      const norm = count > 1 ? p * 2 - 1 : 0;
      const phase = p * Math.PI * 2;
      let yRaw = 0;
      let rotDeg = 0;

      if (layout === "wave" || layout === "wave-soft" || layout === "wave-strong") {
        const waveMul = layout === "wave-soft" ? 0.7 : layout === "wave-strong" ? 1.35 : 1;
        const rotMul = layout === "wave-soft" ? 0.11 : layout === "wave-strong" ? 0.21 : 0.16;
        yRaw = Math.sin(phase) * ampRaw * waveMul;
        rotDeg = Math.cos(phase) * curve * rotMul;
      } else if (layout === "zigzag") {
        yRaw = (idx % 2 === 0 ? -1 : 1) * ampRaw * 0.7;
        rotDeg = (idx % 2 === 0 ? -1 : 1) * curve * 0.2;
      } else if (layout === "stair-up" || layout === "stair-down") {
        const dir = layout === "stair-up" ? -1 : 1;
        yRaw = dir * (p - 0.5) * 2 * ampRaw * 1.1;
        rotDeg = dir * 6;
      } else if (layout === "arc-up" || layout === "arc-down" || layout === "arc-up-strong" || layout === "arc-down-strong") {
        const arcDown = layout === "arc-down" || layout === "arc-down-strong";
        const strong = layout === "arc-up-strong" || layout === "arc-down-strong";
        const arcMul = strong ? 2.05 : 1.45;
        const rotMul = strong ? 0.75 : 0.55;
        yRaw = (arcDown ? 1 : -1) * Math.pow(norm, 2) * ampRaw * arcMul;
        rotDeg = norm * curve * rotMul;
      }

      const top = yRaw + (entry.height || maxRawH);
      const bottom = yRaw;
      return { entry, baseX, yRaw, rotDeg, top, bottom };
    });

    const minRawY = layoutRows.reduce((min, row) => Math.min(min, row.bottom), 0);
    const maxRawY = layoutRows.reduce((max, row) => Math.max(max, row.top), maxRawH);
    const centerRawY = (minRawY + maxRawY) / 2;
    const totalRawH = Math.max(0.001, maxRawY - minRawY);

    const textBounds01 = estimateTextHalfBounds01(textState);
    const targetW = clamp(textBounds01.halfW01 * 2 * areaW, 0.03, areaW * 0.96);
    const targetH = clamp(textBounds01.halfH01 * 2 * areaH, 0.03, areaH * 0.88);
    const fitWScale = (areaW * 0.96) / Math.max(0.001, totalRawW * scaleX);
    const fitHScale = (areaH * 0.88) / Math.max(0.001, totalRawH * scaleY);
    const scaleRaw = Math.min(targetW / totalRawW, targetH / maxRawH, fitWScale, fitHScale);
    const glyphScale = clamp(scaleRaw, 0.01, 1.35);
    const rubberDepth = 0.2;
    const rubberStick = clamp(Number(textState?.rubberStick ?? 0.96), 0.7, 1);
    const depthT = 0;
    const zScale = clamp(
      (0.07 + depthT * 0.08) * (maxRawD / 0.024),
      0.06,
      0.17
    );
    const depthBoost = 3.2 + depthT * 2.2;
    const placedW = totalRawW * glyphScale * scaleX * rubberLetterSpacing;
    const placedH = totalRawH * glyphScale * scaleY;

    const safeTextPos = clampTextPos(sideData?.textPos, textState);
    const halfW = placedW / 2;
    const halfH = placedH / 2;
    const edgePad = 0.002;
    const cx = clamp(
      profile.xMin + safeTextPos.x * areaW,
      profile.xMin + halfW + edgePad,
      profile.xMax - halfW - edgePad
    );
    const cy = clamp(
      profile.yTop - safeTextPos.y * areaH,
      profile.yBot + halfH + edgePad,
      profile.yTop - halfH - edgePad
    );
    const rz = ((Number(textState?.rotation) || 0) * Math.PI) / 180;
    const stickLift = (1 - rubberStick) * 0.00032;
    const zNudge = side === "back" ? -(0.000012 + stickLift) : 0.000012 + stickLift;
    const sideRotY = Number(profile.rotY ?? (side === "back" ? Math.PI : 0));
    const textColor = textState?.color || "#f4f4f4";
    const yLift = 0;
    const placementKey = `${side}_${cx}_${cy}_${profile.z || 0}_${sideRotY}_${rz}`;

    return (
      <group
        key={`rubber-text-${side}-${rawText}`}
        position={[cx, cy + yLift, (profile.z || 0) + zNudge]}
        rotation={[0, sideRotY, rz]}
      >
        {layoutRows.map((row, idx) => {
          const entry = row.entry;
          if (!entry.geometry || entry.isSpace) return null;
          const x = row.baseX * glyphScale * scaleX * rubberLetterSpacing;
          const y = (row.yRaw - centerRawY) * glyphScale * scaleY;
          return (
            <ShrinkwrappedRubberGlyph
              key={`rubber-glyph-${side}-${entry.char}-${idx}`}
              baseGeometry={entry.geometry}
              targetMesh={decalHost}
              position={[x, y, 0]}
              rotationZ={(row.rotDeg * Math.PI) / 180}
              scale={[glyphScale * scaleX, glyphScale * scaleY, zScale]}
              color={textColor}
              shrinkwrap
              stick={rubberStick}
              depthBoost={depthBoost}
              placementKey={placementKey}
            />
          );
        })}
      </group>
    );
  };

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
                <meshBasicMaterial
                  map={frontTex}
                  toneMapped={false}
                  color="#ffffff"
                  transparent
                  alphaTest={0.02}
                  depthWrite={false}
                  polygonOffset
                  polygonOffsetFactor={-10}
                  side={THREE.FrontSide}
                />
              </Decal>
            )}

            {showFront &&
              frontEmbossLogos.map((logo, idx) => {
                const tex = frontEmbossTextures[idx];
                if (!tex) return null;
                const box = logo?.box || { x: 0.5, y: 0.6, w: 0.62, h: 0.42 };
                const cx = frontProfile.xMin + box.x * frontW;
                const cy = frontProfile.yTop - box.y * frontH;
                const decalW = clamp(box.w * frontW, 0.01, frontW);
                const decalH = clamp(box.h * frontH, 0.01, frontH);
                const rz = ((logo?.rotation || 0) * Math.PI) / 180;
                const fx = getLogoStyle(logo);
                return (
                  <React.Fragment key={`emboss-front-wrap-${logo.id || idx}`}>
                    <Decal
                      mesh={decalHostRef}
                      position={[cx, cy, frontProfile.z + torsoZOffsetFront + 0.0026]}
                      rotation={[0, frontProfile.rotY || 0, rz]}
                      scale={[decalW * 1.12, decalH * 1.12, TORSO_DEPTH * 0.9]}
                    >
                      <meshStandardMaterial
                        color="#0f1218"
                        alphaMap={tex}
                        transparent
                        opacity={clamp(fx.opacity * 0.32, 0, 0.42)}
                        alphaTest={0.09}
                        roughness={0.98}
                        metalness={0.0}
                        envMapIntensity={0.22}
                        depthWrite={false}
                        polygonOffset
                        polygonOffsetFactor={-10}
                        side={THREE.FrontSide}
                      />
                    </Decal>
                    <Decal
                      mesh={decalHostRef}
                      position={[cx, cy, frontProfile.z + torsoZOffsetFront + 0.0036]}
                      rotation={[0, frontProfile.rotY || 0, rz]}
                      scale={[decalW * 1.085, decalH * 1.085, TORSO_DEPTH * 0.84]}
                    >
                      <meshStandardMaterial
                        color="#212732"
                        alphaMap={tex}
                        transparent
                        opacity={clamp(fx.opacity * 0.95, 0, 1)}
                        alphaTest={0.07}
                        roughness={0.96}
                        metalness={0.004}
                        envMapIntensity={0.34}
                        bumpMap={tex}
                        bumpScale={7.8}
                        depthWrite={false}
                        polygonOffset
                        polygonOffsetFactor={-12}
                        side={THREE.FrontSide}
                      />
                    </Decal>
                    <Decal
                      mesh={decalHostRef}
                      position={[cx, cy, frontProfile.z + torsoZOffsetFront + 0.0052]}
                      rotation={[0, frontProfile.rotY || 0, rz]}
                      scale={[decalW, decalH, TORSO_DEPTH * 0.6]}
                    >
                      <meshStandardMaterial
                        map={tex}
                        alphaMap={tex}
                        transparent
                        opacity={fx.opacity}
                        alphaTest={0.06}
                        roughness={0.84}
                        metalness={0.004}
                        envMapIntensity={0.48}
                        bumpMap={tex}
                        bumpScale={11.8}
                        depthWrite={false}
                        polygonOffset
                        polygonOffsetFactor={-14}
                        side={THREE.FrontSide}
                      />
                    </Decal>
                  </React.Fragment>
                );
              })}

            {showFront && renderRubberText("front", frontSideData, frontProfile, frontW, frontH, frontHasRubber)}

            {showBack && backTex && (
              <Decal
                mesh={decalHostRef}
                position={[0, backCY, backProfile.z + torsoZOffsetBack]}
                rotation={[0, backProfile.rotY || Math.PI, 0]}
                scale={[backW, backH, TORSO_DEPTH]}
              >
                <meshBasicMaterial
                  map={backTex}
                  toneMapped={false}
                  color="#ffffff"
                  transparent
                  alphaTest={0.02}
                  depthWrite={false}
                  polygonOffset
                  polygonOffsetFactor={-10}
                  side={THREE.FrontSide}
                />
              </Decal>
            )}

            {showBack && renderRubberText("back", backSideData, backProfile, backW, backH, backHasRubber)}

            {showBack &&
              backEmbossLogos.map((logo, idx) => {
                const tex = backEmbossTextures[idx];
                if (!tex) return null;
                const box = logo?.box || { x: 0.5, y: 0.6, w: 0.62, h: 0.42 };
                const cx = backProfile.xMin + box.x * backW;
                const cy = backProfile.yTop - box.y * backH;
                const decalW = clamp(box.w * backW, 0.01, backW);
                const decalH = clamp(box.h * backH, 0.01, backH);
                const rz = ((logo?.rotation || 0) * Math.PI) / 180;
                const fx = getLogoStyle(logo);
                return (
                  <React.Fragment key={`emboss-back-wrap-${logo.id || idx}`}>
                    <Decal
                      mesh={decalHostRef}
                      position={[cx, cy, backProfile.z + torsoZOffsetBack - 0.0026]}
                      rotation={[0, backProfile.rotY || Math.PI, rz]}
                      scale={[decalW * 1.12, decalH * 1.12, TORSO_DEPTH * 0.9]}
                    >
                      <meshStandardMaterial
                        color="#0f1218"
                        alphaMap={tex}
                        transparent
                        opacity={clamp(fx.opacity * 0.32, 0, 0.42)}
                        alphaTest={0.09}
                        roughness={0.98}
                        metalness={0.0}
                        envMapIntensity={0.22}
                        depthWrite={false}
                        polygonOffset
                        polygonOffsetFactor={-10}
                        side={THREE.FrontSide}
                      />
                    </Decal>
                    <Decal
                      mesh={decalHostRef}
                      position={[cx, cy, backProfile.z + torsoZOffsetBack - 0.0036]}
                      rotation={[0, backProfile.rotY || Math.PI, rz]}
                      scale={[decalW * 1.085, decalH * 1.085, TORSO_DEPTH * 0.84]}
                    >
                      <meshStandardMaterial
                        color="#212732"
                        alphaMap={tex}
                        transparent
                        opacity={clamp(fx.opacity * 0.95, 0, 1)}
                        alphaTest={0.07}
                        roughness={0.96}
                        metalness={0.004}
                        envMapIntensity={0.34}
                        bumpMap={tex}
                        bumpScale={7.8}
                        depthWrite={false}
                        polygonOffset
                        polygonOffsetFactor={-12}
                        side={THREE.FrontSide}
                      />
                    </Decal>
                    <Decal
                      mesh={decalHostRef}
                      position={[cx, cy, backProfile.z + torsoZOffsetBack - 0.0052]}
                      rotation={[0, backProfile.rotY || Math.PI, rz]}
                      scale={[decalW, decalH, TORSO_DEPTH * 0.6]}
                    >
                      <meshStandardMaterial
                        map={tex}
                        alphaMap={tex}
                        transparent
                        opacity={fx.opacity}
                        alphaTest={0.06}
                        roughness={0.84}
                        metalness={0.004}
                        envMapIntensity={0.48}
                        bumpMap={tex}
                        bumpScale={11.8}
                        depthWrite={false}
                        polygonOffset
                        polygonOffsetFactor={-14}
                        side={THREE.FrontSide}
                      />
                    </Decal>
                  </React.Fragment>
                );
              })}
          </>
        )}
      </Center>
    </group>
  );
}

/* ================= RESIZE FRAME ================= */
function ResizeFrame({
  box,
  onChange,
  rotation = 0,
  onRotateChange,
  onFrameTap,
  transformMode = "resize",
  containerRef,
  onDragStateChange,
  diagonalOnly = false,
  disableResize = false,
  largeHandles = false,
}) {
  const dragRef = useRef(null);
  const rafRef = useRef(0);
  const pendingBoxRef = useRef(null);

  const flushPendingChange = () => {
    if (!pendingBoxRef.current) return;
    onChange(pendingBoxRef.current);
    pendingBoxRef.current = null;
  };

  const queueChange = (nextBox) => {
    pendingBoxRef.current = nextBox;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      flushPendingChange();
    });
  };

  const getPointer01 = (e, rect) => ({
    x: clamp01((e.clientX - rect.left) / rect.width),
    y: clamp01((e.clientY - rect.top) / rect.height),
  });

  const begin = (mode, e) => {
    if (disableResize && mode !== "move" && mode !== "rotate") return;
    if (diagonalOnly && (mode === "t" || mode === "b" || mode === "l" || mode === "r")) return;
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef?.current) return;
    if (e.target?.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch { }
    }

    const rect = containerRef.current.getBoundingClientRect();
    const { x: px, y: py } = getPointer01(e, rect);

    dragRef.current = {
      mode,
      rect,
      startBox: { ...box },
      startClient: { x: e.clientX, y: e.clientY },
      moved: false,
      startRotation: Number(rotation) || 0,
      startAngle: Math.atan2(py - box.y, px - box.x),
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
    if (!s.moved) {
      const dx = Math.abs(e.clientX - s.startClient.x);
      const dy = Math.abs(e.clientY - s.startClient.y);
      if (dx > 2 || dy > 2) s.moved = true;
    }

    const { x: px, y: py } = getPointer01(e, s.rect);
    const minW = 0.12;
    const minH = 0.12;

    if (s.mode === "rotate") {
      if (!onRotateChange) return;
      const currentAngle = Math.atan2(py - s.startBox.y, px - s.startBox.x);
      const deltaDeg = ((currentAngle - s.startAngle) * 180) / Math.PI;
      let nextRot = s.startRotation + deltaDeg;
      nextRot = ((((nextRot + 180) % 360) + 360) % 360) - 180;
      onRotateChange(Math.round(nextRot));
      return;
    }

    if (s.mode === "move") {
      const halfW = s.startBox.w / 2;
      const halfH = s.startBox.h / 2;
      queueChange({
        x: clamp(px + s.moveOffset.dx, halfW, 1 - halfW),
        y: clamp(py + s.moveOffset.dy, halfH, 1 - halfH),
        w: s.startBox.w,
        h: s.startBox.h,
      });
      return;
    }

    if (diagonalOnly) {
      const ratio = Math.max(0.01, (s.startBox.w || 1) / (s.startBox.h || 1));
      let anchorX = s.startEdges.right;
      let anchorY = s.startEdges.bottom;
      let maxW = anchorX;
      let maxH = anchorY;
      let rawW = Math.abs(anchorX - px);
      let rawH = Math.abs(anchorY - py);

      if (s.mode === "rt") {
        anchorX = s.startEdges.left;
        anchorY = s.startEdges.bottom;
        maxW = 1 - anchorX;
        maxH = anchorY;
        rawW = Math.abs(px - anchorX);
        rawH = Math.abs(anchorY - py);
      } else if (s.mode === "rb") {
        anchorX = s.startEdges.left;
        anchorY = s.startEdges.top;
        maxW = 1 - anchorX;
        maxH = 1 - anchorY;
        rawW = Math.abs(px - anchorX);
        rawH = Math.abs(py - anchorY);
      } else if (s.mode === "lb") {
        anchorX = s.startEdges.right;
        anchorY = s.startEdges.top;
        maxW = anchorX;
        maxH = 1 - anchorY;
        rawW = Math.abs(anchorX - px);
        rawH = Math.abs(py - anchorY);
      }

      const dwNorm = rawW / Math.max(0.001, s.startBox.w || 1);
      const dhNorm = rawH / Math.max(0.001, s.startBox.h || 1);
      let w = dwNorm >= dhNorm ? rawW : rawH * ratio;
      let h = w / ratio;

      w = clamp(w, minW, maxW);
      h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      if (h < minH) {
        h = minH;
        w = h * ratio;
      }
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }

      let left = s.startEdges.left;
      let right = s.startEdges.right;
      let top = s.startEdges.top;
      let bottom = s.startEdges.bottom;

      if (s.mode === "lt") {
        left = anchorX - w;
        right = anchorX;
        top = anchorY - h;
        bottom = anchorY;
      } else if (s.mode === "rt") {
        left = anchorX;
        right = anchorX + w;
        top = anchorY - h;
        bottom = anchorY;
      } else if (s.mode === "rb") {
        left = anchorX;
        right = anchorX + w;
        top = anchorY;
        bottom = anchorY + h;
      } else if (s.mode === "lb") {
        left = anchorX - w;
        right = anchorX;
        top = anchorY;
        bottom = anchorY + h;
      }

      queueChange({
        x: left + w / 2,
        y: top + h / 2,
        w,
        h,
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
    queueChange({ x: left + w / 2, y: top + h / 2, w, h });
  };

  const end = (e) => {
    if (e.target?.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch { }
    }
    const s = dragRef.current;
    const wasTap = Boolean(s && s.mode === "move" && !s.moved);
    dragRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    flushPendingChange();
    if (wasTap) onFrameTap?.();
    onDragStateChange?.(false);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
  };

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    },
    []
  );

  return (
    <div
      className={`absolute border-2 rounded-lg group ${
        transformMode === "rotate" ? "border-cyan-300/90 border-dashed" : "border-white/75 cursor-grab active:cursor-grabbing"
      }`}
      style={{
        left: pct(box.x - box.w / 2),
        top: pct(box.y - box.h / 2),
        width: pct(box.w),
        height: pct(box.h),
        touchAction: "none",
        pointerEvents: "auto",
        zIndex: 60,
      }}
      onPointerDown={
        transformMode === "rotate"
          ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            onFrameTap?.();
          }
          : (e) => begin("move", e)
      }
    >
      {!disableResize && transformMode === "resize" &&
        [
          ["lt", 0, 0],
          ["t", 50, 0],
          ["rt", 100, 0],
          ["r", 100, 50],
          ["rb", 100, 100],
          ["b", 50, 100],
          ["lb", 0, 100],
          ["l", 0, 50],
        ]
          .filter(([key]) => !diagonalOnly || ["lt", "rt", "rb", "lb"].includes(key))
          .map(([key, lx, ty]) => (
            <div
              key={key}
              className={`absolute ${largeHandles ? "w-7 h-7" : "w-6 h-6"} bg-white rounded-full border border-zinc-400 shadow-sm opacity-95 transition-transform group-hover:scale-105`}
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
      {onRotateChange && transformMode === "rotate" &&
        [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100],
        ].map(([lx, ty], idx) => (
          <div
            key={`rot-handle-${idx}`}
            className={`absolute ${largeHandles ? "w-8 h-8 text-[13px]" : "w-7 h-7 text-[12px]"} bg-cyan-50 rounded-full border border-cyan-300 shadow-sm opacity-95 text-cyan-900 font-black flex items-center justify-center`}
            style={{
              left: `${lx}%`,
              top: `${ty}%`,
              transform: "translate(-50%, -50%)",
              touchAction: "none",
              cursor: "grab",
            }}
            onPointerDown={(e) => begin("rotate", e)}
          >
            ⟳
          </div>
        ))}
    </div>
  );
}

/* ================= DESIGN MODEL ITEM ================= */
function DesignModelItem({
  design,
  isActive,
  isHovered,
  isSceneFocused,
  showModelDeleteButton,
  canDeleteModel,
  enableLongPressDelete,
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
  onUserRotate,
  onModelTap,
  onModelLongPress,
  onDeleteModel,
}) {
  const groupRef = useRef(null);
  const userRotRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, pid: null, startX: 0, startY: 0, startRotY: 0, startRotX: 0 });
  const holdRef = useRef({ timer: null, pid: null, startX: 0, startY: 0, triggered: false });

  const ROT_SPEED = isMobile ? 0.014 : 0.01;
  const clampRotX = (v) => Math.max(isMobile ? -0.9 : -0.75, Math.min(isMobile ? 0.9 : 0.75, v));
  const clampRotY = (v) => Math.max(isMobile ? -1.05 : -0.85, Math.min(isMobile ? 1.05 : 0.85, v));

  const clearHoldTimer = () => {
    if (holdRef.current.timer) {
      clearTimeout(holdRef.current.timer);
      holdRef.current.timer = null;
    }
    holdRef.current.pid = null;
    holdRef.current.triggered = false;
  };

  const armHoldTimer = (e) => {
    if (!enableLongPressDelete) return;
    clearHoldTimer();
    holdRef.current.pid = e.pointerId;
    holdRef.current.startX = e.clientX;
    holdRef.current.startY = e.clientY;
    holdRef.current.triggered = false;
    holdRef.current.timer = setTimeout(() => {
      holdRef.current.triggered = true;
      onModelLongPress?.(design.id);
      document.body.style.cursor = "default";
    }, 420);
  };

  useEffect(() => {
    return () => clearHoldTimer();
  }, []);

  useEffect(() => {
    userRotRef.current = { x: 0, y: 0 };
    onUserRotate?.(design.id, { x: 0, y: 0 });
  }, [view, design.id]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;

    g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, Math.min(1, delta * 6));
    g.position.z = THREE.MathUtils.lerp(g.position.z, targetZ, Math.min(1, delta * 6));

    const desiredRotY = targetRotY + (isActive ? userRotRef.current.y : 0);
    const desiredRotX = isActive ? userRotRef.current.x : 0;

    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, desiredRotY, Math.min(1, delta * 10));
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, desiredRotX, Math.min(1, delta * 10));

    const nextS = targetScale + (isHovered ? 0.06 : 0) + (isActive ? 0.05 : 0) + (isSceneFocused ? 0.14 : 0);
    const lerped = THREE.MathUtils.lerp(g.scale.x || 1, nextS, Math.min(1, delta * 10));
    g.scale.setScalar(lerped);
  });

  const isZipper = hasCenterZip(design.modelType);
  const gap01 = MODEL_PRINT_BOUNDS?.[design.modelType]?.front?.zipGap01 ?? MODEL_PRINT_BOUNDS?.fermuarli?.front?.zipGap01 ?? 0.08;
  const printTypesBySide = normalizePrintTypesBySide(design.printTypesBySide, design.printTypes);
  const frontHasRubber = (printTypesBySide.front || []).includes("rubber");
  const backHasRubber = (printTypesBySide.back || []).includes("rubber");

  const frontCanvas = useDesignCanvas(
    design.sides.front || EMPTY_SIDE,
    isZipper
      ? { clearCenterStripe01: gap01, disableText: frontHasRubber }
      : { disableText: frontHasRubber }
  );
  const backCanvas = useDesignCanvas(design.sides.back || EMPTY_SIDE, { disableText: backHasRubber });

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
        armHoldTimer(e);
        if (!isActive) {
          if (!enableLongPressDelete) onModelTap?.(design.id);
          return;
        }
        if (holdRef.current.triggered) return;
        if (disableDrag) {
          if (!enableLongPressDelete) onModelTap?.(design.id);
          return;
        }

        dragRef.current = {
          active: true,
          pid: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startRotY: userRotRef.current.y,
          startRotX: userRotRef.current.x,
          moved: false,
        };

        document.body.style.cursor = "grabbing";
        if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (enableLongPressDelete && holdRef.current.pid === e.pointerId && holdRef.current.timer) {
          const holdDx = Math.abs(e.clientX - holdRef.current.startX);
          const holdDy = Math.abs(e.clientY - holdRef.current.startY);
          if (holdDx > 6 || holdDy > 6) clearHoldTimer();
        }
        if (disableDrag) return;
        if (!dragRef.current.active || dragRef.current.pid !== e.pointerId) return;
        e.stopPropagation();
        const dx = Math.abs(e.clientX - dragRef.current.startX);
        const dy = Math.abs(e.clientY - dragRef.current.startY);
        if (dx > 2 || dy > 2) dragRef.current.moved = true;

        const nextY = dragRef.current.startRotY + (e.clientX - dragRef.current.startX) * ROT_SPEED;
        const nextX = dragRef.current.startRotX + (e.clientY - dragRef.current.startY) * ROT_SPEED;
        userRotRef.current.y = clampRotY(nextY);
        userRotRef.current.x = clampRotX(nextX);
        onUserRotate?.(design.id, {
          x: userRotRef.current.x,
          y: userRotRef.current.y,
        });
      }}
      onPointerUp={(e) => {
        const holdTriggered = holdRef.current.pid === e.pointerId && holdRef.current.triggered;
        if (holdRef.current.pid === e.pointerId) clearHoldTimer();
        if (disableDrag) return;
        if (dragRef.current.pid !== e.pointerId) return;
        const tapped = !dragRef.current.moved;
        dragRef.current.active = false;
        document.body.style.cursor = "grab";
        if (e.target?.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
        if (tapped && !holdTriggered && !enableLongPressDelete) onModelTap?.(design.id);
      }}
      onPointerCancel={(e) => {
        if (holdRef.current.pid === e.pointerId) clearHoldTimer();
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
        frontSideData={design.sides.front || EMPTY_SIDE}
        backSideData={design.sides.back || EMPTY_SIDE}
        modelType={design.modelType}
        hoodieV12Parts={design.hoodieV12Parts}
        fabricType={design.fabricType}
        view={view}
        isMobile={isMobile}
        frontPrintTypes={printTypesBySide.front}
        backPrintTypes={printTypesBySide.back}
      />
      {showModelDeleteButton && (
        <Html position={[0, 1.18, 0]} center transform distanceFactor={4.8} zIndexRange={[180, 240]}>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (canDeleteModel) onDeleteModel?.(design.id);
            }}
            disabled={!canDeleteModel}
            className={`h-9 px-3 rounded-full border text-[11px] font-black uppercase tracking-wide shadow-lg backdrop-blur-sm ${
              canDeleteModel
                ? "border-red-300 bg-red-600/90 text-white hover:bg-red-700/95"
                : "border-zinc-400 bg-zinc-500/60 text-zinc-200 cursor-not-allowed"
            }`}
            aria-label="Modeli sil"
            title={canDeleteModel ? "Modeli Sil" : "En az bir model kalmalı"}
          >
            <span className="inline-flex items-center gap-1.5">
              <Trash2 size={13} />
              Sil
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}

function StyledTextPreview({ textState, className = "" }) {
  const text = String(textState?.text || "").trim();
  if (!text) return null;

  const layout = textState?.layout || "straight";
  const curve = getTextCurveValue(textState);
  const chars = [...text];
  const center = Math.max((chars.length - 1) / 2, 1);
  const amp = (curve / 90) * 12;

  const commonStyle = {
    color: textState?.color || "#ffffff",
    fontFamily: textState?.font || FONT_OPTIONS[0].value,
    fontSize: `${clamp((Number(textState?.size) || 150) / 13, 12, 26)}px`,
    lineHeight: 1,
    fontWeight: 900,
  };
  const rotation = clamp(Number(textState?.rotation) || 0, -180, 180);
  const rotatedStyle = rotation ? { transform: `rotate(${rotation}deg)` } : null;

  if (layout === "straight") {
    return (
      <span className={`select-none ${className}`} style={{ ...commonStyle, ...(rotatedStyle || {}) }}>
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ ...commonStyle, ...(rotatedStyle || {}) }}
    >
      {chars.map((ch, i) => {
        const norm = (i - center) / center;
        let y = 0;
        let rot = 0;
        if (layout === "wave" || layout === "wave-soft" || layout === "wave-strong") {
          const waveAmpMul = layout === "wave-soft" ? 0.85 : layout === "wave-strong" ? 1.75 : 1.35;
          const phase = (i / Math.max(chars.length - 1, 1)) * Math.PI * 2;
          y = Math.sin(phase) * amp * waveAmpMul;
          rot = Math.cos(phase) * (curve * (layout === "wave-soft" ? 0.11 : layout === "wave-strong" ? 0.2 : 0.16));
        } else if (layout === "zigzag") {
          y = (i % 2 === 0 ? -1 : 1) * amp * 0.9;
          rot = (i % 2 === 0 ? -1 : 1) * curve * 0.2;
        } else if (layout === "stair-up" || layout === "stair-down") {
          const p = chars.length > 1 ? i / (chars.length - 1) : 0.5;
          y = (layout === "stair-up" ? -1 : 1) * (p - 0.5) * 2 * amp;
          rot = (layout === "stair-up" ? -1 : 1) * 6;
        } else {
          const arcDown = layout === "arc-down" || layout === "arc-down-strong";
          const arcStrong = layout === "arc-up-strong" || layout === "arc-down-strong";
          y = (arcDown ? 1 : -1) * Math.pow(norm, 2) * (amp * (arcStrong ? 2.05 : 1.45));
          rot = norm * curve * (arcStrong ? 0.75 : 0.55);
        }
        return (
          <span
            key={`${ch}-${i}`}
            className="inline-block"
            style={{ transform: `translateY(${y}px) rotate(${rot}deg)` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </span>
  );
}

function ModelSelectionPreview3D({ modelType, paused = false }) {
  const modelPathRaw = MODEL_PATHS[normalizeModelType(modelType)] || MODEL_PATHS[DEFAULT_MODEL_TYPE];
  const gltf = useGLTF(toSafeUrl(modelPathRaw));
  const groupRef = useRef(null);
  const spinStartRef = useRef(0);
  const progressRef = useRef(0);
  const wasPausedRef = useRef(false);
  const hasSkinned = useMemo(() => {
    let found = false;
    gltf.scene.traverse((o) => {
      if (o?.isSkinnedMesh) found = true;
    });
    return found;
  }, [gltf.scene]);

  const root = useMemo(() => {
    return hasSkinned ? SkeletonUtils.clone(gltf.scene) : gltf.scene.clone(true);
  }, [gltf.scene, hasSkinned]);

  useFrame(() => {
    if (!groupRef.current) return;
    const now = performance.now();
    const cycleMs = 9000; // 8-10 saniye arasi 1 tur
    if (!spinStartRef.current) spinStartRef.current = now;

    if (paused) {
      if (!wasPausedRef.current) {
        const elapsed = now - spinStartRef.current;
        progressRef.current = ((elapsed % cycleMs) + cycleMs) % cycleMs / cycleMs;
      }
      wasPausedRef.current = true;
    } else {
      if (wasPausedRef.current) {
        spinStartRef.current = now - progressRef.current * cycleMs;
      }
      wasPausedRef.current = false;
      const elapsed = now - spinStartRef.current;
      progressRef.current = ((elapsed % cycleMs) + cycleMs) % cycleMs / cycleMs;
    }

    const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progressRef.current);
    groupRef.current.rotation.y = easedProgress * Math.PI * 2;
  });

  // Apply fabric material to review model
  useMemo(() => {
    root.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#ffffff"),
          side: THREE.FrontSide,
          clearcoat: 0,
          sheen: 1.0,
          sheenRoughness: 0.5,
          sheenColor: new THREE.Color(0xcccccc),
          roughness: 0.92,
          metalness: 0.0,
          envMapIntensity: 0.2,
        });
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [root]);

  return (
    <group ref={groupRef} position={[0, -0.08, 0]}>
      <Center>
        <primitive object={root} />
      </Center>
    </group>
  );
}

function ModelSelectionPanel({ selectedModel, onSelectModel, onContinue }) {
  const groupedModels = useMemo(() => {
    return MODEL_SELECTION_GROUPS.map((group) => ({
      ...group,
      models: group.models.filter((modelType) => AVAILABLE_MODELS.includes(modelType)),
    })).filter((group) => group.models.length > 0);
  }, []);
  const [pressedModel, setPressedModel] = useState(null);
  const [cardTransition, setCardTransition] = useState(null);
  const transitionLockRef = useRef(false);
  const cardRefs = useRef({});
  const timerRefs = useRef([]);

  const clearTransitionHandles = () => {
    timerRefs.current.forEach((id) => window.clearTimeout(id));
    timerRefs.current = [];
  };

  useEffect(() => {
    return () => {
      clearTransitionHandles();
      transitionLockRef.current = false;
    };
  }, []);

  const runSelectionTransition = (modelType) => {
    if (!modelType || transitionLockRef.current) return;
    transitionLockRef.current = true;
    clearTransitionHandles();
    setPressedModel(null);
    onSelectModel?.(modelType);

    const cardEl = cardRefs.current[modelType];
    if (!cardEl) {
      timerRefs.current.push(
        window.setTimeout(() => {
          onContinue?.(modelType);
        }, 560)
      );
      return;
    }

    const previewEl = cardEl.querySelector("[data-model-preview]") || cardEl;
    const startRect = previewEl.getBoundingClientRect();

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const targetRect = {
      width: viewportW,
      height: viewportH,
      left: 0,
      top: 0,
    };

    let snapshotSrc = "";
    try {
      const canvas = previewEl.querySelector("canvas");
      if (canvas && typeof canvas.toDataURL === "function") {
        snapshotSrc = canvas.toDataURL("image/png");
      }
    } catch {
      snapshotSrc = "";
    }
    if (!snapshotSrc) {
      const img = previewEl.querySelector("img");
      snapshotSrc = img?.src || "";
    }

    setCardTransition({
      modelType,
      phase: "focus",
      startRect,
      targetRect,
      snapshotSrc,
    });

    timerRefs.current.push(
      window.setTimeout(() => {
        setCardTransition((prev) => (prev ? { ...prev, phase: "expand" } : prev));
      }, 110)
    );

    timerRefs.current.push(
      window.setTimeout(() => {
        onContinue?.(modelType);
      }, 560)
    );

    timerRefs.current.push(
      window.setTimeout(() => {
        transitionLockRef.current = false;
        setCardTransition(null);
      }, 760)
    );
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#F7F7F7] text-zinc-900 px-4 py-6 md:px-8 md:py-10">
      {cardTransition && (
        (() => {
          const { startRect, targetRect, snapshotSrc, phase } = cardTransition;
          const startCenterX = startRect.left + startRect.width / 2;
          const startCenterY = startRect.top + startRect.height / 2;
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const dx = targetCenterX - startCenterX;
          const dy = targetCenterY - startCenterY;
          const sx = targetRect.width / Math.max(1, startRect.width);
          const sy = targetRect.height / Math.max(1, startRect.height);
          const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

          const isExpand = phase === "expand";
          let transform = "translate3d(0px, 0px, 0px) scale(1.04)";
          let transition = `transform 110ms ${ease}`;
          if (isExpand) {
            transform = `translate3d(${dx}px, ${dy}px, 0px) scale(${sx}, ${sy})`;
            transition = `transform 380ms ${ease}`;
          }
          const cardRadius = isExpand ? "0px" : "20px";
          const cardShadow = isExpand
            ? "0 30px 68px rgba(0,0,0,0.24)"
            : "0 18px 44px rgba(0,0,0,0.20)";
          const imageTransform = isExpand ? "scale(1.06)" : "scale(1.00)";

          return (
            <div className="fixed inset-0 z-[140] pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  background: "rgba(16,20,28,0.18)",
                  backdropFilter: "blur(4px)",
                  transition: `opacity 160ms ${ease}, backdrop-filter 160ms ${ease}`,
                }}
              />

              <div
                className="absolute left-0 right-0 top-0 z-[2] px-4 md:px-8"
                style={{
                  opacity: isExpand ? 1 : 0,
                  transform: isExpand ? "translateY(0px)" : "translateY(-12px)",
                  transition: `opacity 220ms ${ease} 120ms, transform 220ms ${ease} 120ms`,
                }}
              >
                <div className="h-[72px] mt-3 rounded-2xl border border-white/35 bg-white/75 backdrop-blur-sm shadow-[0_10px_24px_rgba(0,0,0,0.12)]" />
              </div>

              <div
                className="absolute left-0 right-0 bottom-0 z-[2] px-4 md:px-8 pb-4"
                style={{
                  opacity: isExpand ? 1 : 0,
                  transform: isExpand ? "translateY(0px)" : "translateY(40px)",
                  transition: `opacity 240ms ${ease} 120ms, transform 240ms ${ease} 120ms`,
                }}
              >
                <div className="h-[190px] rounded-3xl border border-white/35 bg-white/82 backdrop-blur-sm shadow-[0_-10px_24px_rgba(0,0,0,0.14)]" />
              </div>

              <div
                className="absolute overflow-hidden border border-white/45"
                style={{
                  left: `${startRect.left}px`,
                  top: `${startRect.top}px`,
                  width: `${startRect.width}px`,
                  height: `${startRect.height}px`,
                  transform,
                  transition,
                  transformOrigin: "center center",
                  willChange: "transform",
                  borderRadius: cardRadius,
                  boxShadow: cardShadow,
                  zIndex: 3,
                }}
              >
                {snapshotSrc ? (
                  <img
                    src={snapshotSrc}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{
                      transform: imageTransform,
                      transformOrigin: "center center",
                      transition: `transform 380ms ${ease}`,
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#eef1f4]" />
                )}
              </div>
            </div>
          );
        })()
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Adım 1</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Model Seçim</h1>
            <p className="text-sm text-zinc-500 mt-1">Model kartına tek dokunma ile tasarıma geçilir.</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-full border border-zinc-300 bg-white text-xs font-black uppercase tracking-widest hover:bg-zinc-100"
          >
            Geri
          </Link>
        </div>

        <div className="space-y-6 md:space-y-7">
          {groupedModels.map((group) => (
            <section key={`model-group-${group.id}`} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] md:text-sm font-black uppercase tracking-[0.14em] text-zinc-600">
                  {group.title}
                </h2>
                <span className="text-[11px] font-bold text-zinc-500">{group.models.length} model</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {group.models.map((modelType) => {
                  const active = selectedModel === modelType;
                  const shortLabel = MODEL_SELECTION_CARD_LABELS[modelType] || MODEL_LABELS[modelType] || modelType;
                  const transitionActive = Boolean(cardTransition);
                  const transitionSelected = cardTransition?.modelType === modelType;
                  const isPressed = pressedModel === modelType;
                  let cardScale = 1;
                  if (isPressed) cardScale = 0.96;
                  if (transitionSelected) cardScale = cardTransition?.phase === "expand" ? 1.04 : 1.04;
                  const cardOpacity = transitionActive && !transitionSelected ? 0.6 : 1;
                  const cardShadow = transitionSelected
                    ? "0 16px 34px rgba(15,23,42,0.16)"
                    : "0 8px 20px rgba(15,23,42,0.08)";
                  return (
                    <button
                      key={`select-model-${modelType}`}
                      type="button"
                      ref={(el) => {
                        if (el) cardRefs.current[modelType] = el;
                      }}
                      onPointerDown={() => {
                        if (transitionActive) return;
                        setPressedModel(modelType);
                      }}
                      onPointerUp={() => setPressedModel((prev) => (prev === modelType ? null : prev))}
                      onPointerLeave={() => setPressedModel((prev) => (prev === modelType ? null : prev))}
                      onPointerCancel={() => setPressedModel((prev) => (prev === modelType ? null : prev))}
                      onClick={() => runSelectionTransition(modelType)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          runSelectionTransition(modelType);
                        }
                      }}
                      className={`w-full rounded-[20px] border bg-white p-2.5 text-left ${active || transitionSelected || isPressed
                        ? "border-black ring-1 ring-black/40"
                        : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      style={{
                        transform: `scale(${cardScale})`,
                        opacity: cardOpacity,
                        boxShadow: cardShadow,
                        transition: "transform 110ms cubic-bezier(0.22, 1, 0.36, 1), opacity 110ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 110ms cubic-bezier(0.22, 1, 0.36, 1), border-color 110ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      aria-pressed={active}
                    >
                      <div data-model-preview className="aspect-square rounded-[20px] overflow-hidden border border-zinc-200 bg-[#F7F7F7]">
                        <Canvas
                          dpr={[1, 1.2]}
                          camera={{ position: [0, 0.28, 2.12], fov: 30 }}
                          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
                          onCreated={({ gl }) => {
                            gl.outputColorSpace = THREE.SRGBColorSpace;
                            gl.toneMapping = THREE.ACESFilmicToneMapping;
                            gl.toneMappingExposure = 0.60;
                          }}
                        >
                          <color attach="background" args={["#F7F7F7"]} />
                          <ambientLight intensity={0.45} />
                          <hemisphereLight intensity={0.15} groundColor="#252525" />
                          <directionalLight position={[4, 7, 5]} intensity={0.45} />
                          <directionalLight position={[-4, 5, -4]} intensity={0.15} />
                          <Suspense fallback={null}>
                            <ModelSelectionPreview3D
                              modelType={modelType}
                              paused={isPressed || transitionSelected}
                            />
                          </Suspense>
                        </Canvas>
                      </div>
                      <p className="mt-2 text-[16px] md:text-[18px] font-medium text-zinc-900 leading-tight">{shortLabel}</p>
                      <p className="mt-0.5 text-[12px] md:text-[13px] font-normal text-zinc-500">{getModelGroupTitle(modelType)}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">
            Seçili model:{" "}
            <span className="font-black text-zinc-900">
              {selectedModel ? MODEL_LABELS[selectedModel] || selectedModel : "Henüz seçilmedi"}
            </span>
            <span className="ml-2 text-xs text-zinc-500">(Tek dokunuşla geçiş başlar)</span>
          </p>
          <button
            type="button"
            disabled={!selectedModel}
            onClick={() => onContinue?.(selectedModel)}
            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition ${selectedModel
              ? "bg-black text-white hover:bg-zinc-800"
              : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
              }`}
          >
            Tasarıma Geç
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= EDITOR PANEL ================= */
function EditorPanel({
  design,
  updateDesign,
  view,
  isMobile,
  activeTab,
  setActiveTab,
  layout = "standard",
  onRequestDrawerCollapse,
  onRequestDrawerExpand,
  onRequestShowEditorOverlay,
  forceShowEditorOverlay = false,
  suppressEditorInPanel = false,
  onOpenCategoryMenu,
  printTypePickerSignal = 0,
}) {
  const isZipperFront = hasCenterZip(design.modelType) && view === "front";
  const gap01 = MODEL_PRINT_BOUNDS?.[design.modelType]?.front?.zipGap01 ?? MODEL_PRINT_BOUNDS?.fermuarli?.front?.zipGap01 ?? 0.08;
  const isDrawerLayout = layout === "drawer";
  const isMobileDrawer = isDrawerLayout && isMobile;

  const currentSide = view === "back" ? "back" : "front";
  const sideData = useMemo(() => design?.sides?.[currentSide] || createSideData(), [design, currentSide]);

  const previewRef = useRef(null);
  const uploadSlotRefs = useRef([]);
  const pdfInputRef = useRef(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const sizes = ["S", "M", "L", "XL"];
  const colorPresets = BRAND_COLORS;
  const stringPresets = ["#e6e6e6", "#ffffff", "#000000", "#c8b08a", "#a0a0a0"];
  const printTypes = design ? getPrintTypesForSide(design, currentSide) : [];
  const dtfActiveForSide = printTypes.includes("dtf");
  const rubberActiveForSide = printTypes.includes("rubber");

  useEffect(() => {
    if (printTypePickerSignal <= 0) return;
    setActiveTab("print");
  }, [printTypePickerSignal, setActiveTab]);

  useEffect(() => {
    if (activeTab === "upload" && !dtfActiveForSide) {
      setActiveTab("print");
    }
  }, [activeTab, dtfActiveForSide, setActiveTab]);

  if (!design) return null;

  const sideLabel = currentSide === "front" ? "ÖN" : "ARKA";
  const cm = CM_LABELS[design.modelType]?.[currentSide] || { w: 0, h: 0 };

  const t = sideData?.customText || {};
  const hasPdf = Boolean(design?.hasPdf && design?.pdfFileUrl);
  const pdfPlacement = normalizePdfPlacement(design?.pdfPlacement, currentSide);
  const updatePdfPlacement = (patch) => {
    updateDesign({
      hasPdf: true,
      pdfPlacement: normalizePdfPlacement({ ...pdfPlacement, ...patch }, patch?.side || pdfPlacement.side || currentSide),
    });
  };
  const setCurrentSidePrintTypes = (nextTypes) => {
    const bySide = normalizePrintTypesBySide(design.printTypesBySide, design.printTypes);
    const safeSide = currentSide === "back" ? "back" : "front";
    const normalizedNext = Array.isArray(nextTypes) ? Array.from(new Set(nextTypes)) : [];
    const nextBySide = { ...bySide, [safeSide]: normalizedNext };
    const mergedLegacy = Array.from(new Set([...(nextBySide.front || []), ...(nextBySide.back || [])]));
    updateDesign({
      printTypesBySide: nextBySide,
      printTypes: mergedLegacy,
    });
  };

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
  const baseModelPrice = getModelBasePrice(design.modelType);
  const totalListPrice = getListPriceBeforeLaunchDiscount(totalPrice);
  const baseModelListPrice = getListPriceBeforeLaunchDiscount(baseModelPrice);
  const largePrintSummary = getLargePrintChargeSummary(design);

  const logos = sideData?.logos || [];
  const activeLogo = logos.find((l) => l.id === sideData.activeLogoId) || logos[0] || null;
  const logoCount = logos.length;
  const canUploadMoreLogos = logoCount < MAX_LOGOS_PER_SIDE;

  const handleUploadFile = async (file) => {
    if (!file) return;
    try {
      if ((sideData.logos || []).length >= MAX_LOGOS_PER_SIDE) {
        alert(`Bu alanda en fazla ${MAX_LOGOS_PER_SIDE} baskı görseli yükleyebilirsin.`);
        return;
      }

      const optimizedUrl = await optimizeUploadDataUrl(file);
      const id = makeId();
      const nextLogo = {
        id,
        url: optimizedUrl,
        box: { x: 0.5, y: 0.6, w: 0.7, h: 0.45 },
        rotation: 0,
        z: 0,
        ...LOGO_STYLE_DEFAULTS,
      };

      const nextLogos = [...(sideData.logos || []), nextLogo];
      updateSide({ logos: nextLogos, activeLogoId: id });
      onRequestDrawerCollapse?.();
      onRequestShowEditorOverlay?.();
      setActiveTab("editor");
    } catch (err) {
      console.error("Gorsel yukleme hatasi:", err);
      alert(err?.message || "Görsel yüklenemedi. Farklı bir görsel deneyin.");
    }
  };

  const handleAddSticker = (sticker) => {
    if (!sticker?.src) return;
    if ((sideData.logos || []).length >= MAX_LOGOS_PER_SIDE) {
      alert(`Bu alanda en fazla ${MAX_LOGOS_PER_SIDE} baskı görseli yükleyebilirsin.`);
      return;
    }
    const id = makeId();
    const nextLogo = {
      id,
      url: sticker.src,
      box: { x: 0.5, y: 0.6, w: 0.62, h: 0.42 },
      rotation: 0,
      z: 0,
      kind: "sticker",
      emboss: true,
      ...LOGO_STYLE_DEFAULTS,
    };
    const nextLogos = [...(sideData.logos || []), nextLogo];
    updateSide({ logos: nextLogos, activeLogoId: id });
    onRequestDrawerCollapse?.();
    onRequestShowEditorOverlay?.();
    setActiveTab("editor");
  };

  const isFocusMode = isMobile && activeTab === "editor" && !isDrawerLayout;
  const drawerHeadingClass = "text-[13px] font-black tracking-[0.14em] text-gray-500 uppercase";
  const panelTabs = [
    { id: "color", icon: Palette, label: "Renk" },
    { id: "print", icon: Layers, label: "Baskı Seçim" },
    { id: "text", icon: FileText, label: "Yazı" },
    ...(dtfActiveForSide ? [{ id: "upload", icon: ImageIcon, label: "Görsel" }] : []),
  ];

  const togglePrintType = (id) => {
    const alreadySelected = printTypes.includes(id);
    const next = alreadySelected ? printTypes.filter((t) => t !== id) : [...printTypes, id];
    setCurrentSidePrintTypes(next);
    if (!alreadySelected) {
      if (id === "rubber" || id === "flock") {
        setActiveTab("text");
      } else if (id === "dtf") {
        setActiveTab("upload");
      }
    }
  };

  const removePrintType = (id) => {
    const next = printTypes.filter((typeId) => typeId !== id);
    setCurrentSidePrintTypes(next);
  };

  const handleSelectPrintTypeFromPanel = (id) => {
    const opt = PRINT_TYPE_OPTIONS.find((entry) => entry.id === id);
    if (!opt?.available) return;
    togglePrintType(id);
  };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    try {
      setIsUploadingPdf(true);
      const ext = String(file.name || "").toLowerCase();
      if (!ext.endsWith(".pdf")) {
        throw new Error("Lütfen PDF dosyası seçin.");
      }
      const dataUrl = await fileToDataUrl(file);
      const fallbackPlacement = normalizePdfPlacement(design.pdfPlacement, currentSide);
      updateDesign({
        hasPdf: true,
        pdfFileUrl: dataUrl,
        pdfOriginalName: file.name || "dosya.pdf",
        pdfPlacement: {
          ...fallbackPlacement,
          side: currentSide,
        },
      });
      setActiveTab("text");
      onRequestDrawerExpand?.();
    } catch (err) {
      console.error("PDF yukleme hatasi:", err);
      alert(err?.message || "PDF yuklenemedi.");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDeleteActiveImage = () => {
    const currentId = sideData.activeLogoId || sideData.logos?.[0]?.id;
    if (!currentId) return;
    const next = (sideData.logos || []).filter((l) => l.id !== currentId);
    updateSide({ logos: next, activeLogoId: next[0]?.id || null });
  };

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
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  width: `${Math.round(gap01 * 100)}%`,
                  transform: "translateX(-50%)",
                  top: `${ZIP_STRIPE_TOP01 * 100}%`,
                  bottom: `${(1 - ZIP_STRIPE_BOTTOM01) * 100}%`,
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
                const fx = getLogoStyle(l);
                return (
                  <div
                    key={l.id}
                    className={`absolute overflow-hidden border ${isSel ? "border-white" : "border-white/10"}`}
                    style={{
                      left: pct(box.x - box.w / 2),
                      top: pct(box.y - box.h / 2),
                      width: pct(box.w),
                      height: pct(box.h),
                      touchAction: "none",
                      pointerEvents: isSel ? "none" : "auto",
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      updateSide({ activeLogoId: l.id });
                    }}
                  >
                    <img
                      src={l.url}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        transform: `rotate(${l.rotation || 0}deg) scale(${fx.flipX ? -1 : 1}, ${fx.flipY ? -1 : 1})`,
                        filter: logoFilterCss(fx),
                        opacity: fx.opacity,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                );
              };
              const textEl = t?.text ? (
                <div
                  className="absolute"
                  style={{
                    left: `${clampTextPos(sideData?.textPos, sideData?.customText).x * 100}%`,
                    top: `${clampTextPos(sideData?.textPos, sideData?.customText).y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                    cursor: "grab",
                    zIndex: 90,
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = previewRef.current.getBoundingClientRect();
                    const move = (ev) =>
                      updateSide({
                        textPos: clampTextPos({
                          x: clamp01((ev.clientX - rect.left) / rect.width),
                          y: clamp01((ev.clientY - rect.top) / rect.height),
                        }, sideData?.customText)
                      });
                    const up = () => {
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                  }}
                >
                  <StyledTextPreview textState={sideData.customText} />
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
                disableResize={isEmbossSticker(activeLogo)}
              />
            )}

          </div>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-[#111111]">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase mb-2">
            <span>Toplam</span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 line-through">{formatMoney(totalListPrice)} ₺</span>
              <span className="text-white font-black">{formatMoney(totalPrice)} ₺</span>
            </div>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Açılışa Özel %20 İndirim</p>
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
                      className={`w-7 h-7 text-[10px] font-bold rounded border transition ${design.size === s ? "bg-white text-black border-white" : "text-zinc-500 border-zinc-700"
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
            {panelTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "upload" && !isMobileDrawer) onRequestDrawerCollapse?.();
                }}
                className={`flex-1 py-3 text-[10px] font-bold uppercase flex flex-col items-center gap-1 ${activeTab === tab.id ? "text-white border-b-2 border-white" : "text-zinc-500"
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
        className={`flex-1 ${isDrawerLayout
          ? isMobileDrawer
            ? "h-full p-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] flex flex-col items-stretch gap-2 overflow-y-auto overflow-x-hidden"
            : "h-full py-2.5 px-3 2xl:px-7 flex items-stretch justify-start gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          : "p-4 overflow-y-auto"
          }`}
        style={{ touchAction: "pan-y", minHeight: 0, backgroundColor: contentBackground }}
      >
        {/* PRINT TYPE */}
        {activeTab === "print" && (
          <div className={`${isDrawerLayout ? (isMobileDrawer ? "w-full flex flex-col gap-2.5" : "h-full w-full flex items-stretch justify-start gap-2.5") : "space-y-2.5"}`}>
            <div className={isDrawerLayout ? "w-full" : ""}>
              <PrintTypePickerCards
                selectedIds={printTypes}
                onSelect={handleSelectPrintTypeFromPanel}
                sourceLabel="Panelden sec"
                isMobile={isMobile}
              />
            </div>
          </div>
        )}

        {/* UPLOAD / VISUAL */}
        {activeTab === "upload" && (
          <div className={`${isDrawerLayout ? (isMobileDrawer ? "w-full flex flex-col gap-2.5" : "h-full w-full flex items-stretch justify-start gap-2.5") : "space-y-2.5"}`}>
            {!dtfActiveForSide && (
              <div className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-600">
                Görsel yükleme alanını açmak için DTF seç.
              </div>
            )}

            {dtfActiveForSide && (
              <div className={`${isDrawerLayout ? "w-full" : "grid grid-cols-1 gap-2"}`}>
                <div className={`rounded-xl border border-gray-200 bg-white p-2 space-y-2 shadow-sm ${isDrawerLayout ? (isMobileDrawer ? "w-full shrink-0" : "h-full min-h-[206px]") : ""}`}>
                  <div className="flex items-center justify-between">
                    <p className={drawerHeadingClass}>Dosya</p>
                    <p className="text-[10px] text-gray-500">{logoCount}/{MAX_LOGOS_PER_SIDE} katman</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: MAX_LOGOS_PER_SIDE }).map((_, slotIdx) => {
                      const layer = sideData.logos?.[slotIdx] || null;
                      const selected = layer && (sideData.activeLogoId || sideData.logos?.[0]?.id) === layer.id;

                      if (layer) {
                        return (
                          <div
                            key={`slot-layer-${layer.id}`}
                            onClick={() => updateSide({ activeLogoId: layer.id })}
                            role="button"
                            className={`relative h-28 rounded-lg border overflow-hidden transition cursor-pointer ${selected ? "border-black ring-1 ring-black/20" : "border-gray-300 hover:border-gray-400"
                              }`}
                          >
                            <div className="absolute left-1.5 top-1.5 z-10 px-1.5 py-0.5 rounded bg-white/90 border border-gray-200 text-[9px] text-gray-700 font-black uppercase tracking-wide flex items-center gap-1">
                              <ImageIcon size={10} />
                              Dosya {slotIdx + 1}
                            </div>
                            <img src={layer.url} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = (sideData.logos || []).filter((l) => l.id !== layer.id);
                                updateSide({ logos: next, activeLogoId: next[0]?.id || null });
                              }}
                              className="absolute right-1.5 top-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                              aria-label="Katmanı sil"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={`slot-empty-${slotIdx}`} className="relative h-28 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                          <button
                            onClick={() => uploadSlotRefs.current?.[slotIdx]?.click()}
                            disabled={!canUploadMoreLogos}
                            className={`w-full h-full flex flex-col items-start justify-center pl-4 gap-1 ${canUploadMoreLogos ? "text-gray-600 hover:bg-gray-100" : "text-gray-400 cursor-not-allowed"
                              }`}
                          >
                            <Plus size={26} strokeWidth={2.8} />
                            <span className="text-[11px] font-bold uppercase">Dosya Ekle</span>
                          </button>
                          <input
                            ref={(el) => {
                              uploadSlotRefs.current[slotIdx] = el;
                            }}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            disabled={!canUploadMoreLogos}
                            onChange={async (e) => {
                              const inputEl = e.currentTarget;
                              const file = inputEl.files?.[0];
                              await handleUploadFile(file);
                              inputEl.value = "";
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("editor");
                      if (isMobileDrawer) onRequestDrawerCollapse?.();
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2"
                  >
                    <Move size={14} /> Yerleşim Paneli
                  </button>
                  <button
                    onClick={handleDeleteActiveImage}
                    disabled={!activeLogo}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase border flex items-center justify-center gap-2 ${activeLogo
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                  >
                    <Trash2 size={13} /> Seçili Dosyayı Sil
                  </button>
                  {!canUploadMoreLogos && (
                    <p className="text-[10px] text-gray-500 font-semibold">Maksimum 3 görsel yüklendi.</p>
                  )}
                </div>
              </div>
            )}
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
                className={`w-full max-w-[520px] mr-auto bg-zinc-900 rounded-xl border border-zinc-600 relative overflow-hidden shadow-2xl touch-none ${isMobile ? "aspect-[4/5] h-64" : "aspect-square"
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
                    className="absolute pointer-events-none"
                    style={{
                      left: "50%",
                      width: `${Math.round(gap01 * 100)}%`,
                      transform: "translateX(-50%)",
                      top: `${ZIP_STRIPE_TOP01 * 100}%`,
                      bottom: `${(1 - ZIP_STRIPE_BOTTOM01) * 100}%`,
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
                  const fx = getLogoStyle(l);

                  return (
                    <div
                      key={l.id}
                      className={`absolute rounded-lg overflow-hidden border ${isSel ? "border-white" : "border-white/10"
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
                        style={{
                          transform: `rotate(${l.rotation || 0}deg) scale(${fx.flipX ? -1 : 1}, ${fx.flipY ? -1 : 1})`,
                          filter: logoFilterCss(fx),
                          opacity: fx.opacity,
                          transformOrigin: "center center",
                        }}
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
                    disableResize={isEmbossSticker(activeLogo)}
                  />
                )}

                {/* yazı: sürükle */}
                {sideData?.customText?.text && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/30 border border-white/20"
                    style={{
                      left: pct(clampTextPos(sideData?.textPos, sideData?.customText).x),
                      top: pct(clampTextPos(sideData?.textPos, sideData?.customText).y),
                      touchAction: "none",
                      cursor: "grab",
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = previewRef.current.getBoundingClientRect();
                      const start = {
                        x: clamp01((e.clientX - rect.left) / rect.width),
                        y: clamp01((e.clientY - rect.top) / rect.height),
                      };
                      const base = sideData?.textPos || { x: 0.5, y: 0.85 };
                      const offset = { dx: base.x - start.x, dy: base.y - start.y };
                      const move = (ev) =>
                        updateSide({
                          textPos: clampTextPos({
                            x: clamp01((ev.clientX - rect.left) / rect.width + offset.dx),
                            y: clamp01((ev.clientY - rect.top) / rect.height + offset.dy),
                          }, sideData?.customText)
                        });
                      const up = () => {
                        window.removeEventListener("pointermove", move);
                        window.removeEventListener("pointerup", up);
                      };
                      window.addEventListener("pointermove", move);
                      window.addEventListener("pointerup", up);
                    }}
                  >
                    <StyledTextPreview textState={sideData.customText} />
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
        {/* TEXT / PDF */}
        {activeTab === "text" && (
          <div className={`${isDrawerLayout ? (isMobileDrawer ? "w-full flex flex-col gap-2.5" : "h-full w-full flex items-start justify-start gap-2.5") : "space-y-2.5"}`}>
            <div className={`rounded-xl border border-gray-200 bg-white p-3 space-y-3 shadow-sm ${isDrawerLayout ? (isMobileDrawer ? "w-full shrink-0" : "w-full min-h-[188px] overflow-hidden") : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={drawerHeadingClass}>Yazı / PDF</p>
                {hasPdf ? (
                  <span className="text-[10px] font-black uppercase text-emerald-600">Hazır</span>
                ) : (
                  <span className="text-[10px] font-black uppercase text-gray-500">Dosya Yok</span>
                )}
              </div>

              <div className={`${isDrawerLayout && !isMobileDrawer ? "grid grid-cols-2 gap-3 items-start" : "space-y-3"}`}>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Metin</p>
                    <button
                      type="button"
                      onClick={() =>
                        bumpText({
                          text: "",
                          color: "#ffffff",
                          size: 150,
                          emboss: false,
                          embossDepth: 1.4,
                          embossStrength: 1.4,
                          font: FONT_OPTIONS[0].value,
                          layout: "straight",
                          curve: 30,
                        })
                      }
                      className="text-[10px] font-black uppercase text-gray-600 underline"
                    >
                      Temizle
                    </button>
                  </div>
                  <input
                    type="text"
                    value={t.text || ""}
                    maxLength={56}
                    onChange={(e) => bumpText({ text: e.target.value })}
                    placeholder=""
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[16px] md:text-[12px] font-semibold text-gray-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="block text-[10px] font-black uppercase tracking-wide text-gray-500">Font</span>
                      <select
                        value={t.font || FONT_OPTIONS[0].value}
                        onChange={(e) => bumpText({ font: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-[16px] md:text-[11px] font-semibold text-gray-800"
                      >
                        {FONT_OPTIONS.map((opt) => (
                          <option key={`font-opt-${opt.value}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-[10px] font-black uppercase tracking-wide text-gray-500">Renk</span>
                      <input
                        type="color"
                        value={t.color || "#ffffff"}
                        onChange={(e) => bumpText({ color: e.target.value })}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white p-1"
                      />
                    </label>
                  </div>
                  {rubberActiveForSide && (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-gray-500">
                          <span>Rubber Kalınlık</span>
                          <span className="text-gray-700 normal-case">2.00 mm (Sabit)</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-gray-500">
                          <span>Boyut</span>
                          <span className="text-gray-700 normal-case">{Math.round(Number(t?.size) || 150)}px</span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="280"
                          step="1"
                          value={Number(t?.size) || 150}
                          onChange={(e) => bumpText({ size: Number(e.target.value) })}
                          className="w-full accent-cyan-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-gray-500">
                          <span>Harf Aralığı</span>
                          <span className="text-gray-700 normal-case">{clamp(Number(t?.rubberLetterSpacing ?? 1), 0.2, 3).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.05"
                          value={clamp(Number(t?.rubberLetterSpacing ?? 1), 0.2, 3)}
                          onChange={(e) => bumpText({ rubberLetterSpacing: Number(e.target.value) })}
                          className="w-full accent-cyan-600"
                        />
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!String(t.text || "").trim()) {
                        bumpText({ text: "YAZI" });
                      }
                      setActiveTab("editor");
                      if (isMobileDrawer) onRequestDrawerCollapse?.();
                    }}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2"
                  >
                    <Move size={14} /> Modelde Düzenle
                  </button>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">PDF</p>
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer?.files?.[0];
                      await handlePdfUpload(file);
                    }}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:bg-gray-100 text-gray-700 flex flex-col items-center justify-center gap-1.5"
                  >
                    <FileText size={18} />
                    <span className="text-[11px] font-black uppercase tracking-wide">PDF Yükle</span>
                  </button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const inputEl = e.currentTarget;
                      const file = inputEl.files?.[0];
                      await handlePdfUpload(file);
                      inputEl.value = "";
                    }}
                  />

                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold text-gray-700 break-all">
                      {design.pdfOriginalName || "PDF seçilmedi"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "front", label: "Ön Yüz" },
                      { id: "back", label: "Arka Yüz" },
                    ].map((opt) => (
                      <button
                        key={`pdf-side-${opt.id}`}
                        type="button"
                        disabled={!hasPdf}
                        onClick={() => updatePdfPlacement({ side: opt.id })}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase border ${(design.pdfPlacement?.side || "front") === opt.id
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          } ${!hasPdf ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!hasPdf}
                    onClick={() =>
                      updateDesign({
                        hasPdf: false,
                        pdfFileUrl: "",
                        pdfOriginalName: "",
                        pdfPlacement: { ...DEFAULT_PDF_PLACEMENT, side: currentSide },
                      })
                    }
                    className={`w-full py-2 rounded-lg text-[10px] font-black uppercase border ${hasPdf
                      ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    PDF’yi Kaldır
                  </button>
                  {isUploadingPdf && <p className="text-[10px] font-bold uppercase text-gray-500">PDF yükleniyor...</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COLOR */}
        {activeTab === "color" && (
          <div className={`${isDrawerLayout ? (isMobileDrawer ? "w-full flex flex-col gap-2.5" : "h-full w-full flex items-stretch justify-start gap-2.5") : "space-y-2.5"}`}>
            <div className={`rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${isDrawerLayout ? (isMobileDrawer ? "w-full shrink-0" : "flex-1 min-w-[220px] max-w-[320px] 2xl:min-w-[260px] 2xl:max-w-[420px] h-full max-h-full min-h-[188px] flex flex-col overflow-y-auto overflow-x-hidden") : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={drawerHeadingClass}>Ürün Rengi</p>
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
                    className={`w-10 h-10 rounded-full border-2 transition hover:scale-110 ${design.color === c ? "border-black scale-110" : "border-gray-200"
                      }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {design.modelType.includes("hoodie") && (
              <div className={`rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${isDrawerLayout ? (isMobileDrawer ? "w-full shrink-0" : "flex-1 min-w-[220px] max-w-[320px] 2xl:min-w-[260px] 2xl:max-w-[420px] h-full max-h-full min-h-[188px] flex flex-col overflow-y-auto overflow-x-hidden") : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={drawerHeadingClass}>İp Rengi</p>
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
                      className={`w-10 h-10 rounded-full border-2 transition ${(design.stringColor || "#e6e6e6") === c ? "border-black scale-110" : "border-gray-300"
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

      {!isDrawerLayout && (
        <div
          className={`p-3 flex-shrink-0 ${isMobile ? "pb-[calc(env(safe-area-inset-bottom)+12px)]" : ""} border-t border-zinc-800 bg-[#111111]`}
        >
          <div className="mb-2 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Açılışa Özel</span>
              <div className="text-right leading-tight">
                <p className="text-[10px] font-mono text-zinc-500 line-through">{formatMoney(baseModelListPrice)} ₺</p>
                <p className="text-xs font-mono text-zinc-100">{formatMoney(baseModelPrice)} ₺</p>
              </div>
            </div>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Açılış İndirimi %20</p>

            {largePrintSummary.count > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500">
                  Büyük Baskı ({largePrintSummary.count}×)
                </span>
                <span className="text-xs font-mono text-zinc-300">+{formatMoney(largePrintSummary.amount)} ₺</span>
              </div>
            )}

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-bold uppercase text-white">Toplam</span>
              <div className="text-right leading-tight">
                <p className="text-[10px] font-mono text-zinc-500 line-through">{formatMoney(totalListPrice)} ₺</p>
                <p className="text-sm font-black font-mono text-white">{formatMoney(totalPrice)} ₺</p>
              </div>
            </div>
          </div>
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
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ activeTab artık burada (hata bitti)
  const [activeTab, setActiveTab] = useState("color");
  const [forceEditorOverlay, setForceEditorOverlay] = useState(false);
  const [drawerMenuOpen, setDrawerMenuOpen] = useState(false);
  const [drawerMenuMounted, setDrawerMenuMounted] = useState(false);
  const [printTypePickerSignal, setPrintTypePickerSignal] = useState(0);

  // ✅ designs/activeId init bug fix
  const initialDesignRef = useRef(null);
  if (!initialDesignRef.current) initialDesignRef.current = createDesign(DEFAULT_MODEL_TYPE);

  const presetModelFromQuery = useMemo(() => {
    if (!searchParams) return null;
    const raw = searchParams.get("model") || searchParams.get("product") || "";
    if (!raw) return null;
    const normalized = normalizeModelType(raw);
    return AVAILABLE_MODELS.includes(normalized) ? normalized : null;
  }, [searchParams]);
  const resumeRequested = useMemo(() => searchParams?.get("resume") === "1", [searchParams]);

  const safeInitial = presetModelFromQuery || AVAILABLE_MODELS[0];

  const [view, setView] = useState("front");
  const [designs, setDesigns] = useState(() => [
    { ...initialDesignRef.current, modelType: safeInitial },
  ]);
  const [activeId, setActiveId] = useState(() => initialDesignRef.current.id);
  const [flowStep, setFlowStep] = useState("select");
  const [selectedModelType, setSelectedModelType] = useState(() => presetModelFromQuery);
  const resumeAppliedRef = useRef(false);

  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [lockToast, setLockToast] = useState("");
  const [cmInputW, setCmInputW] = useState("");
  const [cmInputH, setCmInputH] = useState("");
  const [isEditingCmW, setIsEditingCmW] = useState(false);
  const [isEditingCmH, setIsEditingCmH] = useState(false);
  const [editorControlTab, setEditorControlTab] = useState("logo");

  const glRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [captureView, setCaptureView] = useState(null);
  const [captureId, setCaptureId] = useState(null);
  const [camAnimating, setCamAnimating] = useState(false);
  const lockToastTimerRef = useRef(null);
  const previewRef = useRef(null);
  const sceneEditRef = useRef(null);
  const modelUserRotateRef = useRef({});
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [sceneSelectionVisible, setSceneSelectionVisible] = useState(false);
  const [sceneFrameMode, setSceneFrameMode] = useState("resize");
  const [sceneTextSelectionVisible, setSceneTextSelectionVisible] = useState(false);
  const [sceneTextFrameMode, setSceneTextFrameMode] = useState("resize");
  const [sceneModelSelectionId, setSceneModelSelectionId] = useState(null);
  const [showPlacementPanel, setShowPlacementPanel] = useState(false);
  const [scenePlaneRect, setScenePlaneRect] = useState(null);
  const logoCountTrackRef = useRef({});
  const prevActiveTabRef = useRef("upload");

  const toggleLockAspect = () => {
    setLockAspect((prev) => {
      const next = !prev;
      setLockToast(next ? "Kilit Kapalı" : "Kilit Açık");
      if (lockToastTimerRef.current) clearTimeout(lockToastTimerRef.current);
      lockToastTimerRef.current = setTimeout(() => setLockToast(""), 900);
      return next;
    });
  };

  // Editor overlay için gerekli değişkenler
  const currentActiveDesign = designs.find(d => d.id === activeId);
  const currentSide = view;
  const sideLabel = currentSide === "front" ? "ÖN" : "ARKA";
  const sideData = currentActiveDesign?.sides?.[currentSide] || {};
  const printCm = CM_LABELS[currentActiveDesign?.modelType]?.[currentSide] || { w: 0, h: 0 };
  const printBounds = useMemo(() => {
    const modelType = currentActiveDesign?.modelType || "tshirt";
    const side = currentSide === "back" ? "back" : "front";
    return getPrintProfile(modelType, side, currentActiveDesign?.hoodieV12Parts);
  }, [currentActiveDesign?.modelType, currentActiveDesign?.hoodieV12Parts, currentSide]);
  const previewAspect = useMemo(() => {
    if (printBounds) {
      const w = printBounds.xMax - printBounds.xMin;
      const h = printBounds.yTop - printBounds.yBot;
      if (w > 0 && h > 0) return clamp(w / h, 0.55, 0.9);
    }
    if (printCm?.w && printCm?.h) return clamp(printCm.w / printCm.h, 0.55, 0.9);
    return 0.8;
  }, [printBounds, printCm?.w, printCm?.h]);
  const logos = sideData?.logos || [];
  const customText = sideData?.customText || {};
  const safeTextPos = clampTextPos(sideData?.textPos, customText);
  const activeLogo = logos.find(l => l.id === (sideData?.activeLogoId || logos[0]?.id));
  const activeLogoIsEmboss = isEmbossSticker(activeLogo);
  const logoControlsLocked = lockAspect;
  const imageControlDisabled = logoControlsLocked || !activeLogo;
  const sizeControlDisabled = imageControlDisabled || activeLogoIsEmboss;
  const isPrintAreaOpen = activeTab === "editor";
  const activeLogoBox = activeLogo?.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
  const activeLogoFx = getLogoStyle(activeLogo);
  const activePdfPlacement = normalizePdfPlacement(currentActiveDesign?.pdfPlacement, currentSide);
  const pdfVisibleOnCurrentSide = Boolean(currentActiveDesign?.hasPdf && activePdfPlacement.side === currentSide);
  const activeSidePrintTypes = getPrintTypesForSide(currentActiveDesign, currentSide);
  const rubberActiveForSide = activeSidePrintTypes.includes("rubber");
  const snapThreshold = 0.02;
  const guideStops = [0.25, 0.5, 0.75];
  const activeVGuides = isLogoDragging
    ? guideStops.filter((p) => Math.abs((activeLogoBox?.x ?? 0.5) - p) <= snapThreshold)
    : [];
  const activeHGuides = isLogoDragging
    ? guideStops.filter((p) => Math.abs((activeLogoBox?.y ?? 0.5) - p) <= snapThreshold)
    : [];
  const isZipperFront = hasCenterZip(currentActiveDesign?.modelType) && currentSide === "front";
  const gap01 = MODEL_PRINT_BOUNDS[currentActiveDesign?.modelType]?.front?.zipGap01 || 0;
  const textEditingMode = editorControlTab === "text" && showPlacementPanel;
  const showSceneFrame = Boolean(sceneSelectionVisible && activeLogo && !textEditingMode);
  const isSceneFrameCompact = (activeLogoBox?.w || 0) < 0.30 || (activeLogoBox?.h || 0) < 0.22;
  const hasSceneText = Boolean((customText?.text || "").trim());
  const textHalfBounds = estimateTextHalfBounds01(customText);
  const sceneTextBox = useMemo(
    () => ({
      x: safeTextPos.x,
      y: safeTextPos.y,
      w: clamp(textHalfBounds.halfW01 * 2, 0.12, 0.98),
      h: clamp(textHalfBounds.halfH01 * 2, 0.08, 0.72),
    }),
    [safeTextPos.x, safeTextPos.y, textHalfBounds.halfW01, textHalfBounds.halfH01]
  );
  const showSceneTextFrame = Boolean(sceneTextSelectionVisible && hasSceneText);

  useEffect(() => {
    setSceneSelectionVisible(false);
    setSceneTextSelectionVisible(false);
    setSceneFrameMode("resize");
    setSceneTextFrameMode("resize");
  }, [activeId, currentSide]);

  useEffect(() => {
    const key = `${activeId}_${currentSide}`;
    const prevCount = logoCountTrackRef.current[key];
    const nextCount = logos.length;
    logoCountTrackRef.current[key] = nextCount;
    if (typeof prevCount === "number" && prevCount !== nextCount) {
      // Yeni görsel eklendiğinde çerçeve otomatik açılmasın.
      setSceneSelectionVisible(false);
      setSceneTextSelectionVisible(false);
      setSceneFrameMode("resize");
      setSceneTextFrameMode("resize");
    }
  }, [activeId, currentSide, logos.length]);

  useEffect(() => {
    if (hasSceneText) return;
    setSceneTextSelectionVisible(false);
    setSceneTextFrameMode("resize");
  }, [hasSceneText]);

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

  const updateTextPos = (patch) => {
    const next = clampTextPos({ ...safeTextPos, ...patch }, customText);
    updateSide({ textPos: next });
  };

  const bumpCustomText = (patch) => {
    updateSide({ customText: { ...customText, ...patch } });
  };

  const setTextLayer = (layer) => {
    const z = layer === "front" ? 1 : layer === "back" ? -1 : 0;
    bumpCustomText({ z });
  };

  const sanitizeLogoBox = (nextBox) => {
    const minW = 0.12;
    const minH = 0.12;
    const rawW = activeLogoIsEmboss ? activeLogoBox.w : clamp(nextBox.w ?? activeLogoBox.w, minW, 1);
    const rawH = activeLogoIsEmboss ? activeLogoBox.h : clamp(nextBox.h ?? activeLogoBox.h, minH, 1);
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

  const clearSceneSelection = () => {
    setSceneSelectionVisible(false);
    setSceneTextSelectionVisible(false);
    setSceneFrameMode("resize");
    setSceneTextFrameMode("resize");
    setSceneModelSelectionId(null);
  };

  const handleDeleteActiveImage = () => {
    const currentId = sideData.activeLogoId || sideData.logos?.[0]?.id;
    if (!currentId) return;
    const next = (sideData.logos || []).filter((l) => l.id !== currentId);
    updateSide({ logos: next, activeLogoId: next[0]?.id || null });
    clearSceneSelection();
  };

  const handleSceneModelTap = (designId) => {
    if (!designId) return;
    if (activeTab !== "editor") return;
    setSceneModelSelectionId(null);
    if (designId !== activeId) return;
    if (showPlacementPanel) return;

    const preferText = editorControlTab === "text" || rubberActiveForSide;
    if (preferText && hasSceneText) {
      setSceneTextSelectionVisible(true);
      setSceneTextFrameMode("resize");
      setSceneSelectionVisible(false);
      return;
    }

    if (activeLogo) {
      setSceneSelectionVisible(true);
      setSceneFrameMode("resize");
      setSceneTextSelectionVisible(false);
      return;
    }

    if (hasSceneText) {
      setSceneTextSelectionVisible(true);
      setSceneTextFrameMode("resize");
      setSceneSelectionVisible(false);
    }
  };

  const handleSceneModelLongPress = (designId) => {
    if (!designId || activeTab === "editor") return;
    setActiveId(designId);
    setSceneModelSelectionId(designId);
    setSceneSelectionVisible(false);
    setSceneTextSelectionVisible(false);
  };

  const handleDeleteSceneModel = (designId) => {
    if (!designId) return;
    setSceneModelSelectionId((prev) => (prev === designId ? null : prev));
    removeModel(designId);
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

  const sanitizeCmInput = (raw) => String(raw ?? "").replace(/[^\d.,]/g, "");

  const applyWidthCmInput = (raw) => {
    if (activeLogoIsEmboss) return null;
    if (!activeLogo || !printCm.w || !printCm.h) return null;
    const nextCm = toNumber(raw);
    if (!Number.isFinite(nextCm)) return null;
    const safeRatio = activeLogoBox.w > 0 ? activeLogoBox.h / activeLogoBox.w : 1;
    const nextW = clamp(nextCm / printCm.w, 0.12, 0.95);
    const nextH = lockAspect ? clamp(nextW * safeRatio, 0.12, 0.95) : activeLogoBox.h;
    updateActiveLogoBox({ ...activeLogoBox, w: nextW, h: nextH });
    return {
      cmW: nextW * printCm.w,
      cmH: nextH * printCm.h,
    };
  };

  const applyHeightCmInput = (raw) => {
    if (activeLogoIsEmboss) return null;
    if (!activeLogo || !printCm.w || !printCm.h) return null;
    const nextCm = toNumber(raw);
    if (!Number.isFinite(nextCm)) return null;
    const safeRatio = activeLogoBox.w > 0 ? activeLogoBox.h / activeLogoBox.w : 1;
    const nextH = clamp(nextCm / printCm.h, 0.12, 0.95);
    const nextW = lockAspect ? clamp(nextH / safeRatio, 0.12, 0.95) : activeLogoBox.w;
    updateActiveLogoBox({ ...activeLogoBox, w: nextW, h: nextH });
    return {
      cmW: nextW * printCm.w,
      cmH: nextH * printCm.h,
    };
  };

  useEffect(() => {
    if (!activeLogo || !printCm.w || !printCm.h) {
      if (!isEditingCmW) setCmInputW("");
      if (!isEditingCmH) setCmInputH("");
      return;
    }
    if (!isEditingCmW) setCmInputW((activeLogoBox.w * printCm.w).toFixed(1));
    if (!isEditingCmH) setCmInputH((activeLogoBox.h * printCm.h).toFixed(1));
  }, [
    activeLogo?.id,
    activeLogoBox.w,
    activeLogoBox.h,
    printCm.w,
    printCm.h,
    activeId,
    currentSide,
    isEditingCmW,
    isEditingCmH,
  ]);

  const modelCount = designs.length;
  const isIOSDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    return /iPad|iPhone|iPod/i.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }, []);
  const perf = useMemo(() => {
    const heavy = modelCount > 2;
    if (isMobile) {
      const conservative = heavy || isIOSDevice;
      return {
        dpr: conservative ? 0.95 : 1.1,
        antialias: !conservative,
        shadowMap: conservative ? 256 : 320,
        powerPreference: "default",
      };
    }
    return {
      dpr: heavy ? 1.3 : 1.6,
      antialias: !heavy,
      shadowMap: heavy ? 512 : 768,
      powerPreference: "high-performance",
    };
  }, [isMobile, modelCount, isIOSDevice]);

  // Mobile drawer
  const DRAWER_PEEK = 74;
  const CONTROLS_GAP = 56;
  const MAX_OPEN = 0;
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerY, setDrawerY] = useState(0);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [drawerMaxClosed, setDrawerMaxClosed] = useState(500);
  const drawerYRef = useRef(0);
  const dragState = useRef({ dragging: false, moved: false, startY: 0, startDrawerY: 0 });

  useEffect(() => {
    document.documentElement.style.backgroundColor = SCENE_BG_COLOR;
    document.body.style.backgroundColor = SCENE_BG_COLOR;
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
      if (lockToastTimerRef.current) clearTimeout(lockToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const shouldLockScroll = flowStep !== "select";
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    document.documentElement.style.overflow = shouldLockScroll ? "hidden" : "";
    document.body.style.overscrollBehaviorY = shouldLockScroll ? "none" : "";
    document.documentElement.style.overscrollBehaviorY = shouldLockScroll ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.overscrollBehaviorY = "";
      document.documentElement.style.overscrollBehaviorY = "";
    };
  }, [flowStep]);

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
    if (!presetModelFromQuery) return;
    setSelectedModelType((prev) => prev || presetModelFromQuery);
  }, [presetModelFromQuery]);

  useEffect(() => {
    if (!resumeRequested || resumeAppliedRef.current) return;
    resumeAppliedRef.current = true;
    const cached = getCheckoutData();
    if (!cached?.designs?.length) return;
    const restored = cached.designs.map(restoreDesignFromCheckoutItem).filter(Boolean);
    if (!restored.length) return;

    setDesigns(restored);
    setActiveId(restored[0].id);
    setSelectedModelType(restored[0].modelType);
    setView("front");
    setFlowStep("design");
    setActiveTab("upload");
    setForceEditorOverlay(false);
    setPickerOpen(false);
    setDrawerMenuOpen(false);
    setDrawerOpen(true);
    router.replace(`/tasarim?model=${restored[0].modelType}`, { scroll: false });
  }, [resumeRequested, router]);

  useEffect(() => {
    if (!activeId && designs[0]) setActiveId(designs[0].id);
  }, [activeId, designs]);

  useEffect(() => {
    const alive = new Set(designs.map((d) => d.id));
    const next = {};
    Object.entries(modelUserRotateRef.current).forEach(([id, rot]) => {
      if (alive.has(id)) next[id] = rot;
    });
    modelUserRotateRef.current = next;
  }, [designs]);

  const activeDesign = useMemo(() => designs.find((d) => d.id === activeId) || designs[0], [designs, activeId]);
  const hasDtfForActiveSide = getPrintTypesForSide(activeDesign, view).includes("dtf");
  const DRAWER_TABS = hasDtfForActiveSide ? ["color", "print", "text", "upload"] : ["color", "print", "text"];
  const tabIndex = DRAWER_TABS.indexOf(activeTab);
  const tabLabelMap = {
    print: "Baskı Seçim",
    upload: "Görsel",
    text: "Yazı",
    editor: "Yerleşim",
    color: "Renk",
  };
  const goPrevTab = () => {
    setDrawerMenuOpen(false);
    if (tabIndex < 0) {
      setActiveTab("color");
      return;
    }
    setActiveTab(DRAWER_TABS[(tabIndex - 1 + DRAWER_TABS.length) % DRAWER_TABS.length]);
  };
  const goNextTab = () => {
    setDrawerMenuOpen(false);
    if (tabIndex < 0) {
      setActiveTab("color");
      return;
    }
    setActiveTab(DRAWER_TABS[(tabIndex + 1) % DRAWER_TABS.length]);
  };
  const openPrintTypePickerFromHeader = () => {
    setSelectedModelType(activeDesign?.modelType || selectedModelType || safeInitial);
    setFlowStep("select");
    setShowPlacementPanel(false);
    setActiveTab("print");
    setDrawerMenuOpen(false);
    setPickerOpen(false);
    router.replace("/tasarim", { scroll: false });
  };
  const menuTabs = [
    { id: "color", label: "Renk", icon: Palette },
    { id: "print", label: "Baskı Seçim", icon: Layers },
    { id: "text", label: "Yazı", icon: FileText },
    ...(hasDtfForActiveSide ? [{ id: "upload", label: "Görsel", icon: ImageIcon }] : []),
  ];
  const activePrintTypes = getPrintTypesForSide(activeDesign, view);
  const selectedPrintTypeNames = activePrintTypes
    .map((typeId) => PRINT_TYPE_OPTIONS.find((opt) => opt.id === typeId)?.label || typeId)
    .join(" • ");
  const togglePrintTypeFromMenu = (typeId) => {
    const opt = PRINT_TYPE_OPTIONS.find((entry) => entry.id === typeId);
    if (!opt?.available) return;

    let becameSelected = false;
    const safeSide = view === "back" ? "back" : "front";
    setDesigns((prev) =>
      prev.map((d) => {
        if (d.id !== activeId) return d;
        const bySide = normalizePrintTypesBySide(d.printTypesBySide, d.printTypes);
        const current = bySide[safeSide];
        const has = current.includes(typeId);
        const nextCurrent = has ? current.filter((id) => id !== typeId) : [...current, typeId];
        becameSelected = !has;
        const nextBySide = { ...bySide, [safeSide]: Array.from(new Set(nextCurrent)) };
        return {
          ...d,
          printTypesBySide: nextBySide,
          printTypes: Array.from(new Set([...(nextBySide.front || []), ...(nextBySide.back || [])])),
        };
      })
    );

    if (becameSelected && (typeId === "rubber" || typeId === "flock")) {
      setActiveTab("text");
    } else if (becameSelected && typeId === "dtf") {
      setActiveTab("upload");
    } else {
      setActiveTab("print");
    }
    setDrawerMenuOpen(false);
  };

  const selectMenuTab = (id) => {
    setActiveTab(id);
    setDrawerMenuOpen(false);
  };
  const openDrawerMenu = () => {
    setDrawerMenuMounted(true);
    setDrawerMenuOpen(true);
  };
  const closeDrawerMenu = () => setDrawerMenuOpen(false);

  useEffect(() => {
    if (activeTab !== "upload") setForceEditorOverlay(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "upload" && !hasDtfForActiveSide) {
      setActiveTab("print");
    }
  }, [activeTab, hasDtfForActiveSide]);

  useEffect(() => {
    const prev = prevActiveTabRef.current;
    if (activeTab !== "editor") {
      setShowPlacementPanel(false);
      clearSceneSelection();
    } else if (prev !== "editor") {
      setShowPlacementPanel(false);
      clearSceneSelection();
      const enteringFromText = prev === "text";
      setEditorControlTab(enteringFromText ? "text" : "logo");
      if (enteringFromText && hasSceneText) {
        setSceneTextSelectionVisible(true);
        setSceneTextFrameMode("resize");
      }
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab, hasSceneText]);

  useEffect(() => {
    if (!drawerOpen) setDrawerMenuOpen(false);
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerMenuOpen) {
      setDrawerMenuMounted(true);
      return;
    }
    const timer = setTimeout(() => setDrawerMenuMounted(false), 200);
    return () => clearTimeout(timer);
  }, [drawerMenuOpen]);

  useEffect(() => {
    setIsLogoDragging(false);
  }, [activeTab, currentSide, activeId]);

  useEffect(() => {
    if (activeTab !== "editor") return;
    const hasLogo = (sideData?.logos || []).length > 0;
    if (!hasLogo && editorControlTab === "effects") {
      setEditorControlTab("logo");
    }
  }, [activeTab, activeId, currentSide, sideData?.logos?.length, editorControlTab]);

  useEffect(() => {
    if (activeTab === "pattern") {
      setActiveTab("print");
    }
  }, [activeTab]);

  // Desktop'ta baskı alanı açıldığında drawer otomatik aşağı (kapalı) konuma geçer.
  useEffect(() => {
    if (!isMobile && isPrintAreaOpen) setDrawerOpen(false);
  }, [isMobile, isPrintAreaOpen]);

  useEffect(() => {
    if (isMobile && isPrintAreaOpen) {
      setDrawerOpen(false);
    }
  }, [isMobile, isPrintAreaOpen]);

  const updateActive = (patch) => {
    if (patch?.__setView) {
      setView(patch.__setView);
      const { __setView, ...rest } = patch;
      patch = rest;
    }
    const nextPatch = { ...(patch || {}) };
    if (nextPatch.hoodieV12Parts) {
      nextPatch.hoodieV12Parts = normalizeHoodieParts(nextPatch.hoodieV12Parts);
    }
    if (Object.prototype.hasOwnProperty.call(nextPatch, "pdfPlacement")) {
      nextPatch.pdfPlacement = normalizePdfPlacement(
        nextPatch.pdfPlacement,
        nextPatch.pdfPlacement?.side || activeDesign?.pdfPlacement?.side || view
      );
    }
    if (nextPatch.hasPdf === false) {
      nextPatch.pdfFileUrl = nextPatch.pdfFileUrl || "";
      nextPatch.pdfOriginalName = nextPatch.pdfOriginalName || "";
    }
    setDesigns((prev) => prev.map((d) => (d.id === activeId ? { ...d, ...nextPatch } : d)));
  };

  const activeHoodieParts = normalizeHoodieParts(activeDesign?.hoodieV12Parts);
  const showHoodieVariantButtons = MODELS_WITH_HOODIE_PARTS.has(activeDesign?.modelType);
  const setActiveHoodiePartEnabled = (partKey, enabled) => {
    if (!["strings", "pocket"].includes(partKey)) return;
    updateActive({
      hoodieV12Parts: {
        ...activeHoodieParts,
        [partKey]: Boolean(enabled),
      },
    });
  };

  const handleModelUserRotate = (designId, rotationPatch) => {
    if (!designId || !rotationPatch) return;
    const prev = modelUserRotateRef.current[designId] || { x: 0, y: 0 };
    modelUserRotateRef.current[designId] = {
      x: Number.isFinite(rotationPatch.x) ? rotationPatch.x : prev.x,
      y: Number.isFinite(rotationPatch.y) ? rotationPatch.y : prev.y,
    };
  };

  const addModel = (type) => {
    const t = AVAILABLE_MODELS.includes(type) ? type : AVAILABLE_MODELS[0];
    const nd = createDesign(t);
    setDesigns((prev) => [...prev, nd]);
    setActiveId(nd.id);
    setPickerOpen(false);
  };

  const startDesignFlow = (forcedModelType = null) => {
    const resolvedType =
      forcedModelType && AVAILABLE_MODELS.includes(forcedModelType)
        ? forcedModelType
        : selectedModelType;
    if (!resolvedType || !AVAILABLE_MODELS.includes(resolvedType)) return;
    const next = createDesign(resolvedType);
    setDesigns([next]);
    setActiveId(next.id);
    setView("front");
    setActiveTab("color");
    setForceEditorOverlay(false);
    setPickerOpen(false);
    setDrawerMenuOpen(false);
    setDrawerOpen(true);
    setFlowStep("design");
    router.replace(`/tasarim?model=${resolvedType}`, { scroll: false });
  };

  const removeModel = (id) => {
    setDesigns((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (id === activeId) setActiveId(next[next.length - 1]?.id || null);
      return next.length ? next : [createDesign(safeInitial)];
    });
  };

  const layoutFor = (designId) => {
    const sceneRotY = (captureView || view) === "back" ? Math.PI : 0;
    if (captureId) {
      if (designId !== captureId) return { hidden: true, x: -999, z: -999, rotY: 0, scale: 1 };
      return { hidden: false, x: 0, z: 0, rotY: sceneRotY, scale: 1.05 };
    }

    if (designId === activeId) {
      return { hidden: false, x: 0, z: 0, rotY: sceneRotY, scale: 1.03 };
    }

    const others = designs.filter((d) => d.id !== activeId);
    const idx = others.findIndex((d) => d.id === designId);

    if (isMobile) {
      return {
        hidden: false,
        x: -0.36 - idx * 0.3,
        z: -0.86 - idx * 0.22,
        rotY: sceneRotY + 0.64,
        scale: 0.78,
      };
    }
    return {
      hidden: false,
      x: -0.86 - idx * 0.42,
      z: -0.82 - idx * 0.28,
      rotY: sceneRotY + 0.82,
      scale: 0.9,
    };
  };

  useEffect(() => {
    const hasSceneTarget = Boolean(activeLogo || hasSceneText || pdfVisibleOnCurrentSide);
    if (!isPrintAreaOpen || !printBounds || !hasSceneTarget) {
      setScenePlaneRect(null);
      return;
    }

    let rafId = 0;
    const yAxis = new THREE.Vector3(0, 1, 0);
    const euler = new THREE.Euler();

    const calc = () => {
      const camera = cameraRef.current;
      const gl = glRef.current;
      if (!camera || !gl?.domElement) {
        rafId = requestAnimationFrame(calc);
        return;
      }

      const canvasRect = gl.domElement.getBoundingClientRect();
      const layout = layoutFor(activeId);
      const sideRotY = Number(printBounds.rotY ?? (currentSide === "back" ? Math.PI : 0));
      const modelScale = (Number(layout?.scale) || 1) + 0.05;
      const modelX = Number(layout?.x) || 0;
      const modelZ = Number(layout?.z) || 0;
      const modelY = -0.08;
      const userRotate = modelUserRotateRef.current?.[activeId] || { x: 0, y: 0 };
      const modelRotY = (Number(layout?.rotY) || 0) + (Number(userRotate?.y) || 0);
      const modelRotX = Number(userRotate?.x) || 0;
      const zOffset = currentSide === "back" ? -0.001 : 0.001;

      const toWorld = (nx, ny) => {
        const x = printBounds.xMin + nx * (printBounds.xMax - printBounds.xMin);
        const y = printBounds.yTop - ny * (printBounds.yTop - printBounds.yBot);
        const z = (printBounds.z || 0) + zOffset;
        const v = new THREE.Vector3(x, y, z);
        v.applyAxisAngle(yAxis, sideRotY);
        v.multiplyScalar(modelScale);
        euler.set(modelRotX, modelRotY, 0);
        v.applyEuler(euler);
        v.x += modelX;
        v.y += modelY;
        v.z += modelZ;
        return v;
      };

      const points = [
        toWorld(0, 0),
        toWorld(1, 0),
        toWorld(1, 1),
        toWorld(0, 1),
      ].map((v) => {
        const p = v.clone().project(camera);
        return {
          x: canvasRect.left + (p.x * 0.5 + 0.5) * canvasRect.width,
          y: canvasRect.top + (-p.y * 0.5 + 0.5) * canvasRect.height,
        };
      });

      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      if (
        Number.isFinite(minX) &&
        Number.isFinite(maxX) &&
        Number.isFinite(minY) &&
        Number.isFinite(maxY)
      ) {
        setScenePlaneRect({
          left: minX,
          top: minY,
          width: Math.max(1, maxX - minX),
          height: Math.max(1, maxY - minY),
        });
      }

      rafId = requestAnimationFrame(calc);
    };

    calc();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    isPrintAreaOpen,
    activeLogo?.id,
    hasSceneText,
    pdfVisibleOnCurrentSide,
    activeId,
    currentSide,
    printBounds,
    captureView,
    view,
    isMobile,
  ]);

  const captureMockupForSide = async (designId, sideView) => {
    if (!glRef.current || !sceneRef.current || !cameraRef.current) return null;
    setCaptureId(designId);
    setCaptureView(sideView);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const gl = glRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Capture sırasında kamerayı hedef yöne direkt koy; ön/arka mockup karışmasın.
    const extra = Math.min(1.2, Math.max(0, (designs.length - 1) * 0.3));
    const dist = 2.05 + extra;
    const camPos = new THREE.Vector3(0, 0.24, dist);
    camera.position.copy(camPos);
    camera.lookAt(0, -0.08, 0);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(0, -0.08, 0);
      controlsRef.current.update();
    }

    await new Promise((r) => requestAnimationFrame(r));
    gl.render(scene, camera);
    return gl.domElement.toDataURL("image/png");
  };

  const handleFinishCheckout = async () => {
    const hasAnyContent = designs.some((d) => Object.values(d.sides).some((sd) => hasSideContent(sd)));
    if (!hasAnyContent) {
      alert("Lütfen en az bir üründe (ÖN/ARKA) logo/yazı ekleyin.");
      return;
    }

    setLoading(true);
    try {
      const checkoutDesigns = [];

      for (const d of designs) {
        const activeSides = getActiveSides(d);
        if (activeSides.length === 0) continue;

        const mockupFiles = {};
        const printFiles = {};
        const textFiles = {};
        const adjustedUploads = {};
        const userUploadsSet = new Set();

        for (const [sideKey] of activeSides) {
          const sd = d.sides?.[sideKey] || EMPTY_SIDE;
          const zipperGap =
            hasCenterZip(d.modelType) && sideKey === "front"
              ? MODEL_PRINT_BOUNDS?.[d.modelType]?.front?.zipGap01 ?? MODEL_PRINT_BOUNDS?.fermuarli?.front?.zipGap01 ?? 0
              : 0;
          const exportOpts = zipperGap ? { clearCenterStripe01: zipperGap } : {};

          // eslint-disable-next-line no-await-in-loop
          const printData = await makePrintDataUrl(sd, exportOpts);
          if (printData) printFiles[sideKey] = printData;

          // eslint-disable-next-line no-await-in-loop
          const textData = await makeTextDataUrl(sd, exportOpts);
          if (textData) textFiles[sideKey] = textData;

          // eslint-disable-next-line no-await-in-loop
          const adjustedList = await makeAdjustedLogoDataUrls(sd);
          if (adjustedList.length) adjustedUploads[sideKey] = adjustedList;

          for (const l of sd.logos || []) {
            if (l?.url) userUploadsSet.add(l.url);
          }

          // eslint-disable-next-line no-await-in-loop
          mockupFiles[sideKey] = await captureMockupForSide(d.id, sideKey);
        }

        setCaptureId(null);
        setCaptureView(null);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const previewMockup = mockupFiles.front || mockupFiles[activeSides[0][0]] || null;
        const launchPrice = getPrice(d);
        const listPrice = getListPriceBeforeLaunchDiscount(launchPrice);
        const rubberSpecsBySide = buildRubberSpecsBySide(d);
        const orderItem = {
          id: `${d.id}-${Date.now()}`,
          name: MODEL_LABELS[d.modelType] || d.modelType,
          price: launchPrice,
          listPrice,
          launchDiscountRate: LAUNCH_DISCOUNT_RATE,
          size: d.size,
          color: d.color,
          quantity: 1,
          image: previewMockup,
          designDetails: {
            model: d.modelType,
            baseColor: d.color,
            fabricType: normalizeFabricType(d.fabricType, d.modelType),
            stringColor: d.stringColor,
            hoodieV12Parts: normalizeHoodieParts(d.hoodieV12Parts),
            hasPdf: Boolean(d.hasPdf && d.pdfFileUrl),
            pdfFileUrl: d.pdfFileUrl || null,
            pdfOriginalName: d.pdfOriginalName || "",
            pdfPlacement: normalizePdfPlacement(d.pdfPlacement, d.pdfPlacement?.side || "front"),
            printTypes: Array.isArray(d.printTypes) ? d.printTypes : [],
            printTypesBySide: normalizePrintTypesBySide(d.printTypesBySide, d.printTypes),
            printFiles,
            textFiles,
            mockupFiles,
            userUploads: Array.from(userUploadsSet),
            adjustedUploads,
            rubberSpecsBySide,
            sides: d.sides,
          },
        };

        checkoutDesigns.push({
          id: orderItem.id,
          modelType: d.modelType,
          name: orderItem.name,
          color: d.color,
          fabricType: normalizeFabricType(d.fabricType, d.modelType),
          size: d.size,
          price: orderItem.price,
          listPrice: orderItem.listPrice,
          launchDiscountRate: orderItem.launchDiscountRate,
          quantity: 1,
          hoodieV12Parts: normalizeHoodieParts(d.hoodieV12Parts),
          hasPdf: Boolean(d.hasPdf && d.pdfFileUrl),
          pdfFileUrl: d.pdfFileUrl || null,
          pdfOriginalName: d.pdfOriginalName || "",
          pdfPlacement: normalizePdfPlacement(d.pdfPlacement, d.pdfPlacement?.side || "front"),
          printTypes: Array.isArray(d.printTypes) ? d.printTypes : [],
          printTypesBySide: normalizePrintTypesBySide(d.printTypesBySide, d.printTypes),
          preview: previewMockup,
          image: previewMockup,
          printFiles,
          textFiles,
          mockupFiles,
          userUploads: Array.from(userUploadsSet),
          adjustedUploads,
          rubberSpecsBySide,
          designDetails: orderItem.designDetails,
        });
      }

      const totalPrice = checkoutDesigns.reduce((sum, item) => sum + (item.price || 0), 0);
      setCheckoutData({
        createdAt: Date.now(),
        designs: checkoutDesigns,
        totalPrice,
      });

      router.push("/tasarim/adet");
    } catch (err) {
      console.error("Siparis sayfasi hazirlanamadi:", err);
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
      const zoomButtonTop = activeTab === "editor" ? 182 : 238;
      const zoomButtonApproxHeight = 86;
      const extraOffset = isPrintAreaOpen ? 30 : 10;
      const drawerTopLimit = zoomButtonTop + zoomButtonApproxHeight + 8;
      const maxByZoomReference = Math.max(280, window.innerHeight - drawerTopLimit - extraOffset);
      const h = clamp(Math.min(window.innerHeight * 0.72, 560), 280, maxByZoomReference);
      const maxClosed = Math.max(0, h - DRAWER_PEEK);
      setDrawerHeight(h);
      setDrawerMaxClosed(maxClosed);
      setDrawerY((y) => clamp(y, MAX_OPEN, maxClosed));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [isMobile, activeTab]);

  // drawer behavior
  useEffect(() => {
    if (!isMobile) return;
    const nextY = drawerOpen ? MAX_OPEN : drawerMaxClosed;
    drawerYRef.current = nextY;
    setDrawerY(nextY);
  }, [drawerOpen, isMobile, drawerMaxClosed]);

  useEffect(() => {
    drawerYRef.current = drawerY;
  }, [drawerY]);

  const onDrawerPointerDown = (e) => {
    dragState.current.dragging = true;
    dragState.current.moved = false;
    dragState.current.startY = e.clientY;
    dragState.current.startDrawerY = drawerYRef.current;
    window.addEventListener("pointermove", onDrawerPointerMove);
    window.addEventListener("pointerup", onDrawerPointerUp);
  };

  const onDrawerPointerMove = (e) => {
    if (!dragState.current.dragging) return;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dy) > 2) dragState.current.moved = true;
    const next = clamp(dragState.current.startDrawerY + dy, MAX_OPEN, drawerMaxClosed);
    drawerYRef.current = next;
    setDrawerY(next);
  };

  const onDrawerPointerUp = () => {
    const moved = dragState.current.moved;
    const movedUpEnough = drawerYRef.current < dragState.current.startDrawerY - 20;
    dragState.current.dragging = false;
    dragState.current.moved = false;
    window.removeEventListener("pointermove", onDrawerPointerMove);
    window.removeEventListener("pointerup", onDrawerPointerUp);
    if (!moved) {
      toggleDrawer();
      return;
    }
    const mid = (drawerMaxClosed - MAX_OPEN) * 0.55;
    const shouldOpen = movedUpEnough || drawerYRef.current < mid;
    if (shouldOpen) {
      openDrawer();
    } else {
      closeDrawer();
    }
  };

  const openDrawer = () => {
    // Editor modunda drawer'ı açarken tab'ı değiştirme
    if (isMobile) {
      drawerYRef.current = MAX_OPEN;
      setDrawerY(MAX_OPEN);
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (isMobile) {
      drawerYRef.current = drawerMaxClosed;
      setDrawerY(drawerMaxClosed);
    }
    setDrawerOpen(false);
  };

  const toggleDrawer = () => {
    dragState.current.dragging = false;
    window.removeEventListener("pointermove", onDrawerPointerMove);
    window.removeEventListener("pointerup", onDrawerPointerUp);
    if (drawerOpen) {
      closeDrawer();
      return;
    }
    openDrawer();
  };

  const zoomModel = (direction) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const zoomStep = 1.12;
    if (direction === "in") {
      controls.dollyOut?.(zoomStep);
    } else {
      controls.dollyIn?.(zoomStep);
    }
    controls.update?.();
  };

  const switchSideAndOpenPrintPicker = (nextSide) => {
    if (nextSide !== "front" && nextSide !== "back") return;
    setView(nextSide);
    setActiveTab("print");
    setDrawerOpen(true);
    setDrawerMenuOpen(false);
    setPrintTypePickerSignal((prev) => prev + 1);
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
  const visibleDrawerHeight = isMobile
    ? Math.max(DRAWER_PEEK, drawerHeight ? drawerHeight - drawerY : DRAWER_PEEK)
    : drawerOpen
      ? DESKTOP_DRAWER_HEIGHT
      : DESKTOP_DRAWER_PEEK;
  const isPlacementPanelVisible = isPrintAreaOpen && showPlacementPanel;
  const hideMobileDrawerInEditor = isMobile && isPlacementPanelVisible;
  const sceneEditCenterLeft = isMobile
    ? isPlacementPanelVisible
      ? "60%"
      : "56%"
    : isPlacementPanelVisible
      ? "63%"
      : "50%";
  const sceneEditCenterTop = isMobile
    ? isPlacementPanelVisible
      ? "41%"
      : "45%"
    : isPlacementPanelVisible
      ? "43%"
      : "47%";
  const hdrEnvUrls = useMemo(
    () => (isMobile ? [HDR_ENV_MOBILE_PATH, HDR_ENV_DESKTOP_PATH] : [HDR_ENV_DESKTOP_PATH, HDR_ENV_MOBILE_PATH]),
    [isMobile]
  );
  const pickerGroups = MODEL_SELECTION_GROUPS.map((group) => ({
    ...group,
    models: group.models.filter((modelType) => AVAILABLE_MODELS.includes(modelType)),
  })).filter((group) => group.models.length > 0);
  const selectedModelTypesSet = new Set(
    (designs || []).map((d) => normalizeModelType(d?.modelType))
  );

  const renderPanel = (
    <EditorPanel
      design={activeDesign}
      updateDesign={updateActive}
      view={view}
      isMobile={isMobile}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      layout="drawer"
      onRequestDrawerCollapse={() => setDrawerOpen(false)}
      onRequestDrawerExpand={() => setDrawerOpen(true)}
      onRequestShowEditorOverlay={() => setForceEditorOverlay(true)}
      forceShowEditorOverlay={forceEditorOverlay}
      suppressEditorInPanel={!isMobile && forceEditorOverlay}
      onOpenCategoryMenu={openDrawerMenu}
      printTypePickerSignal={printTypePickerSignal}
    />
  );

  if (flowStep === "select") {
    return (
      <ModelSelectionPanel
        selectedModel={selectedModelType}
        onSelectModel={setSelectedModelType}
        onContinue={startDesignFlow}
      />
    );
  }

  const headerDesign = activeDesign || createDesign(DEFAULT_MODEL_TYPE);
  const headerLaunchPrice = getPrice(headerDesign);
  const headerListPrice = getListPriceBeforeLaunchDiscount(headerLaunchPrice);

  return (
    <div className="fixed inset-0 h-screen w-full text-white overflow-hidden font-sans" style={{ background: SCENE_BG_COLOR, overscrollBehavior: "none", touchAction: isMobile ? "pan-y" : "none" }}>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-[90] px-4 pt-4 pb-3 flex items-start justify-between pointer-events-none">
        <div className="flex items-start gap-3 pointer-events-auto">
          <button
            onClick={openPrintTypePickerFromHeader}
            className="mt-0.5 h-8 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center text-[10px] font-black uppercase tracking-wide shadow-sm"
            aria-label="Model secimine don"
          >
            Geri
          </button>
          <div>
            <p className="text-sm font-bold text-black">{MODEL_LABELS[headerDesign.modelType] || headerDesign.modelType}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-zinc-500 line-through">{formatMoney(headerListPrice)} ₺</p>
              <p className="text-xs font-black text-zinc-700">{formatMoney(headerLaunchPrice)} ₺</p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Açılışa Özel %20 İndirim</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleFinishCheckout}
            disabled={loading}
            className={`px-4 py-2 rounded-full border border-zinc-300 bg-white text-black text-xs font-black uppercase tracking-widest shadow-lg ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-zinc-100"
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
            className="absolute z-[90] pointer-events-none transition-all duration-300"
            style={
              isMobile
                ? { top: "110px", right: "4px" }
                : { bottom: controlsBottom, right: "16px" }
            }
          >
            <div className="flex flex-col items-center pointer-events-auto gap-2">
              <div
                className={`flex flex-col rounded-full border-2 border-zinc-700 bg-white/95 backdrop-blur shadow-[0_10px_26px_rgba(0,0,0,0.22)] ${isMobile ? "p-[3px]" : "p-1.5"
                  }`}
              >
                {UI_VIEWS.map((v) => (
                  <button
                    key={v}
                    onClick={() => switchSideAndOpenPrintPicker(v)}
                    className={`${isMobile ? "px-3 py-1.5 text-[10px]" : "px-5 py-2.5 text-[11px]"} rounded-full font-bold uppercase tracking-widest transition-all ${view === v
                      ? "bg-zinc-900 text-white shadow-md"
                      : "bg-white text-zinc-600 hover:bg-zinc-100"
                      }`}
                  >
                    {v === "front" ? "ÖN" : "ARKA"}
                  </button>
                ))}
              </div>
              {showHoodieVariantButtons && !isMobile && (
                <div className="rounded-2xl border border-zinc-300 bg-white/95 backdrop-blur px-2 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                  <div className="grid grid-cols-1 gap-1.5 min-w-[116px]">
                    {HOODIE_DETAIL_OPTIONS.map((opt) => {
                      const isEnabled = Boolean(activeHoodieParts[opt.id]);
                      return (
                        <button
                          key={`floating-hoodie-${opt.id}`}
                          onClick={() => setActiveHoodiePartEnabled(opt.id, !isEnabled)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition ${isEnabled
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                            }`}
                        >
                          {isEnabled ? "✓ " : ""}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isMobile && (
          <div
            className="absolute z-[90] pointer-events-auto transition-all duration-300"
            style={{ top: activeTab === "editor" ? "182px" : "238px", right: "10px" }}
          >
            <div className="flex flex-col gap-2 rounded-2xl border border-zinc-300 bg-white/90 backdrop-blur px-2 py-2 shadow-lg">
              <button
                onClick={() => zoomModel("in")}
                className="w-9 h-9 rounded-full border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center"
                aria-label="Yakınlaştır"
              >
                <Plus size={16} strokeWidth={2.8} />
              </button>
              <button
                onClick={() => zoomModel("out")}
                className="w-9 h-9 rounded-full border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center"
                aria-label="Uzaklaştır"
              >
                <Minus size={16} strokeWidth={2.8} />
              </button>
            </div>
          </div>
        )}

        {/* Model picker modal */}
        {pickerOpen && (
          <div className="absolute inset-0 z-[95] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#eef1f4] border border-gray-300 rounded-2xl p-4 max-h-[82vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black tracking-widest uppercase text-zinc-800">Model Ekle</h3>
                <button
                  onClick={() => {
                    setPickerOpen(false);
                  }}
                  className="w-8 h-8 rounded-full border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 flex items-center justify-center"
                  aria-label="Model penceresini kapat"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Eklenebilecek Modeller</p>
                {pickerGroups.map((group) => (
                  <div key={`picker-group-full-${group.id}`} className="rounded-xl border border-zinc-300 bg-white p-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-zinc-600 mb-2">{group.title}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {group.models.map((modelType) => {
                        const alreadyAdded = selectedModelTypesSet.has(normalizeModelType(modelType));
                        return (
                          <button
                            key={`picker-add-model-${modelType}`}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => addModel(modelType)}
                            className={`py-2 px-2 rounded-lg border text-xs font-bold uppercase tracking-wide text-center ${
                              alreadyAdded
                                ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800"
                            }`}
                          >
                            {MODEL_SELECTION_CARD_LABELS[normalizeModelType(modelType)] || MODEL_LABELS[modelType] || modelType}
                            <span className="block mt-0.5 text-[10px] font-normal normal-case text-zinc-500">
                              {alreadyAdded ? "Ekli" : getModelGroupTitle(modelType)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Editor Overlay - Sol Taraf */}
        {isPrintAreaOpen && showPlacementPanel && (
          <div
            className={`absolute z-[90] backdrop-blur-md border border-gray-200 shadow-2xl overflow-hidden flex flex-col ${isMobile ? "rounded-none border-x-0 rounded-t-2xl" : "rounded-2xl"
              }`}
            style={{
              backgroundColor: "#f7f8fa",
              left: isMobile ? "0" : `${LEFT_PRINT_AREA_GAP}px`,
              right: isMobile ? "0" : undefined,
              width: isMobile ? "auto" : `${LEFT_PRINT_AREA_WIDTH}px`,
              maxWidth: isMobile ? "100vw" : undefined,
              top: isMobile ? "auto" : "72px",
              bottom: isMobile
                ? hideMobileDrawerInEditor
                  ? "calc(env(safe-area-inset-bottom) + 2px)"
                  : `${Math.round(visibleDrawerHeight) + 48}px`
                : `${(drawerOpen ? DESKTOP_DRAWER_HEIGHT : DESKTOP_DRAWER_PEEK) + 12}px`,
              maxHeight: isMobile ? (hideMobileDrawerInEditor ? "48vh" : "58vh") : undefined,
            }}
          >
            {isMobile && !!lockToast && (
              <div className="absolute left-1/2 top-2 -translate-x-1/2 z-20 rounded-full bg-black/45 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 backdrop-blur-md border border-white/25 pointer-events-none">
                {lockToast}
              </div>
            )}
            <div className={`${isMobile ? "p-3" : "p-4"} border-b border-gray-200 bg-white/85`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Yerleşim Ayarı</h3>
                  <p className="text-[10px] text-gray-500 mt-1">{sideLabel}</p>
                </div>
                <button
                  onClick={() => setShowPlacementPanel(false)}
                  className="w-8 h-8 rounded-full border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 flex items-center justify-center"
                  aria-label="Yerleşim panelini kapat"
                  title="Kapat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className={`flex-1 ${isMobile ? "overflow-y-auto overflow-x-hidden p-3" : "overflow-y-auto overflow-x-visible p-4"}`}>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setEditorControlTab("logo")}
                  className={`py-1.5 rounded-lg text-[10px] font-black uppercase border ${editorControlTab === "logo"
                    ? "bg-white text-black border-white"
                    : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                    }`}
                >
                  Gorsel Ayari
                </button>
                <button
                  onClick={() => setEditorControlTab("text")}
                  className={`py-1.5 rounded-lg text-[10px] font-black uppercase border ${editorControlTab === "text"
                    ? "bg-white text-black border-white"
                    : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                    }`}
                >
                  Yazi Ayari
                </button>
                <button
                  onClick={() => setEditorControlTab("effects")}
                  className={`py-1.5 rounded-lg text-[10px] font-black uppercase border ${editorControlTab === "effects"
                    ? "bg-white text-black border-white"
                    : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                    }`}
                >
                  Efektler
                </button>
              </div>

              {editorControlTab === "logo" && (
                <div className={`mt-3 rounded-xl border border-zinc-700 bg-zinc-800/60 space-y-3 relative ${isMobile ? "p-2.5" : "p-3"}`}>
                  <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Gorsel Ayarlari</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Ölçü (cm)</p>
                      <button
                        onClick={toggleLockAspect}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center ${lockAspect ? "bg-white text-black border-white" : "bg-zinc-700 text-zinc-100 border-zinc-500"
                          }`}
                        title={lockAspect ? "Kilit Kapalı" : "Kilit Açık"}
                      >
                        {lockAspect ? <Lock size={14} /> : <LockOpen size={14} />}
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
                          disabled={sizeControlDisabled}
                          onChange={(e) => {
                            setCmInputW(sanitizeCmInput(e.target.value));
                          }}
                          className={`w-full rounded-md border px-2 py-1 text-[16px] md:text-[11px] ${sizeControlDisabled
                            ? "border-zinc-700 bg-zinc-800/60 text-zinc-500 cursor-not-allowed"
                            : "border-zinc-600 bg-zinc-900/60 text-white"
                            }`}
                          onFocus={() => setIsEditingCmW(true)}
                          onBlur={() => {
                            setIsEditingCmW(false);
                            const applied = applyWidthCmInput(cmInputW);
                            if (!applied) {
                              if (printCm.w) setCmInputW((activeLogoBox.w * printCm.w).toFixed(1));
                              return;
                            }
                            setCmInputW(applied.cmW.toFixed(1));
                            if (lockAspect) setCmInputH(applied.cmH.toFixed(1));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
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
                          disabled={sizeControlDisabled}
                          onChange={(e) => {
                            setCmInputH(sanitizeCmInput(e.target.value));
                          }}
                          className={`w-full rounded-md border px-2 py-1 text-[16px] md:text-[11px] ${sizeControlDisabled
                            ? "border-zinc-700 bg-zinc-800/60 text-zinc-500 cursor-not-allowed"
                            : "border-zinc-600 bg-zinc-900/60 text-white"
                            }`}
                          onFocus={() => setIsEditingCmH(true)}
                          onBlur={() => {
                            setIsEditingCmH(false);
                            const applied = applyHeightCmInput(cmInputH);
                            if (!applied) {
                              if (printCm.h) setCmInputH((activeLogoBox.h * printCm.h).toFixed(1));
                              return;
                            }
                            setCmInputH(applied.cmH.toFixed(1));
                            if (lockAspect) setCmInputW(applied.cmW.toFixed(1));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
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
                      disabled={imageControlDisabled}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, x: Number(e.target.value) })}
                      className={`w-full accent-cyan-300 ${imageControlDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      disabled={imageControlDisabled}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, y: Number(e.target.value) })}
                      className={`w-full accent-cyan-300 ${imageControlDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      disabled={sizeControlDisabled}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, w: Number(e.target.value) })}
                      className={`w-full accent-cyan-300 ${sizeControlDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      disabled={sizeControlDisabled}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, h: Number(e.target.value) })}
                      className={`w-full accent-cyan-300 ${sizeControlDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      step="5"
                      value={activeLogo?.rotation || 0}
                      disabled={imageControlDisabled}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const snapped = Math.round(raw / 5) * 5;
                        updateActiveLogo({ rotation: snapped });
                      }}
                      className={`w-full accent-cyan-300 ${imageControlDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={imageControlDisabled}
                      onClick={() => setActiveLogoLayer("front")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${imageControlDisabled
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-zinc-700 hover:bg-zinc-600"
                        }`}
                    >
                      Öne Al
                    </button>
                    <button
                      disabled={imageControlDisabled}
                      onClick={() => setActiveLogoLayer("back")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${imageControlDisabled
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-zinc-700 hover:bg-zinc-600"
                        }`}
                    >
                      Arkaya Al
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={imageControlDisabled}
                      onClick={() => updateActiveLogoBox({ ...activeLogoBox, x: 0.5, y: 0.5 })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${imageControlDisabled
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-zinc-700 hover:bg-zinc-600"
                        }`}
                    >
                      Ortala
                    </button>
                    <button
                      disabled={imageControlDisabled}
                      onClick={() =>
                        updateActiveLogoBox(
                          activeLogoIsEmboss
                            ? { ...activeLogoBox, x: 0.5, y: 0.6 }
                            : { x: 0.5, y: 0.6, w: 0.7, h: 0.45 }
                        )
                      }
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${imageControlDisabled
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-zinc-700 hover:bg-zinc-600"
                        }`}
                    >
                      Sıfırla
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteActiveImage}
                    disabled={!activeLogo}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase border ${activeLogo
                      ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                  >
                    Görseli Sil
                  </button>
                </div>
              )}

              {editorControlTab === "text" && (
                <div className={`mt-3 rounded-xl border border-zinc-700 bg-zinc-800/60 space-y-3 ${isMobile ? "p-2.5" : "p-3"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Yazi Ayari</p>
                    {!(customText?.text || "").trim() && (
                      <button
                        type="button"
                        onClick={() => bumpCustomText({ text: "YAZI" })}
                        className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase"
                      >
                        Yazi Ekle
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">Metin</label>
                    <input
                      type="text"
                      value={customText?.text || ""}
                      onChange={(e) => bumpCustomText({ text: e.target.value })}
                      className="w-full rounded-md border border-zinc-600 bg-zinc-900/60 text-white px-2 py-1 text-[16px] md:text-[11px]"
                      placeholder=""
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400">Font</label>
                      <select
                        value={customText?.font || FONT_OPTIONS[0].value}
                        onChange={(e) => bumpCustomText({ font: e.target.value })}
                        className="w-full rounded-md border border-zinc-600 bg-zinc-900/60 text-white px-2 py-1 text-[16px] md:text-[11px]"
                      >
                        {FONT_OPTIONS.map((opt) => (
                          <option key={`editor-text-font-${opt.value}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400">Renk</label>
                      <input
                        type="color"
                        value={customText?.color || "#ffffff"}
                        onChange={(e) => bumpCustomText({ color: e.target.value })}
                        className="w-full h-[30px] rounded-md border border-zinc-600 bg-zinc-900/60 p-1"
                      />
                    </div>
                  </div>
                  {!rubberActiveForSide && (
                    <>
                      <button
                        type="button"
                        onClick={() => bumpCustomText({ emboss: !Boolean(customText?.emboss) })}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase border transition ${
                          Boolean(customText?.emboss)
                            ? "bg-cyan-200 text-cyan-950 border-cyan-300"
                            : "bg-zinc-900/60 text-zinc-200 border-zinc-600 hover:bg-zinc-800"
                        }`}
                      >
                        Kabartı: {Boolean(customText?.emboss) ? "Açık" : "Kapalı"}
                      </button>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Kabartı Kalınlığı</span>
                          <span>{clamp(Number(customText?.embossDepth ?? 1.4), 0.6, 2.8).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="2.8"
                          step="0.05"
                          value={clamp(Number(customText?.embossDepth ?? 1.4), 0.6, 2.8)}
                          disabled={customText?.emboss === false}
                          onChange={(e) => bumpCustomText({ embossDepth: Number(e.target.value) })}
                          className={`w-full accent-cyan-300 ${customText?.emboss === false ? "opacity-45 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Kabartı Gücü</span>
                          <span>{clamp(Number(customText?.embossStrength ?? 1.4), 0.6, 2.4).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="2.4"
                          step="0.05"
                          value={clamp(Number(customText?.embossStrength ?? 1.4), 0.6, 2.4)}
                          disabled={customText?.emboss === false}
                          onChange={(e) => bumpCustomText({ embossStrength: Number(e.target.value) })}
                          className={`w-full accent-cyan-300 ${customText?.emboss === false ? "opacity-45 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </>
                  )}

                  {rubberActiveForSide && (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Rubber Kalınlık</span>
                          <span>2.00 mm (Sabit)</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Boyut</span>
                          <span>{Math.round(Number(customText?.size) || 150)}px</span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="280"
                          step="1"
                          value={Number(customText?.size) || 150}
                          onChange={(e) => bumpCustomText({ size: Number(e.target.value) })}
                          className="w-full accent-cyan-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Harf Aralığı</span>
                          <span>{clamp(Number(customText?.rubberLetterSpacing ?? 1), 0.2, 3).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.05"
                          value={clamp(Number(customText?.rubberLetterSpacing ?? 1), 0.2, 3)}
                          onChange={(e) => bumpCustomText({ rubberLetterSpacing: Number(e.target.value) })}
                          className="w-full accent-cyan-300"
                        />
                      </div>
                    </>
                  )}

                  {!rubberActiveForSide && (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Boyut</span>
                          <span>{Math.round(Number(customText?.size) || 150)}px</span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="280"
                          step="1"
                          value={Number(customText?.size) || 150}
                          onChange={(e) => bumpCustomText({ size: Number(e.target.value) })}
                          className="w-full accent-cyan-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Döndürme</span>
                          <span>{Math.round(Number(customText?.rotation) || 0)}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="1"
                          value={Number(customText?.rotation) || 0}
                          onChange={(e) => bumpCustomText({ rotation: Number(e.target.value) })}
                          className="w-full accent-cyan-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>X Konum</span>
                          <span>{Math.round(safeTextPos.x * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.005"
                          value={safeTextPos.x}
                          onChange={(e) => updateTextPos({ x: Number(e.target.value) })}
                          className="w-full accent-cyan-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Y Konum</span>
                          <span>{Math.round(safeTextPos.y * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.005"
                          value={safeTextPos.y}
                          onChange={(e) => updateTextPos({ y: Number(e.target.value) })}
                          className="w-full accent-cyan-300"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTextLayer("front")}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-zinc-700 hover:bg-zinc-600"
                        >
                          Öne Al
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextLayer("back")}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-zinc-700 hover:bg-zinc-600"
                        >
                          Arkaya Al
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeLogo && editorControlTab === "effects" && (
                <div className={`mt-3 rounded-xl border border-zinc-700 bg-zinc-800/60 space-y-2 ${isMobile ? "p-2.5" : "p-3"}`}>
                  <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Efektler</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-300">
                      <span>Opaklik</span>
                      <span>{Math.round(activeLogoFx.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(activeLogoFx.opacity * 100)}
                      onChange={(e) => updateActiveLogo({ opacity: Number(e.target.value) / 100 })}
                      className="w-full accent-cyan-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-300">
                        <span>Parlaklik</span>
                        <span>{Math.round(activeLogoFx.brightness)}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="1"
                        value={Math.round(activeLogoFx.brightness)}
                        onChange={(e) => updateActiveLogo({ brightness: Number(e.target.value) })}
                        className="w-full accent-cyan-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-300">
                        <span>Kontrast</span>
                        <span>{Math.round(activeLogoFx.contrast)}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="1"
                        value={Math.round(activeLogoFx.contrast)}
                        onChange={(e) => updateActiveLogo({ contrast: Number(e.target.value) })}
                        className="w-full accent-cyan-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-300">
                        <span>Doygunluk</span>
                        <span>{Math.round(activeLogoFx.saturation)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="250"
                        step="1"
                        value={Math.round(activeLogoFx.saturation)}
                        onChange={(e) => updateActiveLogo({ saturation: Number(e.target.value) })}
                        className="w-full accent-cyan-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-300">
                        <span>Gri Ton</span>
                        <span>{Math.round(activeLogoFx.grayscale)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(activeLogoFx.grayscale)}
                        onChange={(e) => updateActiveLogo({ grayscale: Number(e.target.value) })}
                        className="w-full accent-cyan-300"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateActiveLogo({ flipX: !activeLogoFx.flipX })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${activeLogoFx.flipX
                        ? "bg-cyan-100 text-cyan-900 border-cyan-300"
                        : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                        }`}
                    >
                      Yatay
                    </button>
                    <button
                      onClick={() => updateActiveLogo({ flipY: !activeLogoFx.flipY })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${activeLogoFx.flipY
                        ? "bg-cyan-100 text-cyan-900 border-cyan-300"
                        : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                        }`}
                    >
                      Dikey
                    </button>
                  </div>

                  <button
                    onClick={() => updateActiveLogo({ ...LOGO_STYLE_DEFAULTS })}
                    className="w-full py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-[10px] font-bold uppercase"
                  >
                    Efekti Sifirla
                  </button>
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
          const desktopClosedScale = isPlacementPanelVisible ? 0.96 : isPrintAreaOpen ? 1.1 : 1.06;
          const desktopOpenScale = isPlacementPanelVisible ? 0.86 : isPrintAreaOpen ? 1.02 : 0.95;
          const desktopScale = drawerOpen ? desktopOpenScale : desktopClosedScale;
          const desktopWidth = isPlacementPanelVisible ? "62vw" : isPrintAreaOpen ? "74vw" : "70vw";
          const desktopHeight = isPlacementPanelVisible ? "82vh" : isPrintAreaOpen ? "90vh" : "86vh";
          const desktopTop = "50%";
          const desktopShiftY = drawerOpen
            ? isPlacementPanelVisible
              ? "-18%"
              : isPrintAreaOpen
                ? "-6%"
                : "-12%"
            : "0%";
          const mobileScale = isPrintAreaOpen ? (drawerOpen ? 0.78 : 0.92) : drawerOpen ? 0.8 : 0.96;
          const mobileLeft = isPlacementPanelVisible ? "60%" : drawerOpen ? "55%" : "57%";
          const mobileShiftY = isPlacementPanelVisible ? (drawerOpen ? "-22%" : "-18%") : drawerOpen ? "-9%" : "-4%";
          const minZoomDistance = !isMobile
            ? isPlacementPanelVisible
              ? 1.86
              : drawerOpen
                ? 1.72
                : 1.56
            : isPlacementPanelVisible
              ? 1.9
              : 1.72;
          const controlsTargetY = !isMobile
            ? isPlacementPanelVisible
              ? -0.12
              : drawerOpen
                ? -0.2
                : -0.1
            : isPlacementPanelVisible
              ? -0.05
              : -0.1;
          return (
            <Canvas
              style={{
                position: "absolute",
                left: isMobile ? mobileLeft : isPlacementPanelVisible ? "63%" : "50%",
                top: isMobile ? "50%" : desktopTop,
                transform: `translate(-50%, -50%) translateY(${isMobile ? mobileShiftY : desktopShiftY}) scale(${isMobile ? mobileScale : desktopScale})`,
                width: isMobile ? "100vw" : desktopWidth,
                height: isMobile ? "100vh" : desktopHeight,
                display: "block",
                backgroundColor: SCENE_BG_COLOR,
                willChange: "transform",
                transformOrigin: "center center",
                transition: isMobile ? "transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1)" : "transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                zIndex: 10,
                touchAction: "none",
              }}
              gl={{
                preserveDrawingBuffer: true,
                antialias: perf.antialias,
                alpha: false,
                powerPreference: perf.powerPreference,
              }}
              dpr={perf.dpr}
              onPointerMissed={() => {
                clearSceneSelection();
              }}
              onCreated={({ gl, scene, camera }) => {
                glRef.current = gl;
                sceneRef.current = scene;
                cameraRef.current = camera;
                const bgColor = new THREE.Color(SCENE_BG_COLOR);
                scene.background = bgColor;
                gl.setClearColor(bgColor, 1);
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 0.60;
                if (gl?.domElement) {
                  gl.domElement.style.touchAction = "none";
                  gl.domElement.style.overscrollBehavior = "contain";
                  gl.domElement.style.webkitUserSelect = "none";
                  gl.domElement.style.webkitTouchCallout = "none";
                }
              }}
              camera={{ position: [0, 0.36, 2.34], fov: isMobile ? (isPlacementPanelVisible ? 38 : 34) : 30 }}
              shadows={!isMobile}
            >
              <SceneBackgroundLock />

              <HdriEnvironment urls={hdrEnvUrls} enabled />

              <ambientLight intensity={0.35} />
              <hemisphereLight intensity={0.12} groundColor={"#1f1f1f"} />
              <directionalLight
                position={[6, 10, 8]}
                intensity={0.45}
                castShadow={!isMobile}
                shadow-mapSize-width={perf.shadowMap}
                shadow-mapSize-height={perf.shadowMap}
              />
              <directionalLight position={[-6, 6, -6]} intensity={0.16} />
              <pointLight position={[0, 2.6, 2.2]} intensity={0.05} />
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
                      isSceneFocused={sceneModelSelectionId === design.id}
                      showModelDeleteButton={activeTab !== "editor" && sceneModelSelectionId === design.id}
                      canDeleteModel={designs.length > 1}
                      enableLongPressDelete={activeTab !== "editor"}
                      onSelect={setActiveId}
                      onHover={setHoveredId}
                      onUnhover={() => setHoveredId(null)}
                      view={effectiveView}
                      targetX={layout.x}
                      targetZ={layout.z}
                      targetRotY={layout.rotY}
                      targetScale={layout.scale}
                      hidden={layout.hidden}
                      disableDrag={isLogoDragging}
                      isMobile={isMobile}
                      onUserRotate={handleModelUserRotate}
                      onModelTap={handleSceneModelTap}
                      onModelLongPress={handleSceneModelLongPress}
                      onDeleteModel={handleDeleteSceneModel}
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
                dampingFactor={isMobile ? 0.12 : 0.08}
                zoomSpeed={isMobile ? 0.95 : 0.7}
                minDistance={minZoomDistance}
                maxDistance={isMobile ? 4.8 : 4.2}
                zoomToCursor={false}
                enabled={!camAnimating}
                target={[0, controlsTargetY, 0]}
                mouseButtons={{ LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null }}
                touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY }}
              />
            </Canvas>
          );
        })()}

        {/* MODEL ÜZERİ DİREKT YERLEŞİM (Panel değişmeden) */}
        {isPrintAreaOpen && (
          <div
            className="absolute z-[72] pointer-events-none"
            style={{
              left: scenePlaneRect ? `${scenePlaneRect.left}px` : sceneEditCenterLeft,
              top: scenePlaneRect ? `${scenePlaneRect.top}px` : sceneEditCenterTop,
              width: scenePlaneRect ? `${scenePlaneRect.width}px` : isMobile ? "min(74vw, 350px)" : "min(34vw, 470px)",
              height: scenePlaneRect ? `${scenePlaneRect.height}px` : undefined,
              aspectRatio: scenePlaneRect ? undefined : previewAspect,
              transform: scenePlaneRect ? "none" : "translate(-50%, -50%)",
            }}
          >
            <div
              ref={sceneEditRef}
              className="relative w-full h-full touch-none pointer-events-none"
              style={{ touchAction: "none" }}
            >
              {(logos || []).map((l) => {
                const isSelected = l.id === (sideData?.activeLogoId || sideData?.logos?.[0]?.id);
                const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
                return (
                  <div
                    key={`scene-logo-${l.id}`}
                    className={`absolute border-2 rounded-sm transition-all ${
                      isSelected && showSceneFrame
                        ? "border-cyan-300/90 bg-transparent shadow-none"
                        : "border-transparent bg-transparent"
                    }`}
                    style={{
                      left: `${(box.x - box.w / 2) * 100}%`,
                      top: `${(box.y - box.h / 2) * 100}%`,
                      width: `${box.w * 100}%`,
                      height: `${box.h * 100}%`,
                      pointerEvents: textEditingMode ? "none" : "auto",
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isSelected || !sceneSelectionVisible) {
                        updateSide({ activeLogoId: l.id });
                        setSceneSelectionVisible(true);
                        setSceneTextSelectionVisible(false);
                        setSceneFrameMode("resize");
                        return;
                      }
                      setSceneFrameMode((prev) => (prev === "resize" ? "rotate" : "resize"));
                    }}
                  />
                );
              })}

              {showSceneFrame && (
                <ResizeFrame
                  box={activeLogo.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 }}
                  containerRef={sceneEditRef}
                  onChange={updateActiveLogoBox}
                  rotation={Number(activeLogo?.rotation) || 0}
                  onRotateChange={(nextRot) => updateActiveLogo({ rotation: nextRot })}
                  onFrameTap={() => setSceneFrameMode((prev) => (prev === "resize" ? "rotate" : "resize"))}
                  transformMode={sceneFrameMode}
                  onDragStateChange={setIsLogoDragging}
                  diagonalOnly={lockAspect}
                  disableResize={activeLogoIsEmboss}
                  largeHandles={isMobile}
                />
              )}

              {showSceneFrame && (
                <div
                  className="absolute flex items-center gap-1.5 z-[85] pointer-events-auto"
                  style={{
                    left: `${(activeLogoBox.x - activeLogoBox.w / 2) * 100}%`,
                    top: `${(activeLogoBox.y - activeLogoBox.h / 2) * 100}%`,
                    transform: isSceneFrameCompact ? "translate(-112%, -112%)" : "translate(0%, -120%)",
                  }}
                >
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLockAspect();
                    }}
                    className={`rounded-full border border-white/60 bg-black/70 text-white hover:bg-black/85 flex items-center justify-center shadow-md ${
                      isMobile ? "w-9 h-9" : "w-8 h-8"
                    }`}
                    aria-label="Oran kilidi"
                    title={lockAspect ? "Kilitli" : "Kilit Açık"}
                  >
                    {lockAspect ? <Lock size={14} /> : <LockOpen size={14} />}
                  </button>
                </div>
              )}

              {showSceneFrame && (
                <div
                  className={`absolute flex z-[85] pointer-events-auto ${isSceneFrameCompact ? "items-center flex-col gap-1" : "items-center gap-1.5"}`}
                  style={{
                    left: `${(activeLogoBox.x + activeLogoBox.w / 2) * 100}%`,
                    top: `${(activeLogoBox.y - activeLogoBox.h / 2) * 100}%`,
                    transform: isSceneFrameCompact ? "translate(12%, -112%)" : "translate(-100%, -120%)",
                  }}
                >
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteActiveImage();
                      setSceneSelectionVisible(false);
                      setSceneFrameMode("resize");
                    }}
                    className={`rounded-full border border-white/60 bg-black/70 text-white hover:bg-black/85 flex items-center justify-center shadow-md ${
                      isMobile ? "w-9 h-9" : "w-8 h-8"
                    }`}
                    aria-label="Seçili görseli sil"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditorControlTab("logo");
                      setShowPlacementPanel(true);
                    }}
                    className={`rounded-full border border-white/60 bg-black/70 text-white hover:bg-black/85 flex items-center justify-center shadow-md ${
                      isMobile ? "w-9 h-9" : "w-8 h-8"
                    }`}
                    aria-label="Görsel düzenleme paneline geç"
                    title="Düzenle"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}

              {hasSceneText && (
                <>
                  <div
                    className={`absolute border-2 rounded-sm transition-all ${
                      showSceneTextFrame
                        ? "border-cyan-300/90 bg-transparent shadow-none"
                        : "border-transparent bg-transparent"
                    }`}
                    style={{
                      left: `${(sceneTextBox.x - sceneTextBox.w / 2) * 100}%`,
                      top: `${(sceneTextBox.y - sceneTextBox.h / 2) * 100}%`,
                      width: `${sceneTextBox.w * 100}%`,
                      height: `${sceneTextBox.h * 100}%`,
                      pointerEvents: showSceneTextFrame ? "none" : "auto",
                      touchAction: "none",
                      zIndex: showSceneTextFrame ? 62 : 61,
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!sceneTextSelectionVisible) {
                        setSceneTextSelectionVisible(true);
                        setSceneTextFrameMode("resize");
                        setSceneSelectionVisible(false);
                        return;
                      }
                      setSceneTextFrameMode((prev) => (prev === "resize" ? "rotate" : "resize"));
                    }}
                  />

                  {showSceneTextFrame && (
                    <ResizeFrame
                      box={sceneTextBox}
                      containerRef={sceneEditRef}
                      onChange={(nextBox) => updateTextPos({ x: nextBox.x, y: nextBox.y })}
                      rotation={Number(customText?.rotation) || 0}
                      onRotateChange={(nextRot) => bumpCustomText({ rotation: nextRot })}
                      onFrameTap={() => setSceneTextFrameMode((prev) => (prev === "resize" ? "rotate" : "resize"))}
                      transformMode={sceneTextFrameMode}
                      onDragStateChange={setIsLogoDragging}
                      disableResize
                      largeHandles={isMobile}
                    />
                  )}

                  {showSceneTextFrame && (
                    <div
                      className="absolute flex items-center gap-1.5 z-[85] pointer-events-auto"
                      style={{
                        left: `${(sceneTextBox.x + sceneTextBox.w / 2) * 100}%`,
                        top: `${(sceneTextBox.y - sceneTextBox.h / 2) * 100}%`,
                        transform: "translate(-100%, -120%)",
                      }}
                    >
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditorControlTab("text");
                          setShowPlacementPanel(true);
                        }}
                        className={`rounded-full border border-white/60 bg-black/70 text-white hover:bg-black/85 flex items-center justify-center shadow-md ${
                          isMobile ? "w-9 h-9" : "w-8 h-8"
                        }`}
                        aria-label="Yazi düzenleme paneline geç"
                        title="Yazı Düzenle"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

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
                view={view}
                isMobile={isMobile}
                activeTab="editor"
                setActiveTab={setActiveTab}
                layout="standard"
                onRequestDrawerCollapse={() => setDrawerOpen(false)}
                printTypePickerSignal={printTypePickerSignal}
              />
            </div>
          </div>
        )}

        {/* DRAWER (MOBILE + DESKTOP) - Nike Style */}
        {activeDesign && !hideMobileDrawerInEditor && (
          <div
            className={`fixed left-0 right-0 z-[92] pointer-events-auto transition-all duration-300 ${isMobile ? "bottom-0" : "bottom-0"
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
              backgroundColor: "#ebedf0",
              borderTopLeftRadius: isMobile ? "24px" : "0",
              borderTopRightRadius: isMobile ? "24px" : "0",
              boxShadow: isMobile ? "0 -4px 20px rgba(0,0,0,0.15)" : drawerOpen ? "0 -2px 10px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <div
              className="w-full h-full overflow-x-hidden overflow-y-visible flex flex-col pointer-events-auto"
              style={{ backgroundColor: "#eef1f4" }}
            >
              {/* Drawer Tab Navigation */}
              <div
                className={`relative px-3 border-b border-gray-300/80 bg-[#eceff3] ${drawerOpen ? "pt-9 pb-2" : "pt-7 pb-3"
                  }`}
                onPointerDown={(e) => {
                  if (!isMobile || drawerOpen) return;
                  onDrawerPointerDown(e);
                }}
                onClick={(e) => {
                  if (!isMobile || drawerOpen) return;
                  if (e.target?.closest?.("button")) return;
                  openDrawer();
                }}
              >
                <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gray-400/80" />

                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDrawer();
                  }}
                  className="absolute left-1/2 top-0 -translate-x-1/2 w-10 h-5 rounded-b-full border-2 border-zinc-700 border-t-0 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center z-40 shadow-[0_6px_14px_rgba(0,0,0,0.18)]"
                  aria-label="Paneli aç/kapa"
                >
                  <span className="translate-y-[3px]">
                    {drawerOpen ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronUp size={14} strokeWidth={2.5} />}
                  </span>
                </button>

                {drawerOpen && (
                  <div className="relative flex items-center justify-center min-h-[46px] w-full">
                    {!isMobile ? (
                      <>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <div
                            className="h-9 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 flex items-center justify-center text-[10px] font-black uppercase tracking-wide shadow-sm max-w-[250px] truncate"
                            title={selectedPrintTypeNames || "Baski secilmedi"}
                          >
                            {selectedPrintTypeNames || "Baski secilmedi"}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setPickerOpen(true);
                            }}
                            className="h-9 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center text-[11px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Model ekle"
                          >
                            + Model
                          </button>
                          <div className="flex items-center gap-2 min-w-0 max-w-[430px] px-1">
                            <button
                              onClick={goPrevTab}
                              className="w-10 h-10 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shadow-sm"
                              aria-label="Önceki adım"
                            >
                              <ChevronLeft size={18} strokeWidth={2.6} />
                            </button>
                            <div className="text-center min-w-0 px-1">
                              <p className="text-[18px] leading-none font-black uppercase tracking-wide text-gray-900">
                                {tabLabelMap[activeTab] || "Görsel"}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                {MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}
                              </p>
                            </div>
                            <button
                              onClick={goNextTab}
                              className="w-10 h-10 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shadow-sm"
                              aria-label="Sonraki adım"
                            >
                              <ChevronRight size={18} strokeWidth={2.6} />
                            </button>
                          </div>
                          <button
                            onClick={openDrawerMenu}
                            className="h-9 px-4 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Kategori menüsünü aç"
                          >
                            <Menu size={14} />
                            Menü
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-full flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setPickerOpen(true);
                            }}
                            className="h-8 px-2.5 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center text-[10px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Model ekle"
                          >
                            + Model
                          </button>
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center">
                            <button
                              onClick={goPrevTab}
                              className="w-10 h-10 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shadow-sm"
                              aria-label="Önceki adım"
                            >
                              <ChevronLeft size={18} strokeWidth={2.6} />
                            </button>
                            <div className="text-center min-w-0 max-w-[140px] px-0.5">
                              <p className="text-[15px] leading-none font-black uppercase tracking-wide text-gray-900 truncate">
                                {tabLabelMap[activeTab] || "Görsel"}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                {MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}
                              </p>
                            </div>
                            <button
                              onClick={goNextTab}
                              className="w-10 h-10 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shadow-sm"
                              aria-label="Sonraki adım"
                            >
                              <ChevronRight size={18} strokeWidth={2.6} />
                            </button>
                          </div>
                          <button
                            onClick={openDrawerMenu}
                            className="h-8 px-2.5 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Kategori menüsünü aç"
                          >
                            <Menu size={12} />
                            Menü
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {drawerOpen && renderPanel}
            </div>
          </div>
        )}

        {drawerMenuMounted && (
          <div
            className={`fixed inset-0 z-[96] transition-opacity duration-200 ${drawerMenuOpen
              ? "opacity-100 pointer-events-auto bg-black/16 backdrop-blur-[2px]"
              : "opacity-0 pointer-events-none bg-black/0 backdrop-blur-0"
              }`}
            onClick={closeDrawerMenu}
          >
            <div
              className={`absolute left-1/2 w-[min(97vw,980px)] rounded-2xl border border-gray-200 bg-white/95 shadow-2xl p-4 md:p-5 transform-gpu will-change-transform transition-all duration-200 ease-out ${drawerMenuOpen ? "opacity-100" : "opacity-0"
                }`}
              style={{
                top: "50%",
                transform: `translate(-50%, calc(-50% + ${drawerMenuOpen ? 0 : 12}px)) scale(${drawerMenuOpen ? 1 : 0.985})`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black tracking-[0.16em] uppercase text-gray-500">Menü</p>
                <button
                  onClick={closeDrawerMenu}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  aria-label="Menüyü kapat"
                >
                  <X size={14} />
                </button>
              </div>

              <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
                {menuTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => selectMenuTab(tab.id)}
                    className={`px-3 py-3 rounded-xl border text-[11px] font-black uppercase tracking-wide transition flex items-center justify-center gap-2 ${activeTab === tab.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <PrintTypePickerCards
                selectedIds={activePrintTypes}
                onSelect={togglePrintTypeFromMenu}
                sourceLabel="Menuden sec"
                isMobile={isMobile}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* preload (first paint priority) */
const PRIORITY_PRELOAD_MODELS = Array.from(new Set([DEFAULT_MODEL_TYPE, "hoodie-v12-canavari"]));
PRIORITY_PRELOAD_MODELS.forEach((modelType) => {
  const modelPath = MODEL_PATHS[modelType];
  if (modelPath) useGLTF.preload(toSafeUrl(modelPath));
});
useGLTF.preload(toSafeUrl(RUBBER_GLYPH_MODEL_PATH));

if (typeof window !== "undefined") {
  // Ortam ışığını cihaz tipine göre tek dosya preload et (ilk açılış ve bellek daha stabil).
  const prefersMobileEnv = window.matchMedia("(max-width: 1023px)").matches;
  const preferredEnv = prefersMobileEnv ? HDR_ENV_MOBILE_PATH : HDR_ENV_DESKTOP_PATH;
  getHdriSourceTexture(preferredEnv).catch(() => {});

  // Diğer modelleri idle zamanda sırayla preload et; ilk modeli bloke etmesin.
  const preloadRest = () => {
    const rest = AVAILABLE_MODELS.filter((m) => !PRIORITY_PRELOAD_MODELS.includes(m));
    rest.forEach((modelType, idx) => {
      const modelPath = MODEL_PATHS[modelType];
      if (!modelPath) return;
      window.setTimeout(() => {
        useGLTF.preload(toSafeUrl(modelPath));
      }, idx * 120);
    });
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(preloadRest, { timeout: 1600 });
  } else {
    window.setTimeout(preloadRest, 900);
  }
}
