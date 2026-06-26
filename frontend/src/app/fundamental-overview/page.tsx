"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowLeft,
  Calendar,
  Building2,
  TrendingUp,
  ShieldAlert,
  Coins,
  Scale
} from "lucide-react";

interface Report {
  symbol: string;
  name: string;
  date: string;
  rawDate: string; // for sorting: YYYY-MM-DD
  description: string;
  htmlContent: React.ReactNode;
}

export default function FundamentalOverviewPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "title-asc">("date-desc");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reports: Report[] = useMemo(() => [
    {
      symbol: "SARBTM",
      name: "Sarbottam Cement Limited",
      date: "04/02/2026",
      rawDate: "2026-02-04",
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Sarbottam Cement Limited (SARBTM)</h1>
            <p className="text-slate-400 mt-2 text-sm">Premium Fundamental Investment Report — NEPSE | Updated Feb 04, 2026</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overview */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Company Overview
              </h2>
              <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
                <p>Sarbottam Cement Limited (SARBTM) is a leading cement manufacturer in Nepal, established in 2010 and commercially operational since February 2014. The company is headquartered at Neupane Tower, Tinkune, Kathmandu. SARBTM made history by becoming the <strong className="text-white">first Nepalese company to issue an IPO under the book-building mechanism</strong>, marking a milestone in Nepal’s capital market evolution.</p>
                <p>SARBTM focuses on advanced cement manufacturing technologies, supplying high-quality cement products to meet the growing domestic demand fueled by infrastructure development, urban expansion, and post-earthquake reconstruction.</p>
              </div>
            </div>

            {/* Operations */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Operational & Business Highlights
              </h2>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span><strong>Installed Capacity:</strong> Large-scale production with strong capital investment and long-term payback efficiency.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span><strong>Product Portfolio:</strong> OPC (Ordinary Portland Cement) & PPC (Portland Pozzolana Cement).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span><strong>Core Focus:</strong> Cement manufacturing (no unrelated diversification).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span><strong>Competitive Edge:</strong> Efficiency, profitability growth, and technological innovation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span><strong>Market Drivers:</strong> Infrastructure projects, urban housing, government construction, reconstruction demand.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Share Structure */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4 flex items-center gap-2">
              <Coins className="h-5 w-5" /> Share Structure & Market Snapshot
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Shares Outstanding", val: "52,242,750" },
                { label: "Paid-up Capital", val: "Rs. 5.224 Billion" },
                { label: "Market Capitalization", val: "Rs. 45.29 Billion" },
                { label: "Current Price", val: "Rs. 866.90" },
                { label: "52-Week Range", val: "Rs. 760.20 – Rs. 1,048.00" },
                { label: "1-Year Yield", val: "~3.82% – 11.97%" }
              ].map((s, idx) => (
                <div key={idx} className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 transition-colors">
                  <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{s.label}</span>
                  <span className="text-base font-bold text-white font-mono">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial table & Valuation grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md overflow-hidden">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Financial Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5">Metric</th>
                      <th className="py-2.5">Value</th>
                      <th className="py-2.5">Insight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr><td className="py-2.5 font-medium">EPS (TTM)</td><td className="py-2.5 font-mono text-white">Rs. 25.87 – 26.07</td><td className="py-2.5 text-xs">Consistent YoY growth</td></tr>
                    <tr><td className="py-2.5 font-medium">Net Profit (TTM)</td><td className="py-2.5 font-mono text-white">~Rs. 1.35 Billion</td><td className="py-2.5 text-xs">Lower finance cost surge</td></tr>
                    <tr><td className="py-2.5 font-medium">Revenue Growth</td><td className="py-2.5 font-mono text-green-400">+35.94%</td><td className="py-2.5 text-xs">Improved sales momentum</td></tr>
                    <tr><td className="py-2.5 font-medium">Book Value / Share</td><td className="py-2.5 font-mono text-white">Rs. 198.20 – 202.96</td><td className="py-2.5 text-xs">Strong asset base</td></tr>
                    <tr><td className="py-2.5 font-medium">ROE</td><td className="py-2.5 font-mono text-white">13.91%</td><td className="py-2.5 text-xs">Efficiency improving</td></tr>
                    <tr><td className="py-2.5 font-medium">ROA</td><td className="py-2.5 font-mono text-white">6.85%</td><td className="py-2.5 text-xs">Solid asset utilization</td></tr>
                    <tr><td className="py-2.5 font-medium">3-Yr Profit CAGR</td><td className="py-2.5 font-mono text-green-400">74.89%</td><td className="py-2.5 text-xs">High growth momentum</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md overflow-hidden">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Valuation Metrics</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5">Ratio</th>
                      <th className="py-2.5">Value</th>
                      <th className="py-2.5">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="py-3 font-medium">P/E Ratio</td>
                      <td className="py-3 font-mono text-white">33.38 – 35.04</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium">Premium Valuation</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">P/B Ratio</td>
                      <td className="py-3 font-mono text-white">4.27 – 4.36</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium">Above Industry Average</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">Dividend Yield</td>
                      <td className="py-3 font-mono text-white">~0.26% – 3.82%</td>
                      <td className="py-3 text-slate-400 text-xs">Moderate</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 p-4 border border-slate-800 bg-slate-950/20 rounded-xl">
                <h4 className="text-sm font-semibold text-white mb-2">Dividend & Shareholder Returns</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>• FY2081/82 Proposed Dividend: <strong>20% (15% Cash + 5% Bonus)</strong></li>
                  <li>• Previous Dividend: 15%</li>
                  <li>• Focus on maintaining sustainable cash flows and capital expansion.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Intrinsic Value */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5" /> Intrinsic Value & Fair Price Estimation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
              <div className="space-y-3">
                <p className="font-semibold text-white text-base">DCF Model (Conservative)</p>
                <ul className="space-y-1.5">
                  <li>• Annual Free Cash Flow: Rs. 1.35 Billion</li>
                  <li>• Discount Rate: 12%</li>
                  <li>• Time Horizon: 20 Years</li>
                  <li>• <strong className="text-white">Equity Value:</strong> ~Rs. 10.08 Billion</li>
                  <li>• <strong className="text-blue-400">Intrinsic Value Per Share:</strong> ~Rs. 193</li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-white text-base">Alternative Valuation Ranges</p>
                <ul className="space-y-1.5">
                  <li>• Book Value Method: Rs. 200 – Rs. 250</li>
                  <li>• Dividend Discount Model: Rs. 150 – Rs. 200</li>
                  <li>• Relative P/E Valuation: Rs. 520 – Rs. 780</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-center font-semibold text-sm">
              Conclusion: SARBTM appears overvalued compared to intrinsic value.
            </div>
          </div>

          {/* Buy/Sell Price Zones & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md overflow-hidden">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Suggested Price Zones</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5">Action</th>
                      <th className="py-2.5">Price Range</th>
                      <th className="py-2.5">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr><td className="py-3 font-semibold text-green-400">Ideal Buy Zone</td><td className="py-3 font-mono text-white">Rs. 760 – 800</td><td className="py-3 text-xs">Near support & lower valuation</td></tr>
                    <tr><td className="py-3 font-semibold text-slate-400">Hold Zone</td><td className="py-3 font-mono text-white">Rs. 800 – 900</td><td className="py-3 text-xs">Neutral market sentiment</td></tr>
                    <tr><td className="py-3 font-semibold text-red-400">Sell / Profit Book</td><td className="py-3 font-mono text-white">Rs. 900 – 1,000+</td><td className="py-3 text-xs">Near resistance & overvaluation</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" /> Key Investment Risks
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <li>• Market Volatility & price swings</li>
                <li>• Overvaluation Risk (high P/E)</li>
                <li>• Sector demand cycles</li>
                <li>• Raw material & energy costs</li>
                <li>• Financial debt & interest risks</li>
                <li>• IPO regulatory controversies</li>
                <li>• NEPSE structural/political risks</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md text-slate-300 text-sm">
            <h3 className="text-lg font-bold text-white mb-2">Final Investment Verdict</h3>
            <p className="leading-relaxed">SARBTM is a <strong>strong long-term cement sector growth candidate</strong>, backed by solid earnings recovery, operational efficiency, and rising infrastructure demand. However, the current market price reflects <strong>premium valuation and sentiment-driven optimism</strong>.</p>
            <p className="mt-3 text-blue-400 font-semibold">Best suited for long-term investors who buy at discounted levels. Short-term traders should be cautious due to volatility and overvaluation.</p>
          </div>
        </div>
      )
    },
    {
      symbol: "NBL",
      name: "Nepal Bank Limited",
      date: "30/01/2026",
      rawDate: "2026-01-30",
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-red-950/30 via-slate-900 to-blue-950/30 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <span className="px-3 py-1 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 text-xs font-bold uppercase tracking-wider mb-2 inline-block">
              NEPSE: NBL
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Fundamentals of Nepal Bank Limited</h1>
            <p className="text-slate-400 mt-2 text-sm">Established in 1937 • Nepal's First Commercial Bank • Government Backed (51%)</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Bank Profile
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              <strong>Nepal Bank Limited (NBL)</strong> marks the beginning of formal banking in Nepal. As a Class 'A' commercial bank under Nepal Rastra Bank, it maintains a dominant market presence through a vast network of branches and robust digital banking infrastructure.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Assets", val: "NPR 403.34B" },
                { label: "Total Deposits", val: "NPR 340.47B" },
                { label: "Total Equity", val: "NPR 38.25B" },
                { label: "Capital Adequacy", val: "12.45%", isGreen: true }
              ].map((s, idx) => (
                <div key={idx} className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 text-center">
                  <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{s.label}</span>
                  <span className={`text-base font-bold font-mono ${s.isGreen ? "text-green-400" : "text-white"}`}>{s.val}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-800/80 pt-4 text-xs text-slate-400 italic">
              Latest Dividend (FY 2078/79): 10% Cash Dividend & 2% Bonus Shares.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Ratios */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Key Financial Ratios (TTM 2026)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5">Metric</th>
                      <th className="py-2.5">Value / Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr><td className="py-2.5 font-medium">Price-to-Earnings (PE)</td><td className="py-2.5 font-mono text-white">9.30 - 9.37</td></tr>
                    <tr><td className="py-2.5 font-medium">Price-to-Book (PB)</td><td className="py-2.5 font-mono text-white">0.92</td></tr>
                    <tr><td className="py-2.5 font-medium">Earnings Per Share (EPS)</td><td className="py-2.5 font-mono text-white">NPR 25.58</td></tr>
                    <tr><td className="py-2.5 font-medium">Interest Spread</td><td className="py-2.5 font-mono text-white">3.9%</td></tr>
                    <tr><td className="py-2.5 font-medium">Debt-to-Equity</td><td className="py-2.5 font-mono text-white">0.09</td></tr>
                    <tr><td className="py-2.5 font-medium">52-Week High / Low</td><td className="py-2.5 font-mono text-white">NPR 308 / 230</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risks */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-amber-500 border-l-4 border-amber-500 pl-3 mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" /> Investment Risk Factors
                </h2>
                <ul className="space-y-3 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>Regulatory changes in Nepal's Class 'A' banking sector.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>Interest rate volatility impacting net interest margins.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>Broader 5-year downtrend (-14.10%) despite strong capital base.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Strategy row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-950/20 to-slate-950 border border-green-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-2">Entry Zone (Buy)</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 230 - 235</div>
              <p className="text-xs text-slate-400">Aligns with S3 support levels and historical 52-week lows. Monitor volume for accumulation.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-950/20 to-slate-950 border border-blue-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-blue-400 uppercase tracking-wider mb-2">Intrinsic Value</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 217 - 305</div>
              <p className="text-xs text-slate-400">Earnings-based DCF suggests NPR 296. Currently trading at 0.78 of GF Value.</p>
            </div>

            <div className="bg-gradient-to-br from-amber-950/20 to-slate-950 border border-amber-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-amber-500 uppercase tracking-wider mb-2">Target Zone (Sell)</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 240 - 245</div>
              <p className="text-xs text-slate-400">Near-term resistance (R1-R3). Consider holding for NPR 308 if market momentum shifts.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      symbol: "SCB",
      name: "Standard Chartered Bank Nepal",
      date: "30/01/2026",
      rawDate: "2026-01-30b", // minor offset to ensure order matches screenshot
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-teal-950/30 via-slate-900 to-teal-950/30 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Standard Chartered Bank Nepal (SCB)</h1>
            <p className="text-slate-400 mt-2 text-sm">
              A "Triple A" rated global subsidiary (Est. 1987) known for premium asset quality, conservative risk management, and consistent dividend performance in Nepal's NEPSE landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Current Price", val: "NPR 632", desc: "As of Jan 1, 2026" },
              { label: "EPS (Trailing)", val: "~NPR 30", desc: "Stable Profitability" },
              { label: "P/E Ratio", val: "21.0", desc: "Premium Valuation" },
              { label: "Book Value", val: "NPR 223", desc: "P/B Ratio: 2.83" }
            ].map((s, idx) => (
              <div key={idx} className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 text-center">
                <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{s.label}</span>
                <span className="text-lg font-bold text-teal-400 font-mono block">{s.val}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">{s.desc}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-teal-400 border-l-4 border-teal-500 pl-3 mb-4">Intrinsic Value Analysis</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Estimates suggest SCB is currently trading at the higher end of its fair value range, reflecting its premium "safety" status.
                </p>
                <ul className="space-y-2 text-slate-300 text-sm mb-4">
                  <li>• <strong>Graham Formula:</strong> NPR 555 – 675 (Defensive valuation)</li>
                  <li>• <strong>P/E Based (Fair 15-20x):</strong> NPR 450 – 600</li>
                  <li>• <strong>Historical P/B Adjusted:</strong> NPR 558</li>
                </ul>
                <div className="p-3 bg-teal-950/20 border border-teal-500/20 text-teal-400 rounded-xl flex justify-between items-center text-sm font-semibold">
                  <span>Consensus Fair Value Range:</span>
                  <span>NPR 500 – 650</span>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-teal-400 border-l-4 border-teal-500 pl-3 mb-4">Why Invest in SCB?</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>• <strong>Global Governance:</strong> Backed by Standard Chartered PLC (UK).</li>
                  <li>• <strong>Asset Quality:</strong> Industry-leading low NPLs & Triple A rating.</li>
                  <li>• <strong>Dividend Reliability:</strong> Consistent payer (19% Cash for FY 81/82).</li>
                  <li>• <strong>Technical Outlook:</strong> Bullish signals across MA5, MA20, and MA180.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-teal-400 border-l-4 border-teal-500 pl-3 mb-4">Trading Strategy</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Accumulation Zone</span>
                    <div className="p-3 bg-green-950/20 border border-green-500/20 text-green-400 rounded-xl flex justify-between items-center font-bold font-mono">
                      <span>Best Entry Price</span>
                      <span>595 – 620</span>
                    </div>
                    <small className="block text-[11px] text-slate-400 mt-1">Aligns with 52-week lows and pivot support S2/S3.</small>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">Target Sell Zone</span>
                    <div className="p-3 bg-amber-950/20 border border-amber-500/20 text-amber-500 rounded-xl flex justify-between items-center font-bold font-mono">
                      <span>Profit Taking</span>
                      <span>650 – 700</span>
                    </div>
                    <small className="block text-[11px] text-slate-400 mt-1">Resistance R2/R3 levels; P/B starts to overextend here.</small>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-red-400 border-l-4 border-red-500 pl-3 mb-4">Key Risks</h3>
                <ul className="space-y-2 text-slate-300 text-xs">
                  <li>• NRB regulatory caps on interest spreads.</li>
                  <li>• High valuation premium vs. local sector avg.</li>
                  <li>• Slow domestic GDP and credit growth.</li>
                  <li>• Lower liquidity for large institutional trades.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-10">
            Disclaimer: This analysis is for informational purposes only. Consult a financial advisor before making investment decisions in the NEPSE market.
          </div>
        </div>
      )
    },
    {
      symbol: "CIT",
      name: "Citizen Investment Trust",
      date: "29/01/2026",
      rawDate: "2026-01-29",
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/30 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Citizen Investment Trust (CIT) Analysis</h1>
            <p className="text-slate-400 mt-2 text-sm">Comprehensive Fundamental & Technical Review for NEPSE Investors</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Market Essentials (January 2026)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Current Price", val: "NPR 1,787" },
                { label: "Market Cap", val: "NPR 121.62B" },
                { label: "52-Week Range", val: "1,731 — 2,200" },
                { label: "Sector", val: "Investment" }
              ].map((s, idx) => (
                <div key={idx} className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 text-center">
                  <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{s.label}</span>
                  <span className="text-base font-bold text-white font-mono">{s.val}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Citizen Investment Trust (Nagarik Lagani Kosh) is a government-backed statutory body. It serves as a cornerstone of Nepal's financial sector, managing retirement funds, the Citizen Unit Scheme, and diverse equity portfolios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Fundamental Indicators</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5">Metric</th>
                      <th className="py-2.5">Value</th>
                      <th className="py-2.5">Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr><td className="py-2.5 font-medium">EPS</td><td className="py-2.5 font-mono text-white">NPR 18.47</td><td className="py-2.5 text-xs">Annualized/Trailing Earnings</td></tr>
                    <tr><td className="py-2.5 font-medium">PE Ratio</td><td className="py-2.5 font-mono text-amber-400">96.75</td><td className="py-2.5 text-xs text-amber-500 font-medium">High; reflects institutional demand</td></tr>
                    <tr><td className="py-2.5 font-medium">Book Value</td><td className="py-2.5 font-mono text-white">NPR 397.52</td><td className="py-2.5 text-xs">Current Net Worth Per Share</td></tr>
                    <tr><td className="py-2.5 font-medium">PB Ratio</td><td className="py-2.5 font-mono text-white">4.50</td><td className="py-2.5 text-xs">Trading at premium to assets</td></tr>
                    <tr><td className="py-2.5 font-medium">Proposed Dividend</td><td className="py-2.5 font-mono text-white">13%</td><td className="py-2.5 text-xs">8% Cash + 5% Bonus (FY 81/82)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Intrinsic Value Estimates</h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  Using conservative valuation models, the calculated fair value range varies significantly from the current market price:
                </p>
                <ul className="space-y-2 text-slate-300 text-sm mb-4">
                  <li>• <strong>Graham Number:</strong> NPR 406 (Conservative fundamental floor)</li>
                  <li>• <strong>Dividend Discount Model:</strong> NPR 387 — 500</li>
                  <li>• <strong>PE-Based Fair Value:</strong> NPR 462 (Assuming sector average PE of 25)</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl text-slate-300 text-xs">
                <strong>Analyst Note:</strong> The NPR 1,787 market price reflects a "Scarcity Premium." Investors value CIT for its government backing and stability, rather than pure earnings growth.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-950/20 to-slate-950 border border-green-900/30 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-2">Buy Zone</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 1,700 – 1,750</div>
              <p className="text-xs text-slate-400"><strong>Rationale:</strong> Near 52-week lows and strong historical support. High margin of safety for long-term accumulation.</p>
            </div>

            <div className="bg-gradient-to-br from-red-950/20 to-slate-950 border border-red-900/30 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-red-400 uppercase tracking-wider mb-2">Sell Zone</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 2,000 – 2,200</div>
              <p className="text-xs text-slate-400"><strong>Rationale:</strong> Resistance levels where PE exceeds 100. Ideal for profit-taking or rebalancing portfolios.</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">SWOT Analysis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <strong className="text-green-400 font-bold block mb-1">Strengths & Ops</strong>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>• Sovereign backing & low default risk</li>
                  <li>• Dominant player in retirement schemes</li>
                </ul>
              </div>
              <div className="space-y-2">
                <strong className="text-red-400 font-bold block mb-1">Weaknesses & Threats</strong>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li>• Extreme overvaluation on paper (PE 96+)</li>
                  <li>• Highly sensitive to NEPSE volatility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      symbol: "NTC",
      name: "Nepal Doorsanchar Company Limited",
      date: "25/01/2026",
      rawDate: "2026-01-25",
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-blue-900/20 via-slate-900 to-indigo-900/20 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Fundamentals of Nepal Doorsanchar Company Limited (NTC)</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Nepal Doorsanchar Company Limited, popularly known as <strong>Nepal Telecom (NTC)</strong>, is Nepal's state-owned telecommunications giant. Established in 2004, it operates under the Ministry of Information and Communications, offering everything from 4G/5G trials to FTTH broadband. As a defensive blue-chip stock on the NEPSE (Symbol: <strong>NTC</strong>), it offers unmatched nationwide coverage and stable government backing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Paid-Up Capital", val: "NPR 18 Billion" },
              { label: "Market Cap (Jan 2026)", val: "NPR 162.9 Billion" },
              { label: "Government Ownership", val: "91.52%" },
              { label: "Public Float", val: "8.48%" }
            ].map((s, idx) => (
              <div key={idx} className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 text-center">
                <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{s.label}</span>
                <span className="text-base font-bold text-white font-mono">{s.val}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4">Financial Performance Overview</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              While NTC maintains a robust balance sheet with minimal debt, it faces modern headwinds from OTT services (WhatsApp/Viber) and private competition.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5">Metric</th>
                    <th className="py-2.5">FY 2081/82 (Annual)</th>
                    <th className="py-2.5">Q1 FY 2082/83</th>
                    <th className="py-2.5">YoY Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr><td className="py-2.5 font-medium">Net Revenue</td><td className="py-2.5 font-mono text-white">~NPR 35-40B (Est.)</td><td className="py-2.5 font-mono text-white">NPR 8.67B</td><td className="py-2.5 font-mono text-red-400">-11.76%</td></tr>
                  <tr><td className="py-2.5 font-medium">Net Profit</td><td className="py-2.5 font-mono text-white">NPR 2.66B</td><td className="py-2.5 font-mono text-white">NPR 1.33B</td><td className="py-2.5 font-mono text-red-400">-23.8%</td></tr>
                  <tr><td className="py-2.5 font-medium">EPS (Annualized)</td><td className="py-2.5 font-mono text-white">NPR 14.78</td><td className="py-2.5 font-mono text-white">NPR 29.56</td><td className="py-2.5 text-xs text-slate-400">Declining Trend</td></tr>
                  <tr><td className="py-2.5 font-medium">Book Value (BVPS)</td><td className="py-2.5 font-mono text-white">NPR 504</td><td className="py-2.5 font-mono text-white">NPR 504</td><td className="py-2.5 text-xs text-slate-400">Stable</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-950/10 border border-green-900/20 rounded-2xl p-6 shadow-md">
              <h4 className="text-base font-bold text-green-400 mb-3">Key Strengths</h4>
              <ul className="space-y-2 text-slate-300 text-xs">
                <li>• Government monopoly on fixed-line services.</li>
                <li>• Extensive rural network infrastructure.</li>
                <li>• Strong cash reserves and minimal debt.</li>
                <li>• Reliable dividend history (30% Cash in FY 81/82).</li>
              </ul>
            </div>
            <div className="bg-red-950/10 border border-red-900/20 rounded-2xl p-6 shadow-md">
              <h4 className="text-base font-bold text-red-400 mb-3">Risks & Weaknesses</h4>
              <ul className="space-y-2 text-slate-300 text-xs">
                <li>• Revenue erosion from OTT apps (WhatsApp/Viber).</li>
                <li>• Slow bureaucratic decision-making processes.</li>
                <li>• High P/E ratio relative to current growth.</li>
                <li>• Low public liquidity due to 8.48% float.</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-base font-bold text-white mb-4">Investment Valuation & Strategy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-green-900/30 bg-green-950/10 rounded-xl text-center">
                <strong className="text-green-400 text-xs block mb-1">Value Buy Zone</strong>
                <span className="text-xl font-bold text-white font-mono block">NPR 850 — 900</span>
                <p className="text-[10px] text-slate-400 mt-1">Safety margin relative to Book Value. Entry below 120-day average.</p>
              </div>
              <div className="p-4 border border-slate-800 bg-slate-950/40 rounded-xl text-center">
                <strong className="text-slate-400 text-xs block mb-1">Intrinsic Value (Avg)</strong>
                <span className="text-xl font-bold text-white font-mono block">NPR 500 — 700</span>
                <p className="text-[10px] text-slate-400 mt-1">Based on Graham Number and Dividend Discount Models.</p>
              </div>
              <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-xl text-center">
                <strong className="text-red-400 text-xs block mb-1">Target Sell Zone</strong>
                <span className="text-xl font-bold text-white font-mono block">NPR 950 — 1,000</span>
                <p className="text-[10px] text-slate-400 mt-1">Historical resistance levels. Lock in gains if growth remains stagnant.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      symbol: "NABIL",
      name: "Nabil Bank Limited",
      date: "22/01/2026",
      rawDate: "2026-01-22",
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-green-950/30 via-slate-900 to-blue-950/30 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Fundamentals of Nabil Bank Limited (NABIL)</h1>
            <p className="text-slate-400 mt-2 text-sm">Comprehensive investment analysis for the 2026 Fiscal Year</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-blue-400 border-l-4 border-blue-500 pl-3 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Bank Overview
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Established in 1984, <strong>Nabil Bank Limited</strong> stands as Nepal's premier Class 'A' commercial bank. With a network of over 200 branches, it leads the private sector in market capitalization (Rs. 133 Billion) and asset management, specializing in digital banking, SME lending, and sustainable finance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">📈 Business & Market Position</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Dominant market leader in the banking sector with over Rs. 300 billion in deposits. Shows strong profitability, high capital adequacy, and steady growth in loan portfolios. Resistant to sector volatilities due to extensive retail footprint.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-400 mb-3">💰 Valuation Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-850 bg-slate-950/40 rounded-xl text-center">
                    <span className="block text-xs text-slate-500 mb-1">P/E Ratio</span>
                    <span className="text-sm font-bold text-white font-mono">19.5 - 20.2</span>
                  </div>
                  <div className="p-3 border border-slate-850 bg-slate-950/40 rounded-xl text-center">
                    <span className="block text-xs text-slate-500 mb-1">Book Value</span>
                    <span className="text-sm font-bold text-white font-mono">NPR 248.50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-950/20 to-slate-950 border border-green-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-2">Ideal Buy Zone</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 380 - 410</div>
              <p className="text-xs text-slate-400">Excellent support zones, offering higher margin of safety.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-950/20 to-slate-950 border border-blue-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-blue-400 uppercase tracking-wider mb-2">Intrinsic Value</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 445</div>
              <p className="text-xs text-slate-400">Calculated based on sustainable growth and stable cash flows.</p>
            </div>

            <div className="bg-gradient-to-br from-red-950/20 to-slate-950 border border-red-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-red-400 uppercase tracking-wider mb-2">Sell / Target Zone</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 520 - 550+</div>
              <p className="text-xs text-slate-400">Optimal profit-taking region as price meets historical resistance.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      symbol: "HDL",
      name: "Himalayan Distillery Limited",
      date: "22/01/2026",
      rawDate: "2026-01-22b",
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-emerald-950/20 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#c5a059]">Himalayan Distillery Limited (HDL)</h1>
            <p className="text-slate-400 mt-2 text-sm">
              A premier NEPSE-listed manufacturer (Sector: Manufacturing & Processing) specializing in high-quality spirits with a commitment to sustainability and zero leverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Ratios */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-[#c5a059] border-l-4 border-[#c5a059] pl-3 mb-4 uppercase tracking-wider text-sm">📊 Key Ratios (TTM)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr><td className="py-2 font-medium">EPS (Adjusted)</td><td className="py-2 font-mono text-white text-right">NPR 22.90</td></tr>
                    <tr><td className="py-2 font-medium">Book Value</td><td className="py-2 font-mono text-white text-right">NPR 115.33</td></tr>
                    <tr><td className="py-2 font-medium">ROE</td><td className="py-2 font-mono text-white text-right">21.57%</td></tr>
                    <tr><td className="py-2 font-medium">Net Margin</td><td className="py-2 font-mono text-white text-right">25%</td></tr>
                    <tr><td className="py-2 font-medium">Debt-to-Equity</td><td className="py-2 font-mono text-green-400 text-right">0.00 (Debt Free)</td></tr>
                    <tr><td className="py-2 font-medium">Current Ratio</td><td className="py-2 font-mono text-white text-right">9.89</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded bg-slate-950 text-xs font-semibold text-slate-400 border border-slate-800">Altman Z-Score: 67.71 (Safe)</span>
                <span className="px-2.5 py-1 rounded bg-slate-950 text-xs font-semibold text-slate-400 border border-slate-800">Piotroski: 5/9</span>
              </div>
            </div>

            {/* Market Overview */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-[#c5a059] border-l-4 border-[#c5a059] pl-3 mb-4 uppercase tracking-wider text-sm">📈 Market Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr><td className="py-2 font-medium">Market Cap</td><td className="py-2 font-mono text-white text-right">NPR 42.64 Billion</td></tr>
                    <tr><td className="py-2 font-medium">Paid-up Capital</td><td className="py-2 font-mono text-white text-right">NPR 3.69 Billion</td></tr>
                    <tr><td className="py-2 font-medium">Promoter Holding</td><td className="py-2 font-mono text-white text-right">58%</td></tr>
                    <tr><td className="py-2 font-medium">Public Holding</td><td className="py-2 font-mono text-white text-right">42%</td></tr>
                    <tr><td className="py-2 font-medium">52-Week High</td><td className="py-2 font-mono text-white text-right">NPR 1,556.10</td></tr>
                    <tr><td className="py-2 font-medium">PE Ratio</td><td className="py-2 font-mono text-white text-right">50.48</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Intrinsic Value */}
            <div className="bg-gradient-to-br from-blue-950/20 to-slate-950 border border-blue-900/30 rounded-2xl p-6 shadow-md text-center flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-blue-400 uppercase tracking-wider mb-2">💎 Valuation Insights</h3>
                <div className="text-2xl font-black text-white font-mono my-2">NPR 1,400 - 1,500</div>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-left space-y-1">
                <strong>GuruFocus:</strong> NPR 1,488 <br />
                <strong>PE-Based:</strong> NPR 1,446 <br />
                <span className="text-green-400 font-semibold mt-1 block">Status: Modestly Undervalued (~22%)</span>
              </p>
            </div>

            {/* Entry Strategy */}
            <div className="bg-gradient-to-br from-green-950/20 to-slate-950 border border-green-900/30 rounded-2xl p-6 shadow-md text-center flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-2">📥 Entry Strategy</h3>
                <div className="text-2xl font-black text-white font-mono my-2">NPR 1,050 - 1,150</div>
              </div>
              <ul className="text-xs text-slate-400 mt-2 text-left list-disc pl-4 space-y-0.5">
                <li>Strong support at S2/S3 levels.</li>
                <li>Aligns with 52-week lows.</li>
                <li>Favorable risk-reward for accumulation.</li>
              </ul>
            </div>

            {/* Exit Strategy */}
            <div className="bg-gradient-to-br from-amber-950/20 to-slate-950 border border-amber-900/30 rounded-2xl p-6 shadow-md text-center flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-500 uppercase tracking-wider mb-2">📤 Exit Strategy</h3>
                <div className="text-2xl font-black text-white font-mono my-2">NPR 1,400 - 1,600</div>
              </div>
              <ul className="text-xs text-slate-400 mt-2 text-left list-disc pl-4 space-y-0.5">
                <li>Target intrinsic value capture.</li>
                <li>Historical resistance at 1,556.</li>
                <li>PE expansion alert: 60x - 70x.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sustainability */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-[#c5a059] border-l-4 border-[#c5a059] pl-3 mb-4 uppercase tracking-wider text-sm">🌿 Sustainability & Scale</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                <div>
                  <strong>Energy:</strong> 98% Renewable <br />
                  <strong>Capacity:</strong> 582,906 cases (+39% YoY)
                </div>
                <div>
                  <strong>Distribution:</strong> 15,000+ Outlets <br />
                  <strong>Flagship:</strong> Golden Oak (&gt;50% share)
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-950 text-xs font-semibold text-slate-400 border border-slate-800">ISO 9001/14001</span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-xs font-semibold text-slate-400 border border-slate-800">Zero Liquid Discharge</span>
              </div>
            </div>

            {/* Verdict */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-center">
              <h3 className="text-base font-bold text-white mb-2">Investment Considerations</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                HDL demonstrates strong resilience with a significant rebound in FY 2024-25. The company's <strong>zero-debt balance sheet</strong> and <strong>dominant market position</strong> in premium segments provide a safety margin. While revenue concentration and excise volatility remain risks, the current shift toward direct-sales distribution and new product launches like <em>Shlok</em> support a long-term growth thesis.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      symbol: "CGH",
      name: "Chandragiri Hills Limited",
      date: "20/01/2026",
      rawDate: "2026-01-20",
      description: "A detailed fundamental analysis report is available. Click 'View Details' to see the full content.",
      htmlContent: (
        <div className="space-y-6 text-slate-100 max-w-4xl mx-auto pb-10">
          <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold tracking-wider uppercase mb-2 inline-block">
              NEPSE: CGH (Hotels & Tourism)
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Chandragiri Hills Limited</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl mx-auto">
              Analysis & Financial Overview of Nepal's Premier Cable Car and Tourism Destination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Operational Profile */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-sky-400 border-l-4 border-sky-500 pl-3 mb-4 uppercase tracking-wider text-xs">Operational Profile</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Established in 2015, CGH operates the iconic cable car to Bhaleshwor Mahadev (2,551m). A diversified tourism model:
              </p>
              <div className="grid grid-cols-2 gap-2 text-center mb-4">
                <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Cable Car</span>
                  <span className="text-base font-bold text-white font-mono">57%</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Resort</span>
                  <span className="text-base font-bold text-white font-mono">25%</span>
                </div>
              </div>
              <hr className="border-slate-800/80 my-3" />
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Key Risks</h4>
              <ul className="list-disc pl-4 text-xs text-slate-400 space-y-1">
                <li>Seasonal weather dependency</li>
                <li>High debt (NPR 2.09B)</li>
                <li>Market competition</li>
                <li>Operational maintenance needs</li>
              </ul>
            </div>

            {/* Financial Performance */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-sky-400 border-l-4 border-sky-500 pl-3 mb-4 uppercase tracking-wider text-xs">Financial History</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Steady recovery post-COVID with significant revenue growth in FY 2022-24.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "BVPS (Latest)", val: "106.48" },
                  { label: "OPM (%)", val: "62%" },
                  { label: "ROE (Avg)", val: "11%" },
                  { label: "Gearing", val: "1.5x" }
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-center">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{s.label}</span>
                    <span className="text-xs font-bold text-white font-mono">{s.val}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-xl text-xs">
                <strong className="block mb-1 text-white">Revenue Growth (NPR M)</strong>
                <div className="space-y-0.5 text-slate-400">
                  <div>• <strong>FY 78/79:</strong> 669 (+201%)</div>
                  <div>• <strong>FY 79/80:</strong> 913 (+37%)</div>
                  <div>• <strong>FY 81/82 (Q4):</strong> 933 (-3.39%)</div>
                </div>
              </div>
            </div>

            {/* Market Standing */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-sky-400 border-l-4 border-sky-500 pl-3 mb-4 uppercase tracking-wider text-xs">Market Standing</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Market Cap</span>
                    <span className="text-sm font-bold text-white font-mono">~14B</span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-center">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Credit Rating</span>
                    <span className="text-sm font-bold text-white font-mono">BBB-</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl text-xs space-y-1">
                <strong className="text-white">Analyst Verdict</strong>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Suitable for:</strong> Growth-oriented investors betting on Nepal’s tourism rebound.
                </p>
                <p className="text-red-400 font-semibold leading-relaxed mt-1">
                  Caution: High finance costs eat 31% of revenue. Monitor quarterly visitor arrivals closely.
                </p>
              </div>
            </div>
          </div>

          {/* Zones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-950/20 to-slate-950 border border-green-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-2">📥 Buy Zone</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 800 — 850</div>
              <p className="text-xs text-slate-400">Aligns with 52-week lows. Provides a margin of safety. Recommended if RSI &lt; 40.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-950/20 to-slate-950 border border-blue-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-blue-400 uppercase tracking-wider mb-2">⚖️ Intrinsic Value</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 150 — 200</div>
              <p className="text-xs text-slate-400">Based on Graham Number and DCF. Currently trading at a premium (4-5x intrinsic) due to brand value.</p>
            </div>

            <div className="bg-gradient-to-br from-red-950/20 to-slate-950 border border-red-900/30 rounded-2xl p-6 shadow-md text-center">
              <h3 className="text-base font-bold text-red-400 uppercase tracking-wider mb-2">📤 Sell Zone</h3>
              <div className="text-2xl font-black text-white font-mono my-2">NPR 1,000 — 1,150</div>
              <p className="text-xs text-slate-400">Near historical resistance. PE exceeds 100. Consider partial exit to secure gains.</p>
            </div>
          </div>
        </div>
      )
    }
  ], []);

  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === "date-desc") return b.rawDate.localeCompare(a.rawDate);
      if (sortBy === "date-asc") return a.rawDate.localeCompare(b.rawDate);
      return a.symbol.localeCompare(b.symbol);
    });
    return list;
  }, [reports, search, sortBy]);

  const activeReport = useMemo(() => {
    return reports.find(r => r.symbol === selectedReport) || null;
  }, [reports, selectedReport]);

  if (activeReport) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedReport(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-input-theme text-body-theme hover:bg-hover-theme border border-theme text-sm font-medium transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </button>

        <div>
          {activeReport.htmlContent}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-theme flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent-theme" />
          Fundamental Overview
        </h1>
        <p className="text-muted-theme text-sm mt-0.5">
          Curated fundamental investment reports for major NEPSE companies
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme placeholder:text-muted-theme"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-theme" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="title-asc">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.symbol}
            className="card-3d p-5 flex flex-col gap-4 justify-between h-[220px]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-accent-theme/10 text-accent-theme border border-accent-theme/20 text-[10px] font-bold tracking-wider uppercase">
                  FUNDAMENTAL
                </span>
                <span className="text-[10px] text-muted-theme flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {report.date}
                </span>
              </div>
              <h2 className="text-lg font-bold text-primary-theme leading-tight">
                {report.symbol}
              </h2>
              <p className="text-xs text-muted-theme line-clamp-3">
                {report.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedReport(report.symbol)}
              className="inline-flex items-center gap-1.5 text-xs text-accent-theme hover:text-accent-theme/80 font-bold transition-colors w-fit"
            >
              VIEW DETAILS →
            </button>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-16 text-muted-theme">
          No fundamental reports found matching &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
}
