export const DarkTheme = {
  bg: {
    primary: "#09090b",
    card: "#13131a",
    elevated: "#1a1a25",
    input: "#1a1a25",
    overlay: "rgba(0,0,0,0.6)",
  },
  border: {
    default: "#27272a",
    subtle: "#1e1e2a",
    focus: "#D4A017",
  },
  text: {
    primary: "#ffffff",
    secondary: "#8892a0",
    tertiary: "#52525b",
    inverse: "#09090b",
  },
  accent: {
    gold: "#D4A017",
    goldBg: "rgba(212,160,23,0.1)",
    goldMuted: "rgba(212,160,23,0.2)",
  },
  semantic: {
    profit: "#22c55e",
    profitBg: "rgba(34,197,94,0.1)",
    loss: "#ef4444",
    lossBg: "rgba(239,68,68,0.1)",
    warning: "#f59e0b",
    warningBg: "rgba(245,158,11,0.1)",
    info: "#3b82f6",
    infoBg: "rgba(59,130,246,0.1)",
  },
  skeleton: {
    base: "#1a1a25",
    highlight: "#27272a",
  },
} as const;

export const LightTheme = {
  bg: {
    primary: "#f5f5f7",
    card: "#ffffff",
    elevated: "#ffffff",
    input: "#f0f0f2",
    overlay: "rgba(0,0,0,0.4)",
  },
  border: {
    default: "#e5e5ea",
    subtle: "#f0f0f2",
    focus: "#B8860B",
  },
  text: {
    primary: "#1a1a2e",
    secondary: "#6b7280",
    tertiary: "#9ca3af",
    inverse: "#ffffff",
  },
  accent: {
    gold: "#B8860B",
    goldBg: "rgba(184,134,11,0.1)",
    goldMuted: "rgba(184,134,11,0.15)",
  },
  semantic: {
    profit: "#16a34a",
    profitBg: "rgba(22,163,74,0.1)",
    loss: "#dc2626",
    lossBg: "rgba(220,38,38,0.1)",
    warning: "#d97706",
    warningBg: "rgba(217,119,6,0.1)",
    info: "#2563eb",
    infoBg: "rgba(37,99,235,0.1)",
  },
  skeleton: {
    base: "#e5e5ea",
    highlight: "#f0f0f2",
  },
} as const;

export type ThemeColors = typeof DarkTheme;
