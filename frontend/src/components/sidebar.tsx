"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Bookmark,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getNavCategories, getAllNavItems, CATEGORY_SHORTCUTS, type NavItem, type NavCategory } from "@/lib/nav-config";

function SidebarLink({ link, pathname, isFav, onToggleFav, onClick }: {
  link: NavItem;
  pathname: string | null;
  isFav: boolean;
  onToggleFav: (href: string, e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const isActive = pathname === link.href || (pathname?.startsWith(link.href + "/") && link.href !== "/");
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-200 ${
        isActive ? "bg-accent-theme text-accent-theme" : "text-body-theme hover:bg-hover-theme hover:text-primary-theme"
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-accent-theme" : "text-muted-theme"}`} />
      <span className="flex-1 truncate">{link.label}</span>
      <button
        onClick={(e) => onToggleFav(link.href, e)}
        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isFav ? "!opacity-100 text-accent-theme" : "text-muted-theme hover:text-accent-theme"}`}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <Bookmark className={`h-3 w-3 ${isFav ? "fill-current" : ""}`} />
      </button>
    </Link>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const { t } = useI18n();
  const CATEGORIES = getNavCategories(t);
  const ALL_ITEMS = getAllNavItems(CATEGORIES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nepse_favorites");
      if (saved) setFavorites(JSON.parse(saved));
      const savedCols = localStorage.getItem("nepse_collapsed");
      if (savedCols) setCollapsed(JSON.parse(savedCols));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("nepse_favorites", JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  useEffect(() => {
    try { localStorage.setItem("nepse_collapsed", JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => { onClose(); }, [pathname]);

  const toggleFav = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(href) ? prev.filter((f) => f !== href) : [...prev, href]));
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const scrollToCategory = useCallback((categoryId: string) => {
    const el = document.getElementById(`sidebar-cat-${categoryId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 8) {
          const catId = CATEGORY_SHORTCUTS[num];
          if (catId) {
            e.preventDefault();
            setCollapsed((prev) => ({ ...prev, [catId]: false }));
            setTimeout(() => scrollToCategory(catId), 50);
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scrollToCategory]);

  const q = searchQuery.toLowerCase().trim();
  const isSearching = q.length > 0;

  const filteredCategories = isSearching
    ? CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q)
        ),
      })).filter((cat) => cat.items.length > 0)
    : CATEGORIES;

  const favItems = isSearching
    ? filteredCategories.flatMap((c) => c.items).filter((item) => favorites.includes(item.href))
    : ALL_ITEMS.filter((item) => favorites.includes(item.href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "var(--overlay)" }} onClick={onClose} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col border-r transition-transform duration-300 lg:translate-x-0 overflow-y-auto bg-surface border-theme ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-theme">
          <img src="/icon.svg" alt="NEPSE.io" className="h-9 w-9 rounded-xl shadow-lg shadow-[#D4A017]/20" />
          <div className="flex-1">
            <div className="text-sm font-bold tracking-wide text-primary-theme">NEPSE<span className="text-accent-theme">.io</span></div>
            <div className="text-[10px] text-muted-theme font-medium">Stock Analytics</div>
          </div>
          <button onClick={onClose} className="lg:hidden text-dim-theme hover:text-primary-theme">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-3 pt-3 pb-1 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input-theme bg-input-theme py-2 pl-9 pr-8 text-xs text-primary-theme placeholder-text-placeholder outline-none focus:border-accent-theme transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-theme hover:text-primary-theme">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setShowFavsOnly(false); setSearchQuery(""); }}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${!showFavsOnly ? "bg-accent-theme text-accent-theme border border-accent-border" : "text-muted-theme hover:text-primary-theme border border-transparent"}`}>
              All Pages
            </button>
            <button onClick={() => { setShowFavsOnly(true); setSearchQuery(""); }}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${showFavsOnly ? "bg-accent-theme text-accent-theme border border-accent-border" : "text-muted-theme hover:text-primary-theme border border-transparent"}`}>
              <Bookmark className="h-3 w-3" /> Favorites ({favorites.length})
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {/* Favorites only view */}
          {showFavsOnly && !isSearching && (
            <div className="space-y-0.5">
              {favorites.length === 0 && (
                <div className="px-2 py-6 text-center">
                  <Bookmark className="h-5 w-5 text-border-theme mx-auto mb-2" />
                  <p className="text-[10px] text-muted-theme">No favorites yet</p>
                  <p className="text-[10px] text-muted-theme">Click the bookmark icon to add</p>
                </div>
              )}
              {favItems.map((item) => (
                <SidebarLink key={item.href} link={item} pathname={pathname} isFav onToggleFav={toggleFav} onClick={onClose} />
              ))}
            </div>
          )}

          {/* Favorites bar in default view */}
          {!showFavsOnly && !isSearching && favorites.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <Bookmark className="h-3 w-3 text-accent-theme" />
                <span className="text-[10px] font-semibold text-accent-theme uppercase tracking-wider">Favorites</span>
              </div>
              <div className="space-y-0.5">
                {favItems.slice(0, 5).map((item) => (
                  <SidebarLink key={item.href} link={item} pathname={pathname} isFav onToggleFav={toggleFav} onClick={onClose} />
                ))}
                {favItems.length > 5 && (
                  <button onClick={() => setShowFavsOnly(true)} className="w-full text-left px-3 py-1 text-[10px] text-muted-theme hover:text-accent-theme">
                    View all {favorites.length} favorites...
                  </button>
                )}
              </div>
              <div className="mx-2 my-2 border-t border-theme" />
            </div>
          )}

          {/* Search results */}
          {isSearching && (
            <div className="space-y-0.5">
              {filteredCategories.length === 0 && (
                <div className="px-2 py-6 text-center">
                  <Search className="h-5 w-5 text-border-theme mx-auto mb-2" />
                  <p className="text-[10px] text-muted-theme">No results for &quot;{searchQuery}&quot;</p>
                </div>
              )}
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="mb-2">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <span className="cat-icon">
                      <cat.icon className="h-3 w-3 text-muted-theme" />
                    </span>
                    <span className="text-[10px] font-semibold text-muted-theme uppercase tracking-wider">{cat.label}</span>
                  </div>
                  {cat.items.map((item) => (
                    <SidebarLink key={item.href} link={item} pathname={pathname} isFav={favorites.includes(item.href)} onToggleFav={toggleFav} onClick={onClose} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Categorized navigation */}
          {!showFavsOnly && !isSearching && (
            <div className="space-y-1">
              {CATEGORIES.map((cat, idx) => {
                const isCol = collapsed[cat.id];
                const hasActive = cat.items.some(
                  (item) => pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/")
                );
                return (
                  <div key={cat.id} id={`sidebar-cat-${cat.id}`}>
                    <button
                      onClick={() => toggleCollapse(cat.id)}
                      className={`sidebar-category ${hasActive ? "active" : ""}`}
                    >
                      <span className="cat-icon">
                        <cat.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 text-left">{cat.label}</span>
                      <kbd className="text-[9px] text-muted-theme bg-kbd-theme px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                        {idx + 1}
                      </kbd>
                      {isCol
                        ? <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
                        : <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50" />
                      }
                    </button>
                    {!isCol && (
                      <div className="space-y-0.5">
                        {cat.items.map((item) => (
                          <SidebarLink key={item.href} link={item} pathname={pathname} isFav={favorites.includes(item.href)} onToggleFav={toggleFav} onClick={onClose} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="sticky bottom-0 border-t border-theme p-3 bg-surface">
          <div className="text-[9px] text-muted-theme text-center">
            <kbd className="bg-kbd-theme px-1 py-0.5 rounded">Ctrl+1-8</kbd> jump to category
          </div>
        </div>
      </aside>
    </>
  );
}
