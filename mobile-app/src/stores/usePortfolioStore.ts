import { create } from "zustand";
import { storageGet, storageSet } from "../lib/storage";

interface PortfolioHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface Transaction {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
}

interface PortfolioState {
  holdings: PortfolioHolding[];
  transactions: Transaction[];
  cash: number;
  load: () => Promise<void>;
  buy: (symbol: string, name: string, qty: number, price: number) => Promise<void>;
  sell: (symbol: string, qty: number, price: number) => Promise<void>;
  updatePrices: (prices: Record<string, number>) => void;
}

const INITIAL_CASH = 10_000_000;

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  holdings: [],
  transactions: [],
  cash: INITIAL_CASH,

  load: async () => {
    const [holdings, transactions, cash] = await Promise.all([
      storageGet<PortfolioHolding[]>("portfolio_holdings"),
      storageGet<Transaction[]>("portfolio_transactions"),
      storageGet<number>("portfolio_cash"),
    ]);
    set({
      holdings: holdings || [],
      transactions: transactions || [],
      cash: cash ?? INITIAL_CASH,
    });
  },

  buy: async (symbol, name, qty, price) => {
    const { holdings, transactions, cash } = get();
    const totalCost = qty * price;
    if (totalCost > cash) return;

    const existing = holdings.find((h) => h.symbol === symbol);
    let newHoldings: PortfolioHolding[];
    if (existing) {
      const newQty = existing.quantity + qty;
      const newAvg = (existing.avgPrice * existing.quantity + price * qty) / newQty;
      newHoldings = holdings.map((h) =>
        h.symbol === symbol ? { ...h, quantity: newQty, avgPrice: newAvg } : h
      );
    } else {
      newHoldings = [...holdings, { symbol, name, quantity: qty, avgPrice: price, currentPrice: price }];
    }

    const tx: Transaction = {
      id: `${Date.now()}-${symbol}`,
      symbol,
      type: "buy",
      quantity: qty,
      price,
      date: new Date().toISOString(),
    };
    const nextTx = [tx, ...transactions];
    const nextCash = cash - totalCost;

    set({ holdings: newHoldings, transactions: nextTx, cash: nextCash });
    await Promise.all([
      storageSet("portfolio_holdings", newHoldings),
      storageSet("portfolio_transactions", nextTx),
      storageSet("portfolio_cash", nextCash),
    ]);
  },

  sell: async (symbol, qty, price) => {
    const { holdings, transactions, cash } = get();
    const holding = holdings.find((h) => h.symbol === symbol);
    if (!holding || holding.quantity < qty) return;

    const newQty = holding.quantity - qty;
    const newHoldings = newQty === 0
      ? holdings.filter((h) => h.symbol !== symbol)
      : holdings.map((h) => (h.symbol === symbol ? { ...h, quantity: newQty } : h));

    const tx: Transaction = {
      id: `${Date.now()}-${symbol}`,
      symbol,
      type: "sell",
      quantity: qty,
      price,
      date: new Date().toISOString(),
    };
    const nextTx = [tx, ...transactions];
    const nextCash = cash + qty * price;

    set({ holdings: newHoldings, transactions: nextTx, cash: nextCash });
    await Promise.all([
      storageSet("portfolio_holdings", newHoldings),
      storageSet("portfolio_transactions", nextTx),
      storageSet("portfolio_cash", nextCash),
    ]);
  },

  updatePrices: (prices) => {
    const { holdings } = get();
    const updated = holdings.map((h) => ({
      ...h,
      currentPrice: prices[h.symbol] ?? h.currentPrice,
    }));
    set({ holdings: updated });
    storageSet("portfolio_holdings", updated);
  },
}));
