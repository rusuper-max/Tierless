// src/hooks/useOcrUsage.ts
// Hook to fetch and display OCR usage in the editor

import { useState, useEffect, useCallback } from "react";

type OcrUsageData = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  isLifetimeTrial: boolean;
  displayText: string;
  canScan: boolean;
};

export function useOcrUsage() {
  const [usage, setUsage] = useState<OcrUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ocr-usage");
      if (!res.ok) {
        if (res.status === 401) {
          setUsage(null);
          return;
        }
        throw new Error("Failed to fetch OCR usage");
      }
      const data = await res.json();
      setUsage(data);
    } catch (err) {
      console.error("[useOcrUsage]", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Refetch after a scan
  const refresh = useCallback(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usage,
    loading,
    error,
    refresh,
    canScan: usage?.canScan ?? false,
    displayText: usage?.displayText ?? "",
    remaining: usage?.remaining ?? 0,
    isLifetimeTrial: usage?.isLifetimeTrial ?? false,
  };
}
