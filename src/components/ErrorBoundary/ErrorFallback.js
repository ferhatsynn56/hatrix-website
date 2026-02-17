"use client";

import { useMemoryMonitor } from "@/hooks/useMemoryMonitor";
import { useEffect, useState } from "react";

export default function ErrorFallback({ error, resetErrorBoundary }) {
    const memoryStats = useMemoryMonitor();
    const [deviceInfo, setDeviceInfo] = useState(null);

    useEffect(() => {
        // Capture device info on mount (client-side only)
        setDeviceInfo({
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            pixelRatio: window.devicePixelRatio,
            platform: navigator.platform,
            language: navigator.language,
        });
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white p-4 overflow-auto">
            <div className="max-w-md w-full bg-gray-900 rounded-lg border border-red-500/30 p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-red-500 mb-4">
                    Beklenmeyen Bir Hata Oluştu
                </h2>

                <div className="mb-6 p-4 bg-red-900/20 rounded border border-red-900/50">
                    <p className="font-mono text-sm text-red-200 break-words mb-2">
                        {error?.message || "Bilinmeyen Hata"}
                    </p>
                    {error?.stack && (
                        <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-white">
                                Stack Trace Görüntüle
                            </summary>
                            <pre className="mt-2 text-[10px] text-gray-500 overflow-x-auto whitespace-pre-wrap">
                                {error.stack}
                            </pre>
                        </details>
                    )}
                </div>

                <div className="space-y-4 mb-6 text-sm">
                    <h3 className="font-semibold text-gray-300 border-b border-gray-700 pb-1">
                        Cihaz Bilgileri
                    </h3>
                    {deviceInfo ? (
                        <ul className="grid grid-cols-1 gap-2 text-gray-400 font-mono text-xs">
                            <li>
                                <span className="text-gray-500">Model/UA:</span>{" "}
                                {deviceInfo.userAgent}
                            </li>
                            <li>
                                <span className="text-gray-500">Ekran:</span>{" "}
                                {deviceInfo.screenResolution} (DPR: {deviceInfo.pixelRatio})
                            </li>
                            <li>
                                <span className="text-gray-500">Platform:</span>{" "}
                                {deviceInfo.platform}
                            </li>
                        </ul>
                    ) : (
                        <span className="text-gray-500">Bilgiler yükleniyor...</span>
                    )}

                    <h3 className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mt-4">
                        Bellek Durumu
                    </h3>
                    {memoryStats ? (
                        memoryStats.error ? (
                            <p className="text-yellow-500 text-xs">{memoryStats.error}</p>
                        ) : (
                            <ul className="grid grid-cols-2 gap-2 text-gray-400 font-mono text-xs">
                                <li>
                                    <span className="text-gray-500">Kullanılan:</span>{" "}
                                    {memoryStats.usedJSHeapSize}
                                </li>
                                <li>
                                    <span className="text-gray-500">Toplam:</span>{" "}
                                    {memoryStats.totalJSHeapSize}
                                </li>
                                <li>
                                    <span className="text-gray-500">Limit:</span>{" "}
                                    {memoryStats.jsHeapSizeLimit}
                                </li>
                            </ul>
                        )
                    ) : (
                        <span className="text-gray-500">Hesaplanıyor...</span>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Sayfayı Yenile
                    </button>
                    {resetErrorBoundary && (
                        <button
                            onClick={resetErrorBoundary}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                            Tekrar Dene
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
