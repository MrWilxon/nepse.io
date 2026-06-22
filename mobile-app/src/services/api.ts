const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export interface CompanySummary {
  symbol: string;
  name: string;
  ltp: number;
  percentChange: number;
  volume: number;
  sector: string;
}

export async function fetchCompanies(): Promise<CompanySummary[]> {
  const res = await fetch(`${API_BASE}/api/companies`);
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export async function fetchCompanyDetail(symbol: string) {
  const res = await fetch(`${API_BASE}/api/company/${symbol}`);
  if (!res.ok) throw new Error("Failed to fetch company");
  return res.json();
}

export async function fetchSectors() {
  const res = await fetch(`${API_BASE}/api/sectors`);
  if (!res.ok) throw new Error("Failed to fetch sectors");
  return res.json();
}
