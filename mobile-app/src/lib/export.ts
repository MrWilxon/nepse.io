import { formatPrice, formatPercent, formatDateFull } from "./format";

export function generateWatchlistCSV(
  items: { symbol: string; name: string; price?: number; change?: number }[]
): string {
  const header = "Symbol,Name,Price (Rs),Change (%)\n";
  const rows = items
    .map(
      (item) =>
        `${item.symbol},"${item.name}",${item.price?.toFixed(2) || "N/A"},${item.change?.toFixed(2) || "N/A"}`
    )
    .join("\n");
  return header + rows;
}

export function generatePortfolioCSV(
  holdings: { symbol: string; name: string; quantity: number; avgPrice: number; currentPrice: number }[],
  cash: number
): string {
  const header = "Symbol,Shares,Avg Price (Rs),Current Price (Rs),Total Value (Rs),P&L (Rs),P&L (%)\n";
  const rows = holdings
    .map((h) => {
      const value = h.quantity * h.currentPrice;
      const pnl = (h.currentPrice - h.avgPrice) * h.quantity;
      const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
      return `${h.symbol},${h.quantity},${h.avgPrice.toFixed(2)},${h.currentPrice.toFixed(2)},${value.toFixed(2)},${pnl.toFixed(2)},${pnlPct.toFixed(2)}`;
    })
    .join("\n");
  const totalValue = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0) + cash;
  const footer = `\nTotal Portfolio Value: Rs ${totalValue.toFixed(2)}\nCash Balance: Rs ${cash.toFixed(2)}\n`;
  return header + rows + footer;
}

export function generateTradesCSV(
  trades: { id: string; symbol: string; type: string; quantity: number; price: number; date: string }[]
): string {
  const header = "Date,Symbol,Type,Quantity,Price (Rs),Total (Rs)\n";
  const rows = trades
    .map(
      (tx) =>
        `${tx.date.split("T")[0]},${tx.symbol},${tx.type.toUpperCase()},${tx.quantity},${tx.price.toFixed(2)},${(tx.quantity * tx.price).toFixed(2)}`
    )
    .join("\n");
  return header + rows;
}

export function generateStockDataCSV(
  data: { date: string; open: number; high: number; low: number; close: number; volume: number; turnover: number }[],
  symbol: string
): string {
  const header = "Date,Open,High,Low,Close,Volume,Turnover\n";
  const rows = data
    .map(
      (d) =>
        `${d.date},${d.open.toFixed(2)},${d.high.toFixed(2)},${d.low.toFixed(2)},${d.close.toFixed(2)},${d.volume},${d.turnover.toFixed(2)}`
    )
    .join("\n");
  return `${header}${rows}`;
}

export function generateBacktestCSV(
  trades: { date: string; action: string; price: number; shares: number; pnl: number }[],
  stats: { totalReturn: number; sharpeRatio: number; maxDrawdown: number; winRate: number }
): string {
  const header = "Date,Action,Price (Rs),Shares,P&L (Rs)\n";
  const rows = trades
    .map(
      (t) =>
        `${t.date},${t.action},${t.price.toFixed(2)},${t.shares},${t.pnl.toFixed(2)}`
    )
    .join("\n");
  const footer = `\n--- Summary ---\nTotal Return: ${stats.totalReturn.toFixed(2)}%\nSharpe Ratio: ${stats.sharpeRatio.toFixed(2)}\nMax Drawdown: ${stats.maxDrawdown.toFixed(2)}%\nWin Rate: ${stats.winRate.toFixed(1)}%\n`;
  return header + rows + footer;
}

export function generateTaxReportCSV(
  transactions: {
    symbol: string;
    buyDate: string;
    sellDate: string;
    buyPrice: number;
    sellPrice: number;
    quantity: number;
    pnl: number;
    holdingDays: number;
  }[]
): string {
  const header = "Symbol,Buy Date,Sell Date,Buy Price,Sell Price,Qty,P&L,Holding Days,Type\n";
  const rows = transactions
    .map((t) => {
      const type = t.holdingDays <= 365 ? "Short-term" : "Long-term";
      return `${t.symbol},${t.buyDate},${t.sellDate},${t.buyPrice.toFixed(2)},${t.sellPrice.toFixed(2)},${t.quantity},${t.pnl.toFixed(2)},${t.holdingDays},${type}`;
    })
    .join("\n");
  const totalPnl = transactions.reduce((s, t) => s + t.pnl, 0);
  const footer = `\nTotal P&L: Rs ${totalPnl.toFixed(2)}\n`;
  return header + rows + footer;
}

export async function downloadCSV(content: string, filename: string): Promise<void> {
  // On mobile, share the CSV as a file
  const Sharing = await import("expo-sharing");
  const FileSystem = await import("expo-file-system");

  const path = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.default.isAvailableAsync()) {
    await Sharing.default.shareAsync(path, {
      mimeType: "text/csv",
      dialogTitle: `Export ${filename}`,
    });
  }
}
