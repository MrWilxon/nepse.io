"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-theme bg-surface mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/icon.svg" alt="NEPSE.io" className="h-8 w-8 rounded-lg" />
              <div>
                <div className="text-sm font-bold text-primary-theme">NEPSE<span className="text-accent-theme">.io</span></div>
              </div>
            </div>
            <p className="text-xs text-muted-theme leading-relaxed">
              Free all-in-one Nepal Stock Exchange analytics platform with real-time prices, technical analysis, and AI predictions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-primary-theme uppercase tracking-wider mb-3">Markets</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Dashboard</Link></li>
              <li><Link href="/sectors" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Sectors</Link></li>
              <li><Link href="/floorsheet" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Floor Sheet</Link></li>
              <li><Link href="/brokers" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Brokers</Link></li>
              <li><Link href="/announcements" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Announcements</Link></li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-semibold text-primary-theme uppercase tracking-wider mb-3">Tools</h3>
            <ul className="space-y-2">
              <li><Link href="/screener" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Stock Screener</Link></li>
              <li><Link href="/backtest" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Backtesting</Link></li>
              <li><Link href="/predict" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">AI Prediction</Link></li>
              <li><Link href="/paper-trading" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Paper Trading</Link></li>
              <li><Link href="/portfolio" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Portfolio</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-primary-theme uppercase tracking-wider mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-xs text-muted-theme hover:text-accent-theme transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer Bar */}
      <div className="border-t border-theme bg-page/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-[10px] text-muted-theme leading-relaxed text-center">
            <strong className="text-body-theme">Disclaimer:</strong> NEPSE.io is for informational purposes only and does not constitute financial advice. 
            Investing in the stock market involves risk. Past performance does not guarantee future results. 
            Always consult a qualified financial advisor before making investment decisions. 
            Data is sourced from NEPSE and may be delayed. NEPSE.io is not affiliated with Nepal Stock Exchange Limited.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-theme bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] text-muted-theme">
            &copy; {new Date().getFullYear()} NEPSE.io. All rights reserved.
          </p>
          <p className="text-[10px] text-muted-theme">
            Built for the Nepal investment community
          </p>
        </div>
      </div>
    </footer>
  );
}
