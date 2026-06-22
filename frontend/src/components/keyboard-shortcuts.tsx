"use client";

import { useState, useEffect, useCallback } from "react";
import { Keyboard, X, Zap } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["Cmd", "K"], description: "Open command palette", category: "Navigation" },
  { keys: ["/"], description: "Search pages", category: "Navigation" },
  { keys: ["Esc"], description: "Close modal / panel", category: "Navigation" },
  { keys: ["G", "D"], description: "Go to Dashboard", category: "Navigation" },
  { keys: ["G", "W"], description: "Go to Watchlist", category: "Navigation" },
  { keys: ["G", "S"], description: "Go to Screener", category: "Navigation" },
  { keys: ["G", "B"], description: "Go to Backtest", category: "Navigation" },
  { keys: ["G", "P"], description: "Go to Portfolio", category: "Navigation" },
  { keys: ["T"], description: "Toggle dark/light theme", category: "Appearance" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "Help" },
  { keys: ["1-9"], description: "Switch sidebar sections", category: "Navigation" },
  { keys: ["W", "A"], description: "Add to watchlist", category: "Actions" },
];

export default function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [showHelp, setShowHelp] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      if (e.key === "Escape") {
        setShowHelp(false);
        setPendingKey(null);
        return;
      }

      if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("nepse_theme", next);
        showToast(`Switched to ${next} mode`);
        return;
      }

      if (pendingKey) {
        const combo = `${pendingKey}${e.key.toLowerCase()}`;
        const shortcuts: Record<string, string> = {
          gd: "/",
          gw: "/watchlist",
          gs: "/screener",
          gb: "/backtest",
          gp: "/portfolio",
        };
        if (shortcuts[combo]) {
          window.location.href = shortcuts[combo];
        }
        setPendingKey(null);
        return;
      }

      if (e.key === "g") {
        setPendingKey("g");
        setTimeout(() => setPendingKey(null), 1000);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pendingKey, showToast]);

  return (
    <>
      {children}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2.5 shadow-2xl">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--text-primary)]">{toast}</span>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowHelp(false)} />
          <div className="relative w-full max-w-lg card-3d overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-6 py-4">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="rounded-lg p-1 text-[var(--text-dim)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-6">
              {["Navigation", "Appearance", "Actions", "Help"].map((cat) => {
                const catShortcuts = SHORTCUTS.filter((s) => s.category === cat);
                if (catShortcuts.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)]">{cat}</h3>
                    <div className="space-y-1.5">
                      {catShortcuts.map((s, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--bg-hover)]">
                          <span className="text-sm text-[var(--text-body)]">{s.description}</span>
                          <div className="flex gap-1">
                            {s.keys.map((k, j) => (
                              <kbd key={j} className="rounded bg-[var(--bg-kbd)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
