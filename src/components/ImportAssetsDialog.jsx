"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Image as ImageIcon, FileText, X } from "lucide-react";

const getAssetId = (asset, index) =>
  `${asset?.kind || "asset"}_${index}_${String(asset?.name || "isimsiz").replace(/\s+/g, "_")}`;

const summarizeText = (value, max = 120) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Metin icerigi bos.";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(20, max - 1))}…`;
};

export default function ImportAssetsDialog({
  open = false,
  onClose,
  assets = [],
  onConfirm,
  loading = false,
}) {
  const rows = useMemo(
    () =>
      (Array.isArray(assets) ? assets : []).map((asset, idx) => ({
        id: getAssetId(asset, idx),
        asset,
      })),
    [assets]
  );

  const [selectedMap, setSelectedMap] = useState({});
  const [bgRemoveMap, setBgRemoveMap] = useState({});
  const [previewMap, setPreviewMap] = useState({});

  useEffect(() => {
    if (!open) return;
    const nextSelected = {};
    const nextBgRemove = {};
    rows.forEach(({ id, asset }) => {
      nextSelected[id] = true;
      if (asset?.kind === "image") nextBgRemove[id] = false;
    });
    setSelectedMap(nextSelected);
    setBgRemoveMap(nextBgRemove);
  }, [open, rows]);

  useEffect(() => {
    if (!open) return;
    const nextPreviewMap = {};
    rows.forEach(({ id, asset }) => {
      if (asset?.kind !== "image" || !(asset?.blob instanceof Blob)) return;
      nextPreviewMap[id] = URL.createObjectURL(asset.blob);
    });
    setPreviewMap(nextPreviewMap);
    return () => {
      Object.values(nextPreviewMap).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      setPreviewMap({});
    };
  }, [open, rows]);

  if (!open) return null;

  const selectedCount = rows.filter(({ id }) => Boolean(selectedMap[id])).length;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 px-3 py-4">
      <div className="w-full max-w-2xl max-h-[86vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Dosyadan içe aktar</p>
            <h3 className="text-sm md:text-base font-black text-zinc-900">Aktarılacak içerikleri seç</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            aria-label="İçe aktar penceresini kapat"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-4 py-3 space-y-2.5">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              Uygun içerik bulunamadı.
            </div>
          ) : (
            rows.map(({ id, asset }) => {
              const selected = Boolean(selectedMap[id]);
              const isImage = asset?.kind === "image";
              return (
                <div
                  key={id}
                  className={`rounded-xl border p-2.5 transition ${selected ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMap((prev) => ({ ...prev, [id]: !prev[id] }))}
                      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-transparent"}`}
                      aria-label={`${asset?.name || "asset"} sec`}
                    >
                      <Check size={12} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-zinc-600">
                          {isImage ? <ImageIcon size={12} /> : <FileText size={12} />}
                        </span>
                        <p className="truncate text-[12px] font-bold text-zinc-900">{asset?.name || "Isimsiz içerik"}</p>
                      </div>

                      {isImage ? (
                        <div className="mt-2 flex items-start gap-3">
                          <div className="h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                            {previewMap[id] ? (
                              <img src={previewMap[id]} alt={asset?.name || "Onizleme"} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <label className="flex items-center gap-2 text-[11px] font-semibold text-zinc-700">
                            <input
                              type="checkbox"
                              className="accent-black"
                              checked={Boolean(bgRemoveMap[id])}
                              onChange={(e) => setBgRemoveMap((prev) => ({ ...prev, [id]: e.target.checked }))}
                              disabled={!selected}
                            />
                            Arka planı kaldır
                          </label>
                        </div>
                      ) : (
                        <p className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] text-zinc-600">
                          {summarizeText(asset?.text, 120)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3">
          <p className="text-[11px] font-semibold text-zinc-600">{selectedCount} öğe seçili</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-[11px] font-black uppercase tracking-wide text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={loading || selectedCount === 0}
              onClick={() => {
                const selectedAssets = rows
                  .filter(({ id }) => Boolean(selectedMap[id]))
                  .map(({ id, asset }) => ({
                    ...asset,
                    bgRemove: asset?.kind === "image" ? Boolean(bgRemoveMap[id]) : false,
                  }));
                onConfirm?.(selectedAssets);
              }}
              className={`h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-wide text-white ${loading || selectedCount === 0 ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-black"}`}
            >
              {loading ? "Aktariliyor..." : "Seçilenleri Tasarıma Aktar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

