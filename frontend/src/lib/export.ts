import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = String(val ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(
  data: Record<string, any>[],
  title: string,
  filename: string
) {
  if (!data.length) return;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(18);
  doc.setTextColor(212, 160, 23);
  doc.text(title, 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
  doc.text(`Records: ${data.length}`, 14, 34);

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      return val !== null && val !== undefined ? String(val) : "";
    })
  );

  autoTable(doc, {
    startY: 38,
    head: [headers],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 30, 30],
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [212, 160, 23],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 38, left: 14, right: 14 },
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function exportCompanyReport(
  symbol: string,
  stats: Record<string, any>,
  priceData: Record<string, any>[],
  indicators?: Record<string, any>[]
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(22);
  doc.setTextColor(212, 160, 23);
  doc.text(`${symbol} - Stock Analysis Report`, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`NEPSE Stock Exchange · Generated ${new Date().toLocaleDateString()}`, 14, 28);

  // Stats section
  let y = 40;
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Key Statistics", 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const statEntries = [
    ["Latest Close", `Rs ${(stats.latestClose || 0).toLocaleString()}`],
    ["All Time High", `Rs ${(stats.allTimeHigh || 0).toLocaleString()}`],
    ["All Time Low", `Rs ${(stats.allTimeLow || 0).toLocaleString()}`],
    ["Average Volume", (stats.avgVolume || 0).toLocaleString()],
    ["Total Records", (stats.totalRecords || 0).toLocaleString()],
    ["Data Range", `${stats.firstDate || "N/A"} to ${stats.lastDate || "N/A"}`],
  ];

  for (const [label, value] of statEntries) {
    doc.text(`${label}:`, 14, y);
    doc.text(String(value), 70, y);
    y += 6;
  }

  // Price table
  y += 6;
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Recent Price History", 14, y);
  y += 4;

  const recentData = priceData.slice(-20);
  const priceHeaders = [["Date", "Open", "High", "Low", "Close", "Change", "Volume"]];
  const priceRows = recentData.map((r) => [
    r.date, String(r.open), String(r.high), String(r.low), String(r.close),
    String(r.change), String(r.volume),
  ]);

  autoTable(doc, {
    startY: y,
    head: priceHeaders,
    body: priceRows,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 30, 30] },
    headStyles: { fillColor: [212, 160, 23], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  // Indicators page if available
  if (indicators && indicators.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Technical Indicators", 14, 20);

    const latest = indicators[indicators.length - 1];
    const indEntries = [
      ["RSI (14)", latest.rsi],
      ["MACD", latest.macd],
      ["MACD Signal", latest.macdSignal],
      ["SMA 20", latest.sma20],
      ["SMA 50", latest.sma50],
      ["EMA 12", latest.ema12],
      ["EMA 26", latest.ema26],
      ["BB Upper", latest.bbUpper],
      ["BB Lower", latest.bbLower],
    ].filter(([, v]) => v !== null && v !== undefined);

    let iy = 30;
    doc.setFontSize(9);
    for (const [label, value] of indEntries) {
      doc.text(`${label}:`, 14, iy);
      doc.text(String(typeof value === "number" ? value.toFixed(2) : value), 70, iy);
      iy += 6;
    }

    // Indicator history table
    iy += 6;
    doc.setFontSize(12);
    doc.text("Indicator History", 14, iy);
    iy += 4;

    const indData = indicators.slice(-15);
    const indHeaders = [["Date", "Close", "RSI", "MACD", "SMA20", "SMA50"]];
    const indRows = indData.map((r) => [
      r.date, String(r.close), r.rsi ? r.rsi.toFixed(2) : "-",
      r.macd ? r.macd.toFixed(2) : "-",
      r.sma20 ? r.sma20.toFixed(2) : "-",
      r.sma50 ? r.sma50.toFixed(2) : "-",
    ]);

    autoTable(doc, {
      startY: iy,
      head: indHeaders,
      body: indRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 30, 30] },
      headStyles: { fillColor: [212, 160, 23], textColor: [255, 255, 255], fontStyle: "bold" },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `NEPSE Analytics · Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${symbol}_analysis_report.pdf`);
}

export function exportTaxReport(
  summary: Record<string, any>,
  transactions: Record<string, any>[],
  fiscalYear: string
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(212, 160, 23);
  doc.text("Capital Gains Tax Report", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fiscal Year: ${fiscalYear} · NEPSE Stock Exchange`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

  // Summary
  let y = 46;
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Tax Summary", 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const summaryEntries = [
    ["Total Transactions", summary.totalTransactions],
    ["Total Gains", `Rs ${(summary.totalGains || 0).toLocaleString()}`],
    ["Total Losses", `Rs ${(summary.totalLosses || 0).toLocaleString()}`],
    ["Net P&L", `Rs ${(summary.netPnL || 0).toLocaleString()}`],
    ["Short-term Gains", `Rs ${(summary.shortTermGains || 0).toLocaleString()}`],
    ["Long-term Gains", `Rs ${(summary.longTermGains || 0).toLocaleString()}`],
    ["Short-term Losses", `Rs ${(summary.shortTermLosses || 0).toLocaleString()}`],
    ["Long-term Losses", `Rs ${(summary.longTermLosses || 0).toLocaleString()}`],
    ["Estimated Tax (5%)", `Rs ${(summary.taxLiability || 0).toLocaleString()}`],
  ];

  for (const [label, value] of summaryEntries) {
    doc.text(`${label}:`, 14, y);
    doc.text(String(value), 80, y);
    y += 6;
  }

  // Transaction table
  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Transaction Details", 14, y);
  y += 4;

  const txHeaders = [["Symbol", "Buy Date", "Sell Date", "Buy Price", "Sell Price", "Qty", "P&L", "Period"]];
  const txRows = transactions.map((t) => [
    t.symbol, t.buyDate, t.sellDate,
    `Rs ${t.buyPrice}`, `Rs ${t.sellPrice}`,
    String(t.quantity),
    `Rs ${t.pnl.toLocaleString()}`,
    t.holdingPeriod === "short_term" ? "Short" : "Long",
  ]);

  autoTable(doc, {
    startY: y,
    head: txHeaders,
    body: txRows,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 30, 30] },
    headStyles: { fillColor: [212, 160, 23], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      6: { fontStyle: "bold" },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `NEPSE Tax Report · Page ${i} of ${pageCount} · This is a computer-generated report for reference only`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`tax_report_${fiscalYear.replace("/", "-")}.pdf`);
}
