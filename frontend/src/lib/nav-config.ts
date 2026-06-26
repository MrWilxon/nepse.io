import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BarChart3,
  GitCompare,
  FileText,
  TrendingUp,
  GitBranch,
  Search,
  RotateCcw,
  AlertTriangle,
  BrainCircuit,
  Bookmark,
  Zap,
  Activity,
  Users,
  Heart,
  Building2,
  Download,
  Calculator,
  Layers,
  Target,
  LineChart,
  Radio,
  Wallet,
  BookOpen,
  PieChart,
  Settings,
  Bell,
  MessageSquare,
  Globe,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export function getNavCategories(t: (key: string) => string): NavCategory[] {
  return [
    {
      id: "overview",
      label: t("navCategory.overview"),
      icon: PieChart,
      items: [
        { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: "/sectors", label: t("nav.sectors"), icon: BarChart3 },
        { href: "/compare", label: t("nav.compare"), icon: GitCompare },
      ],
    },
    {
      id: "market-data",
      label: t("navCategory.marketData"),
      icon: Layers,
      items: [
        { href: "/fundamentals", label: t("nav.fundamentals"), icon: TrendingUp },
        { href: "/fundamental-overview", label: t("nav.fundamentalOverview"), icon: FileText },
        { href: "/floorsheet", label: t("nav.floorSheet"), icon: FileText },
        { href: "/earnings", label: t("nav.earnings"), icon: FileText },
        { href: "/announcements", label: t("nav.announcements"), icon: Bell },
        { href: "/ipo", label: t("nav.ipo"), icon: FileText },
        { href: "/bulk-ipo", label: t("nav.bulkIpo"), icon: Layers },
      ],
    },
    {
      id: "brokers",
      label: t("navCategory.brokers"),
      icon: Users,
      items: [
        { href: "/brokers", label: t("nav.topBrokers"), icon: Users },
        { href: "/brokers/analysis", label: t("nav.brokerAnalysis"), icon: Activity },
      ],
    },
    {
      id: "technical",
      label: t("navCategory.technical"),
      icon: LineChart,
      items: [
        { href: "/indicators", label: t("nav.indicators"), icon: GitBranch },
        { href: "/fibonacci", label: t("nav.fibonacci"), icon: TrendingUp },
        { href: "/volume-profile", label: t("nav.volumeProfile"), icon: BarChart3 },
        { href: "/breadth", label: t("nav.marketBreadth"), icon: Activity },
        { href: "/timeframes", label: t("nav.timeframes"), icon: RotateCcw },
        { href: "/patterns", label: t("nav.chartPatterns"), icon: Search },
        { href: "/rotation", label: t("nav.sectorRotation"), icon: RotateCcw },
      ],
    },
    {
      id: "research",
      label: t("navCategory.research"),
      icon: BrainCircuit,
      items: [
        { href: "/screener", label: t("nav.stockScreener"), icon: Search },
        { href: "/backtest", label: t("nav.backtesting"), icon: TrendingUp },
        { href: "/correlation", label: t("nav.correlation"), icon: GitBranch },
        { href: "/predict", label: t("nav.pricePrediction"), icon: BrainCircuit },
        { href: "/analysts", label: t("nav.analysts"), icon: Users },
        { href: "/sentiment", label: t("nav.marketSentiment"), icon: Heart },
        { href: "/community", label: t("nav.community"), icon: MessageSquare },
      ],
    },
    {
      id: "portfolio",
      label: t("navCategory.portfolio"),
      icon: Wallet,
      items: [
        { href: "/paper-trading", label: t("nav.paperTrading"), icon: Zap },
        { href: "/portfolio", label: t("nav.portfolio"), icon: Wallet },
        { href: "/holdings", label: t("nav.institutionalHoldings"), icon: Building2 },
        { href: "/watchlist", label: t("nav.watchlist"), icon: Bookmark },
        { href: "/trade-journal", label: t("nav.tradeJournal"), icon: BookOpen },
      ],
    },
    {
      id: "trading",
      label: t("navCategory.trading"),
      icon: Target,
      items: [
        { href: "/order-book", label: t("nav.orderDepth"), icon: BarChart3 },
        { href: "/risk-calculator", label: t("nav.riskCalculator"), icon: Calculator },
        { href: "/signal", label: t("nav.signal"), icon: Radio },
        { href: "/alerts", label: t("nav.technicalAlerts"), icon: AlertTriangle },
        { href: "/alerts-config", label: t("nav.targetAlerts"), icon: AlertTriangle },
      ],
    },
    {
      id: "reports",
      label: t("navCategory.reports"),
      icon: Settings,
      items: [
        { href: "/reports", label: t("nav.reports"), icon: Download },
        { href: "/tax-report", label: t("nav.taxReport"), icon: Calculator },
        { href: "/export", label: t("nav.dataExport"), icon: Download },
        { href: "/settings", label: t("nav.settings"), icon: Settings },
      ],
    },
  ];
}

export function getAllNavItems(categories: NavCategory[]): NavItem[] {
  return categories.flatMap((c) => c.items);
}

export interface FlatPage {
  href: string;
  label: string;
  icon: LucideIcon;
  category: string;
}

export function getFlatPages(t: (key: string) => string): FlatPage[] {
  return getNavCategories(t).flatMap((cat) =>
    cat.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
      category: cat.label,
    }))
  );
}

export const MOBILE_NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/screener", label: "Screener", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/settings", label: "More", icon: Settings },
];

export const MOBILE_MORE_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/sectors", label: "Sectors", icon: BarChart3 },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/indicators", label: "Indicators", icon: GitBranch },
  { href: "/backtest", label: "Backtest", icon: TrendingUp },
  { href: "/earnings", label: "Earnings", icon: FileText },
  { href: "/paper-trading", label: "Paper Trading", icon: Zap },
  { href: "/risk-calculator", label: "Risk Calc", icon: Calculator },
  { href: "/alerts", label: "Signals", icon: AlertTriangle },
  { href: "/export", label: "Export", icon: Download },
];

export const CATEGORY_SHORTCUTS: Record<number, string> = {
  1: "overview",
  2: "market-data",
  3: "brokers",
  4: "technical",
  5: "research",
  6: "portfolio",
  7: "trading",
  8: "reports",
};
