import { useEffect, useRef, useState, useCallback } from "react";
import { getWsUrl } from "../services/api";

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: number;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const listenersRef = useRef<Map<string, Set<(update: PriceUpdate) => void>>>(new Map());

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.symbol) {
            const update: PriceUpdate = {
              symbol: data.symbol,
              price: data.price || data.close || 0,
              change: data.change || 0,
              changePct: data.changePct || data.percentChange || 0,
              volume: data.volume || 0,
              timestamp: Date.now(),
            };
            setPrices((prev) => ({ ...prev, [update.symbol]: update }));
            const listeners = listenersRef.current.get(update.symbol);
            listeners?.forEach((fn) => fn(update));
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimeout.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((symbol: string, callback: (update: PriceUpdate) => void) => {
    if (!listenersRef.current.has(symbol)) {
      listenersRef.current.set(symbol, new Set());
    }
    listenersRef.current.get(symbol)!.add(callback);
    return () => {
      listenersRef.current.get(symbol)?.delete(callback);
    };
  }, []);

  const getPrice = useCallback((symbol: string) => prices[symbol], [prices]);

  return { connected, prices, subscribe, getPrice };
}

let globalWs: ReturnType<typeof useWebSocket> | null = null;

export function useWsPrices() {
  if (!globalWs) {
    // This will be initialized in the provider
    return { connected: false, prices: {}, subscribe: () => () => {}, getPrice: () => undefined };
  }
  return globalWs;
}
