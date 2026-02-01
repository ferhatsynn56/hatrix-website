"use client";

import Link from "next/link";

import React, { useState, Suspense, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Decal, Center, ContactShadows, useGLTF } from "@react-three/drei";

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
} from "lucide-react";

import * as THREE from "three";

// ✅ ÜÇGEN (NORMAL) TEMİZLİĞİ + SKINNED CLONE
// ✅ ÜÇGEN (NORMAL) TEMİZLİĞİ + SKINNED CLONE
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";


import { useCart } from "@/context/CartContext";


/* ================= PATH HELPERS ================= */
const toSafeUrl = (p) => (typeof window !== "undefined" ? encodeURI(p) : p);



/* ================= MODEL PATHS ================= */
const MODEL_PATHS = {
  tshirt: "/models/DüzTshirt.glb",
  hoodie: "/models/hoodie.glb",
  sweatshirt: "/models/DüzSweat.glb",
  "hoodie-cepli": "/models/hoodieCepli.glb",
  "hoodie-ceplipli": "/models/hoodieCepliIpli.glb",
  "oversize-sweat": "/models/OversizeSweat.glb",
  "oversize-tshirt": "/models/OversizeTshirt.glb",
  fermuarli: "/models/Fermuarlı.glb",
};

const AVAILABLE_MODELS = [
  "tshirt",
  "hoodie",
  "sweatshirt",
  "hoodie-cepli",
  "hoodie-ceplipli",
  "oversize-sweat",
  "oversize-tshirt",
  "fermuarli",
];

const MODEL_LABELS = {
  tshirt: "Düz Tişört",
  hoodie: "Hoodie",
  sweatshirt: "Düz Sweat",
  "hoodie-cepli": "Hoodie Cepli",
  "hoodie-ceplipli": "Hoodie Cepli İpli",
  "oversize-sweat": "Oversize Sweat",
  "oversize-tshirt": "Oversize Tişört",
  fermuarli: "Fermuarlı",
};

/* ================= PRINT BOUNDS ================= */
const MODEL_PRINT_BOUNDS = {
  tshirt: {
    front: { xMin: -0.188, xMax: 0.188, yTop: 0.280, yBot: -0.30, z: 0.147, rotY: 0 },
    back:  { xMin: -0.188, xMax: 0.188, yTop: 0.280, yBot: -0.30, z: -0.148, rotY: Math.PI },
    sleeveL: { xMin: -0.075, xMax: 0.075, yTop: 0.170, yBot: 0.030, z: 0.060, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.33 },
    sleeveR: { xMin: -0.075, xMax: 0.075, yTop: 0.170, yBot: 0.030, z: 0.060, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.33 },
  },
  "oversize-tshirt": {
    front: { xMin: -0.207, xMax: 0.206, yTop: 0.280, yBot: -0.30, z: 0.153, rotY: 0 },
    back:  { xMin: -0.207, xMax: 0.206, yTop: 0.280, yBot: -0.30, z: -0.153, rotY: Math.PI },
    sleeveL: { xMin: -0.085, xMax: 0.085, yTop: 0.175, yBot: 0.035, z: 0.065, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.37 },
    sleeveR: { xMin: -0.085, xMax: 0.085, yTop: 0.175, yBot: 0.035, z: 0.065, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.37 },
  },
  sweatshirt: {
    front: { xMin: -0.190, xMax: 0.190, yTop: 0.280, yBot: -0.30, z: 0.139, rotY: 0 },
    back:  { xMin: -0.190, xMax: 0.190, yTop: 0.280, yBot: -0.30, z: -0.140, rotY: Math.PI },
    sleeveL: { xMin: -0.080, xMax: 0.080, yTop: 0.175, yBot: 0.030, z: 0.060, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.36 },
    sleeveR: { xMin: -0.080, xMax: 0.080, yTop: 0.175, yBot: 0.030, z: 0.060, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.36 },
  },
  "oversize-sweat": {
    front: { xMin: -0.187, xMax: 0.187, yTop: 0.280, yBot: -0.30, z: 0.138, rotY: 0 },
    back:  { xMin: -0.187, xMax: 0.187, yTop: 0.280, yBot: -0.30, z: -0.138, rotY: Math.PI },
    sleeveL: { xMin: -0.085, xMax: 0.085, yTop: 0.180, yBot: 0.040, z: 0.060, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.38 },
    sleeveR: { xMin: -0.085, xMax: 0.085, yTop: 0.180, yBot: 0.040, z: 0.060, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.38 },
  },
  hoodie: {
    front: { xMin: -0.146, xMax: 0.145, yTop: 0.280, yBot: -0.30, z: 0.104, rotY: 0 },
    back:  { xMin: -0.146, xMax: 0.145, yTop: 0.280, yBot: -0.30, z: -0.104, rotY: Math.PI },
    sleeveL: { xMin: -0.085, xMax: 0.085, yTop: 0.190, yBot: 0.040, z: 0.060, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.41 },
    sleeveR: { xMin: -0.085, xMax: 0.085, yTop: 0.190, yBot: 0.040, z: 0.060, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.41 },
  },
  "hoodie-cepli": {
    front: { xMin: -0.150, xMax: 0.149, yTop: 0.280, yBot: -0.30, z: 0.112, rotY: 0 },
    back:  { xMin: -0.150, xMax: 0.149, yTop: 0.280, yBot: -0.30, z: -0.113, rotY: Math.PI },
    sleeveL: { xMin: -0.085, xMax: 0.085, yTop: 0.195, yBot: 0.045, z: 0.060, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.42 },
    sleeveR: { xMin: -0.085, xMax: 0.085, yTop: 0.195, yBot: 0.045, z: 0.060, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.42 },
  },
  "hoodie-ceplipli": {
    front: { xMin: -0.146, xMax: 0.145, yTop: 0.280, yBot: -0.30, z: 0.104, rotY: 0 },
    back:  { xMin: -0.146, xMax: 0.145, yTop: 0.280, yBot: -0.30, z: -0.104, rotY: Math.PI },
    sleeveL: { xMin: -0.085, xMax: 0.085, yTop: 0.190, yBot: 0.040, z: 0.060, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.41 },
    sleeveR: { xMin: -0.085, xMax: 0.085, yTop: 0.190, yBot: 0.040, z: 0.060, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.41 },
  },
  fermuarli: {
    front: { xMin: -0.177, xMax: 0.176, yTop: 0.280, yBot: -0.30, z: 0.131, rotY: 0 },
    back:  { xMin: -0.177, xMax: 0.176, yTop: 0.280, yBot: -0.30, z: -0.132, rotY: Math.PI },
    sleeveL: { xMin: -0.085, xMax: 0.085, yTop: 0.190, yBot: 0.040, z: 0.060, rotY: Math.PI / 2, rotZ: Math.PI / 2, x: -0.41 },
    sleeveR: { xMin: -0.085, xMax: 0.085, yTop: 0.190, yBot: 0.040, z: 0.060, rotY: -Math.PI / 2, rotZ: -Math.PI / 2, x: 0.41 },
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
const EXTRA_SIDE_PRICE = 150; // her ek taraf için

/* ================= HELPERS ================= */
const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clamp01 = (v) => clamp(v, 0, 1);
const pct = (v01) => `${Math.round(v01 * 100)}%`;

// ✅ YENİ: side içeriği var mı? (çoklu görsel + tekli görsel + text)
const hasSideContent = (sd) => {
  if (!sd) return false;

  // çoklu görsel
  if (Array.isArray(sd.logos) && sd.logos.length > 0) return true;

  // eski tekli sistem duruyorsa
  if (sd.logoUrl) return true;

  // text
  if ((sd.customText?.text || "").trim()) return true;

  return false;
};


// Her taraf için ayrı design verileri
const createSideData = () => ({
  // ✅ çoklu görsel
  logos: [],               // [{ id, url, box: {x,y,w,h} }]
  activeLogoId: null,      // editte hangisi seçili

  customText: { text: "", color: "#ffffff", size: 150, scaleX: 1, scaleY: 1 },
  textPos: { x: 0.5, y: 0.85 },
});


const createDesign = (type = "tshirt") => ({
  id: makeId(),
  modelType: type,
  color: "#050505",
  size: "M",
  sides: {
    front: createSideData(),
    back: createSideData(),
    left: createSideData(),
    right: createSideData(),
  },
});


// Bir design'ın aktif taraflarını (içerik olan) saymak
const getActiveSides = (design) => {
  return Object.entries(design.sides).filter(([_, sd]) => hasSideContent(sd));
};



const getPrice = (design) => {
  const activeSides = getActiveSides(design);
  if (activeSides.length === 0) return BASE_PRICE;
  return BASE_PRICE + (activeSides.length - 1) * EXTRA_SIDE_PRICE;
};

/* ================= SCENE BACKGROUND ================= */
function SceneBackgroundLock() {
  const { gl, scene } = useThree();
  const bg = useMemo(() => new THREE.Color("#0b0b0b"), []);
  useFrame(() => {
    if (!scene.background || scene.background.getHex() !== bg.getHex()) scene.background = bg;
    gl.setClearColor(bg, 1);
  });
  return null;
}

/* ================= KAMERA KONTROLCÜSÜ ================= */
function CameraController({ view, count }) {
  const isAnimating = useRef(false);
  // FIX 1: Daha yakın başlangıç pozisyonları (4.8 -> 3.2)
  const extra = Math.min(2.5, Math.max(0, (count - 1) * 0.8));

  const positions = useMemo(
    () => ({
      front: new THREE.Vector3(0, 0, 3.2 + extra),
      back: new THREE.Vector3(0, 0, -(3.2 + extra)),
      left: new THREE.Vector3(-(3.2 + extra), 0, 0),
      right: new THREE.Vector3(3.2 + extra, 0, 0),
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

/* ================= CANVAS TEXTURE (per-side) ================= */
function useDesignCanvas(sideData) {
  const [canvas, setCanvas] = useState(null);

  const logos = sideData?.logos || [];
  const customText = sideData?.customText;
  const textPos = sideData?.textPos || { x: 0.5, y: 0.85 };

  useEffect(() => {
    const hasContent = logos.length > 0 || (customText?.text || "").trim();
    if (!hasContent) {
      setCanvas(null);
      return;
    }

    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;

    const ctx = c.getContext("2d");
    if (!ctx) return;

    const commit = () => {
      const out = document.createElement("canvas");
      out.width = c.width;
      out.height = c.height;

      const octx = out.getContext("2d");
      if (!octx) return;

      // decal için Y flip
      octx.translate(0, out.height);
      octx.scale(1, -1);
      octx.drawImage(c, 0, 0);

      setCanvas(out);
    };

    const drawText = () => {
      const t = customText || {};
      if (!t.text) return;

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
    };

    const drawAll = async () => {
      ctx.clearRect(0, 0, 1024, 1024);

      // ✅ sırayla tüm logoları çiz
      for (const l of logos) {
        const box = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
        await new Promise((res) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = l.url;
          img.onload = () => {
            const bw = box.w * 1024;
            const bh = box.h * 1024;
            const bx = box.x * 1024 - bw / 2;
            const by = box.y * 1024 - bh / 2;
            ctx.drawImage(img, bx, by, bw, bh);
            res();
          };
          img.onerror = () => res();
        });
      }

      drawText();
      commit();
    };

    drawAll();
  }, [
    JSON.stringify(logos),
    customText?.text,
    customText?.color,
    customText?.size,
    customText?.scaleX,
    customText?.scaleY,
    textPos.x,
    textPos.y,
  ]);

  return canvas;
}


/* ================= 3D MODEL ================= */
function Real3DModel({ color, frontCanvas, backCanvas, leftCanvas, rightCanvas, modelType, view }) {
  const modelPathRaw = MODEL_PATHS[modelType] || MODEL_PATHS.tshirt;
  const gltf = useGLTF(toSafeUrl(modelPathRaw));

  // Aktif view'a göre doğru canvas seç
  const activeCanvas =
    view === "back" ? backCanvas :
    view === "left" ? leftCanvas :
    view === "right" ? rightCanvas :
    frontCanvas;

  const decalTexture = useMemo(() => {
    if (!activeCanvas) return null;
    const tex = new THREE.CanvasTexture(activeCanvas);
    tex.anisotropy = 16;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [activeCanvas]);

  // Skinned var mı?
  const hasSkinned = useMemo(() => {
    let found = false;
    gltf.scene.traverse((o) => { if (o?.isSkinnedMesh) found = true; });
    return found;
  }, [gltf.scene]);

  // ✅ root + decalHostGeometry aynı memo içinde (ref/state yok)
  const { root, decalHostGeometry } = useMemo(() => {
    const cloned = hasSkinned ? SkeletonUtils.clone(gltf.scene) : gltf.scene.clone(true);

    // decal projeksiyonu için bir "hedef" geometry bul
    let targetGeom = null;
    cloned.traverse((o) => {
      if (!targetGeom && (o?.isMesh || o?.isSkinnedMesh) && o.geometry?.attributes?.position) {
        targetGeom = o.geometry;
      }
    });

    return { root: cloned, decalHostGeometry: targetGeom };
  }, [gltf.scene, hasSkinned]);

  // Modelin ana materyali
  const customMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color || "#050505"),
      roughness: 0.92,
      metalness: 0.02,
      flatShading: false,
      side: THREE.FrontSide,
    });
  }, [color]);

  // ✅ Modelin tamamına materyal bas + normals düzelt (üçgen temizliği sende çalıştığı için koruyorum)
  useEffect(() => {
    if (!root) return;
    root.traverse((o) => {
      if (!(o && (o.isMesh || o.isSkinnedMesh) && o.geometry)) return;

      // vertexColor varsa shading bozmasın
      if (o.geometry.getAttribute?.("color")) o.geometry.deleteAttribute("color");

      // normals tazele
      try { o.geometry.computeVertexNormals(); } catch {}

      // materyal override
      o.material = customMaterial;
    });
  }, [root, customMaterial]);

  // ✅ Decal host mesh görünür kalacak ama materyali tamamen şeffaf olacak
  const decalHostMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0,      // görünmez
      depthWrite: false, // decal z-fight azaltır
    });
  }, []);

  // Sleeve raycast (senin mantık)
  const SLEEVE_RAY = useMemo(() => {
    const base = {
      left:  { origin: new THREE.Vector3(-1.2, 0.15, 0.05), dir: new THREE.Vector3( 1, 0, 0) },
      right: { origin: new THREE.Vector3( 1.2, 0.15, 0.05), dir: new THREE.Vector3(-1, 0, 0) },
      w: 0.20, h: 0.22, depth: 0.35, offset: 0.012,
    };
    if (modelType.includes("hoodie")) {
      base.left.origin.set(-1.35, 0.18, 0.06);
      base.right.origin.set( 1.35, 0.18, 0.06);
      base.w = 0.22; base.h = 0.24;
    }
    if (modelType.includes("oversize")) {
      base.left.origin.set(-1.45, 0.18, 0.06);
      base.right.origin.set( 1.45, 0.18, 0.06);
      base.w = 0.24; base.h = 0.26;
    }
    return base;
  }, [modelType]);

  const [sleeveXform, setSleeveXform] = useState(null);

  useEffect(() => {
    if (view !== "left" && view !== "right") { setSleeveXform(null); return; }
    if (!root) return;

    const raycaster = new THREE.Raycaster();
    const sideKey = view === "left" ? "left" : "right";
    const rayCfg = SLEEVE_RAY[sideKey];

    const tryRay = (origin) => {
      raycaster.set(origin, rayCfg.dir.clone().normalize());
      return raycaster.intersectObject(root, true);
    };

    let hits = tryRay(rayCfg.origin.clone());
    if (!hits.length) {
      const o2 = rayCfg.origin.clone(); o2.z -= 0.25;
      hits = tryRay(o2);
    }
    if (!hits.length) { setSleeveXform(null); return; }

    const hit = hits[0];

    // normal world space
    const n = hit.face?.normal?.clone()?.normalize() || new THREE.Vector3(0, 0, 1);
    const nm = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
    n.applyMatrix3(nm).normalize();

    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    const euler = new THREE.Euler().setFromQuaternion(q, "XYZ");
    const pos = hit.point.clone().add(n.clone().multiplyScalar(SLEEVE_RAY.offset));

    setSleeveXform({ pos, rot: euler, scale: [SLEEVE_RAY.w, SLEEVE_RAY.h, SLEEVE_RAY.depth] });
  }, [view, root, SLEEVE_RAY]);

  // Torso bounds
  const torsoSide = view === "back" ? "back" : "front";
  const torsoProfile = MODEL_PRINT_BOUNDS[modelType]?.[torsoSide] || MODEL_PRINT_BOUNDS.tshirt.front;
  const torsoWidth = torsoProfile.xMax - torsoProfile.xMin;
  const torsoHeight = torsoProfile.yTop - torsoProfile.yBot;
  const torsoCenterY = (torsoProfile.yTop + torsoProfile.yBot) / 2;
  const torsoZOffset = torsoSide === "front" ? 0.02 : -0.02; // biraz artırdım ki kumaş içine gömülmesin

  const showTorsoDecal = !!decalTexture && (view === "front" || view === "back");
  const showSleeveDecal = !!decalTexture && (view === "left" || view === "right");

  return (
    <group dispose={null}>
      <Center top>
        {/* ✅ Modelin kendisi */}
        <primitive object={root} />

        {/* ✅ Decal host mesh: görünür ama şeffaf (Decal render olsun diye şart) */}
        {decalHostGeometry && (
          <mesh geometry={decalHostGeometry} material={decalHostMat}>
            {showTorsoDecal && (
              <Decal
                position={[0, torsoCenterY, torsoProfile.z + torsoZOffset]}
                rotation={[0, torsoProfile.rotY || 0, 0]}
                scale={[torsoWidth, torsoHeight, 0.25]}
                map={decalTexture}
                transparent
                alphaTest={0.02}
                depthTest
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-10}
              />
            )}

            {showSleeveDecal && sleeveXform && (
              <Decal
                position={[sleeveXform.pos.x, sleeveXform.pos.y, sleeveXform.pos.z]}
                rotation={[sleeveXform.rot.x, sleeveXform.rot.y, sleeveXform.rot.z]}
                scale={sleeveXform.scale}
                map={decalTexture}
                transparent
                alphaTest={0.02}
                depthTest
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-10}
              />
            )}
          </mesh>
        )}
      </Center>
    </group>
  );
}




/* ================= TEK MODEL ITEM ================= */
function DesignModelItem({
  design, isActive, isHovered, onSelect, onHover, onUnhover,
  view, targetX, targetZ, targetRotY, targetScale, hidden,
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

  // Her taraf için ayrı canvas
  const frontCanvas = useDesignCanvas(design.sides.front);
  const backCanvas = useDesignCanvas(design.sides.back);
  const leftCanvas = useDesignCanvas(design.sides.left);
  const rightCanvas = useDesignCanvas(design.sides.right);

  if (hidden) return null;

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); onHover(design.id); document.body.style.cursor = "grab"; }}
      onPointerOut={(e) => { e.stopPropagation(); onUnhover(); document.body.style.cursor = "default"; }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(design.id);
        if (!isActive) return;
        dragRef.current = { active: true, pid: e.pointerId, startX: e.clientX, startY: e.clientY, startRotY: userRotRef.current.y, startRotX: userRotRef.current.x };
        document.body.style.cursor = "grabbing";
        if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.active || dragRef.current.pid !== e.pointerId) return;
        e.stopPropagation();
        userRotRef.current.y = dragRef.current.startRotY + (e.clientX - dragRef.current.startX) * ROT_SPEED;
        userRotRef.current.x = clampRotX(dragRef.current.startRotX + (e.clientY - dragRef.current.startY) * ROT_SPEED);
      }}
      onPointerUp={(e) => {
        if (dragRef.current.pid !== e.pointerId) return;
        dragRef.current.active = false;
        document.body.style.cursor = "grab";
        if (e.target?.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
      }}
    >
      <Real3DModel
        color={design.color}
        frontCanvas={frontCanvas}
        backCanvas={backCanvas}
        leftCanvas={leftCanvas}
        rightCanvas={rightCanvas}
        modelType={design.modelType}
        view={view}
      />
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
    e.preventDefault(); e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const { x: px, y: py } = getPointer01(e, rect);
    dragRef.current = {
      mode, rect, startBox: { ...box },
      startEdges: { left: box.x - box.w/2, right: box.x + box.w/2, top: box.y - box.h/2, bottom: box.y + box.h/2 },
      moveOffset: { dx: box.x - px, dy: box.y - py },
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  };

  const move = (e) => {
    const s = dragRef.current;
    if (!s) return;
    const { x: px, y: py } = getPointer01(e, s.rect);
    const minW = 0.12, minH = 0.12;

    if (s.mode === "move") {
      const halfW = s.startBox.w / 2, halfH = s.startBox.h / 2;
      onChange({ x: clamp(px + s.moveOffset.dx, halfW, 1 - halfW), y: clamp(py + s.moveOffset.dy, halfH, 1 - halfH), w: s.startBox.w, h: s.startBox.h });
      return;
    }

    let { left, right, top, bottom } = s.startEdges;
    if (s.mode.includes("l")) left = clamp(px, 0, right - minW);
    if (s.mode.includes("r")) right = clamp(px, left + minW, 1);
    if (s.mode.includes("t")) top = clamp(py, 0, bottom - minH);
    if (s.mode.includes("b")) bottom = clamp(py, top + minH, 1);

    const w = right - left, h = bottom - top;
    onChange({ x: left + w/2, y: top + h/2, w, h });
  };

  const end = () => { dragRef.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };

  return (
    <div className="absolute border-2 border-white/70 rounded-lg group" style={{ left: pct(box.x - box.w/2), top: pct(box.y - box.h/2), width: pct(box.w), height: pct(box.h), touchAction: "none" }} onPointerDown={(e) => begin("move", e)}>
      {[["lt",0,0],["t",50,0],["rt",100,0],["r",100,50],["rb",100,100],["b",50,100],["lb",0,100],["l",0,50]].map(([key, lx, ty]) => (
        <div key={key} className="absolute w-4 h-4 bg-white rounded-full border border-zinc-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${lx}%`, top: `${ty}%`, transform: "translate(-50%, -50%)", cursor: key==="t"||key==="b" ? "ns-resize" : key==="l"||key==="r" ? "ew-resize" : key==="lt"||key==="rb" ? "nwse-resize" : "nesw-resize" }}
          onPointerDown={(e) => begin(key, e)} />
      ))}
    </div>
  );
}

/* ================= EDITOR PANEL ================= */
function EditorPanel({ design, updateDesign, loading, onAddToCartAll, view }) {
  const [activeTab, setActiveTab] = useState("editor");
  const previewRef = useRef(null);

  const sizes = ["S", "M", "L", "XL"];
  const colorPresets = ["#ffffff","#050505","#ff0000","#00ff00","#0000ff","#ffff00","#800080","#00ffff"];

  // Aktif taraf
  const currentSide =
    view === "back" ? "back" :
    view === "left" ? "left" :
    view === "right" ? "right" :
    "front";

  const sideData = design.sides[currentSide] || createSideData();

  const sideLabel =
    currentSide === "front" ? "ÖN" :
    currentSide === "back" ? "ARKA" :
    currentSide === "left" ? "SOL KOL" :
    "SAG KOL";

  // cm label (kol için de front/back gösteriyorsun — aynı bıraktım)
  const cm = CM_LABELS[design.modelType]?.[currentSide === "back" ? "back" : "front"] || { w: 0, h: 0 };

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

  // fiyat
  const activeSides = getActiveSides(design);
  const totalPrice = getPrice(design);

  // taraf göstergeleri
  const sideIndicators = ["front","back","left","right"].map((s) => {
    const sd = design.sides[s];
    const hasContent = (sd?.logos || []).length > 0 || (sd?.customText?.text || "").trim();
    return {
      key: s,
      label: s === "front" ? "Ön" : s === "back" ? "Arka" : s === "left" ? "Sol" : "Sağ",
      hasContent,
      isActive: s === currentSide
    };
  });

  // logos
  const logos = sideData?.logos || [];
  const activeLogo =
    logos.find(l => l.id === sideData.activeLogoId) ||
    logos[0] ||
    null;

  return (
    <div className="w-full md:w-[420px] bg-[#111111] flex flex-col z-20 shadow-2xl h-[55vh] md:h-full border-t md:border-l border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-[#111111] flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold">BASKI ALANI — {sideLabel}</p>
            <h2 className="text-sm font-mono text-white">{cm.w}×{cm.h} CM</h2>
            <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">
              SEÇİLİ: {MODEL_LABELS[design.modelType] || design.modelType}
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

        {/* Taraf göstergeleri */}
        <div className="flex gap-2 mt-3">
          {sideIndicators.map((si) => (
            <div
              key={si.key}
              className={`flex-1 text-center py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide border transition
              ${si.isActive ? "border-white bg-white/10 text-white" : si.hasContent ? "border-green-600 bg-green-900/20 text-green-400" : "border-zinc-700 text-zinc-600"}`}
            >
              {si.label}
              {si.hasContent && <span className="ml-1 text-green-400">●</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-[#111111] flex-shrink-0">
        {[
          { id: "editor", icon: Move, label: "Yerleşim" },
          { id: "upload", icon: ImageIcon, label: "Görsel" },
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
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#111111]">
        {/* ====== EDITOR ====== */}
        {activeTab === "editor" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400">BASKI ALANI ÖNİZLEME — {sideLabel}</h3>

            <div ref={previewRef} className="w-full aspect-square bg-zinc-900 rounded-xl border border-zinc-700 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "10px 10px" }}
              />

              {/* ✅ TÜM LOGOLAR */}
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

              {/* ✅ SADECE SEÇİLİ LOGO RESIZE */}
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

              {/* TEXT */}
              {sideData?.customText?.text && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-black/30 border border-white/20"
                  style={{ left: pct(sideData.textPos.x), top: pct(sideData.textPos.y) }}
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

            <p className="text-[10px] text-zinc-500">
              Logo: tıkla=seç, sürükle=taşı, köşeler=boyutlandır. Şu an düzenlediğiniz taraf:{" "}
              <span className="text-white font-bold">{sideLabel}</span>
            </p>
          </div>
        )}

        {/* ====== UPLOAD ====== */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase">
              Şu an düzenlenen taraf: <span className="text-white">{sideLabel}</span>
            </p>

            <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-white hover:bg-zinc-900 transition">
              <Upload className="w-8 h-8 mb-2 text-zinc-500" />
              <p className="text-xs text-zinc-400 font-bold uppercase">Görsel Ekle (Çoklu)</p>

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

                    const prevSide = design.sides[currentSide] || createSideData();
                    const nextLogos = [...(prevSide.logos || []), nextLogo];

                    updateSide({ logos: nextLogos, activeLogoId: id });
                    setActiveTab("editor");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            {/* Seçili görseli kaldır */}
            {(sideData?.logos || []).length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const currentId = sideData.activeLogoId || sideData.logos?.[0]?.id;
                    const next = (sideData.logos || []).filter((l) => l.id !== currentId);
                    updateSide({ logos: next, activeLogoId: next[0]?.id || null });
                  }}
                  className="w-full py-2 bg-red-900/30 text-red-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/50"
                >
                  <Trash2 size={14} /> Seçili Görseli Kaldır
                </button>

                <button
                  onClick={() => updateSide({ logos: [], activeLogoId: null })}
                  className="w-full py-2 bg-red-900/20 text-red-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-900/40"
                >
                  <Trash2 size={14} /> Bu Taraftaki TÜM Görselleri Kaldır
                </button>
              </div>
            )}

            {/* Diğer taraflar info */}
            <div className="border-t border-zinc-800 pt-3 mt-2">
              <p className="text-[9px] text-zinc-500 font-bold uppercase mb-2">Diğer Taraflar</p>
              <div className="grid grid-cols-2 gap-2">
                {["front", "back", "left", "right"]
                  .filter((s) => s !== currentSide)
                  .map((s) => {
                    const sd = design.sides[s];
                    const hasImg = (sd?.logos || []).length > 0;
                    const label = s === "front" ? "Ön" : s === "back" ? "Arka" : s === "left" ? "Sol" : "Sağ";
                    return (
                      <div
                        key={s}
                        className={`p-2 rounded-lg border text-[9px] font-bold ${
                          hasImg ? "border-green-700 bg-green-900/10 text-green-400" : "border-zinc-800 text-zinc-600"
                        }`}
                      >
                        {label}: {hasImg ? `✓ ${(sd.logos || []).length} görsel` : "Boş"}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ====== TEXT ====== */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-400 font-bold uppercase">
              Şu an düzenlenen taraf: <span className="text-white">{sideLabel}</span>
            </p>

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

        {/* ====== COLOR ====== */}
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
          </div>
        )}
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


/* ================= ANA SAYFA ================= */
export default function TasarimClient() {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.style.backgroundColor = "#0b0b0b";
    document.body.style.backgroundColor = "#0b0b0b";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  const safeInitial = useMemo(() => {
    const initialModel = (searchParams.get("model") || searchParams.get("product") || "tshirt").toLowerCase();
    return AVAILABLE_MODELS.includes(initialModel) ? initialModel : "tshirt";
  }, [searchParams]);

  const [view, setView] = useState("front");
  const [designs, setDesigns] = useState(() => [createDesign("tshirt")]);
  const [activeId, setActiveId] = useState(() => designs[0]?.id);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const glRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const [captureView, setCaptureView] = useState(null); // capture için view override
  const [captureId, setCaptureId] = useState(null);

  const activeDesign = useMemo(() => designs.find((d) => d.id === activeId) || designs[0], [designs, activeId]);

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

  useEffect(() => { if (!activeId && designs[0]) setActiveId(designs[0].id); }, [activeId, designs]);

  const updateActive = (patch) => {
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
    return { hidden: false, x: -2.2 - idx * 0.85, z: -0.35, rotY: 0.85, scale: 0.92 };
  };

  // FIX 5: Her taraf için ayrı print dosyası üret
  const makePrintDataUrl = async (sideData) => {
  return new Promise((resolve) => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;

    const ctx = c.getContext("2d");
    if (!ctx) return resolve(null);

    const logos = sideData?.logos || [];
    const hasText = ((sideData?.customText?.text || "").trim().length > 0);
    const hasContent = logos.length > 0 || hasText;
    if (!hasContent) return resolve(null);

    const drawText = () => {
      const t = sideData?.customText || {};
      if (t.text) {
        const fontSize = clamp(parseInt(t.size || 150, 10), 30, 420);

        ctx.save();
        ctx.translate((sideData.textPos?.x || 0.5) * 1024, (sideData.textPos?.y || 0.85) * 1024);
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

    // ✅ logo yoksa sadece text
    if (!logos.length) {
      drawText();
      return;
    }

    // ✅ sırayla logoları çiz, sonra text
    let i = 0;
    const drawNext = () => {
      if (i >= logos.length) {
        drawText();
        return;
      }

      const l = logos[i++];
      const img = new Image();
      img.src = l.url;

      img.onload = () => {
        const b = l.box || { x: 0.5, y: 0.6, w: 0.7, h: 0.45 };
        ctx.drawImage(
          img,
          b.x * 1024 - (b.w * 1024) / 2,
          b.y * 1024 - (b.h * 1024) / 2,
          b.w * 1024,
          b.h * 1024
        );
        drawNext();
      };

      img.onerror = () => drawNext();
    };

    drawNext();
  });
};


  // FIX 4 + 5: Mockup capture - her taraf için ayrı render
  const captureMockupForSide = async (designId, sideView) => {
    if (!glRef.current || !sceneRef.current || !cameraRef.current) return null;

    setCaptureId(designId);
    setCaptureView(sideView);

    // 2 frame bekle (React render tamamsın)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));

    const gl = glRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL("image/png");

    return dataUrl;
  };

  // FIX 4: Düzeltilmiş sepete ekle
  const handleAddToCartAll = async () => {
    // En az bir tarafta içerik olmalı
    const hasAnyContent = designs.some((d) => {
  return Object.values(d.sides).some((sd) => hasSideContent(sd));
});


    if (!hasAnyContent) {
      alert("Lütfen en az bir üründe (herhangi bir tarafta) logo veya yazı ekleyin.");
      return;
    }

    setLoading(true);
    try {
      for (const d of designs) {
        const activeSides = getActiveSides(d);
        if (activeSides.length === 0) continue;

        // Her aktif taraf için print dosyası üret
        const printFiles = {};
        for (const [sideKey, sideData] of activeSides) {
          printFiles[sideKey] = await makePrintDataUrl(sideData);
        }

        // Her taraf için mockup capture
        const mockupFiles = {};
        for (const [sideKey] of activeSides) {
          mockupFiles[sideKey] = await captureMockupForSide(d.id, sideKey);
        }

        // Capture temizlik
        setCaptureId(null);
        setCaptureView(null);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        // Ana mockup (ön tarafın görüntüsünü preview olarak kullanalım)
        const previewMockup = mockupFiles.front || mockupFiles[activeSides[0][0]] || null;

        // UID: string olsun (CartContext'te object key olabilir)
        const cartItemId = `cart_${d.id}_${Date.now()}`;

        addToCart({
          id: cartItemId,
          name: `Özel Tasarım — ${(MODEL_LABELS[d.modelType] || d.modelType).toUpperCase()}`,
          price: getPrice(d),
          size: d.size,
          image: previewMockup, // preview görseli
          color: d.color,
          designDetails: {
            model: d.modelType,
            baseColor: d.color,
            // Her taraf için ayrı print + mockup dosyaları
            printFiles,    // { front: "data:...", back: "data:...", ... }
            mockupFiles,   // { front: "data:...", back: "data:...", ... }
            sides: d.sides, // tam side data (backup)
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

  // Aktif view: capture modunda override
  const effectiveView = captureView || view;

  return (
    <div className="h-screen w-full bg-[#0b0b0b] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      <Link href="/" className="absolute top-2 left-2 z-50 ...">
  <span className="text-xs">←</span> Geri
</Link>

      <div className="w-full h-[45vh] md:h-full md:flex-1 relative bg-[#0b0b0b]">
        {/* View switcher */}
        <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-full border border-zinc-700 shadow-xl">
          {["front","back","left","right"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${view === v ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>
              {v === "front" ? "Ön" : v === "back" ? "Arka" : v === "left" ? "Sol" : "Sağ"}
            </button>
          ))}
        </div>

        {/* Model controls */}
        <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          <button onClick={() => setPickerOpen(true)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-black shadow-xl hover:bg-zinc-200 transition" title="Model Ekle">
            <Plus size={18} />
          </button>
          <div className="flex items-center gap-2 bg-zinc-900/70 border border-zinc-700 rounded-full px-3 py-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">MODELLER: {designs.length}</span>
            <span className="text-[10px] text-white font-bold uppercase tracking-widest">SEÇİLİ: {MODEL_LABELS[activeDesign?.modelType] || activeDesign?.modelType}</span>
            {designs.length > 1 && (
              <button onClick={() => removeModel(activeId)} className="ml-1 w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center" title="Seçili modeli kaldır">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Model picker modal */}
        {pickerOpen && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black tracking-widest uppercase">Model Seç</h3>
                <button onClick={() => setPickerOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_MODELS.map((m) => (
                  <button key={m} onClick={() => addModel(m)} className="py-3 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-wide text-center">
                    {MODEL_LABELS[m] || m}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 mt-3">Tıkladığın model öne gelir, diğerleri solda yan durur.</p>
            </div>
          </div>
        )}

        {/* THREE.js Canvas */}
        <Canvas
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", backgroundColor: "#0b0b0b" }}
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false, powerPreference: "high-performance" }}
          onCreated={({ gl, scene, camera }) => {
            glRef.current = gl;
            sceneRef.current = scene;
            cameraRef.current = camera;
            const bgColor = new THREE.Color("#0b0b0b");
            scene.background = bgColor;
            gl.setClearColor(bgColor, 1);
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
          // FIX 1: Yakın başlangıç pozisyonu + dar FOV
          camera={{ position: [0, 0, 3.2], fov: 42 }}
          shadows
          dpr={[1, 2]}
        >
          <SceneBackgroundLock />
          <ambientLight intensity={1.2} />
          <directionalLight position={[6, 10, 8]} intensity={0.8} castShadow />
          <directionalLight position={[-6, 6, -6]} intensity={0.35} />
          <pointLight position={[0, 3, 3]} intensity={0.35} />
          <ContactShadows position={[0, -1.4, 0]} opacity={0.2} scale={8} blur={3} far={4} />

          <CameraController view={effectiveView} count={designs.length} />

          <Suspense fallback={null}>
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
                />
              );
            })}
          </Suspense>

          <OrbitControls
            makeDefault
            enableZoom
            enablePan={false}
            enableRotate={false}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.9}
            minDistance={1.5}
            maxDistance={10}
            zoomToCursor={true}
          />
        </Canvas>
      </div>

      {activeDesign && (
        <EditorPanel
          design={activeDesign}
          updateDesign={updateActive}
          loading={loading}
          onAddToCartAll={handleAddToCartAll}
          view={view}
        />
      )}
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