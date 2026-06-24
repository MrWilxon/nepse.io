export const Typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "600" as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: "500" as const, letterSpacing: 0.3 },
  price: { fontSize: 16, fontWeight: "600" as const, fontVariant: ["tabular-nums"] as any },
  priceLarge: { fontSize: 24, fontWeight: "700" as const, fontVariant: ["tabular-nums"] as any },
  button: { fontSize: 15, fontWeight: "600" as const, letterSpacing: 0.2 },
  buttonSmall: { fontSize: 13, fontWeight: "600" as const },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5 },
} as const;
