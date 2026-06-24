import { create } from "zustand";
import { storageGet, storageSet } from "../lib/storage";

interface PaperHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface PaperTrade {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
}

interface PaperTradingState {
  holdings: PaperHolding[];
  trades: PaperTrade[];
  cash: number;
  load: () => Promise<void>;
  buy: (symbol: string, name: string, qty: number, price: number) => Promise<void>;
  sell: (symbol: string, qty: number, price: number) => Promise<void>;
  reset: () => Promise<void>;
}

const INITIAL_CASH = 10_000_000;

export const usePaperTradingStore = create<PaperTradingState>((set, get) => ({
  holdings: [],
  trades: [],
  cash: INITIAL_CASH,

  load: async () => {
    const [holdings, trades, cash] = await Promise.all([
      storageGet<PaperHolding[]>("paper_holdings"),
      storageGet<PaperTrade[]>("paper_trades"),
      storageGet<number>("paper_cash"),
    ]);
    set({
      holdings: holdings || [],
      trades: trades || [],
      cash: cash ?? INITIAL_CASH,
    });
  },

  buy: async (symbol, name, qty, price) => {
    const { holdings, trades, cash } = get();
    const totalCost = qty * price;
    if (totalCost > cash) return;

    const existing = holdings.find((h) => h.symbol === symbol);
    let newHoldings: PaperHolding[];
    if (existing) {
      const newQty = existing.quantity + qty;
      const newAvg = (existing.avgPrice * existing.quantity + price * qty) / newQty;
      newHoldings = holdings.map((h) =>
        h.symbol === symbol ? { ...h, quantity: newQty, avgPrice: newAvg } : h
      );
    } else {
      newHoldings = [...holdings, { symbol, name, quantity: qty, avgPrice: price, currentPrice: price }];
    }

    const tx: PaperTrade = {
      id: `${Date.now()}-${symbol}`,
      symbol,
      type: "buy",
      quantity: qty,
      price,
      date: new Date().toISOString(),
    };
    const nextTx = [tx, ...trades];
    const nextCash = cash - totalCost;

    set({ holdings: newHoldings, trades: nextTx, cash: nextCash });
    await Promise.all([
      storageSet("paper_holdings", newHoldings),
      storageSet("paper_trades", nextTx),
      storageSet("paper_cash", nextCash),
    ]);
  },

  sell: async (symbol, qty, price) => {
    const { holdings, trades, cash } = get();
    const holding = holdings.find((h) => h.symbol === symbol);
    if (!holding || holding.quantity < qty) return;

    const newQty = holding.quantity - qty;
    const newHoldings = newQty === 0
      ? holdings.filter((h) => h.symbol !== symbol)
      : holdings.map((h) => (h.symbol === symbol ? { ...h, quantity: newQty } : h));

    const tx: PaperTrade = {
      id: `${Date.now()}-${symbol}`,
      symbol,
      type: "sell",
      quantity: qty,
      price,
      date: new Date().toISOString(),
    };
    const nextTx = [tx, ...trades];
    const nextCash = cash + qty * price;

    set({ holdings: newHoldings, trades: nextTx, cash: nextCash });
    await Promise.all([
      storageSet("paper_holdings", newHoldings),
      storageSet("paper_trades", nextTx),
      storageSet("paper_cash", nextCash),
    ]);
  },

  reset: async () => {
    set({ holdings: [], trades: [], cash: INITIAL_CASH });
    await Promise.all([
      storageSet("paper_holdings", []),
      storageSet("paper_trades", []),
      storageSet("paper_cash", INITIAL_CASH),
    ]);
  },
}));
