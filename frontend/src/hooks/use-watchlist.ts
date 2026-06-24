"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nepse_watchlist";
const MAX_ITEMS = 20;

function loadWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(symbols: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  } catch {}
}

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSymbols(loadWatchlist());
    setReady(true);
  }, []);

  const toggle = useCallback((symbol: string) => {
    setSymbols((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : prev.length < MAX_ITEMS
          ? [...prev, symbol]
          : prev;
      saveWatchlist(next);
      return next;
    });
  }, []);

  const has = useCallback((symbol: string) => symbols.includes(symbol), [symbols]);

  return { symbols, toggle, has, ready, count: symbols.length, max: MAX_ITEMS };
}
