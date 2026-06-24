"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getFlatPages, type FlatPage } from "@/lib/nav-config";

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useI18n();

  const PAGES = useMemo(() => getFlatPages(t), [t]);

  const filtered = useMemo(() => {
    if (!query) return PAGES;
    const q = query.toLowerCase();
    return PAGES.filter(p => p.label.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.href.includes(q));
  }, [query, PAGES]);

  useEffect(() => { setSelectedIndex(0); }, [query]);
  useEffect(() => { if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && filtered[selectedIndex]) { router.push(filtered[selectedIndex].href); onClose(); }
      else if (e.key === "Escape") { onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex, router, onClose]);

  if (!open) return null;

  const grouped = filtered.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, FlatPage[]>);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60 cmd-overlay" onClick={onClose} />
      <div className="relative w-full max-w-lg card-3d cmd-content overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-theme">
          <Search className="h-4 w-4 text-muted-theme" />
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, features..."
            className="flex-1 bg-transparent text-sm text-primary-theme placeholder-text-placeholder outline-none" />
          <kbd className="text-[10px] text-muted-theme bg-kbd-theme px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, pages]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-theme">{category}</div>
              {pages.map(page => {
                const globalIdx = filtered.indexOf(page);
                const Icon = page.icon;
                return (
                  <button key={page.href} onClick={() => { router.push(page.href); onClose(); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${globalIdx === selectedIndex ? "bg-accent-theme text-accent-theme" : "text-body-theme hover:bg-hover-theme hover:text-primary-theme"}`}>
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{page.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-50" />
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-theme">No results for &quot;{query}&quot;</div>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-theme text-[10px] text-muted-theme">
          <span><kbd className="bg-kbd-theme px-1 py-0.5 rounded">↑↓</kbd> Navigate</span>
          <span><kbd className="bg-kbd-theme px-1 py-0.5 rounded">Enter</kbd> Open</span>
          <span><kbd className="bg-kbd-theme px-1 py-0.5 rounded">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
