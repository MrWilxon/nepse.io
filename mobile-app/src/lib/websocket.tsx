import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { getWsUrl } from "../services/api";

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: number;
}

interface WebSocketContextType {
  connected: boolean;
  prices: Record<string, PriceUpdate>;
  subscribe: (symbol: string, callback: (update: PriceUpdate) => void) => () => void;
  getPrice: (symbol: string) => PriceUpdate | undefined;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  prices: {},
  subscribe: () => () => {},
  getPrice: () => undefined,
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCount = useRef(0);
  const listenersRef = useRef<Map<string, Set<(update: PriceUpdate) => void>>>(new Map());

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle array of price updates
          const updates: Array<{ symbol: string; price?: number; close?: number; change?: number; changePct?: number; percentChange?: number; volume?: number }> =
            Array.isArray(data) ? data : data.ticker ? data.ticker : [data];

          updates.forEach((item) => {
            if (!item.symbol) return;
            const update: PriceUpdate = {
              symbol: item.symbol,
              price: item.price || item.close || 0,
              change: item.change || 0,
              changePct: item.changePct || item.percentChange || 0,
              volume: item.volume || 0,
              timestamp: Date.now(),
            };
            setPrices((prev) => ({ ...prev, [update.symbol]: update }));
            const symbolListeners = listenersRef.current.get(update.symbol);
            symbolListeners?.forEach((fn) => fn(update));
          });
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(5000 * Math.pow(2, reconnectCount.current), 60000);
        reconnectCount.current++;
        reconnectTimeout.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      const delay = Math.min(5000 * Math.pow(2, reconnectCount.current), 60000);
      reconnectCount.current++;
      reconnectTimeout.current = setTimeout(connect, delay);
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

  return (
    <WebSocketContext.Provider value={{ connected, prices, subscribe, getPrice }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWs() {
  return useContext(WebSocketContext);
}
