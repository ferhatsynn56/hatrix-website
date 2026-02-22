"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Decal, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { getCheckoutData } from "@/lib/checkoutStore";

const SIZE_OPTIONS = ["S", "M", "L", "XL"];
const toSafeUrl = (p) => (typeof window !== "undefined" ? encodeURI(p) : p);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const NEW_MODELS_ROOT = "/models/newModels";
const NEW_MODELS_DIR_REMASTERED = `${NEW_MODELS_ROOT}/modelRemastered`;
const DEFAULT_MODEL_TYPE = "yeni-duz-tshirt";
const MODEL_PATHS = {
  "yeni-duz-tshirt": `${NEW_MODELS_DIR_REMASTERED}/T-shirtTHEND.glb`,
  "yeni-oversize-tshirt": `${NEW_MODELS_DIR_REMASTERED}/T-shirtTHEND.glb`,
  "yeni-duz-sweat": `${NEW_MODELS_DIR_REMASTERED}/SweatTHEND.glb`,
  "yeni-oversize-sweat": `${NEW_MODELS_DIR_REMASTERED}/SweatOwersizeTHEND.glb`,
  "yeni-fermuarli": `${NEW_MODELS_DIR_REMASTERED}/FermuarliSweat.glb`,
  "polarv3": `${NEW_MODELS_DIR_REMASTERED}/PolarV5.glb`,
  "hoodie-v12-canavari": `${NEW_MODELS_DIR_REMASTERED}/Classic_HoodieTHENDv1.glb`,
  "oversize-hoodie-parcali": `${NEW_MODELS_DIR_REMASTERED}/Hoodie_Owersize_THEND.glb`,
};
const MODEL_TYPE_ALIASES = {
  tshirt: "yeni-duz-tshirt",
  "normal-tshirt": "yeni-duz-tshirt",
  "normal-tisort": "yeni-duz-tshirt",
  "duz-tshirt": "yeni-duz-tshirt",
  sweatshirt: "yeni-duz-sweat",
  "oversize-tshirt": "yeni-oversize-tshirt",
  "oversize-sweat": "yeni-oversize-sweat",
  hoodie: "hoodie-v12-canavari",
  "hoodie-v12-canavari": "hoodie-v12-canavari",
  "oversize-hoodie-parcali": "oversize-hoodie-parcali",
  fermuarli: "yeni-fermuarli",
  "yeni-fermuarli": "yeni-fermuarli",
  polarv3: "polarv3",
  polarv5: "polarv3",
  polar: "polarv3",
  "polar-son": "polarv3",
};

const normalizeFabricType = (fabricType, modelType) => {
  const safeModel = normalizeModelType(modelType);
  const raw = String(fabricType || "").trim().toLowerCase();
  const defaultType = safeModel.includes("tshirt") ? "supreme-24x1" : "iplik-3-sardonsuz";
  if (raw === "standart") return defaultType;
  if (raw === "pamuk") return "supreme-30x1";
  if (raw === "soft") return "iplik-3-sardonlu";
  if (raw === "supreme-24x1" || raw === "supreme-30x1" || raw === "iplik-3-sardonsuz" || raw === "iplik-3-sardonlu") {
    return raw;
  }
  return defaultType;
};

const normalizeModelType = (type) => {
  const raw = String(type || "")
    .toLowerCase()
    .trim();
  if (!raw) return DEFAULT_MODEL_TYPE;
  const slug = raw.replace(/\s+/g, "-").replace(/_/g, "-");
  const resolved = MODEL_TYPE_ALIASES[raw] || MODEL_TYPE_ALIASES[slug] || raw;
  return MODEL_PATHS[resolved] ? resolved : DEFAULT_MODEL_TYPE;
};

const DEFAULT_HOODIE_PARTS = Object.freeze({
  strings: false,
  pocket: false,
});
const MODELS_WITH_HOODIE_PARTS = new Set(["hoodie-v12-canavari", "oversize-hoodie-parcali"]);
const DEFAULT_PRINT_PROFILE = Object.freeze({
  front: { xMin: -0.16, xMax: 0.16, yTop: 0.265, yBot: -0.31, z: 0.147, rotY: 0 },
  back: { xMin: -0.16, xMax: 0.16, yTop: 0.31, yBot: -0.32, z: -0.148, rotY: Math.PI },
});
const MODEL_PRINT_PROFILE_CACHE = new Map();

const HOODIE_POCKET_FRONT_YBOT = Object.freeze({
  "hoodie-v12-canavari": -0.145,
  "oversize-hoodie-parcali": -0.15,
});

const normalizeHoodieParts = (parts) => ({
  ...DEFAULT_HOODIE_PARTS,
  ...(parts && typeof parts === "object" ? parts : {}),
});

const resolvePrintSideFromMaterialName = (name = "") => {
  const key = String(name || "").toLowerCase().trim();
  if (!key) return null;
  if ((/(^|[._\s-])(sol[_\s-]?kol|left[_\s-]?sleeve|sleeve[_\s-]?left)($|[._\s-])/i).test(key)) return "front";
  if ((/(^|[._\s-])(sag[_\s-]?kol|sağ[_\s-]?kol|right[_\s-]?sleeve|sleeve[_\s-]?right)($|[._\s-])/i).test(key)) return "front";
  if ((/(^|[._\s-])(kol|sleeve)($|[._\s-])/i).test(key)) return "front";
  if ((/(^|[._\s-])(on|ön|front|fore)($|[._\s-])/i).test(key)) return "front";
  if (key.includes("arka") || key.includes("back")) return "back";
  return null;
};

const normalizePrintProfile = (profile, side = "front") => {
  const fallback = DEFAULT_PRINT_PROFILE[side] || DEFAULT_PRINT_PROFILE.front;
  const raw = profile && typeof profile === "object" ? profile : {};
  let xMin = Number.isFinite(Number(raw.xMin)) ? Number(raw.xMin) : fallback.xMin;
  let xMax = Number.isFinite(Number(raw.xMax)) ? Number(raw.xMax) : fallback.xMax;
  let yTop = Number.isFinite(Number(raw.yTop)) ? Number(raw.yTop) : fallback.yTop;
  let yBot = Number.isFinite(Number(raw.yBot)) ? Number(raw.yBot) : fallback.yBot;
  if (!(xMax > xMin) || xMax - xMin < 0.04) {
    xMin = fallback.xMin;
    xMax = fallback.xMax;
  }
  if (!(yTop > yBot) || yTop - yBot < 0.04) {
    yTop = fallback.yTop;
    yBot = fallback.yBot;
  }
  const z = Number.isFinite(Number(raw.z)) ? Number(raw.z) : fallback.z;
  const rotY = Number.isFinite(Number(raw.rotY)) ? Number(raw.rotY) : side === "front" ? 0 : Math.PI;
  return { xMin, xMax, yTop, yBot, z, rotY };
};

const registerMaterialPrintProfiles = (modelType, profiles) => {
  const normalized = normalizeModelType(modelType);
  if (!profiles || typeof profiles !== "object") return;
  MODEL_PRINT_PROFILE_CACHE.set(normalized, {
    front: normalizePrintProfile(profiles.front, "front"),
    back: normalizePrintProfile(profiles.back, "back"),
  });
};

const extractPrintProfilesFromMaterials = (hostMesh) => {
  if (!(hostMesh && (hostMesh.isMesh || hostMesh.isSkinnedMesh) && hostMesh.geometry?.attributes?.position)) {
    return null;
  }
  hostMesh.updateWorldMatrix(true, false);
  const tmp = new THREE.Vector3();
  const sideBounds = {
    front: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity, count: 0 },
    back: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity, count: 0 },
  };
  const updateBounds = (side, p) => {
    const b = sideBounds[side];
    b.minX = Math.min(b.minX, p.x);
    b.maxX = Math.max(b.maxX, p.x);
    b.minY = Math.min(b.minY, p.y);
    b.maxY = Math.max(b.maxY, p.y);
    b.minZ = Math.min(b.minZ, p.z);
    b.maxZ = Math.max(b.maxZ, p.z);
    b.count += 1;
  };

  const geometry = hostMesh.geometry;
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const index = geometry.index;
  const groups = geometry.groups?.length
    ? geometry.groups
    : [{ start: 0, count: index ? index.count : position.count, materialIndex: 0 }];
  const materials = Array.isArray(hostMesh.material) ? hostMesh.material : [hostMesh.material];

  groups.forEach((group) => {
    const mat = materials[group.materialIndex] || materials[0];
    const side = resolvePrintSideFromMaterialName(mat?.name || "");
    if (!side) return;
    const start = Math.max(0, Number(group.start) || 0);
    const count = Math.max(0, Number(group.count) || 0);
    const end = start + count;
    for (let i = start; i < end; i += 1) {
      const vi = index ? (index.array ? index.array[i] : index.getX(i)) : i;
      if (!Number.isFinite(vi) || vi < 0 || vi >= position.count) continue;
      if (normal && vi < normal.count) {
        const nz = Number(normal.getZ(vi));
        if (side === "front" && Number.isFinite(nz) && nz < 0.05) continue;
        if (side === "back" && Number.isFinite(nz) && nz > -0.05) continue;
      }
      tmp.fromBufferAttribute(position, vi);
      updateBounds(side, tmp);
    }
  });

  const toProfile = (side) => {
    const b = sideBounds[side];
    if (!b || b.count < 3) return null;
    const rawW = b.maxX - b.minX;
    const rawH = b.maxY - b.minY;
    if (!(rawW > 0.02) || !(rawH > 0.02)) return null;
    const padX = Math.min(rawW * 0.04, 0.018);
    const padY = Math.min(rawH * 0.045, 0.02);
    return normalizePrintProfile({
      xMin: b.minX + padX,
      xMax: b.maxX - padX,
      yTop: b.maxY - padY,
      yBot: b.minY + padY,
      z: side === "front" ? b.maxZ + 0.0008 : b.minZ - 0.0008,
      rotY: side === "front" ? 0 : Math.PI,
    }, side);
  };

  const result = { front: toProfile("front"), back: toProfile("back") };
  if (!result.front && !result.back) return null;
  return result;
};

const getPrintProfile = (modelType, side = "front", hoodieParts = DEFAULT_HOODIE_PARTS) => {
  const normalized = normalizeModelType(modelType);
  const cached = MODEL_PRINT_PROFILE_CACHE.get(normalized);
  const base = normalizePrintProfile(cached?.[side], side);
  if (side !== "front") return base;
  if (!hoodieParts?.pocket) return base;
  const pocketYBot = HOODIE_POCKET_FRONT_YBOT[normalized];
  if (!Number.isFinite(pocketYBot)) return base;
  return { ...base, yBot: Math.max(base.yBot, pocketYBot) };
};

function pickDecalHostMesh(root) {
  const printableCandidates = [];
  const candidates = [];
  root.traverse((o) => {
    if (!(o && (o.isMesh || o.isSkinnedMesh) && o.geometry?.attributes?.position)) return;
    o.geometry.computeBoundingBox?.();
    const bb = o.geometry.boundingBox;
    if (!bb) return;
    const size = new THREE.Vector3();
    bb.getSize(size);
    const volume = size.x * size.y * size.z;
    if (!Number.isFinite(volume) || volume <= 0) return;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    const hasPrintableMaterial = materials.some((mat) =>
      Boolean(resolvePrintSideFromMaterialName(mat?.name || ""))
    );
    if (hasPrintableMaterial) {
      printableCandidates.push({ o, score: volume * 4 + size.y * size.x });
      return;
    }
    if (size.y > 0.35 && size.x > 0.15) candidates.push({ o, score: volume });
  });
  printableCandidates.sort((a, b) => b.score - a.score);
  if (printableCandidates[0]?.o) return printableCandidates[0].o;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.o || null;
}

function RotatingModelPreviewMesh({
  modelType,
  color = "#d6dbe2",
  stringColor = "#e6e6e6",
  fabricType = "supreme-24x1",
  frontPrintUrl = "",
  backPrintUrl = "",
  hoodieV12Parts = DEFAULT_HOODIE_PARTS,
}) {
  const meshRef = useRef(null);
  const resolvedType = normalizeModelType(modelType);
  const modelPathRaw = MODEL_PATHS[resolvedType] || MODEL_PATHS[DEFAULT_MODEL_TYPE];
  const gltf = useGLTF(toSafeUrl(modelPathRaw));
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

  const [frontTex, setFrontTex] = useState(null);
  const [backTex, setBackTex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!frontPrintUrl) {
      setFrontTex((prev) => {
        if (prev) prev.dispose();
        return null;
      });
      return undefined;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      frontPrintUrl,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);
        texture.needsUpdate = true;
        setFrontTex((prev) => {
          if (prev) prev.dispose();
          return texture;
        });
      },
      undefined,
      () => {
        setFrontTex((prev) => {
          if (prev) prev.dispose();
          return null;
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [frontPrintUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!backPrintUrl) {
      setBackTex((prev) => {
        if (prev) prev.dispose();
        return null;
      });
      return undefined;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      backPrintUrl,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);
        texture.needsUpdate = true;
        setBackTex((prev) => {
          if (prev) prev.dispose();
          return texture;
        });
      },
      undefined,
      () => {
        setBackTex((prev) => {
          if (prev) prev.dispose();
          return null;
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [backPrintUrl]);

  useEffect(
    () => () => {
      if (frontTex) frontTex.dispose();
      if (backTex) backTex.dispose();
    },
    [frontTex, backTex]
  );

  const decalHost = useMemo(() => pickDecalHostMesh(root), [root]);
  const materialProfiles = useMemo(() => extractPrintProfilesFromMaterials(decalHost), [decalHost]);
  const decalHostRef = useMemo(() => ({ current: decalHost }), [decalHost]);
  const parts = normalizeHoodieParts(hoodieV12Parts);
  const frontProfile = useMemo(() => {
    const base = materialProfiles?.front
      ? normalizePrintProfile(materialProfiles.front, "front")
      : getPrintProfile(resolvedType, "front", parts);
    if (!parts?.pocket || !MODELS_WITH_HOODIE_PARTS.has(resolvedType)) return base;
    const pocketYBot = HOODIE_POCKET_FRONT_YBOT[resolvedType];
    if (!Number.isFinite(pocketYBot)) return base;
    return { ...base, yBot: Math.max(base.yBot, pocketYBot) };
  }, [materialProfiles?.front, resolvedType, parts]);
  const backProfile = useMemo(
    () =>
      materialProfiles?.back
        ? normalizePrintProfile(materialProfiles.back, "back")
        : getPrintProfile(resolvedType, "back", parts),
    [materialProfiles?.back, resolvedType, parts]
  );

  useEffect(() => {
    if (!materialProfiles) return;
    registerMaterialPrintProfiles(resolvedType, materialProfiles);
  }, [resolvedType, materialProfiles]);
  const frontW = frontProfile.xMax - frontProfile.xMin;
  const frontH = frontProfile.yTop - frontProfile.yBot;
  const frontCY = (frontProfile.yTop + frontProfile.yBot) / 2;
  const backW = backProfile.xMax - backProfile.xMin;
  const backH = backProfile.yTop - backProfile.yBot;
  const backCY = (backProfile.yTop + backProfile.yBot) / 2;
  const DTF_DECAL_DEPTH = 0.2;
  const DTF_SURFACE_OFFSET = 0.008;
  const frontDecalRotY = Number(frontProfile?.rotY || 0);
  const backDecalRotY = Number(backProfile?.rotY || Math.PI);
  const frontDecalNormal = useMemo(
    () => new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, frontDecalRotY, 0)).normalize(),
    [frontDecalRotY]
  );
  const backDecalNormal = useMemo(
    () => new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, backDecalRotY, 0)).normalize(),
    [backDecalRotY]
  );
  const frontDecalPosition = useMemo(
    () => [
      frontDecalNormal.x * DTF_SURFACE_OFFSET,
      frontCY + frontDecalNormal.y * DTF_SURFACE_OFFSET,
      frontProfile.z + 0.001 + frontDecalNormal.z * DTF_SURFACE_OFFSET,
    ],
    [frontCY, frontProfile.z, frontDecalNormal]
  );
  const backDecalPosition = useMemo(
    () => [
      backDecalNormal.x * DTF_SURFACE_OFFSET,
      backCY + backDecalNormal.y * DTF_SURFACE_OFFSET,
      backProfile.z - 0.001 + backDecalNormal.z * DTF_SURFACE_OFFSET,
    ],
    [backCY, backProfile.z, backDecalNormal]
  );
  const bodyMaterial = useMemo(() => {
    const base = new THREE.Color(color || "#d6dbe2");
    const lum = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
    const whiteTaming = clamp((lum - 0.84) / 0.16, 0, 1);
    if (whiteTaming > 0) {
      base.multiplyScalar(1 - whiteTaming * 0.14);
    }
    const darkBoost = clamp((0.42 - lum) / 0.42, 0, 1);
    const lightBoost = clamp((lum - 0.72) / 0.28, 0, 1);
    const resolvedFabric = normalizeFabricType(fabricType, resolvedType);
    const fabricMap = {
      "supreme-24x1": { rough: 0.01, metal: -0.001, env: 0.01 },
      "supreme-30x1": { rough: 0.03, metal: -0.002, env: -0.01 },
      "iplik-3-sardonsuz": { rough: 0.02, metal: -0.001, env: -0.005 },
      "iplik-3-sardonlu": { rough: 0.045, metal: -0.002, env: -0.025 },
    };
    const fx = fabricMap[resolvedFabric] || fabricMap["supreme-24x1"];
    return new THREE.MeshStandardMaterial({
      color: base,
      roughness: clamp(0.955 + 0.02 * lightBoost + 0.01 * darkBoost + fx.rough, 0.93, 0.998),
      metalness: clamp(0.004 + 0.006 * darkBoost + fx.metal, 0.001, 0.012),
      envMapIntensity: clamp(0.62 + 0.08 * darkBoost - 0.22 * lightBoost + fx.env, 0.35, 0.78),
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

  useEffect(
    () => () => {
      bodyMaterial.dispose();
      laceMaterial.dispose();
    },
    [bodyMaterial, laceMaterial]
  );

  useEffect(() => {
    const isHoodieWithParts = MODELS_WITH_HOODIE_PARTS.has(resolvedType);
    const showStrings = !!parts.strings;
    const showPocket = !!parts.pocket;

    const looksLikeLace = (o) => {
      const n = String(o?.name || "").toLowerCase();
      const mn = String(o?.material?.name || "").toLowerCase();
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

    root.traverse((obj) => {
      if (!(obj?.isMesh || obj?.isSkinnedMesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const meshName = String(obj?.name || "").toLowerCase();

      if (isHoodieWithParts) {
        if (meshName.includes("hoodie_ipler") || meshName.includes("_ip") || meshName.includes("ipler")) {
          obj.visible = showStrings;
          obj.material = laceMaterial;
          return;
        }
        if (meshName.includes("hoodie_cep") || meshName.includes("_cep") || meshName.includes("cep")) {
          obj.visible = showPocket;
          obj.material = bodyMaterial;
          return;
        }
        obj.visible = true;
        obj.material = bodyMaterial;
        return;
      }

      obj.visible = true;
      obj.material = looksLikeLace(obj) ? laceMaterial : bodyMaterial;
    });
  }, [root, resolvedType, parts.strings, parts.pocket, bodyMaterial, laceMaterial]);
  useFrame((state, delta) => {
    if (!meshRef?.current) return;
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={meshRef} position={[0, -0.08, 0]}>
      <Center>
        <primitive object={root} />
        {decalHost && frontTex && (
          <Decal
            mesh={decalHostRef}
            position={frontDecalPosition}
            rotation={[0, frontDecalRotY, 0]}
            scale={[frontW * 0.985, frontH * 0.985, DTF_DECAL_DEPTH]}
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
        {decalHost && backTex && (
          <Decal
            mesh={decalHostRef}
            position={backDecalPosition}
            rotation={[0, backDecalRotY, 0]}
            scale={[backW * 0.985, backH * 0.985, DTF_DECAL_DEPTH]}
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
      </Center>
    </group>
  );
}

function OrderTurntablePreview({
  modelType,
  color,
  stringColor,
  fabricType,
  label,
  frontPrintUrl,
  backPrintUrl,
  hoodieV12Parts,
}) {
  return (
    <div className="aspect-[4/5] rounded-xl bg-[#eef1f4] overflow-hidden border border-zinc-200">
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [0, 0.28, 2.12], fov: 30 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.96;
        }}
      >
        <color attach="background" args={["#eef1f4"]} />
        <ambientLight intensity={0.64} />
        <hemisphereLight intensity={0.2} groundColor="#252525" />
        <directionalLight position={[4, 7, 5]} intensity={0.56} />
        <directionalLight position={[-4, 5, -4]} intensity={0.18} />
        <Suspense fallback={null}>
          <RotatingModelPreviewMesh
            modelType={modelType}
            color={color}
            stringColor={stringColor}
            fabricType={fabricType}
            frontPrintUrl={frontPrintUrl}
            backPrintUrl={backPrintUrl}
            hoodieV12Parts={hoodieV12Parts}
          />
        </Suspense>
      </Canvas>
      <p className="sr-only">{label}</p>
    </div>
  );
}

export default function SiparisPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const resumeHref = useMemo(() => {
    const modelType = data?.designs?.[0]?.modelType;
    return modelType ? `/tasarim?resume=1&model=${encodeURIComponent(modelType)}` : "/tasarim?resume=1";
  }, [data]);

  useEffect(() => {
    const payload = getCheckoutData();
    setData(payload);
    const initialSize = payload?.designs?.[0]?.size;
    if (initialSize) setSelectedSize(initialSize);
  }, []);

  const totalPrice = useMemo(() => {
    if (!data?.designs?.length) return 0;
    return (
      data.totalPrice ??
      data.designs.reduce(
        (sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
        0
      )
    );
  }, [data]);

  if (!data?.designs?.length) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Sipariş</p>
          <h1 className="mt-3 text-lg font-black">Sipariş özeti bulunamadı</h1>
          <p className="mt-2 text-sm text-zinc-500">Tasarım sayfasına dönüp işlemi tamamlayabilirsin.</p>
          <Link
            href="/tasarim"
            className="inline-flex mt-5 px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
          >
            Tasarıma Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
      <header className="px-6 py-5 border-b border-zinc-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={resumeHref}
              className="px-3 py-2 rounded-full border border-zinc-300 bg-white text-xs font-black uppercase tracking-widest"
            >
              Geri
            </Link>
            <div>
              <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.18em]">Sipariş</p>
              <p className="text-sm font-black">Tasarım Özeti</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/odeme")}
            className="px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
          >
            Ödemeye Geç
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            {data.designs.map((item) => {
              const details = item?.designDetails || {};
              const printFiles = details?.printFiles || {};
              const resolvedBaseColor = details?.baseColor || item?.color || "#d6dbe2";
              const resolvedStringColor = details?.stringColor || "#e6e6e6";
              const resolvedFabric = normalizeFabricType(details?.fabricType || item?.fabricType, item.modelType);
              return (
              <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <OrderTurntablePreview
                  modelType={item.modelType}
                  color={resolvedBaseColor}
                  stringColor={resolvedStringColor}
                  fabricType={resolvedFabric}
                  label={`${item.name} 3D onizleme`}
                  frontPrintUrl={printFiles?.front || ""}
                  backPrintUrl={printFiles?.back || ""}
                  hoodieV12Parts={details?.hoodieV12Parts || DEFAULT_HOODIE_PARTS}
                />
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Dönen 3D Önizleme</p>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide">{item.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="inline-flex w-3.5 h-3.5 rounded-full border border-zinc-300" style={{ backgroundColor: item.color }} />
                      <span>{item.color}</span>
                      <span>Adet: {Math.max(1, Number(item.quantity || 1))}</span>
                    </div>
                  </div>
                  <div className="text-sm font-black">
                    {Number(item.price || 0) * Math.max(1, Number(item.quantity || 1))} ₺
                  </div>
                </div>
              </div>
              );
            })}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Beden</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 font-bold uppercase">Toplam</span>
                  <span className="font-black">{totalPrice} ₺</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/odeme")}
                className="mt-4 w-full py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
              >
                Ödemeye Geç
              </button>
            </div>
            {String(data?.orderNote || "").trim() && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Sipariş Notu</p>
                <p className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap break-words">
                  {String(data?.orderNote || "").trim()}
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
