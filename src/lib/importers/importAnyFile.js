"use client";

const MAX_IMPORT_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const canvasToPngBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gorsel olusturulamadi."));
    }, "image/png");
  });

const getExtension = (name = "") => {
  const m = String(name || "").toLowerCase().trim().match(/\.([a-z0-9]+)$/i);
  return m?.[1] || "";
};

const stripExtension = (name = "") => String(name || "").replace(/\.[^.]+$/, "");

const normalizeImageName = (name = "", fallback = "imported-image.png") => {
  const safe = String(name || "").trim();
  if (!safe) return fallback;
  if (/\.(png|jpg|jpeg|webp)$/i.test(safe)) return safe;
  return `${stripExtension(safe) || "imported-image"}.png`;
};

const dataUrlToBlob = (dataUrl) => {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(?:;base64)?,(.*)$/i);
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  const raw = atob(match[2] || "");
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const parseSvgDimensions = (svgText) => {
  let width = 1024;
  let height = 1024;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(svgText || ""), "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return { width, height };
    const widthAttr = parseFloat(String(svgEl.getAttribute("width") || "").replace(/[^\d.]/g, ""));
    const heightAttr = parseFloat(String(svgEl.getAttribute("height") || "").replace(/[^\d.]/g, ""));
    const viewBoxAttr = String(svgEl.getAttribute("viewBox") || "").trim();
    const viewBoxParts = viewBoxAttr.split(/\s+/).map((v) => Number(v));
    if (Number.isFinite(widthAttr) && widthAttr > 0) width = widthAttr;
    if (Number.isFinite(heightAttr) && heightAttr > 0) height = heightAttr;
    if (
      (!Number.isFinite(widthAttr) || widthAttr <= 0 || !Number.isFinite(heightAttr) || heightAttr <= 0) &&
      viewBoxParts.length === 4 &&
      Number.isFinite(viewBoxParts[2]) &&
      Number.isFinite(viewBoxParts[3]) &&
      viewBoxParts[2] > 0 &&
      viewBoxParts[3] > 0
    ) {
      width = viewBoxParts[2];
      height = viewBoxParts[3];
    }
  } catch {
    // fallback dimensions above
  }
  return {
    width: clamp(Math.round(Number(width) || 1024), 64, 4096),
    height: clamp(Math.round(Number(height) || 1024), 64, 4096),
  };
};

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

const sanitizeImportedText = (src, maxChars = 600) =>
  String(src || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, Math.max(40, Math.round(Number(maxChars) || 600)));

const hasEnoughWordLikeContent = (text) => {
  const tokens = String(text || "").match(/[\p{L}\p{N}]{2,}/gu) || [];
  return tokens.length >= 2;
};

const isProbablyGarbledPdfText = (text) => {
  const normalized = sanitizeImportedText(text, 900);
  if (!normalized || normalized.length < 8) return true;
  if (!hasEnoughWordLikeContent(normalized)) return true;
  const replacementCount = (normalized.match(/�/g) || []).length;
  if (replacementCount / Math.max(1, normalized.length) > 0.01) return true;

  const extLatin = normalized.match(/[À-ÿ]/g) || [];
  if (extLatin.length) {
    const allowed = normalized.match(/[ÇĞİÖŞÜçğıöşüÂâÎîÛûÉé]/g) || [];
    const suspiciousRatio = (extLatin.length - allowed.length) / extLatin.length;
    if (suspiciousRatio > 0.45) return true;
  }

  return false;
};

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
      literals.forEach((lit) => chunks.push(decodePdfLiteral(lit.slice(1, -1))));
    });
  });

  if (!chunks.length) {
    const fallbackLiterals = binaryText.match(/\((?:\\.|[^\\)]){2,160}\)/g) || [];
    fallbackLiterals.slice(0, 20).forEach((lit) => chunks.push(decodePdfLiteral(lit.slice(1, -1))));
  }

  return sanitizePdfText(chunks.join(" ")).slice(0, 180);
};

let pdfJsPromise = null;
const getPdfJs = async () => {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      return mod;
    });
  }
  return pdfJsPromise;
};

const extractPdfTextViaPdfJs = async (pdfDoc, opts = {}) => {
  if (!pdfDoc) return "";
  const maxPages = clamp(Number(opts?.maxPages || 4), 1, 12);
  const maxChars = clamp(Number(opts?.maxChars || 1200), 120, 6000);
  const pageCount = Math.min(Number(pdfDoc.numPages || 0), maxPages);
  const chunks = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const content = await page.getTextContent({
        disableCombineTextItems: false,
        includeMarkedContent: false,
      });
      const items = Array.isArray(content?.items) ? content.items : [];
      items.forEach((item) => {
        const str = String(item?.str || "").trim();
        if (!str) return;
        chunks.push(str);
      });
      if (chunks.join(" ").length >= maxChars) break;
    } catch {
      // page-level extraction failure should not fail whole import
    }
  }
  return sanitizeImportedText(chunks.join(" "), maxChars);
};

const importPdfToAssets = async (file, options = {}) => {
  const assets = [];
  const pdfjs = await getPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data: bytes });
  const pdf = await task.promise;
  let text = "";
  try {
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PDF islenemedi.");
    await firstPage.render({ canvasContext: ctx, viewport }).promise;
    const imageBlob = await canvasToPngBlob(canvas);
    assets.push({
      kind: "image",
      name: `${stripExtension(file.name) || "pdf"}-page-1.png`,
      blob: imageBlob,
    });

    // PDF text extraction: önce pdf.js textContent ile al (daha doğru).
    text = await extractPdfTextViaPdfJs(pdf, { maxPages: 4, maxChars: 900 });
  } finally {
    try {
      await pdf.destroy();
    } catch {}
  }

  if (isProbablyGarbledPdfText(text)) {
    text = "";
  }
  if (!text && typeof options?.pdfTextExtractor === "function") {
    try {
      text = sanitizeImportedText(await options.pdfTextExtractor(file), 900);
    } catch {
      text = "";
    }
  }
  if (!text) {
    try {
      const raw = new TextDecoder("latin1").decode(new Uint8Array(await file.arrayBuffer()));
      const fallbackText = extractPdfTextBestEffort(raw);
      text = sanitizeImportedText(fallbackText, 900);
    } catch {
      text = "";
    }
  }
  if (text && !isProbablyGarbledPdfText(text)) {
    assets.push({ kind: "text", name: `${file.name} (metin)`, text });
  }
  return assets;
};

const importSvgToImageAsset = async (file) => {
  const { Canvg } = await import("canvg");
  const svgText = await file.text();
  const { width, height } = parseSvgDimensions(svgText);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("SVG islenemedi.");
  const v = Canvg.fromString(ctx, svgText, {
    ignoreClear: true,
    ignoreDimensions: true,
  });
  await v.render();
  const pngBlob = await canvasToPngBlob(canvas);
  return [{ kind: "image", name: `${stripExtension(file.name) || "vector"}.png`, blob: pngBlob }];
};

const importDocxToAssets = async (file) => {
  const mammothMod = await import("mammoth");
  const mammoth = mammothMod?.default || mammothMod;
  const ab = await file.arrayBuffer();
  const assets = [];

  const raw = await mammoth.extractRawText({ arrayBuffer: ab });
  const rawText = String(raw?.value || "").replace(/\s+/g, " ").trim();
  if (rawText) assets.push({ kind: "text", name: `${file.name} (metin)`, text: rawText });

  const htmlRes = await mammoth.convertToHtml(
    { arrayBuffer: ab },
    {
      convertImage: mammoth.images.inline(async (image) => {
        const base64 = await image.read("base64");
        return { src: `data:${image.contentType || "image/png"};base64,${base64}` };
      }),
    }
  );
  const html = String(htmlRes?.value || "");
  const imageMatches = [...html.matchAll(/<img[^>]+src=["'](data:image\/[^"']+)["']/gi)];
  imageMatches.forEach((m, idx) => {
    const dataUrl = m?.[1];
    const blob = dataUrlToBlob(dataUrl);
    if (!blob) return;
    const ext = blob.type.includes("jpeg")
      ? "jpg"
      : blob.type.includes("webp")
        ? "webp"
        : "png";
    assets.push({
      kind: "image",
      name: `${stripExtension(file.name) || "docx"}-image-${idx + 1}.${ext}`,
      blob,
    });
  });

  return assets;
};

const importHeicToImageAsset = async (file) => {
  const heicMod = await import("heic2any");
  const heic2any = heicMod?.default || heicMod;
  const converted = await heic2any({
    blob: file,
    toType: "image/png",
    quality: 0.95,
  });
  const resultBlob = Array.isArray(converted) ? converted[0] : converted;
  if (!(resultBlob instanceof Blob) || resultBlob.size <= 0) {
    throw new Error("HEIC donusturulemedi.");
  }
  const blob = new Blob([await resultBlob.arrayBuffer()], { type: "image/png" });
  return [{ kind: "image", name: `${stripExtension(file.name) || "heic"}.png`, blob }];
};

const importRasterImageAsset = async (file) => {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type || "image/png" });
  return [{ kind: "image", name: normalizeImageName(file.name), blob }];
};

const importTextAsset = async (file) => {
  const text = String(await file.text() || "");
  return [{ kind: "text", name: file.name || "metin.txt", text }];
};

export async function importAnyFile(file, options = {}) {
  if (!(file instanceof File)) throw new Error("Gecerli bir dosya secin.");
  if (Number(file.size || 0) <= 0) throw new Error("Dosya bos.");
  if (Number(file.size || 0) > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new Error("Dosya 15MB limitini asiyor.");
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Dosya ice aktarma sadece tarayicida calisir.");
  }

  const type = String(file.type || "").toLowerCase();
  const ext = getExtension(file.name);
  const isHeic = type.includes("heic") || type.includes("heif") || ext === "heic" || ext === "heif";

  if (isHeic) {
    return importHeicToImageAsset(file);
  }

  if (type === "image/svg+xml" || ext === "svg") {
    return importSvgToImageAsset(file);
  }

  if (type.startsWith("image/")) {
    return importRasterImageAsset(file);
  }

  if (type === "application/pdf" || ext === "pdf") {
    return importPdfToAssets(file, options);
  }

  if (ext === "docx" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return importDocxToAssets(file);
  }

  if (ext === "txt" || ext === "md" || type.startsWith("text/")) {
    return importTextAsset(file);
  }

  throw new Error("Bu dosya turu desteklenmiyor.");
}
