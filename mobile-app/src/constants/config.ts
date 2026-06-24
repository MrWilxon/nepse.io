export const Config = {
  API_BASE: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000",
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:4000/ws",
  APP_NAME: "NEPSE Analytics",
  VERSION: "1.0.0",
  CURRENCY: "Rs",
  MAX_WATCHLIST: 50,
  REFRESH_INTERVAL: 30000,
} as const;
