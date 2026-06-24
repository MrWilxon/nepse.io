import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { runScreener, fetchCompanies, ScreenerFilter, CompanySummary } from "../services/api";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { StockRow } from "../components/market/StockRow";
import { EmptyState } from "../components/ui/EmptyState";
import { formatPrice } from "../lib/format";
import { useRouter } from "expo-router";

type Tab = "screener" | "backtest" | "correlation";

export default function ResearchScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("screener");
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const [backtestSymbol, setBacktestSymbol] = useState("NABIL");
  const [backtestStrategy, setBacktestStrategy] = useState("sma");

  useEffect(() => {
    fetchCompanies().then(setCompanies);
  }, []);

  const quickFilters = [
    "Top Gainers", "Volume Up", "Oversold (RSI<30)", "New Highs",
    "Dividend >5%", "Low P/E", "Bullish MACD",
  ];

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "screener", label: t("research.screener"), icon: "filter" },
    { key: "backtest", label: t("research.backtest"), icon: "analytics" },
    { key: "correlation", label: t("research.correlation"), icon: "git-network" },
  ];

  const strategies = [
    { value: "sma", label: "SMA Crossover" },
    { value: "rsi", label: "RSI" },
    { value: "macd", label: "MACD" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <ScreenHeader title={t("research.title")} />

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, { borderBottomColor: activeTab === tab.key ? colors.accent.gold : "transparent" }]}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? colors.accent.gold : colors.text.secondary} />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.accent.gold : colors.text.secondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "screener" ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Quick Filters</Text>
            <View style={styles.chipRow}>
              {quickFilters.map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  selected={selectedFilters.includes(filter)}
                  onPress={() => toggleFilter(filter)}
                />
              ))}
            </View>

            <Button
              title="Open Full Screener"
              onPress={() => router.push("/screener")}
              variant="secondary"
              fullWidth
              icon={<Ionicons name="open-outline" size={16} color={colors.accent.gold} />}
              style={{ marginTop: 16 }}
            />

            {results.length > 0 && (
              <>
                <Text style={[styles.resultCount, { color: colors.text.secondary }]}>
                  {results.length} {t("screener.results")}
                </Text>
                {results.map((r: any) => (
                  <StockRow
                    key={r.symbol}
                    symbol={r.symbol}
                    name={r.symbol}
                    price={r.price}
                    change={r.change}
                    volume={r.volume}
                    onPress={() => router.push(`/company/${r.symbol}`)}
                  />
                ))}
              </>
            )}
          </>
        ) : activeTab === "backtest" ? (
          <>
            <Card>
              <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>{t("backtest.strategy")}</Text>
              <View style={styles.chipRow}>
                {strategies.map((s) => (
                  <Chip
                    key={s.value}
                    label={s.label}
                    selected={backtestStrategy === s.value}
                    onPress={() => setBacktestStrategy(s.value)}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>{t("backtest.symbol")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text.primary, backgroundColor: colors.bg.input, borderColor: colors.border.default }]}
                value={backtestSymbol}
                onChangeText={setBacktestSymbol}
                placeholder="NABIL"
                placeholderTextColor={colors.text.tertiary}
              />

              <Button
                title="Open Full Backtester"
                onPress={() => router.push("/backtest")}
                variant="secondary"
                fullWidth
                icon={<Ionicons name="open-outline" size={16} color={colors.accent.gold} />}
              />
            </Card>
          </>
        ) : (
          <EmptyState
            icon={<Ionicons name="git-network-outline" size={32} color={colors.text.tertiary} />}
            title="Correlation Matrix"
            description="Select stocks to compare their correlation"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 2,
  },
  tabText: { fontSize: 12, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  resultCount: { fontSize: 13, marginTop: 20, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" as const, marginBottom: 8, marginTop: 16 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
});
