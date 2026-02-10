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
  Check,
  Lock,
  LockOpen,
} from "lucide-react";

import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { setCheckoutData } from "@/lib/checkoutStore";

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
  tshirt: "Normal Tişört",
  sweatshirt: "Normal Sweat",
  "sweat-yeni": "Yeni Sweat",
  "sweat-deneme": "Deneme Sweat",
  "oversize-tshirt": "Oversize Tişört",
  "oversize-tshirt-efektli": "Oversize Tişört Efektli",
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
  "yeni-duz-tshirt": "Yeni Düz Tişört",
  "yeni-oversize-tshirt": "Yeni Oversize Tişört",
  "yeni-duz-sweat": "Yeni Düz Sweat",
  "yeni-oversize-sweat": "Yeni Oversize Sweat",
  "yeni-fermuarli": "Yeni Fermuarlı",
};

const MODEL_SELECTION_GROUPS = [
  {
    id: "tisort",
    title: "Tişört",
    models: ["yeni-duz-tshirt", "yeni-oversize-tshirt"],
  },
  {
    id: "sweat",
    title: "Sweat",
    models: ["yeni-duz-sweat", "yeni-oversize-sweat"],
  },
  {
    id: "hoodie",
    title: "Hoodie",
    models: ["hoodie-v12-canavari", "oversize-hoodie-parcali"],
  },
  {
    id: "outer",
    title: "Dış Giyim",
    models: ["yeni-fermuarli", "polar-son"],
  },
];

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
    front: { xMin: -0.145, xMax: 0.145, yTop: 0.245, yBot: -0.205, z: 0.139, rotY: 0, zipGap01: 0.03 },
    back: { xMin: -0.145, xMax: 0.145, yTop: 0.29, yBot: -0.225, z: -0.14, rotY: Math.PI },
  },
  "polar-son": {
    front: { xMin: -0.145, xMax: 0.145, yTop: 0.245, yBot: -0.205, z: 0.139, rotY: 0, zipGap01: 0.03 },
    back: { xMin: -0.145, xMax: 0.145, yTop: 0.29, yBot: -0.225, z: -0.14, rotY: Math.PI },
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
      zipGap01: 0.035,
    },
    back: { xMin: -0.153, xMax: 0.153, yTop: 0.27, yBot: -0.238, z: -0.132, rotY: Math.PI },
  },
};

const HOODIE_POCKET_FRONT_YBOT = Object.freeze({
  "hoodie-v12-canavari": -0.145,
  "oversize-hoodie-parcali": -0.15,
});

const CENTER_ZIP_MODEL_TYPES = new Set(["fermuarli", "yeni-fermuarli", "polar", "polar-son"]);
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

const clampTextPos = (textPos, textState = {}) => {
  const size = clamp(Number(textState?.size) || 150, 30, 420);
  const scaleX = clamp(Number(textState?.scaleX) || 1, 0.3, 3);
  const scaleY = clamp(Number(textState?.scaleY) || 1, 0.3, 3);

  // Text kutusunu baskı alanında tutacak güvenli kenar payı.
  const baseMargin = clamp((size / 1024) * 0.62, 0.035, 0.22);
  const marginX = clamp(baseMargin * Math.sqrt(scaleX), 0.035, 0.25);
  const marginY = clamp(baseMargin * Math.sqrt(scaleY), 0.035, 0.25);

  const x = clamp(Number.isFinite(Number(textPos?.x)) ? Number(textPos.x) : 0.5, marginX, 1 - marginX);
  const y = clamp(Number.isFinite(Number(textPos?.y)) ? Number(textPos.y) : 0.85, marginY, 1 - marginY);
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
const BASE_PRICE = 750;
const EXTRA_SIDE_PRICE = 150;

/* ================= BRAND / UI ================= */
const SCENE_BG_COLOR = "#f3f3f3";
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

// Environment map path (put file under /public/hdr)
const HDR_ENV_PATH = "/hdr/studio_small_03_2k.exr";
const SCIENTIFIC_ROUTE = "/bilimsel";

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
              className={`rounded-xl border px-2 py-2 text-left transition ${
                disabled
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                  : selected
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <p className="text-[11px] font-black uppercase tracking-wide">{opt.label}</p>
              <p
                className={`mt-1 text-[12px] font-bold leading-snug ${
                  disabled ? "text-zinc-400" : selected ? "text-zinc-200" : "text-gray-700"
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

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scaleX, scaleY);
  ctx.font = `900 ${fontSize}px ${t?.font || FONT_OPTIONS[0].value}`;
  ctx.fillStyle = t?.color || "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (layout === "straight") {
    ctx.fillText(text, 0, 0);
    ctx.restore();
    return;
  }

  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const spacing = fontSize * 0.06;
  const totalAdvance = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  if (totalAdvance <= 0) {
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
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    cursor += w + spacing;
  });

  ctx.restore();
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

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Dosya okunamadi."));
    reader.readAsDataURL(file);
  });

const loadImg = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel çözümlenemedi."));
    img.src = src;
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
    font: FONT_OPTIONS[0].value,
    layout: "straight",
    curve: 30,
    z: 0,
  },
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

const createDesign = (type = DEFAULT_MODEL_TYPE) => ({
  id: makeId(),
  modelType: normalizeModelType(type),
  color: BRAND_DEFAULT_COLOR,
  fabricType: "standart",
  stringColor: "#e6e6e6",
  hoodieV12Parts: { ...DEFAULT_HOODIE_PARTS },
  hasPdf: false,
  pdfFileUrl: "",
  pdfOriginalName: "",
  pdfPlacement: { ...DEFAULT_PDF_PLACEMENT },
  printTypes: [],
  size: "M",
  sides: {
    front: createSideData(),
    back: createSideData(),
    left: createSideData(),
    right: createSideData(),
  },
});

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

const getPrice = (design) => {
  const activeSides = getActiveSides(design);
  if (activeSides.length === 0) return BASE_PRICE;
  return BASE_PRICE + (activeSides.length - 1) * EXTRA_SIDE_PRICE;
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
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(x0, 0, stripeW, SIZE);
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
    const fx = getLogoStyle(l);

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

function HdriEnvironment({ url }) {
  const { scene } = useThree();

  useEffect(() => {
    if (!url) return undefined;

    const lowerUrl = String(url).toLowerCase();
    const loader = lowerUrl.endsWith(".exr") ? new EXRLoader() : new RGBELoader();
    let disposed = false;
    let envTexture = null;

    loader.load(
      url,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        envTexture = texture;
      },
      undefined,
      (err) => {
        console.error("HDR environment yuklenemedi:", err);
      }
    );

    return () => {
      disposed = true;
      if (scene.environment === envTexture) scene.environment = null;
      if (envTexture) envTexture.dispose();
    };
  }, [scene, url]);

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
  const logoSignature = logos
    .map(
      (l) =>
        `${l.id}_${l.box.x.toFixed(3)}_${l.box.y.toFixed(3)}_${l.box.w.toFixed(3)}_${l.box.h.toFixed(3)}_${l.rotation || 0}_${l.z || 0}_${l.opacity ?? 1}_${l.brightness ?? 100}_${l.contrast ?? 100}_${l.saturation ?? 100}_${l.grayscale ?? 0}_${Number(Boolean(l.flipX))}_${Number(Boolean(l.flipY))}`
    )
    .join("|");
  const customText = sideData?.customText;
  const textSignature = `${customText?.text}_${customText?.color}_${customText?.size}_${customText?.scaleX}_${customText?.scaleY}_${customText?.font}_${customText?.layout || "straight"}_${customText?.curve ?? 30}_${customText?.z ?? 0}`;
  const posSignature = `${sideData?.textPos?.x}_${sideData?.textPos?.y}`;

  const CANVAS_SIZE = 2048;
  const CANVAS_UPDATE_DEBOUNCE_MS = 16;

  useEffect(() => {
    const hasContent = logos.length > 0 || (customText?.text || "").trim();
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
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(x0, 0, stripeW, CANVAS_SIZE);
        ctx.restore();
      };

      const drawLogo = async (l) => {
        const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
        const rotation = (l.rotation || 0) * (Math.PI / 180);
        const fx = getLogoStyle(l);
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
          ...logos.map((l, idx) => ({ kind: "logo", z: l?.z ?? 0, idx, payload: l })),
          ...(customText?.text || "").trim()
            ? [{ kind: "text", z: customText?.z ?? 0, idx: 9999, payload: customText }]
            : [],
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
  }, [logoSignature, textSignature, posSignature, opts?.clearCenterStripe01, CANVAS_SIZE]);

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

function Real3DModel({ color, stringColor, frontCanvas, backCanvas, modelType, hoodieV12Parts, fabricType, view, isMobile }) {
  const modelPathRaw = MODEL_PATHS[normalizeModelType(modelType)] || MODEL_PATHS[DEFAULT_MODEL_TYPE];
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
    const darkBoost = clamp((0.42 - lum) / 0.42, 0, 1);
    const lightBoost = clamp((lum - 0.72) / 0.28, 0, 1);
    const fabric = fabricType || "standart";
    const fabricMap = {
      standart: { rough: 0, metal: 0, env: 0, emit: 0 },
      pamuk: { rough: 0.025, metal: -0.002, env: -0.06, emit: -0.002 },
      soft: { rough: -0.035, metal: 0.004, env: 0.08, emit: 0.003 },
    };
    const fabricFx = fabricMap[fabric] || fabricMap.standart;

    return new THREE.MeshStandardMaterial({
      color: base,
      // Fabric feel: high roughness, very low metalness, controlled reflections.
      roughness: clamp(0.968 - 0.04 * darkBoost + 0.09 * lightBoost + fabricFx.rough, 0.9, 0.995),
      metalness: clamp(0.006 + 0.014 * darkBoost + fabricFx.metal, 0.002, 0.03),
      envMapIntensity: 1.0,
      emissive: base,
      emissiveIntensity: 0,
      side: THREE.FrontSide,
    });
  }, [color, fabricType]);

  const laceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(stringColor || "#e6e6e6"),
        roughness: 0.9,
        metalness: 0.02,
        envMapIntensity: 1.0,
        side: THREE.FrontSide,
      }),
    [stringColor]
  );

  useEffect(() => {
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
          </>
        )}
      </Center>
    </group>
  );
}

/* ================= RESIZE FRAME ================= */
function ResizeFrame({ box, onChange, containerRef, onDragStateChange, diagonalOnly = false }) {
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
    if (diagonalOnly && (mode === "t" || mode === "b" || mode === "l" || mode === "r")) return;
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef?.current) return;
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
      } catch {}
    }
    dragRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    flushPendingChange();
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
      className="absolute border-2 border-white/75 rounded-lg group cursor-grab active:cursor-grabbing"
      style={{
        left: pct(box.x - box.w / 2),
        top: pct(box.y - box.h / 2),
        width: pct(box.w),
        height: pct(box.h),
        touchAction: "none",
        zIndex: 60,
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
      ]
        .filter(([key]) => !diagonalOnly || ["lt", "rt", "rb", "lb"].includes(key))
        .map(([key, lx, ty]) => (
        <div
          key={key}
          className="absolute w-6 h-6 bg-white rounded-full border border-zinc-400 shadow-sm opacity-95 transition-transform group-hover:scale-105"
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

  const ROT_SPEED = isMobile ? 0.014 : 0.01;
  const clampRotX = (v) => Math.max(isMobile ? -0.9 : -0.75, Math.min(isMobile ? 0.9 : 0.75, v));
  const clampRotY = (v) => Math.max(isMobile ? -1.05 : -0.85, Math.min(isMobile ? 1.05 : 0.85, v));

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

  const isZipper = hasCenterZip(design.modelType);
  const gap01 = MODEL_PRINT_BOUNDS?.[design.modelType]?.front?.zipGap01 ?? MODEL_PRINT_BOUNDS?.fermuarli?.front?.zipGap01 ?? 0.08;

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

        const nextY = dragRef.current.startRotY + (e.clientX - dragRef.current.startX) * ROT_SPEED;
        const nextX = dragRef.current.startRotX + (e.clientY - dragRef.current.startY) * ROT_SPEED;
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
        hoodieV12Parts={design.hoodieV12Parts}
        fabricType={design.fabricType}
        view={view}
        isMobile={isMobile}
      />
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

  if (layout === "straight") {
    return (
      <span className={`select-none ${className}`} style={commonStyle}>
        {text}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center select-none ${className}`} style={commonStyle}>
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

let modelSelectionSpinStart = 0;

function ModelSelectionPreview3D({ modelType }) {
  const modelPathRaw = MODEL_PATHS[normalizeModelType(modelType)] || MODEL_PATHS[DEFAULT_MODEL_TYPE];
  const gltf = useGLTF(toSafeUrl(modelPathRaw));
  const groupRef = useRef(null);
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
    if (!modelSelectionSpinStart) modelSelectionSpinStart = performance.now();
    const elapsedSec = (performance.now() - modelSelectionSpinStart) / 1000;
    groupRef.current.rotation.y = elapsedSec * 0.75;
  });

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

  return (
    <div className="h-screen overflow-y-auto bg-[#f3f5f7] text-zinc-900 px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Adım 1</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Model Seçim</h1>
            <p className="text-sm text-zinc-500 mt-1">Model seçmeden tasarım ekranına geçilemez.</p>
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
                  return (
                    <button
                      key={`select-model-${modelType}`}
                      type="button"
                      onClick={() => onSelectModel(modelType)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectModel(modelType);
                        }
                      }}
                      className={`w-full rounded-2xl border bg-white p-2.5 shadow-sm text-left transition ${
                        active
                          ? "border-black ring-2 ring-black/70"
                          : "border-zinc-200 hover:border-zinc-400 hover:shadow-md"
                      }`}
                      aria-pressed={active}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-[#eef1f4]">
                        <Canvas
                          dpr={[1, 1.2]}
                          camera={{ position: [0, 0.28, 2.12], fov: 30 }}
                          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
                        >
                          <color attach="background" args={["#eef1f4"]} />
                          <ambientLight intensity={0.95} />
                          <hemisphereLight intensity={0.35} groundColor="#2a2a2a" />
                          <directionalLight position={[4, 7, 5]} intensity={0.85} />
                          <directionalLight position={[-4, 5, -4]} intensity={0.26} />
                          <Suspense fallback={null}>
                            <ModelSelectionPreview3D modelType={modelType} />
                          </Suspense>
                        </Canvas>
                      </div>
                      <p className="mt-2 text-[12px] font-black uppercase tracking-wide text-zinc-900 leading-tight">
                        {MODEL_LABELS[modelType] || modelType}
                      </p>
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
          </p>
          <button
            type="button"
            disabled={!selectedModel}
            onClick={onContinue}
            className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition ${
              selectedModel
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

function ModelManagementCard({
  designs = [],
  activeId = null,
  onSelectModel,
  onRemoveModel,
  activeModelType,
  hoodieParts,
  onToggleHoodiePart,
  fabricType = "standart",
  onChangeFabric,
  cardClassName = "",
}) {
  const parts = normalizeHoodieParts(hoodieParts);
  const showHoodieOptions = MODELS_WITH_HOODIE_PARTS.has(activeModelType);

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-2 shadow-sm min-h-[206px] ${cardClassName}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-black tracking-[0.14em] text-gray-500 uppercase">Model Yönetimi</p>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{(designs || []).length} model</p>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(designs || []).map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={`model-card-${item.id}`}
              onClick={() => onSelectModel?.(item.id)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border transition ${
                selected
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {MODEL_LABELS[item.modelType] || item.modelType}
            </button>
          );
        })}
      </div>

      {showHoodieOptions && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600">Hoodie Detayları</p>
            <span className="text-[10px] font-bold text-gray-600">{getHoodieVariantLabel(parts)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HOODIE_DETAIL_OPTIONS.map((opt) => {
              const active = Boolean(parts[opt.id]);
              return (
                <button
                  key={`hoodie-detail-toggle-${opt.id}`}
                  type="button"
                  onClick={() => onToggleHoodiePart?.(opt.id, !active)}
                  className={`py-1.5 rounded-lg text-[10px] font-black uppercase border transition flex items-center justify-center gap-1 ${
                    active
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {active && <Check size={12} />}
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-600">Kumaş</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "standart", label: "Standart" },
                { id: "pamuk", label: "Pamuk" },
                { id: "soft", label: "Soft" },
              ].map((opt) => (
                <button
                  key={`fabric-${opt.id}`}
                  type="button"
                  onClick={() => onChangeFabric?.(opt.id)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border transition ${
                    fabricType === opt.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(designs || []).length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(designs || []).map((item) => {
            if (item.id === activeId) return null;
            return (
              <button
                key={`remove-model-${item.id}`}
                onClick={() => onRemoveModel?.(item.id)}
                className="px-2 py-1 rounded-md text-[10px] font-bold uppercase border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              >
                Kaldır: {MODEL_LABELS[item.modelType] || item.modelType}
              </button>
            );
          })}
        </div>
      )}
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
  designs = [],
  activeId = null,
  onSelectModel,
  onRemoveModel,
  onOpenModelPicker,
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
  const [showPrintTypePicker, setShowPrintTypePicker] = useState(false);

  const sizes = ["S", "M", "L", "XL"];
  const colorPresets = BRAND_COLORS;
  const stringPresets = ["#e6e6e6", "#ffffff", "#000000", "#c8b08a", "#a0a0a0"];

  if (!design) return null;

  const sideLabel = currentSide === "front" ? "ÖN" : "ARKA";
  const cm = CM_LABELS[design.modelType]?.[currentSide] || { w: 0, h: 0 };

  const t = sideData?.customText || {};
  const hoodieV12Parts = normalizeHoodieParts(design.hoodieV12Parts);
  const hasPdf = Boolean(design?.hasPdf && design?.pdfFileUrl);
  const pdfPlacement = normalizePdfPlacement(design?.pdfPlacement, currentSide);
  const setHoodiePartEnabled = (partKey, enabled) => {
    if (!["strings", "pocket"].includes(partKey)) return;
    updateDesign({
      hoodieV12Parts: {
        ...hoodieV12Parts,
        [partKey]: Boolean(enabled),
      },
    });
  };
  const updatePdfPlacement = (patch) => {
    updateDesign({
      hasPdf: true,
      pdfPlacement: normalizePdfPlacement({ ...pdfPlacement, ...patch }, patch?.side || pdfPlacement.side || currentSide),
    });
  };
  const fabricType = design.fabricType || "standart";
  const printTypes = Array.isArray(design.printTypes) ? design.printTypes : [];

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

  const isFocusMode = isMobile && activeTab === "editor" && !isDrawerLayout;
  const drawerHeadingClass = "text-[13px] font-black tracking-[0.14em] text-gray-500 uppercase";

  const togglePrintType = (id) => {
    const alreadySelected = printTypes.includes(id);
    const next = alreadySelected ? printTypes.filter((t) => t !== id) : [...printTypes, id];
    updateDesign({ printTypes: next });
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
    updateDesign({ printTypes: next });
  };

  useEffect(() => {
    if (activeTab !== "upload") return;
    if (printTypes.length === 0) setShowPrintTypePicker(true);
  }, [activeTab, printTypes.length, design.id, currentSide]);

  useEffect(() => {
    if (activeTab !== "upload") return;
    setShowPrintTypePicker(true);
  }, [printTypePickerSignal, activeTab]);

  const handleSelectPrintTypeFromPanel = (id) => {
    const opt = PRINT_TYPE_OPTIONS.find((entry) => entry.id === id);
    if (!opt?.available) return;
    togglePrintType(id);
    setShowPrintTypePicker(false);
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
                const fx = getLogoStyle(l);
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
              };
              const textEl = t?.text ? (
                <div
                  className="absolute"
                  style={{
                    left: `${clampTextPos(sideData?.textPos, sideData?.customText).x * 100}%`,
                    top: `${clampTextPos(sideData?.textPos, sideData?.customText).y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = previewRef.current.getBoundingClientRect();
                    const move = (ev) =>
                      updateSide({ textPos: clampTextPos({
                        x: clamp01((ev.clientX - rect.left) / rect.width),
                        y: clamp01((ev.clientY - rect.top) / rect.height),
                      }, sideData?.customText) });
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
              />
            )}

          </div>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-[#111111]">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase mb-2">
            <span>Toplam</span>
            <span className="text-white font-black">{totalPrice} ₺</span>
          </div>
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
              { id: "text", icon: FileText, label: "Yazı" },
              { id: "color", icon: Palette, label: "Renk" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "upload" && !isMobileDrawer) onRequestDrawerCollapse?.();
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
        className={`flex-1 ${
          isDrawerLayout
            ? isMobileDrawer
              ? "h-full p-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] flex flex-col items-stretch gap-2 overflow-y-auto overflow-x-hidden"
              : "h-full py-2.5 px-3 2xl:px-7 flex items-stretch justify-start gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            : "p-4 overflow-y-auto"
        }`}
        style={{ touchAction: "pan-y", minHeight: 0, backgroundColor: contentBackground }}
      >
        {isDrawerLayout && activeTab !== "upload" && (
          <ModelManagementCard
            designs={designs}
            activeId={activeId}
            onSelectModel={onSelectModel}
            onRemoveModel={onRemoveModel}
            activeModelType={design.modelType}
            hoodieParts={hoodieV12Parts}
            onToggleHoodiePart={setHoodiePartEnabled}
            fabricType={fabricType}
            onChangeFabric={(id) => updateDesign({ fabricType: id })}
            cardClassName={isMobileDrawer ? "w-full shrink-0" : "shrink-0 flex-[1.2] min-w-[300px] max-w-[440px] 2xl:min-w-[380px] 2xl:max-w-[620px] h-full min-h-[188px] overflow-hidden"}
          />
        )}

        {/* UPLOAD */}
        {activeTab === "upload" && (
          <div className={`${isDrawerLayout ? (isMobileDrawer ? "w-full flex flex-col gap-2.5" : "h-full w-full flex items-stretch justify-start gap-2.5") : "space-y-2.5"}`}>
            {showPrintTypePicker && (
              <div className={isDrawerLayout ? "w-full" : ""}>
                <PrintTypePickerCards
                  selectedIds={printTypes}
                  onSelect={handleSelectPrintTypeFromPanel}
                  sourceLabel="Panelden sec"
                  isMobile={isMobile}
                />
              </div>
            )}

            {!showPrintTypePicker && (
              <>
            <div className={`${isDrawerLayout ? (isMobileDrawer ? "w-full grid grid-cols-1 gap-2" : "w-full grid grid-cols-[minmax(320px,1.05fr)_minmax(460px,1.35fr)] gap-2") : "grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-2"}`}>
              <ModelManagementCard
                designs={designs}
                activeId={activeId}
                onSelectModel={onSelectModel}
                onRemoveModel={onRemoveModel}
                activeModelType={design.modelType}
                hoodieParts={hoodieV12Parts}
                onToggleHoodiePart={setHoodiePartEnabled}
                fabricType={fabricType}
                onChangeFabric={(id) => updateDesign({ fabricType: id })}
              />

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
                          className={`relative h-28 rounded-lg border overflow-hidden transition cursor-pointer ${
                            selected ? "border-black ring-1 ring-black/20" : "border-gray-300 hover:border-gray-400"
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
                          className={`w-full h-full flex flex-col items-start justify-center pl-4 gap-1 ${
                            canUploadMoreLogos ? "text-gray-600 hover:bg-gray-100" : "text-gray-400 cursor-not-allowed"
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
                {!canUploadMoreLogos && (
                  <p className="text-[10px] text-gray-500 font-semibold">Maksimum 3 görsel yüklendi.</p>
                )}
              </div>
            </div>

            {(sideData?.logos || []).length > 0 && (
              <div className={`rounded-xl border border-gray-200 bg-white p-2 space-y-2 ${isDrawerLayout ? (isMobileDrawer ? "w-full shrink-0" : "flex-1 min-w-[220px] max-w-[320px] 2xl:min-w-[260px] 2xl:max-w-[420px] h-full max-h-full min-h-[188px] flex flex-col overflow-y-auto overflow-x-hidden") : ""}`}>
                <p className={drawerHeadingClass}>Katmanlar</p>
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

                {activeLogo && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        const next = (sideData.logos || []).map((l) =>
                          l.id === activeLogo.id ? { ...l, z: 1 } : l
                        );
                        updateSide({ logos: next });
                      }}
                      className="w-full py-1.5 bg-zinc-100 text-zinc-800 rounded-lg text-[10px] font-bold uppercase border border-zinc-200 hover:bg-zinc-200"
                    >
                      Öne Al
                    </button>
                    <button
                      onClick={() => {
                        const next = (sideData.logos || []).map((l) =>
                          l.id === activeLogo.id ? { ...l, z: -1 } : l
                        );
                        updateSide({ logos: next });
                      }}
                      className="w-full py-1.5 bg-zinc-100 text-zinc-800 rounded-lg text-[10px] font-bold uppercase border border-zinc-200 hover:bg-zinc-200"
                    >
                      Arkaya Al
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => {
                      setActiveTab("editor");
                      if (isMobileDrawer) onRequestDrawerCollapse?.();
                    }}
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
              </>
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
                const fx = getLogoStyle(l);

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
                      updateSide({ textPos: clampTextPos({
                        x: clamp01((ev.clientX - rect.left) / rect.width + offset.dx),
                        y: clamp01((ev.clientY - rect.top) / rect.height + offset.dy),
                      }, sideData?.customText) });
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
	            <div className={`rounded-xl border border-gray-200 bg-white p-3 space-y-3 shadow-sm ${isDrawerLayout ? (isMobileDrawer ? "w-full shrink-0" : "flex-1 min-w-[320px] max-w-[520px] h-full max-h-full min-h-[188px] flex flex-col overflow-y-auto overflow-x-hidden") : ""}`}>
	              <div className="flex items-center justify-between gap-2">
	                <p className={drawerHeadingClass}>Yazı / PDF</p>
	                {hasPdf ? (
	                  <span className="text-[10px] font-black uppercase text-emerald-600">Hazır</span>
	                ) : (
	                  <span className="text-[10px] font-black uppercase text-gray-500">Dosya Yok</span>
	                )}
	              </div>

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
	                  placeholder="Yazını gir"
	                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[12px] font-semibold text-gray-800"
	                />
	                <div className="grid grid-cols-2 gap-2">
	                  <label className="space-y-1">
	                    <span className="block text-[10px] font-black uppercase tracking-wide text-gray-500">Font</span>
	                    <select
	                      value={t.font || FONT_OPTIONS[0].value}
	                      onChange={(e) => bumpText({ font: e.target.value })}
	                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-[11px] font-semibold text-gray-800"
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
	                <div className="space-y-1">
	                  <div className="flex items-center justify-between text-[10px] text-gray-500">
	                    <span className="font-black uppercase tracking-wide">Boyut</span>
	                    <span>{Math.round(Number(t.size || 150))} px</span>
	                  </div>
	                  <input
	                    type="range"
	                    min="30"
	                    max="320"
	                    step="1"
	                    value={Number(t.size || 150)}
	                    onChange={(e) => bumpText({ size: Number(e.target.value) })}
	                    className="w-full accent-black"
	                  />
	                </div>
	                <div className="space-y-1">
	                  <span className="block text-[10px] font-black uppercase tracking-wide text-gray-500">Yazı Duruşu</span>
	                  <select
	                    value={t.layout || "straight"}
	                    onChange={(e) => bumpText({ layout: e.target.value })}
	                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-[11px] font-semibold text-gray-800"
	                  >
	                    {TEXT_LAYOUT_OPTIONS.map((opt) => (
	                      <option key={`layout-opt-${opt.id}`} value={opt.id}>
	                        {opt.label}
	                      </option>
	                    ))}
	                  </select>
	                </div>
	                <div className="space-y-1">
	                  <div className="flex items-center justify-between text-[10px] text-gray-500">
	                    <span className="font-black uppercase tracking-wide">Eğri</span>
	                    <span>{Math.round(getTextCurveValue(t))}%</span>
	                  </div>
	                  <input
	                    type="range"
	                    min="6"
	                    max="88"
	                    step="1"
	                    value={Math.round(getTextCurveValue(t))}
	                    onChange={(e) => bumpText({ curve: Number(e.target.value) })}
	                    className="w-full accent-black"
	                  />
	                </div>
	                <p className="text-[10px] text-gray-500">
	                  Not: Yazı konumu sürükleme ve hassas yerleşim ayarı için `Yerleşim` ekranını kullan.
	                </p>
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
	                  <Move size={14} /> Yazıyı Yerleşimde Konumlandır
	                </button>
	              </div>

	              <button
	                type="button"
                onClick={() => pdfInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer?.files?.[0];
                  await handlePdfUpload(file);
                }}
                className="w-full h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 flex flex-col items-center justify-center gap-2"
              >
                <FileText size={20} />
                <span className="text-[11px] font-black uppercase tracking-wide">PDF Dosyası Ekle</span>
                <span className="text-[10px] text-gray-500">Sürükle-bırak veya tıkla</span>
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

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Dosya</p>
                <p className="text-xs font-semibold text-gray-700 break-all">
                  {design.pdfOriginalName || "Henüz PDF seçilmedi"}
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
                    className={`py-2 rounded-lg text-[10px] font-black uppercase border ${
                      (design.pdfPlacement?.side || "front") === opt.id
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    } ${!hasPdf ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">PDF Konumu</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>X</span>
                    <span>{Math.round(pdfPlacement.x * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={pdfPlacement.w / 2}
                    max={1 - pdfPlacement.w / 2}
                    step="0.005"
                    value={pdfPlacement.x}
                    disabled={!hasPdf}
                    onChange={(e) => updatePdfPlacement({ x: Number(e.target.value) })}
                    className={`w-full accent-black ${!hasPdf ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Y</span>
                    <span>{Math.round(pdfPlacement.y * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={pdfPlacement.h / 2}
                    max={1 - pdfPlacement.h / 2}
                    step="0.005"
                    value={pdfPlacement.y}
                    disabled={!hasPdf}
                    onChange={(e) => updatePdfPlacement({ y: Number(e.target.value) })}
                    className={`w-full accent-black ${!hasPdf ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Ölçek</span>
                    <span>{Math.round(pdfPlacement.w * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.12"
                    max="0.9"
                    step="0.005"
                    value={pdfPlacement.w}
                    disabled={!hasPdf}
                    onChange={(e) => {
                      const nextW = Number(e.target.value);
                      const ratio = Math.max(0.01, pdfPlacement.h / Math.max(0.001, pdfPlacement.w));
                      updatePdfPlacement({ w: nextW, h: clamp(nextW * ratio, 0.08, 0.9) });
                    }}
                    className={`w-full accent-black ${!hasPdf ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Döndürme</span>
                    <span>{Math.round(pdfPlacement.rotation || 0)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={pdfPlacement.rotation || 0}
                    disabled={!hasPdf}
                    onChange={(e) => updatePdfPlacement({ rotation: Number(e.target.value) })}
                    className={`w-full accent-black ${!hasPdf ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>
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
                className={`w-full py-2 rounded-lg text-[10px] font-black uppercase border ${
                  hasPdf
                    ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                PDF’yi Kaldır
              </button>

              <a
                href={SCIENTIFIC_ROUTE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wide text-gray-600 underline"
              >
                Daha fazlası için Bilimsel Sayfası
              </a>
              {isUploadingPdf && <p className="text-[10px] font-bold uppercase text-gray-500">PDF yükleniyor...</p>}
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
                    className={`w-10 h-10 rounded-full border-2 transition hover:scale-110 ${
                      design.color === c ? "border-black scale-110" : "border-gray-200"
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
                      className={`w-10 h-10 rounded-full border-2 transition ${
                        (design.stringColor || "#e6e6e6") === c ? "border-black scale-110" : "border-gray-300"
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
  const [activeTab, setActiveTab] = useState("upload");
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

  const safeInitial = presetModelFromQuery || AVAILABLE_MODELS[0];

  const [view, setView] = useState("front");
  const [designs, setDesigns] = useState(() => [
    { ...initialDesignRef.current, modelType: safeInitial },
  ]);
  const [activeId, setActiveId] = useState(() => initialDesignRef.current.id);
  const [flowStep, setFlowStep] = useState("select");
  const [selectedModelType, setSelectedModelType] = useState(() => presetModelFromQuery);

  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState("root");
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
  const [isLogoDragging, setIsLogoDragging] = useState(false);

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
  const activeLogo = logos.find(l => l.id === (sideData?.activeLogoId || logos[0]?.id));
  const logoControlsLocked = lockAspect;
  const imageControlDisabled = logoControlsLocked || !activeLogo;
  const isPrintAreaOpen = activeTab === "editor";
  const activeLogoBox = activeLogo?.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
  const activeLogoFx = getLogoStyle(activeLogo);
  const activePdfPlacement = normalizePdfPlacement(currentActiveDesign?.pdfPlacement, currentSide);
  const pdfVisibleOnCurrentSide = Boolean(currentActiveDesign?.hasPdf && activePdfPlacement.side === currentSide);
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

  const handleDeleteActiveImage = () => {
    const currentId = sideData.activeLogoId || sideData.logos?.[0]?.id;
    if (!currentId) return;
    const next = (sideData.logos || []).filter((l) => l.id !== currentId);
    updateSide({ logos: next, activeLogoId: next[0]?.id || null });
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
  const perf = useMemo(() => {
    const heavy = modelCount > 2;
    return {
      dpr: isMobile ? (heavy ? 1.2 : 1.35) : heavy ? 1.3 : 1.6,
      antialias: !heavy,
      shadowMap: isMobile ? 384 : heavy ? 512 : 768,
      powerPreference: "high-performance",
    };
  }, [isMobile, modelCount]);

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
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
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
    setDrawerMenuOpen(false);
    if (tabIndex < 0) {
      setActiveTab("upload");
      return;
    }
    setActiveTab(DRAWER_TABS[(tabIndex - 1 + DRAWER_TABS.length) % DRAWER_TABS.length]);
  };
  const goNextTab = () => {
    setDrawerMenuOpen(false);
    if (tabIndex < 0) {
      setActiveTab("upload");
      return;
    }
    setActiveTab(DRAWER_TABS[(tabIndex + 1) % DRAWER_TABS.length]);
  };
  const openPrintTypePickerFromHeader = () => {
    setActiveTab("upload");
    setDrawerMenuOpen(false);
    setDrawerOpen(true);
    setPrintTypePickerSignal((prev) => prev + 1);
  };
  const menuTabs = [
    { id: "upload", label: "Baskı", icon: ImageIcon },
    { id: "text", label: "Yazı", icon: FileText },
    { id: "color", label: "Renk", icon: Palette },
  ];
  const activePrintTypes = Array.isArray(activeDesign?.printTypes) ? activeDesign.printTypes : [];
  const selectedPrintTypeNames = activePrintTypes
    .map((typeId) => PRINT_TYPE_OPTIONS.find((opt) => opt.id === typeId)?.label || typeId)
    .join(" • ");
  const togglePrintTypeFromMenu = (typeId) => {
    const opt = PRINT_TYPE_OPTIONS.find((entry) => entry.id === typeId);
    if (!opt?.available) return;

    let becameSelected = false;
    setDesigns((prev) =>
      prev.map((d) => {
        if (d.id !== activeId) return d;
        const current = Array.isArray(d.printTypes) ? d.printTypes : [];
        const has = current.includes(typeId);
        const next = has ? current.filter((id) => id !== typeId) : [...current, typeId];
        becameSelected = !has;
        return { ...d, printTypes: next };
      })
    );

    if (becameSelected && (typeId === "rubber" || typeId === "flock")) {
      setActiveTab("text");
    } else {
      setActiveTab("upload");
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
    if (!hasLogo && editorControlTab !== "logo") {
      setEditorControlTab("logo");
    }
  }, [activeTab, activeId, currentSide, sideData?.logos?.length, editorControlTab]);

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

  const addModel = (type) => {
    const t = AVAILABLE_MODELS.includes(type) ? type : AVAILABLE_MODELS[0];
    const nd = createDesign(t);
    setDesigns((prev) => [...prev, nd]);
    setActiveId(nd.id);
    setPickerOpen(false);
  };

  const startDesignFlow = () => {
    if (!selectedModelType || !AVAILABLE_MODELS.includes(selectedModelType)) return;
    const next = createDesign(selectedModelType);
    setDesigns([next]);
    setActiveId(next.id);
    setView("front");
    setActiveTab("upload");
    setForceEditorOverlay(false);
    setPickerOpen(false);
    setDrawerMenuOpen(false);
    setDrawerOpen(true);
    setFlowStep("design");
    router.replace(`/tasarim?model=${selectedModelType}`, { scroll: false });
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
        const orderItem = {
          id: `${d.id}-${Date.now()}`,
          name: MODEL_LABELS[d.modelType] || d.modelType,
          price: getPrice(d),
          size: d.size,
          color: d.color,
          quantity: 1,
          image: previewMockup,
          designDetails: {
            model: d.modelType,
            baseColor: d.color,
            fabricType: d.fabricType || "standart",
            stringColor: d.stringColor,
            hoodieV12Parts: normalizeHoodieParts(d.hoodieV12Parts),
            hasPdf: Boolean(d.hasPdf && d.pdfFileUrl),
            pdfFileUrl: d.pdfFileUrl || null,
            pdfOriginalName: d.pdfOriginalName || "",
            pdfPlacement: normalizePdfPlacement(d.pdfPlacement, d.pdfPlacement?.side || "front"),
            printTypes: Array.isArray(d.printTypes) ? d.printTypes : [],
            printFiles,
            textFiles,
            mockupFiles,
            userUploads: Array.from(userUploadsSet),
            adjustedUploads,
            sides: d.sides,
          },
        };

        checkoutDesigns.push({
          id: orderItem.id,
          modelType: d.modelType,
          name: orderItem.name,
          color: d.color,
          fabricType: d.fabricType || "standart",
          size: d.size,
          price: orderItem.price,
          quantity: 1,
          hoodieV12Parts: normalizeHoodieParts(d.hoodieV12Parts),
          hasPdf: Boolean(d.hasPdf && d.pdfFileUrl),
          pdfFileUrl: d.pdfFileUrl || null,
          pdfOriginalName: d.pdfOriginalName || "",
          pdfPlacement: normalizePdfPlacement(d.pdfPlacement, d.pdfPlacement?.side || "front"),
          printTypes: Array.isArray(d.printTypes) ? d.printTypes : [],
          preview: previewMockup,
          image: previewMockup,
          printFiles,
          textFiles,
          mockupFiles,
          userUploads: Array.from(userUploadsSet),
          adjustedUploads,
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
  const hideMobileDrawerInEditor = isMobile && isPrintAreaOpen;
  const menuPanelBottom = `calc(${Math.round(visibleDrawerHeight)}px + 12px)`;

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
      designs={designs}
      activeId={activeId}
      onSelectModel={setActiveId}
      onRemoveModel={removeModel}
      onOpenModelPicker={() => {
        setPickerStep("root");
        setPickerOpen(true);
      }}
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

  return (
    <div className="fixed inset-0 h-screen w-full text-white overflow-hidden font-sans" style={{ background: SCENE_BG_COLOR, overscrollBehavior: "none", touchAction: isMobile ? "pan-y" : "none" }}>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-[90] px-4 pt-4 pb-3 flex items-start justify-between pointer-events-none">
        <div className="flex items-start gap-3 pointer-events-auto">
          <Link href="/" className="px-2 py-2 rounded-full border border-zinc-300 bg-white/80 backdrop-blur-md hover:bg-white transition text-xs text-black">
            ←
          </Link>
          <div>
            <p className="text-sm font-bold text-black">{MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}</p>
            <p className="text-xs text-zinc-600">{getPrice(activeDesign || createDesign(DEFAULT_MODEL_TYPE))} ₺</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleFinishCheckout}
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
            className="absolute z-[90] pointer-events-none transition-all duration-300"
            style={
              isMobile
                ? { top: "110px", right: "4px" }
                : { bottom: controlsBottom, right: "16px" }
            }
          >
            <div className="flex flex-col items-center pointer-events-auto gap-2">
              <div
                className={`flex flex-col rounded-full border-2 border-zinc-700 bg-white/95 backdrop-blur shadow-[0_10px_26px_rgba(0,0,0,0.22)] ${
                  isMobile ? "p-[3px]" : "p-1.5"
                }`}
              >
                {UI_VIEWS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`${isMobile ? "px-3 py-1.5 text-[10px]" : "px-5 py-2.5 text-[11px]"} rounded-full font-bold uppercase tracking-widest transition-all ${
                      view === v
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
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition ${
                          isEnabled
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
            <div className="w-full max-w-md bg-[#eef1f4] border border-gray-300 rounded-2xl p-4 max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {pickerStep !== "root" && (
                    <button
                      onClick={() => setPickerStep("root")}
                      className="w-8 h-8 rounded-full border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 flex items-center justify-center"
                      title="Geri"
                    >
                      <span className="text-sm">←</span>
                    </button>
                  )}
                  <h3 className="text-sm font-black tracking-widest uppercase text-zinc-800">Model Seç</h3>
                </div>

                <button
                  onClick={() => {
                    setPickerStep("root");
                    setPickerOpen(false);
                  }}
                  className="w-8 h-8 rounded-full border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {pickerStep === "root" &&
                  MODEL_SELECTION_GROUPS.map((group) => (
                    <button
                      key={`picker-group-${group.id}`}
                      onClick={() => setPickerStep(group.id)}
                      className="py-3 px-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-xs font-bold uppercase tracking-wide text-center text-zinc-800"
                    >
                      {group.title}
                    </button>
                  ))}

                {pickerStep !== "root" && (
                  <>
                    {(MODEL_SELECTION_GROUPS.find((group) => group.id === pickerStep)?.models || []).map((modelType) => (
                      <button
                        key={`picker-model-${modelType}`}
                        onClick={() => addModel(modelType)}
                        className="py-3 px-2 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-xs font-bold uppercase tracking-wide text-center text-zinc-800"
                      >
                        {MODEL_LABELS[modelType] || modelType}
                      </button>
                    ))}
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
            className={`absolute z-[90] backdrop-blur-md border border-gray-200 shadow-2xl overflow-hidden flex flex-col ${
              isMobile ? "rounded-none border-x-0 rounded-t-2xl" : "rounded-2xl"
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
              maxHeight: isMobile ? (hideMobileDrawerInEditor ? "52vh" : "58vh") : undefined,
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
                {isMobile && (
                  <button
                    onClick={() => {
                      setActiveTab("upload");
                      setForceEditorOverlay(false);
                      setDrawerOpen(false);
                      setDrawerMenuOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider"
                  >
                    Tamam
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex-1 ${isMobile ? "overflow-y-auto overflow-x-hidden p-3" : "overflow-y-auto overflow-x-visible p-4"}`}>
              <div
                ref={previewRef}
                className={`w-full rounded-xl border border-gray-300 relative overflow-hidden shadow-xl touch-none ${isMobile ? "h-[30vh] min-h-[220px] max-h-[340px]" : "h-[56vh]"}`}
                style={{
                  touchAction: "none",
                  backgroundColor: "#eef1f5",
                  aspectRatio: isMobile ? undefined : previewAspect,
                }}
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

                {/* katmanlar: logo + text */}
                {(() => {
                  const items = [
                    ...(logos || []).map((l, idx) => ({ kind: "logo", z: l?.z ?? 0, idx, payload: l })),
                    ...(sideData?.customText?.text || "").trim()
                      ? [{ kind: "text", z: sideData?.customText?.z ?? 0, idx: 9999, payload: sideData.customText }]
                      : [],
                  ].sort((a, b) => (a.z !== b.z ? a.z - b.z : a.idx - b.idx));

                  return items.map((it, renderIdx) => {
                    if (it.kind === "text") {
                      return (
                        <div
                          key={`text-layer-${currentSide}`}
                          className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/20 border border-white/20"
                          style={{
                            left: `${clampTextPos(sideData?.textPos, sideData?.customText).x * 100}%`,
                            top: `${clampTextPos(sideData?.textPos, sideData?.customText).y * 100}%`,
                            touchAction: "none",
                            cursor: "grab",
                            zIndex: 10 + renderIdx,
                          }}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const rect = previewRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            const start = {
                              x: clamp01((e.clientX - rect.left) / rect.width),
                              y: clamp01((e.clientY - rect.top) / rect.height),
                            };
                            const base = sideData?.textPos || { x: 0.5, y: 0.85 };
                            const offset = { dx: base.x - start.x, dy: base.y - start.y };
                            const move = (ev) =>
                              updateSide({ textPos: clampTextPos({
                                x: clamp01((ev.clientX - rect.left) / rect.width + offset.dx),
                                y: clamp01((ev.clientY - rect.top) / rect.height + offset.dy),
                              }, sideData?.customText) });
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
                      );
                    }

                    const l = it.payload;
                    const isSelected = l.id === (sideData?.activeLogoId || sideData?.logos?.[0]?.id);
                    const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
                    const fx = getLogoStyle(l);
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
                          zIndex: 10 + renderIdx,
                          pointerEvents: isSelected ? "none" : "auto",
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
                  });
                })()}

                {pdfVisibleOnCurrentSide && (
                  <div
                    className="absolute border-2 border-cyan-400/90 rounded-md bg-cyan-200/15 backdrop-blur-[1px] pointer-events-none"
                    style={{
                      left: `${(activePdfPlacement.x - activePdfPlacement.w / 2) * 100}%`,
                      top: `${(activePdfPlacement.y - activePdfPlacement.h / 2) * 100}%`,
                      width: `${activePdfPlacement.w * 100}%`,
                      height: `${activePdfPlacement.h * 100}%`,
                      transform: `rotate(${activePdfPlacement.rotation || 0}deg)`,
                      transformOrigin: "center center",
                      zIndex: 18,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="px-2 py-1 rounded-full bg-cyan-500/85 text-[9px] font-black uppercase tracking-wider text-white">
                        PDF Konumu
                      </span>
                    </div>
                  </div>
                )}

                {/* seçili logo resize/drag çerçevesi */}
                {activeLogo && (
                  <ResizeFrame
                    box={activeLogo.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 }}
                    containerRef={previewRef}
                    onChange={updateActiveLogoBox}
                    onDragStateChange={setIsLogoDragging}
                    diagonalOnly={lockAspect}
                  />
                )}

              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditorControlTab("logo")}
                  className={`py-1.5 rounded-lg text-[10px] font-black uppercase border ${
                    editorControlTab === "logo"
                      ? "bg-white text-black border-white"
                      : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                  }`}
                >
                  Gorsel Ayari
                </button>
                <button
                  onClick={() => setEditorControlTab("effects")}
                  className={`py-1.5 rounded-lg text-[10px] font-black uppercase border ${
                    editorControlTab === "effects"
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
                        className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                          lockAspect ? "bg-white text-black border-white" : "bg-zinc-700 text-zinc-100 border-zinc-500"
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
                          disabled={imageControlDisabled}
                          onChange={(e) => {
                            setCmInputW(sanitizeCmInput(e.target.value));
                          }}
                          className={`w-full rounded-md border px-2 py-1 text-[11px] ${
                            imageControlDisabled
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
                          disabled={imageControlDisabled}
                          onChange={(e) => {
                            setCmInputH(sanitizeCmInput(e.target.value));
                          }}
                          className={`w-full rounded-md border px-2 py-1 text-[11px] ${
                            imageControlDisabled
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
                      disabled={imageControlDisabled}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, w: Number(e.target.value) })}
                      className={`w-full accent-cyan-300 ${imageControlDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      disabled={imageControlDisabled}
                      onChange={(e) => updateActiveLogoBox({ ...activeLogoBox, h: Number(e.target.value) })}
                      className={`w-full accent-cyan-300 ${imageControlDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
                        imageControlDisabled
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-zinc-700 hover:bg-zinc-600"
                      }`}
                    >
                      Öne Al
                    </button>
                    <button
                      disabled={imageControlDisabled}
                      onClick={() => setActiveLogoLayer("back")}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
                        imageControlDisabled
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
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
                        imageControlDisabled
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-zinc-700 hover:bg-zinc-600"
                      }`}
                    >
                      Ortala
                    </button>
                    <button
                      disabled={imageControlDisabled}
                      onClick={() => updateActiveLogoBox({ x: 0.5, y: 0.6, w: 0.7, h: 0.45 })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase ${
                        imageControlDisabled
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
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                      activeLogo
                        ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border-zinc-600 bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    Görseli Sil
                  </button>
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
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                        activeLogoFx.flipX
                          ? "bg-cyan-100 text-cyan-900 border-cyan-300"
                          : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                      }`}
                    >
                      Yatay
                    </button>
                    <button
                      onClick={() => updateActiveLogo({ flipY: !activeLogoFx.flipY })}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                        activeLogoFx.flipY
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
          const desktopClosedScale = isPrintAreaOpen ? 0.96 : 1.06;
          const desktopOpenScale = isPrintAreaOpen ? 0.86 : 0.95;
          const desktopScale = drawerOpen ? desktopOpenScale : desktopClosedScale;
          const desktopWidth = isPrintAreaOpen ? "62vw" : "70vw";
          const desktopHeight = isPrintAreaOpen ? "82vh" : "86vh";
          const desktopTop = "50%";
          const desktopShiftY = drawerOpen ? (isPrintAreaOpen ? "-18%" : "-12%") : "0%";
          const mobileScale = isPrintAreaOpen ? (drawerOpen ? 0.72 : 0.86) : drawerOpen ? 0.8 : 0.96;
          const mobileLeft = isPrintAreaOpen ? "60%" : drawerOpen ? "55%" : "57%";
          const mobileShiftY = isPrintAreaOpen ? (drawerOpen ? "-25%" : "-21%") : drawerOpen ? "-14%" : "-8%";
          const minZoomDistance = !isMobile ? (isPrintAreaOpen ? 1.86 : drawerOpen ? 1.72 : 1.56) : isPrintAreaOpen ? 1.9 : 1.72;
          const controlsTargetY = !isMobile ? (isPrintAreaOpen ? -0.12 : drawerOpen ? -0.2 : -0.1) : isPrintAreaOpen ? -0.05 : -0.1;
          return (
        <Canvas
          style={{
            position: "absolute",
            left: isMobile ? mobileLeft : isPrintAreaOpen ? "63%" : "50%",
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
            gl.toneMappingExposure = 1.1;
          }}
          camera={{ position: [0, 0.36, 2.34], fov: isMobile ? (isPrintAreaOpen ? 38 : 34) : 30 }}
          shadows={!isMobile}
        >
          <SceneBackgroundLock />

          <HdriEnvironment url={HDR_ENV_PATH} />

          <ambientLight intensity={0.5} />
          <hemisphereLight intensity={0.18} groundColor={"#1f1f1f"} />
          <directionalLight
            position={[6, 10, 8]}
            intensity={0.58}
            castShadow={!isMobile}
            shadow-mapSize-width={perf.shadowMap}
            shadow-mapSize-height={perf.shadowMap}
          />
          <directionalLight position={[-6, 6, -6]} intensity={0.2} />
          <pointLight position={[0, 2.6, 2.2]} intensity={0.08} />
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
            dampingFactor={isMobile ? 0.12 : 0.08}
            zoomSpeed={isMobile ? 0.95 : 0.7}
            minDistance={minZoomDistance}
            maxDistance={isMobile ? 4.8 : 4.2}
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
            className={`fixed left-0 right-0 z-[92] pointer-events-auto transition-all duration-300 ${
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
                className={`relative px-3 border-b border-gray-300/80 bg-[#eceff3] ${
                  drawerOpen ? "pt-9 pb-2" : "pt-7 pb-3"
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
                        {isMobile && (
                          <button
                            onClick={openPrintTypePickerFromHeader}
                            className="absolute left-2 top-1 h-8 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shadow-sm text-[10px] font-black uppercase tracking-wide z-20"
                            aria-label="Baski tipi secimine don"
                          >
                            Geri
                          </button>
                        )}
		                    {!isMobile ? (
	                      <>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <button
                            onClick={openPrintTypePickerFromHeader}
                            className="h-9 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center text-[11px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Baski tipi secimine don"
                          >
                            Geri
                          </button>
                          <div
                            className="h-9 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 flex items-center justify-center text-[10px] font-black uppercase tracking-wide shadow-sm max-w-[250px] truncate"
                            title={selectedPrintTypeNames || "Baski secilmedi"}
                          >
                            {selectedPrintTypeNames || "Baski secilmedi"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPickerStep("root");
                              setPickerOpen(true);
                            }}
                            className="h-9 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center text-[11px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Model ekle"
                          >
                            + Model
                          </button>
                          <div className="flex items-center gap-1 min-w-0 max-w-[380px]">
                            <button
                              onClick={goPrevTab}
                              className="w-10 h-10 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shadow-sm"
                              aria-label="Önceki adım"
                            >
                              <ChevronLeft size={18} strokeWidth={2.6} />
                            </button>
                            <div className="text-center min-w-0 px-1">
                              <p className="text-[18px] leading-none font-black uppercase tracking-wide text-gray-900">
                                {tabLabelMap[activeTab] || "Baskı"}
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
                            className="h-9 px-3 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Kategori menüsünü aç"
                          >
                            <Menu size={14} />
                            Menü
                          </button>
                        </div>
	                      </>
		                    ) : (
		                      <>
		                        <div className="flex items-center gap-1 min-w-0">
	                          <button
	                            onClick={() => {
                              setPickerStep("root");
                              setPickerOpen(true);
                            }}
                            className="h-8 px-2 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center text-[10px] font-black uppercase tracking-wide shadow-sm"
                            aria-label="Model ekle"
                          >
                            + Model
                          </button>
                          <button
                            onClick={goPrevTab}
                            className="w-10 h-10 shrink-0 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shadow-sm"
                            aria-label="Önceki adım"
                          >
                            <ChevronLeft size={18} strokeWidth={2.6} />
                          </button>
                          <div className="text-center min-w-0 px-1">
                            <p className="text-[18px] leading-none font-black uppercase tracking-wide text-gray-900">
                              {tabLabelMap[activeTab] || "Baskı"}
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
                          <button
                            onClick={openDrawerMenu}
                            className="h-8 px-2 rounded-full border-2 border-zinc-700 bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wide shadow-sm"
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
            className={`fixed inset-0 z-[96] transition-opacity duration-200 ${
              drawerMenuOpen
                ? "opacity-100 pointer-events-auto bg-black/16 backdrop-blur-[2px]"
                : "opacity-0 pointer-events-none bg-black/0 backdrop-blur-0"
            }`}
            onClick={closeDrawerMenu}
          >
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-[min(97vw,980px)] rounded-2xl border border-gray-200 bg-white/95 shadow-2xl p-4 md:p-5 transform-gpu will-change-transform transition-all duration-200 ease-out ${
                drawerMenuOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-3 opacity-0 scale-[0.985]"
              }`}
              style={{
                bottom: menuPanelBottom,
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
                    className={`px-3 py-3 rounded-xl border text-[11px] font-black uppercase tracking-wide transition flex items-center justify-center gap-2 ${
                      activeTab === tab.id
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

/* preload (lightweight set) */
AVAILABLE_MODELS.forEach((modelType) => {
  const modelPath = MODEL_PATHS[modelType];
  if (modelPath) useGLTF.preload(toSafeUrl(modelPath));
});
