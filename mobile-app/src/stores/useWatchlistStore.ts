import { create } from "zustand";
import { storageGet, storageSet } from "../lib/storage";
import { Config } from "../constants/config";

interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
  order: number;
}

interface WatchlistState {
  items: WatchlistItem[];
  load: () => Promise<void>;
  add: (symbol: string, name: string) => Promise<void>;
  remove: (symbol: string) => Promise<void>;
  reorder: (fromIndex: number, toIndex: number) => Promise<void>;
  has: (symbol: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],

  load: async () => {
    const saved = await storageGet<WatchlistItem[]>("watchlist");
    if (saved) {
      const withOrder = saved.map((item, i) => ({ ...item, order: item.order ?? i }));
      withOrder.sort((a, b) => a.order - b.order);
      set({ items: withOrder });
    }
  },

  add: async (symbol, name) => {
    const { items } = get();
    if (items.length >= Config.MAX_WATCHLIST) return;
    if (items.some((i) => i.symbol === symbol)) return;
    const next = [...items, { symbol, name, addedAt: Date.now(), order: items.length }];
    set({ items: next });
    await storageSet("watchlist", next);
  },

  remove: async (symbol) => {
    const next = get().items.filter((i) => i.symbol !== symbol);
    next.forEach((item, i) => (item.order = i));
    set({ items: next });
    await storageSet("watchlist", next);
  },

  reorder: async (fromIndex, toIndex) => {
    const { items } = get();
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    next.forEach((item, i) => (item.order = i));
    set({ items: next });
    await storageSet("watchlist", next);
  },

  has: (symbol) => get().items.some((i) => i.symbol === symbol),
}));
