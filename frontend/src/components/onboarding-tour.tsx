"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, LayoutDashboard, Search, Zap, Bookmark } from "lucide-react";

const STEPS = [
  { icon: LayoutDashboard, title: "Welcome to NEPSE.io", description: "Your all-in-one Nepal Stock Exchange analytics platform. Let's take a quick tour!", target: "" },
  { icon: Search, title: "Stock Screener", description: "Filter 124+ companies by P/E, RSI, EPS, sector, and 30+ indicators. Find opportunities fast.", target: "/screener" },
  { icon: Zap, title: "Paper Trading", description: "Practice trading with Rs 10M virtual money. Test strategies risk-free before going live.", target: "/paper-trading" },
  { icon: Bookmark, title: "Watchlist & Alerts", description: "Track your favorite stocks and get notified when price targets are hit.", target: "/watchlist" },
];

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem("nepse_onboarding_done");
    if (!dismissed) setShow(true);
  }, []);

  const finish = () => {
    localStorage.setItem("nepse_onboarding_done", "true");
    setShow(false);
  };

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={finish} />
      <div className="relative card-3d p-8 w-full max-w-md text-center cmd-content">
        <button onClick={finish} className="absolute top-4 right-4 text-muted-theme hover:text-primary-theme">
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#E8B830] flex items-center justify-center pulse-glow">
            <Icon className="h-8 w-8 text-primary-theme" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-primary-theme mb-2">{current.title}</h2>
        <p className="text-xs text-muted-theme leading-relaxed mb-6">{current.description}</p>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-accent-theme" : i < step ? "w-1.5 bg-accent-theme/50" : "w-1.5 bg-kbd-theme"}`} />
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={finish} className="flex-1 py-2 rounded-lg text-xs font-medium text-muted-theme hover:text-primary-theme border border-theme transition-colors">
            Skip Tour
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 py-2 rounded-lg text-xs font-medium text-primary-theme bg-accent-theme hover:bg-accent-theme transition-colors flex items-center justify-center gap-1">
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button onClick={finish} className="flex-1 py-2 rounded-lg text-xs font-medium text-primary-theme bg-green-theme hover:bg-[#16a34a] transition-colors">
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
