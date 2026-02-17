"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to monitor memory usage.
 * Note: performance.memory is a non-standard API primarily available in Chrome.
 * It does not work in Firefox or Safari (iOS).
 */
export function useMemoryMonitor() {
  const [memoryStats, setMemoryStats] = useState(null);

  useEffect(() => {
    // Check if performance.memory is available
    if (!window.performance || !window.performance.memory) {
      setMemoryStats({
        error: "Memory API not supported on this browser/device (e.g., iOS Safari).",
      });
      return;
    }

    const intervalId = setInterval(() => {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } =
        window.performance.memory;

      setMemoryStats({
        usedJSHeapSize: (usedJSHeapSize / 1048576).toFixed(2) + " MB",
        totalJSHeapSize: (totalJSHeapSize / 1048576).toFixed(2) + " MB",
        jsHeapSizeLimit: (jsHeapSizeLimit / 1048576).toFixed(2) + " MB",
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(intervalId);
  }, []);

  return memoryStats;
}
