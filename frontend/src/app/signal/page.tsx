"use client";

import { useState } from "react";
import {
  Target,
  AlertTriangle,
  Clock,
  Shield,
  LinkIcon,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageCircle,
} from "lucide-react";

interface SignalData {
  symbol: string;
  name: string;
  buyZone: number;
  stopLoss: number;
  takeProfit: number;
  description?: string;
  chartLinks?: { label: string; url: string }[];
  postedBy: string;
  postedAt: string;
}

const FREE_SIGNALS: SignalData[] = [
  {
    symbol: "UPPER",
    name: "Upper Tamakoshi Hydropower",
    buyZone: 189,
    stopLoss: 170,
    takeProfit: 327,
    postedBy: "GoldenEdge",
    postedAt: "Jun 5, 2026, 2:28 PM",
  },
  {
    symbol: "NBL",
    name: "Nepal Bank Limited",
    buyZone: 262,
    stopLoss: 220,
    takeProfit: 380,
    postedBy: "GoldenEdge",
    postedAt: "May 25, 2026, 12:24 PM",
  },
  {
    symbol: "MNBBL",
    name: "Muktinath Bikas Bank Limited",
    buyZone: 372,
    stopLoss: 333,
    takeProfit: 550,
    description:
      "Muktinath Bikas Bank Limited (MNBBL) was established on 19th Paush 2063 B.S. (i.e. 3rd January 2007 A.D.). The Bank is licensed by the Central Bank of Nepal to operate as a 'B' Class Development Bank.",
    chartLinks: [{ label: "Chart 1", url: "#" }],
    postedBy: "GoldenEdge",
    postedAt: "Apr 6, 2026, 2:03 PM",
  },
  {
    symbol: "TAMOR",
    name: "Sanima Middle Tamor Hydropower Ltd.",
    buyZone: 419,
    stopLoss: 387,
    takeProfit: 542,
    description:
      "Founded in 2016, Sanima Middle Tamor Hydropower Ltd. (TAMOR) is a Kathmandu, Nepal-based Special Purpose Vehicle (SPV) company tasked with overseeing and carrying out the development of the Middle Tamor Hydropower Project.",
    chartLinks: [{ label: "Chart 1", url: "#" }],
    postedBy: "GoldenEdge",
    postedAt: "Mar 22, 2026, 11:41 AM",
  },
];

const PAID_SIGNALS: SignalData[] = [
  { symbol: "NABIL", name: "Nabil Bank Ltd.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 20, 2026" },
  { symbol: "SANIMA", name: "Sanima Bank Ltd.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 19, 2026" },
  { symbol: "NICA", name: "NIC Asia Bank Ltd.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 18, 2026" },
  { symbol: "SBL", name: "Siddhartha Bank Ltd.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 17, 2026" },
  { symbol: "LSL", name: "Laxmi Sunrise Bank Ltd.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 16, 2026" },
  { symbol: "HBL", name: "Himalayan Bank Ltd.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 15, 2026" },
  { symbol: "SANDEEP", name: "Sandeep Equities Ltd.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 14, 2026" },
  { symbol: "HEI", name: "Himalayan Energy", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 13, 2026" },
  { symbol: "CHCL", name: "Chilime Hydropower", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 12, 2026" },
  { symbol: "NHPC", name: "Nepal Hydro Power Co.", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 11, 2026" },
  { symbol: "BPCL", name: "BP Cement Laghubitta", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 10, 2026" },
  { symbol: "MKCL", name: "Mithila Laghubitta", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 9, 2026" },
  { symbol: "GBBL", name: "Grameen Bikas Bank", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 8, 2026" },
  { symbol: "SWMF", name: "Sanima Middle Tamor", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 7, 2026" },
  { symbol: "AKPL", name: "Arun Valley Hydropower", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 6, 2026" },
  { symbol: "PPCL", name: "Patan Laghubitta", buyZone: 0, stopLoss: 0, takeProfit: 0, postedBy: "GoldenEdge", postedAt: "Jun 5, 2026" },
];

const WHATSAPP_URL = "https://wa.me/9779708919577";

function SignalCard({ signal }: { signal: SignalData }) {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = signal.description || (signal.chartLinks && signal.chartLinks.length > 0);

  return (
    <div className="card-3d p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-theme flex items-center justify-center">
            <Target className="h-4 w-4 text-accent-theme" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary-theme leading-tight">{signal.symbol}</h3>
            <p className="text-xs text-muted-theme">{signal.name}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-accent-theme text-[10px] font-bold tracking-wider text-primary-theme uppercase">
          NEPSE
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-theme">
        <Clock className="h-3 w-3" />
        <span>
          Posted by <span className="text-body-theme font-medium">{signal.postedBy}</span> on {signal.postedAt}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-input-theme border border-theme p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-theme font-semibold mb-1">Buy Zone</div>
          <div className="text-lg font-bold text-primary-theme font-mono">{signal.buyZone}</div>
        </div>
        <div className="rounded-lg bg-red-theme border border-red-theme p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-red-theme font-semibold mb-1">Stop Loss</div>
          <div className="text-lg font-bold text-red-theme font-mono">{signal.stopLoss}</div>
        </div>
        <div className="rounded-lg bg-green-theme border border-green-theme p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-green-theme font-semibold mb-1">Take Profit</div>
          <div className="text-lg font-bold text-green-theme font-mono">{signal.takeProfit}</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-theme">
        <Shield className="h-3 w-3" />
        <span>
          Risk:Reward ={" "}
          <span className="font-mono text-primary-theme">
            1:{((signal.takeProfit - signal.buyZone) / (signal.buyZone - signal.stopLoss)).toFixed(1)}
          </span>
        </span>
      </div>

      {hasExtra && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-accent-theme hover:text-accent-theme font-medium transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5" /> View Full Analysis...</>
            )}
          </button>
          {expanded && (
            <div className="space-y-3 border-t border-theme pt-3">
              {signal.description && (
                <p className="text-sm text-body-theme leading-relaxed">{signal.description}</p>
              )}
              {signal.chartLinks && signal.chartLinks.length > 0 && (
                <div>
                  <div className="text-xs text-muted-theme font-semibold uppercase tracking-wider mb-2">Chart Links:</div>
                  <div className="flex flex-wrap gap-2">
                    {signal.chartLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-input-theme border border-theme text-xs text-body-theme hover:bg-hover-theme hover:border-accent-theme transition-colors"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaidSignalCard({ signal }: { signal: SignalData }) {
  return (
    <div className="card-3d p-5 flex flex-col gap-4 relative overflow-hidden select-none">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent-theme flex items-center justify-center">
              <Target className="h-4 w-4 text-accent-theme" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary-theme leading-tight">{signal.symbol}</h3>
              <p className="text-xs text-muted-theme">{signal.name}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-accent-theme text-[10px] font-bold tracking-wider text-primary-theme uppercase">
            NEPSE
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-theme mt-4">
          <Clock className="h-3 w-3" />
          <span>
            Posted by <span className="text-body-theme font-medium">{signal.postedBy}</span> on {signal.postedAt}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-input-theme border border-theme p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-theme font-semibold mb-1">Buy Zone</div>
            <div className="text-lg font-bold text-primary-theme font-mono">*****</div>
          </div>
          <div className="rounded-lg bg-red-theme border border-red-theme p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-red-theme font-semibold mb-1">Stop Loss</div>
            <div className="text-lg font-bold text-red-theme font-mono">*****</div>
          </div>
          <div className="rounded-lg bg-green-theme border border-green-theme p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-green-theme font-semibold mb-1">Take Profit</div>
            <div className="text-lg font-bold text-green-theme font-mono">*****</div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl z-10 gap-3">
        <Lock className="h-8 w-8 text-accent-theme" />
        <p className="text-sm font-semibold text-primary-theme text-center px-4">Premium Signal</p>
        <p className="text-xs text-muted-theme text-center px-6">
          Contact us on WhatsApp to get access to premium signals
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-semibold transition-colors shadow-lg"
        >
          <MessageCircle className="h-4 w-4" />
          Contact on WhatsApp
        </a>
      </div>
    </div>
  );
}

type TabType = "free" | "paid";

export default function SignalPage() {
  const [activeTab, setActiveTab] = useState<TabType>("free");
  const [search, setSearch] = useState("");

  const filteredFree = FREE_SIGNALS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPaid = PAID_SIGNALS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Signals</h1>
        <p className="text-muted-theme text-sm mt-0.5">
          Trading signals with buy zones, targets, and stop losses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-input-theme rounded-lg w-fit border border-theme">
        <button
          onClick={() => setActiveTab("free")}
          className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === "free"
              ? "bg-accent-theme text-primary-theme shadow-md"
              : "text-muted-theme hover:text-primary-theme hover:bg-hover-theme"
          }`}
        >
          Free Signals
          <span className="ml-1.5 text-xs opacity-70">({FREE_SIGNALS.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`px-5 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "paid"
              ? "bg-accent-theme text-primary-theme shadow-md"
              : "text-muted-theme hover:text-primary-theme hover:bg-hover-theme"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          Paid Signals
          <span className="ml-0.5 text-xs opacity-70">({PAID_SIGNALS.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
        <input
          type="text"
          placeholder="Search signals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme placeholder:text-placeholder"
        />
      </div>

      {/* Free Signals */}
      {activeTab === "free" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFree.map((signal) => (
              <SignalCard key={signal.symbol} signal={signal} />
            ))}
            {filteredFree.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-theme">
                No free signals found matching &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </>
      )}

      {/* Paid Signals */}
      {activeTab === "paid" && (
        <>
          {/* Premium CTA Banner */}
          <div className="card-3d p-5 border-l-4 border-accent-theme bg-accent-theme/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-accent-theme uppercase tracking-wider mb-1">
                  Premium Trading Signals
                </h3>
                <p className="text-xs text-body-theme">
                  Get 16+ expert-curated signals daily with an 80-90% win rate, precise buy zones, targets, and stop losses.
                  Unlock premium signals now!
                </p>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-semibold transition-colors shadow-lg flex-shrink-0"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPaid.map((signal) => (
              <PaidSignalCard key={signal.symbol} signal={signal} />
            ))}
            {filteredPaid.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-theme">
                No paid signals found matching &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="card-3d p-5 border-l-4 border-amber-theme">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-theme flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-amber-theme uppercase tracking-wider">Disclaimer</h3>
            <p className="text-xs text-body-theme leading-relaxed">
              The content and analysis provided on this page are not buy or sell recommendations. They are intended for
              educational and informational purposes only. The stock market involves significant risk, and past performance
              is not indicative of future results.
            </p>
            <p className="text-xs text-body-theme leading-relaxed">
              Do your own analysis or research before making any investment decisions. Always consult with a qualified and
              licensed financial advisor registered with the appropriate regulatory bodies in Nepal before making any
              financial decisions. We are not liable for any financial losses incurred based on the information presented
              here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
