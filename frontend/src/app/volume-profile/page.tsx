"use client";

import { useEffect, useState } from "react";
import { Search, BarChart3 } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function VolumeProfilePage() {
  const [symbol, setSymbol] = useState("NMB");
  const [period, setPeriod] = useState(60);
  const [numBins, setNumBins] = useState(20);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/volume-profile/${symbol}?period=${period}&bins=${numBins}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const maxVol = data?.profile?.length ? Math.max(...data.profile.map((p: any) => p.totalVolume)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Volume Profile Analysis</h1>
        <p className="text-muted-theme text-sm mt-0.5">Price-volume distribution and Point of Control</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input type="text" placeholder="Symbol..." value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-32 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
        </div>
        <select value={period} onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none">
          <option value={30}>30 Days</option>
          <option value={60}>60 Days</option>
          <option value={90}>90 Days</option>
          <option value={180}>180 Days</option>
        </select>
        <select value={numBins} onChange={(e) => setNumBins(parseInt(e.target.value))}
          className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none">
          <option value={10}>10 Bins</option>
          <option value={15}>15 Bins</option>
          <option value={20}>20 Bins</option>
          <option value={30}>30 Bins</option>
        </select>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-accent-theme text-primary-theme text-sm font-medium hover:bg-accent-theme">Analyze</button>
      </div>

      {loading ? (
        <div className="h-96 rounded-xl bg-input-theme animate-pulse" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-3d p-4">
              <div className="text-xs text-muted-theme">Point of Control</div>
              <div className="text-lg font-bold text-accent-theme font-mono">Rs {data.poc.price}</div>
              <div className="text-[10px] text-muted-theme">Highest volume node</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-xs text-muted-theme">Value Area High</div>
              <div className="text-lg font-bold text-green-theme font-mono">Rs {data.valueArea.high}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-xs text-muted-theme">Value Area Low</div>
              <div className="text-lg font-bold text-red-theme font-mono">Rs {data.valueArea.low}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-xs text-muted-theme">Buy Pressure</div>
              <div className="text-lg font-bold text-primary-theme font-mono">{data.summary.buyPressure}%</div>
            </div>
          </div>

          <div className="card-3d p-5">
            <h2 className="text-sm font-semibold text-primary-theme mb-4">Volume Distribution</h2>
            <div className="space-y-1">
              {data.profile.map((level: any, i: number) => {
                const barWidth = maxVol > 0 ? (level.totalVolume / maxVol) * 100 : 0;
                const isPOC = level.priceMid === data.poc.price;
                const inValueArea = level.priceLow >= data.valueArea.low && level.priceHigh <= data.valueArea.high;
                return (
                  <div key={i} className={`flex items-center gap-3 p-1.5 rounded ${isPOC ? "bg-accent-theme" : inValueArea ? "bg-kbd-theme/50" : ""}`}>
                    <div className="w-24 text-right">
                      <div className="text-xs font-mono text-primary-theme">Rs {level.priceMid.toFixed(0)}</div>
                    </div>
                    <div className="flex-1 h-6 bg-page rounded overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 rounded" style={{
                        width: `${barWidth}%`,
                        backgroundColor: level.buyPct > 50 ? "#22c55e80" : "#ef444480",
                      }} />
                      {isPOC && <div className="absolute inset-y-0 right-0 w-1 bg-accent-theme" />}
                    </div>
                    <div className="w-20 text-right">
                      <div className="text-[10px] font-mono text-body-theme">{(level.totalVolume / 1000).toFixed(0)}K</div>
                    </div>
                    <div className="w-12 text-right">
                      <div className={`text-[10px] font-mono ${level.buyPct > 50 ? "text-green-theme" : "text-red-theme"}`}>{level.buyPct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-theme">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-[#22c55e80]" /><span className="text-xs text-muted-theme">Buy Volume</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-[#ef444480]" /><span className="text-xs text-muted-theme">Sell Volume</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-1 bg-accent-theme" /><span className="text-xs text-muted-theme">POC</span></div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
