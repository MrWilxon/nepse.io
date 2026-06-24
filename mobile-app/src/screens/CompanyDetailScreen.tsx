import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { useWatchlistStore } from "../stores/useWatchlistStore";
import {
  fetchCompany, fetchCompanyStats, fetchIndicators, fetchDividends,
  CompanyDetail, CompanyStats, IndicatorData, DividendRecord, StockRecord
} from "../services/api";
import { CandlestickChart } from "../components/charts/CandlestickChart";
import { GaugeChart } from "../components/charts/GaugeChart";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { SkeletonCard } from "../components/ui/Skeleton";
import { formatPrice, formatPercent, formatVolume, formatDate } from "../lib/format";
import { hapticLight, hapticSuccess } from "../lib/haptics";

type Timeframe = "1M" | "3M" | "6M" | "1Y" | "ALL";

export default function CompanyDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { has, add, remove } = useWatchlistStore();

  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [indicators, setIndicators] = useState<IndicatorData[]>([]);
  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!symbol) return;
    try {
      const [d, s, i, div] = await Promise.all([
        fetchCompany(symbol, undefined, undefined, "200"),
        fetchCompanyStats(symbol),
        fetchIndicators(symbol, "200"),
        fetchDividends(symbol),
      ]);
      setDetail(d);
      setStats(s);
      setIndicators(i);
      setDividends(div);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const latestData = detail?.data || [];
  const latestRecord = latestData[latestData.length - 1];
  const prevRecord = latestData[latestData.length - 2];
  const latestIndicator = indicators[indicators.length - 1];

  const filteredData = (() => {
    const now = new Date();
    const cutoff = new Date();
    switch (timeframe) {
      case "1M": cutoff.setMonth(now.getMonth() - 1); break;
      case "3M": cutoff.setMonth(now.getMonth() - 3); break;
      case "6M": cutoff.setMonth(now.getMonth() - 6); break;
      case "1Y": cutoff.setFullYear(now.getFullYear() - 1); break;
      case "ALL": return latestData;
    }
    return latestData.filter((d) => new Date(d.date) >= cutoff);
  })();

  const change = latestRecord && prevRecord ? latestRecord.close - prevRecord.close : 0;
  const changePct = prevRecord ? (change / prevRecord.close) * 100 : 0;
  const isWatchlisted = symbol ? has(symbol) : false;

  const toggleWatchlist = () => {
    if (!symbol || !latestRecord) return;
    if (isWatchlisted) {
      remove(symbol);
    } else {
      add(symbol, detail?.category || symbol);
    }
    hapticSuccess();
  };

  const timeframes: Timeframe[] = ["1M", "3M", "6M", "1Y", "ALL"];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <SkeletonCard />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg.primary }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.gold} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.symbol, { color: colors.text.primary }]}>{symbol}</Text>
          <Text style={[styles.companyName, { color: colors.text.secondary }]}>{detail?.category || ""}</Text>
        </View>
        <TouchableOpacity onPress={toggleWatchlist} style={styles.starBtn}>
          <Ionicons
            name={isWatchlisted ? "star" : "star-outline"}
            size={22}
            color={isWatchlisted ? colors.accent.gold : colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Price */}
      {latestRecord && (
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: colors.text.primary }]}>
            {formatPrice(latestRecord.close)}
          </Text>
          <View style={styles.changeRow}>
            <Ionicons
              name={change >= 0 ? "caret-up" : "caret-down"}
              size={14}
              color={change >= 0 ? colors.semantic.profit : colors.semantic.loss}
            />
            <Text style={[styles.change, { color: change >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
              {change >= 0 ? "+" : ""}{change.toFixed(2)} ({formatPercent(changePct)})
            </Text>
          </View>
        </View>
      )}

      {/* Timeframe Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tfScroll}>
        {timeframes.map((tf) => (
          <Chip
            key={tf}
            label={tf}
            selected={timeframe === tf}
            onPress={() => { setTimeframe(tf); hapticLight(); }}
          />
        ))}
      </ScrollView>

      {/* Candlestick Chart */}
      <CandlestickChart data={filteredData} height={240} />

      {/* Chart Type Tabs */}
      <View style={styles.chartTabs}>
        <Chip label="Candle" selected />
        <Chip label="Volume" />
        <Chip label="Indicators" />
      </View>

      {/* OHLCV Card */}
      {latestRecord && (
        <Card style={styles.ohlcvCard}>
          <View style={styles.ohlcvGrid}>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>{t("common.open")}</Text>
              <Text style={[styles.ohlcvValue, { color: colors.text.primary }]}>{formatPrice(latestRecord.open)}</Text>
            </View>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>{t("common.high")}</Text>
              <Text style={[styles.ohlcvValue, { color: colors.semantic.profit }]}>{formatPrice(latestRecord.high)}</Text>
            </View>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>{t("common.low")}</Text>
              <Text style={[styles.ohlcvValue, { color: colors.semantic.loss }]}>{formatPrice(latestRecord.low)}</Text>
            </View>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>{t("common.close")}</Text>
              <Text style={[styles.ohlcvValue, { color: colors.text.primary }]}>{formatPrice(latestRecord.close)}</Text>
            </View>
          </View>
          <View style={[styles.ohlcvDivider, { backgroundColor: colors.border.subtle }]} />
          <View style={styles.ohlcvGrid}>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>{t("common.volume")}</Text>
              <Text style={[styles.ohlcvValue, { color: colors.text.primary }]}>{formatVolume(latestRecord.volume)}</Text>
            </View>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>Turnover</Text>
              <Text style={[styles.ohlcvValue, { color: colors.text.primary }]}>{formatVolume(latestRecord.turnover)}</Text>
            </View>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>ATH</Text>
              <Text style={[styles.ohlcvValue, { color: colors.accent.gold }]}>{stats ? formatPrice(stats.allTimeHigh) : "-"}</Text>
            </View>
            <View style={styles.ohlcvItem}>
              <Text style={[styles.ohlcvLabel, { color: colors.text.tertiary }]}>ATL</Text>
              <Text style={[styles.ohlcvValue, { color: colors.text.secondary }]}>{stats ? formatPrice(stats.allTimeLow) : "-"}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Technical Indicators */}
      {latestIndicator && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Indicators</Text>
          <View style={styles.gaugeRow}>
            {latestIndicator.rsi !== undefined && (
              <GaugeChart value={latestIndicator.rsi} label="RSI(14)" />
            )}
            {latestIndicator.macd !== undefined && (
              <GaugeChart value={Math.abs(latestIndicator.macd) % 100} label="MACD" />
            )}
          </View>
          <Card style={styles.indicatorCard}>
            {latestIndicator.sma20 !== undefined && (
              <View style={styles.indicatorRow}>
                <Text style={[styles.indicatorName, { color: colors.text.secondary }]}>SMA(20)</Text>
                <Text style={[styles.indicatorValue, { color: latestRecord && latestRecord.close > latestIndicator.sma20 ? colors.semantic.profit : colors.semantic.loss }]}>
                  {formatPrice(latestIndicator.sma20)}
                </Text>
                <Badge
                  label={latestRecord && latestRecord.close > latestIndicator.sma20 ? "Above" : "Below"}
                  variant={latestRecord && latestRecord.close > latestIndicator.sma20 ? "success" : "danger"}
                />
              </View>
            )}
            {latestIndicator.sma50 !== undefined && (
              <View style={styles.indicatorRow}>
                <Text style={[styles.indicatorName, { color: colors.text.secondary }]}>SMA(50)</Text>
                <Text style={[styles.indicatorValue, { color: latestRecord && latestRecord.close > latestIndicator.sma50 ? colors.semantic.profit : colors.semantic.loss }]}>
                  {formatPrice(latestIndicator.sma50)}
                </Text>
                <Badge
                  label={latestRecord && latestRecord.close > latestIndicator.sma50 ? "Above" : "Below"}
                  variant={latestRecord && latestRecord.close > latestIndicator.sma50 ? "success" : "danger"}
                />
              </View>
            )}
            {latestIndicator.rsi !== undefined && (
              <View style={styles.indicatorRow}>
                <Text style={[styles.indicatorName, { color: colors.text.secondary }]}>RSI(14)</Text>
                <Text style={[styles.indicatorValue, { color: colors.text.primary }]}>
                  {latestIndicator.rsi.toFixed(1)}
                </Text>
                <Badge
                  label={latestIndicator.rsi < 30 ? "Oversold" : latestIndicator.rsi > 70 ? "Overbought" : "Neutral"}
                  variant={latestIndicator.rsi < 30 ? "success" : latestIndicator.rsi > 70 ? "danger" : "info"}
                />
              </View>
            )}
            {latestIndicator.bbUpper !== undefined && latestIndicator.bbLower !== undefined && (
              <View style={styles.indicatorRow}>
                <Text style={[styles.indicatorName, { color: colors.text.secondary }]}>Bollinger</Text>
                <Text style={[styles.indicatorValue, { color: colors.text.primary }]}>
                  {formatPrice(latestIndicator.bbLower)} - {formatPrice(latestIndicator.bbUpper)}
                </Text>
              </View>
            )}
          </Card>
        </View>
      )}

      {/* Dividends */}
      {dividends.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Dividends</Text>
          <Card style={styles.dividendCard}>
            <View style={styles.dividendHeader}>
              <Text style={[styles.dividendYield, { color: colors.accent.gold }]}>
                Last: Rs {dividends[0]?.amount || 0}
              </Text>
              <Text style={[styles.dividendDate, { color: colors.text.tertiary }]}>
                {dividends[0]?.year}
              </Text>
            </View>
            {dividends.slice(0, 5).map((d, i) => (
              <View key={i} style={[styles.dividendRow, i < 4 && { borderBottomWidth: 1, borderBottomColor: colors.border.subtle }]}>
                <Text style={[styles.dividendYear, { color: colors.text.primary }]}>{d.year}</Text>
                <Badge label={d.type} variant="gold" />
                <Text style={[styles.dividendAmount, { color: colors.text.primary }]}>Rs {d.amount}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Action Bar */}
      <View style={[styles.actionBar, { borderTopColor: colors.border.default }]}>
        <Button
          title={t("trade.buy")}
          variant="primary"
          onPress={() => router.push({ pathname: "/paper-trading", params: { symbol, action: "buy" } })}
          style={{ flex: 1 }}
        />
        <Button
          title={t("trade.sell")}
          variant="secondary"
          onPress={() => router.push({ pathname: "/paper-trading", params: { symbol, action: "sell" } })}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1 },
  symbol: { fontSize: 20, fontWeight: "700" },
  companyName: { fontSize: 12, marginTop: 2 },
  starBtn: { padding: 8 },
  priceSection: { paddingHorizontal: 16, marginBottom: 12 },
  price: { fontSize: 32, fontWeight: "700", fontVariant: ["tabular-nums"] as any },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  change: { fontSize: 14, fontWeight: "600" },
  tfScroll: { paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  chartTabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  ohlcvCard: { marginHorizontal: 16, padding: 12 },
  ohlcvGrid: { flexDirection: "row", justifyContent: "space-between" },
  ohlcvItem: { alignItems: "center", flex: 1 },
  ohlcvLabel: { ...Typography.caption, textTransform: "uppercase" as const },
  ohlcvValue: { ...Typography.price, marginTop: 4, fontVariant: ["tabular-nums"] as any },
  ohlcvDivider: { height: 1, marginVertical: 12 },
  gaugeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  indicatorCard: { marginHorizontal: 16, padding: 12 },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  indicatorName: { ...Typography.bodySmall, flex: 1 },
  indicatorValue: { ...Typography.price, flex: 1, textAlign: "center", fontVariant: ["tabular-nums"] as any },
  dividendCard: { marginHorizontal: 16 },
  dividendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dividendYield: { ...Typography.h3 },
  dividendDate: { ...Typography.caption },
  dividendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  dividendYear: { ...Typography.body, fontWeight: "600" },
  dividendAmount: { ...Typography.price, fontVariant: ["tabular-nums"] as any },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: "#09090b",
    borderTopWidth: 1,
  },
});
