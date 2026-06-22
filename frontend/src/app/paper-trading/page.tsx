"use client";

import { useEffect, useState } from "react";
import { Search, ShoppingCart, DollarSign, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function PaperTradingPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [symbol, setSymbol] = useState("NMB");
  const [quantity, setQuantity] = useState("10");
  const [orderType, setOrderType] = useState("buy");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchPortfolio = () => {
    fetch(`${API}/api/paper-trading/portfolio`).then(r => r.json()).then(d => { setPortfolio(d); setLoading(false); });
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const placeOrder = () => {
    setMsg("");
    fetch(`${API}/api/paper-trading/order`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: symbol.toUpperCase(), type: orderType, quantity: parseInt(quantity) }),
    }).then(r => r.json()).then(d => {
      if (d.error) { setMsg(`Error: ${d.error}`); return; }
      setMsg(`${orderType.toUpperCase()} ${quantity} ${symbol.toUpperCase()} @ Rs ${d.trade.price} — Total Rs ${d.trade.total.toLocaleString()}`);
      fetchPortfolio();
    });
  };

  const resetAccount = () => {
    if (!confirm("Reset account to Rs 10,000,000?")) return;
    fetch(`${API}/api/paper-trading/reset`, { method: "POST" }).then(() => { setMsg("Account reset!"); fetchPortfolio(); });
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-input-theme animate-pulse" />)}</div>;

  const totalHoldingValue = portfolio.holdings.reduce((s: number, h: any) => s + h.marketValue, 0);
  const totalPnL = portfolio.holdings.reduce((s: number, h: any) => s + h.pnl, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">Paper Trading Simulator</h1>
          <p className="text-muted-theme text-sm mt-0.5">Practice with Rs 10,000,000 virtual money</p>
        </div>
        <button onClick={resetAccount} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-input-theme text-muted-theme hover:text-primary-theme text-xs">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Cash Balance</div>
          <div className="text-lg font-bold text-accent-theme font-mono">Rs {portfolio.balance.toLocaleString()}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Holdings Value</div>
          <div className="text-lg font-bold text-primary-theme font-mono">Rs {totalHoldingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Total Portfolio</div>
          <div className="text-lg font-bold text-primary-theme font-mono">Rs {portfolio.totalPortfolioValue.toLocaleString()}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Total P&L</div>
          <div className={`text-lg font-bold font-mono ${portfolio.totalReturn >= 0 ? "text-green-theme" : "text-red-theme"}`}>
            {portfolio.totalReturn >= 0 ? "+" : ""}{portfolio.totalReturn}%
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Holdings</div>
          <div className="text-lg font-bold text-primary-theme font-mono">{portfolio.holdings.length}</div>
        </div>
      </div>

      {/* Order Form */}
      <div className="card-3d p-5">
        <h2 className="text-sm font-semibold text-primary-theme mb-4 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-accent-theme" /> Place Order</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-[10px] text-muted-theme mb-1 block">Symbol</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
              <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-theme mb-1 block">Type</label>
            <div className="flex gap-1">
              <button onClick={() => setOrderType("buy")} className={`flex-1 py-2 rounded-lg text-xs font-bold ${orderType === "buy" ? "bg-[#22c55e] text-primary-theme" : "bg-input-theme text-muted-theme border border-theme"}`}>BUY</button>
              <button onClick={() => setOrderType("sell")} className={`flex-1 py-2 rounded-lg text-xs font-bold ${orderType === "sell" ? "bg-[#ef4444] text-primary-theme" : "bg-input-theme text-muted-theme border border-theme"}`}>SELL</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-theme mb-1 block">Quantity</label>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
          </div>
          <button onClick={placeOrder}
            className={`py-2 rounded-lg text-sm font-bold text-primary-theme ${orderType === "buy" ? "bg-[#22c55e] hover:bg-[#16a34a]" : "bg-[#ef4444] hover:bg-[#dc2626]"}`}>
            {orderType === "buy" ? "Buy" : "Sell"} {symbol}
          </button>
          <div className="text-[10px] text-muted-theme">
            {msg && <span className={msg.startsWith("Error") ? "text-red-theme" : "text-green-theme"}>{msg}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings */}
        <div className="card-3d p-5">
          <h2 className="text-sm font-semibold text-primary-theme mb-3">Holdings</h2>
          {portfolio.holdings.length === 0 ? (
            <p className="text-xs text-muted-theme text-center py-8">No holdings yet. Place your first trade above!</p>
          ) : (
            <div className="space-y-2">
              {portfolio.holdings.map((h: any) => (
                <div key={h.symbol} className="flex items-center justify-between p-3 rounded-lg bg-input-theme border border-theme">
                  <div>
                    <div className="text-sm font-bold text-primary-theme">{h.symbol}</div>
                    <div className="text-[10px] text-muted-theme">{h.shares} shares @ Rs {h.avgPrice.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-primary-theme">Rs {h.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className={`text-[10px] font-mono ${h.pnl >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                      {h.pnl >= 0 ? "+" : ""}Rs {h.pnl.toFixed(0)} ({h.pnlPct}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Trades */}
        <div className="card-3d p-5">
          <h2 className="text-sm font-semibold text-primary-theme mb-3">Recent Trades</h2>
          {portfolio.recentTrades.length === 0 ? (
            <p className="text-xs text-muted-theme text-center py-8">No trades yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {portfolio.recentTrades.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-page">
                  <div className="flex items-center gap-2">
                    {t.type === "buy" ? <TrendingUp className="h-4 w-4 text-green-theme" /> : <TrendingDown className="h-4 w-4 text-red-theme" />}
                    <div>
                      <span className={`text-xs font-bold ${t.type === "buy" ? "text-green-theme" : "text-red-theme"}`}>{t.type.toUpperCase()}</span>
                      <span className="text-xs text-primary-theme ml-2">{t.quantity} {t.symbol}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-primary-theme">Rs {t.price}</div>
                    <div className="text-[10px] text-muted-theme">{new Date(t.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
