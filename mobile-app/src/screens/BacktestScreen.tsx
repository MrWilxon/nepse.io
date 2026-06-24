import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { runBacktest, BacktestResult } from "../services/api";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { EmptyState } from "../components/ui/EmptyState";
import { GaugeChart } from "../components/charts/GaugeChart";
import { formatPrice, formatPercent } from "../lib/format";
import { hapticLight, hapticSuccess, hapticError } from "../lib/haptics";
import { useRouter } from "expo-router";

const STRATEGIES = [
  { value: "sma", label: "SMA Crossover", icon: "trending-up" },
  { value: "rsi", label: "RSI", icon: "pulse" },
  { value: "macd", label: "MACD", icon: "analytics" },
];

export default function BacktestScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [strategy, setStrategy] = useState("sma");
  const [symbol, setSymbol] = useState("NABIL");
  const [initialCapital, setInitialCapital] = useState("1000000");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    hapticLight();
    try {
      const data = await runBacktest(symbol.toUpperCase(), strategy, parseInt(initialCapital) || 1000000);
      if (data) {
        setResult(data);
        hapticSuccess();
      } else {
        setError("Backtest failed. Please try again.");
        hapticError();
      }
    } catch (e) {
      setError("Network error. Check your connection.");
      hapticError();
    } finally {
      setRunning(false);
    }
  }, [symbol, strategy, initialCapital]);

  // Generate equity curve data points from trades
  const equityCurve = result?.trades.reduce<number[]>((acc, trade) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : parseInt(initialCapital) || 1000000;
    acc.push(last + trade.pnl);
    return acc;
  }, []) || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg.primary }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader
        title={t("backtest.title")}
        leftIcon="chevron-back"
        onLeftPress={() => router.back()}
      />

      {/* Strategy Selection */}
      <Text style={[styles.label, { color: colors.text.secondary }]}>{t("backtest.strategy")}</Text>
      <View style={styles.strategyRow}>
        {STRATEGIES.map((s) => (
          <TouchableOpacity
            key={s.value}
            onPress={() => { setStrategy(s.value); hapticLight(); }}
            style={[styles.strategyBtn, {
              backgroundColor: strategy === s.value ? colors.accent.goldBg : colors.bg.elevated,
              borderColor: strategy === s.value ? colors.accent.gold : colors.border.default,
            }]}
          >
            <Ionicons name={s.icon as any} size={18} color={strategy === s.value ? colors.accent.gold : colors.text.secondary} />
            <Text style={[styles.strategyText, { color: strategy === s.value ? colors.accent.gold : colors.text.secondary }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Symbol Input */}
      <Text style={[styles.label, { color: colors.text.secondary }]}>{t("backtest.symbol")}</Text>
      <TextInput
        style={[styles.input, { color: colors.text.primary, backgroundColor: colors.bg.input, borderColor: colors.border.default }]}
        value={symbol}
        onChangeText={setSymbol}
        placeholder="NABIL"
        placeholderTextColor={colors.text.tertiary}
        autoCapitalize="characters"
      />

      {/* Capital Input */}
      <Text style={[styles.label, { color: colors.text.secondary }]}>{t("backtest.capital")}</Text>
      <TextInput
        style={[styles.input, { color: colors.text.primary, backgroundColor: colors.bg.input, borderColor: colors.border.default }]}
        value={initialCapital}
        onChangeText={setInitialCapital}
        keyboardType="numeric"
        placeholder="1000000"
        placeholderTextColor={colors.text.tertiary}
      />

      {/* Run Button */}
      <Button
        title={running ? "Running..." : t("backtest.runBacktest")}
        onPress={handleRun}
        variant="primary"
        fullWidth
        loading={running}
        icon={!running ? <Ionicons name="play" size={18} color={colors.text.inverse} /> : undefined}
      />

      {/* Error */}
      {error && (
        <Card style={[styles.errorCard, { borderColor: colors.semantic.loss }]}>
          <Text style={[styles.errorText, { color: colors.semantic.loss }]}>{error}</Text>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Equity Curve */}
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Equity Curve</Text>
          <Card style={styles.chartCard}>
            <View style={styles.equityChart}>
              {equityCurve.length > 0 && (
                <>
                  {/* Simple bar visualization */}
                  <View style={styles.equityBars}>
                    {equityCurve.slice(-30).map((val, i) => {
                      const max = Math.max(...equityCurve);
                      const min = Math.min(...equityCurve);
                      const range = max - min || 1;
                      const height = ((val - min) / range) * 120 + 20;
                      const isPositive = i === 0 || val >= equityCurve[Math.max(0, equityCurve.indexOf(val) - 1)];
                      return (
                        <View
                          key={i}
                          style={[
                            styles.equityBar,
                            {
                              height,
                              backgroundColor: isPositive ? colors.semantic.profit : colors.semantic.loss,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                  <View style={[styles.equityLabels, { borderTopColor: colors.border.subtle }]}>
                    <Text style={[styles.equityLabel, { color: colors.text.tertiary }]}>Start: {formatPrice(parseInt(initialCapital))}</Text>
                    <Text style={[styles.equityLabel, { color: colors.accent.gold }]}>End: {formatPrice(result.finalValue)}</Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Stats Grid */}
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Performance</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Ionicons name="trending-up" size={20} color={result.totalReturn >= 0 ? colors.semantic.profit : colors.semantic.loss} />
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{t("backtest.return")}</Text>
              <Text style={[styles.statValue, { color: result.totalReturn >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                {formatPercent(result.totalReturn)}
              </Text>
            </Card>
            <Card style={styles.statCard}>
              <Ionicons name="speedometer" size={20} color={colors.semantic.info} />
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{t("backtest.sharpe")}</Text>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{result.sharpeRatio.toFixed(2)}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Ionicons name="arrow-down" size={20} color={colors.semantic.loss} />
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{t("backtest.maxDD")}</Text>
              <Text style={[styles.statValue, { color: colors.semantic.loss }]}>{formatPercent(-Math.abs(result.maxDrawdown))}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={20} color={colors.semantic.profit} />
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>{t("backtest.winRate")}</Text>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{result.winRate.toFixed(1)}%</Text>
            </Card>
          </View>

          {/* Gauges */}
          <View style={styles.gaugeRow}>
            <GaugeChart value={result.winRate} label={t("backtest.winRate")} />
            <GaugeChart value={Math.min(100, Math.max(0, (result.sharpeRatio + 1) * 33))} label={t("backtest.sharpe")} />
          </View>

          {/* Trade Log */}
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
            {t("backtest.trades")} ({result.trades.length})
          </Text>
          <Card style={styles.tradeLogCard}>
            {result.trades.slice(-20).reverse().map((trade, i) => (
              <View key={i} style={[styles.tradeRow, i < Math.min(result.trades.length, 20) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border.subtle }]}>
                <View style={[styles.tradeTypeBadge, {
                  backgroundColor: trade.action === "BUY" ? colors.semantic.profitBg : colors.semantic.lossBg,
                }]}>
                  <Text style={[styles.tradeType, { color: trade.action === "BUY" ? colors.semantic.profit : colors.semantic.loss }]}>
                    {trade.action}
                  </Text>
                </View>
                <View style={styles.tradeInfo}>
                  <Text style={[styles.tradeDate, { color: colors.text.secondary }]}>{trade.date}</Text>
                  <Text style={[styles.tradeDetail, { color: colors.text.tertiary }]}>
                    {trade.shares} shares @ {formatPrice(trade.price)}
                  </Text>
                </View>
                <Text style={[styles.tradePnl, { color: trade.pnl >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                  {trade.pnl >= 0 ? "+" : ""}{formatPrice(trade.pnl)}
                </Text>
              </View>
            ))}
          </Card>

          {/* Export */}
          <Button
            title="Export Results"
            onPress={() => {}}
            variant="secondary"
            fullWidth
            icon={<Ionicons name="download-outline" size={16} color={colors.accent.gold} />}
            style={{ marginTop: 16 }}
          />
        </>
      )}

      {/* Empty State */}
      {!result && !running && !error && (
        <EmptyState
          icon={<Ionicons name="analytics-outline" size={32} color={colors.text.tertiary} />}
          title="Strategy Backtesting"
          description="Select a strategy, enter a stock symbol, and run the backtest to see results"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  strategyRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  strategyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  strategyText: { fontSize: 12, fontWeight: "600" },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 4,
  },
  errorCard: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, textAlign: "center" },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  chartCard: { padding: 16 },
  equityChart: { minHeight: 160 },
  equityBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 140,
  },
  equityBar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 4,
  },
  equityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  equityLabel: { fontSize: 11, fontWeight: "600" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  statLabel: { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] as any },
  gaugeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginBottom: 8,
  },
  tradeLogCard: { padding: 0 },
  tradeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  tradeTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tradeType: { fontSize: 10, fontWeight: "700" },
  tradeInfo: { flex: 1 },
  tradeDate: { fontSize: 12 },
  tradeDetail: { fontSize: 11, marginTop: 2 },
  tradePnl: { fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] as any },
});
