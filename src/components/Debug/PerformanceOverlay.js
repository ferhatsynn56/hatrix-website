"use client";

import { useState, useEffect, useRef } from "react";

export default function PerformanceOverlay() {
    const [metrics, setMetrics] = useState({
        fps: 0,
        domNodes: 0,
        images: 0,
        memory: null,
    });
    const [isVisible, setIsVisible] = useState(false); // Hidden by default, toggle with triple tap or query param? Let's make it visible for now or toggleable.

    // Frame counting
    const frames = useRef(0);
    const lastTime = useRef(performance.now());
    const requestRef = useRef();

    useEffect(() => {
        // Show by default for now to satisfy user request, or add a small toggle button
        setIsVisible(true);

        const countFPS = () => {
            const now = performance.now();
            frames.current++;

            if (now >= lastTime.current + 1000) {
                let memoryUsage = "N/A";
                if (window.performance && window.performance.memory) {
                    memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / 1048576) + " MB";
                }

                setMetrics({
                    fps: frames.current,
                    domNodes: document.getElementsByTagName("*").length,
                    images: document.getElementsByTagName("img").length,
                    memory: memoryUsage,
                });

                frames.current = 0;
                lastTime.current = now;
            }

            requestRef.current = requestAnimationFrame(countFPS);
        };

        requestRef.current = requestAnimationFrame(countFPS);

        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-2 left-2 z-[9999] bg-black/80 text-green-400 font-mono text-[10px] p-2 rounded pointer-events-none select-none border border-green-900 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col gap-1">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">FPS:</span>
                    <span className={metrics.fps < 30 ? "text-red-500 font-bold" : "text-green-400"}>
                        {metrics.fps}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">DOM Nodes:</span>
                    <span className={metrics.domNodes > 1500 ? "text-yellow-500" : "text-blue-300"}>
                        {metrics.domNodes}
                    </span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Images:</span>
                    <span className="text-purple-300">
                        {metrics.images}
                    </span>
                </div>
                {metrics.memory !== "N/A" && (
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-400">RAM (Est):</span>
                        <span className="text-yellow-300">{metrics.memory}</span>
                    </div>
                )}
                <div className="border-t border-gray-800 mt-1 pt-1 text-[9px] text-gray-500">
                    iOS "Low Power Mode" caps FPS at 30.
                </div>
            </div>
        </div>
    );
}
