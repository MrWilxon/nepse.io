"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "nepse_watchlist";

function loadWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(list: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);

  const toggle = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (symbol: string) => watchlist.includes(symbol),
    [watchlist]
  );

  return { watchlist, toggle, isWatched };
}
