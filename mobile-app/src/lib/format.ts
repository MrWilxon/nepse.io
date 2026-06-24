export function formatPrice(value: number): string {
  return `Rs ${value.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPriceCompact(value: number): string {
  if (value >= 1_000_000_000) return `Rs ${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `Rs ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `Rs ${(value / 1_000).toFixed(1)}K`;
  return `Rs ${value.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-NP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return mins <= 0 ? "Just now" : `${mins}m ago`;
  }
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return "Yesterday";

  const day = date.getDate();
  const month = date.toLocaleString("en", { month: "short" });
  const year = date.getFullYear();
  const currentYear = now.getFullYear();

  return year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
