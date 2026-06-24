import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import {
  runScreener, fetchCompanies, ScreenerFilter, ScreenerResult, CompanySummary
} from "../services/api";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { Badge } from "../components/ui/Badge";
import { StockRow } from "../components/market/StockRow";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonRow } from "../components/ui/Skeleton";
import { formatPrice, formatPercent } from "../lib/format";
import { hapticLight, hapticSuccess } from "../lib/haptics";

type FilterCategory = "quick" | "technical" | "fundamental";

const QUICK_FILTERS = [
  { id: "gainers", label: "Top Gainers", field: "change", op: "gt" as const, value: 2 },
  { id: "losers", label: "Top Losers", field: "change", op: "lt" as const, value: -2 },
  { id: "volume", label: "High Volume", field: "volume", op: "gt" as const, value: 100000 },
  { id: "oversold", label: "Oversold (RSI<30)", field: "rsi_14", op: "lt" as const, value: 30 },
  { id: "overbought", label: "Overbought (RSI>70)", field: "rsi_14", op: "gt" as const, value: 70 },
  { id: "newhigh", label: "Near 52-Week High", field: "price", op: "gt" as const, value: 500 },
  { id: "lowpe", label: "Low P/E (<15)", field: "pe_ratio", op: "lt" as const, value: 15 },
  { id: "dividend", label: "High Dividend (>3%)", field: "dividend_yield", op: "gt" as const, value: 3 },
  { id: "bullmacd", label: "Bullish MACD", field: "macd_line", op: "gt" as const, value: 0 },
  { id: "bearmacd", label: "Bearish MACD", field: "macd_line", op: "lt" as const, value: 0 },
];

const SORT_OPTIONS = [
  { field: "change", label: "% Change" },
  { field: "volume", label: "Volume" },
  { field: "price", label: "Price" },
  { field: "turnover", label: "Turnover" },
  { field: "rsi_14", label: "RSI" },
  { field: "pe_ratio", label: "P/E Ratio" },
];

export default function ScreenerScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<FilterCategory>("quick");
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState("change");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);

  // Custom filter inputs
  const [customField, setCustomField] = useState("price");
  const [customOp, setCustomOp] = useState<"gt" | "lt" | "between">("gt");
  const [customValue, setCustomValue] = useState("");

  const toggleFilter = (id: string) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildFilters = useCallback((): ScreenerFilter[] => {
    const filters: ScreenerFilter[] = [];
    selectedFilters.forEach((id) => {
      const qf = QUICK_FILTERS.find((f) => f.id === id);
      if (qf) {
        filters.push({ field: qf.field, op: qf.op, value: qf.value });
      }
    });
    if (customValue) {
      const val = parseFloat(customValue);
      if (!isNaN(val)) {
        filters.push({ field: customField, op: customOp, value: val });
      }
    }
    return filters;
  }, [selectedFilters, customField, customOp, customValue]);

  const runFilter = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const filters = buildFilters();
      const data = await runScreener(filters, { field: sortBy, order: sortOrder });
      setResults(data.results);
      hapticSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [buildFilters, sortBy, sortOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await runFilter();
    setRefreshing(false);
  };

  const categories: { key: FilterCategory; label: string; icon: string }[] = [
    { key: "quick", label: "Quick", icon: "flash" },
    { key: "technical", label: "Technical", icon: "pulse" },
    { key: "fundamental", label: "Fundamental", icon: "business" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <ScreenHeader
        title={t("screener.title")}
        leftIcon="chevron-back"
        onLeftPress={() => router.back()}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.symbol}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.gold} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {/* Category Tabs */}
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setActiveCategory(cat.key)}
                  style={[styles.categoryBtn, {
                    backgroundColor: activeCategory === cat.key ? colors.accent.goldBg : colors.bg.elevated,
                    borderColor: activeCategory === cat.key ? colors.accent.gold : colors.border.default,
                  }]}
                >
                  <Ionicons name={cat.icon as any} size={14} color={activeCategory === cat.key ? colors.accent.gold : colors.text.secondary} />
                  <Text style={[styles.categoryText, { color: activeCategory === cat.key ? colors.accent.gold : colors.text.secondary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Filters */}
            {activeCategory === "quick" && (
              <View style={styles.chipRow}>
                {QUICK_FILTERS.map((filter) => (
                  <Chip
                    key={filter.id}
                    label={filter.label}
                    selected={selectedFilters.has(filter.id)}
                    onPress={() => toggleFilter(filter.id)}
                  />
                ))}
              </View>
            )}

            {/* Technical Filters */}
            {activeCategory === "technical" && (
              <View style={styles.customFilter}>
                <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Custom Filter</Text>
                <View style={styles.filterRow}>
                  <View style={[styles.filterSelect, { backgroundColor: colors.bg.input, borderColor: colors.border.default }]}>
                    <TextInput
                      style={[styles.filterInput, { color: colors.text.primary }]}
                      value={customField}
                      onChangeText={setCustomField}
                      placeholder="rsi_14"
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>
                  <View style={[styles.filterSelect, { backgroundColor: colors.bg.input, borderColor: colors.border.default }]}>
                    <TextInput
                      style={[styles.filterInput, { color: colors.text.primary }]}
                      value={customOp}
                      onChangeText={(v) => setCustomOp(v as any)}
                      placeholder="gt"
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>
                  <View style={[styles.filterSelect, { backgroundColor: colors.bg.input, borderColor: colors.border.default }]}>
                    <TextInput
                      style={[styles.filterInput, { color: colors.text.primary }]}
                      value={customValue}
                      onChangeText={setCustomValue}
                      keyboardType="numeric"
                      placeholder="50"
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>
                </View>
                <Text style={[styles.filterHint, { color: colors.text.tertiary }]}>
                  Fields: rsi_14, macd_line, sma_20, ema_12, pe_ratio, pb_ratio, volume, price, change
                </Text>
              </View>
            )}

            {/* Fundamental Filters */}
            {activeCategory === "fundamental" && (
              <View style={styles.chipRow}>
                <Chip label="P/E < 15" selected={selectedFilters.has("lowpe")} onPress={() => toggleFilter("lowpe")} />
                <Chip label="P/E > 25" selected={selectedFilters.has("highpe")} onPress={() => toggleFilter("highpe")} />
                <Chip label="P/B < 1" selected={selectedFilters.has("lowpb")} onPress={() => toggleFilter("lowpb")} />
                <Chip label="Dividend > 3%" selected={selectedFilters.has("dividend")} onPress={() => toggleFilter("dividend")} />
                <Chip label="EPS > 50" selected={selectedFilters.has("higheps")} onPress={() => toggleFilter("higheps")} />
                <Chip label="ROE > 15%" selected={selectedFilters.has("highroe")} onPress={() => toggleFilter("highroe")} />
              </View>
            )}

            {/* Sort Options */}
            <View style={styles.sortSection}>
              <Text style={[styles.sortLabel, { color: colors.text.secondary }]}>Sort by</Text>
              <View style={styles.sortRow}>
                {SORT_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.field}
                    label={opt.label}
                    selected={sortBy === opt.field}
                    onPress={() => {
                      if (sortBy === opt.field) {
                        setSortOrder(prev => prev === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy(opt.field);
                        setSortOrder("desc");
                      }
                      hapticLight();
                    }}
                  />
                ))}
              </View>
              <View style={[styles.sortOrderRow, { borderTopColor: colors.border.subtle }]}>
                <Text style={[styles.sortOrderLabel, { color: colors.text.tertiary }]}>Order:</Text>
                <TouchableOpacity onPress={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}>
                  <Ionicons
                    name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
                    size={16}
                    color={colors.accent.gold}
                  />
                </TouchableOpacity>
                <Text style={[styles.sortOrderValue, { color: colors.accent.gold }]}>
                  {sortOrder === "desc" ? "Descending" : "Ascending"}
                </Text>
              </View>
            </View>

            {/* Apply Button */}
            <Button
              title={`${t("screener.applyFilters")} (${selectedFilters.size > 0 ? selectedFilters.size : "all"})`}
              onPress={runFilter}
              variant="primary"
              fullWidth
              loading={loading}
              style={{ marginTop: 8 }}
            />

            {selectedFilters.size > 0 && (
              <TouchableOpacity onPress={() => { setSelectedFilters(new Set()); setCustomValue(""); }} style={styles.resetBtn}>
                <Text style={[styles.resetText, { color: colors.semantic.loss }]}>{t("screener.reset")}</Text>
              </TouchableOpacity>
            )}

            {/* Results Header */}
            {hasSearched && (
              <Text style={[styles.resultCount, { color: colors.text.secondary }]}>
                {results.length} {t("screener.results")}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          hasSearched && !loading ? (
            <EmptyState
              icon={<Ionicons name="search-outline" size={32} color={colors.text.tertiary} />}
              title="No Results"
              description="Try adjusting your filters"
            />
          ) : !hasSearched ? (
            <EmptyState
              icon={<Ionicons name="filter-outline" size={32} color={colors.text.tertiary} />}
              title="Stock Screener"
              description="Select filters and tap Apply to find stocks"
            />
          ) : (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.resultCard}>
            <TouchableOpacity
              onPress={() => router.push(`/company/${item.symbol}`)}
              style={styles.resultRow}
            >
              <View style={styles.resultLeft}>
                <Text style={[styles.resultSymbol, { color: colors.text.primary }]}>{item.symbol}</Text>
                <Text style={[styles.resultDate, { color: colors.text.tertiary }]}>{item.date}</Text>
              </View>
              <View style={styles.resultCenter}>
                <Text style={[styles.resultPrice, { color: colors.text.primary }]}>{formatPrice(item.price)}</Text>
                <Text style={[styles.resultChange, { color: item.change >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                  {formatPercent(item.change)}
                </Text>
              </View>
              <View style={styles.resultRight}>
                {item.rsi_14 !== null && (
                  <Badge
                    label={`RSI ${item.rsi_14.toFixed(0)}`}
                    variant={item.rsi_14 < 30 ? "success" : item.rsi_14 > 70 ? "danger" : "info"}
                    size="sm"
                  />
                )}
                {item.pe_ratio !== null && (
                  <Text style={[styles.resultMeta, { color: colors.text.tertiary }]}>
                    P/E {item.pe_ratio.toFixed(1)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  categoryText: { fontSize: 13, fontWeight: "600" },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  customFilter: { marginBottom: 16 },
  filterLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterSelect: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
  },
  filterInput: { paddingHorizontal: 10, fontSize: 13 },
  filterHint: { fontSize: 11, marginTop: 6 },
  sortSection: { marginBottom: 16 },
  sortLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 },
  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sortOrderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  sortOrderLabel: { fontSize: 12 },
  sortOrderValue: { fontSize: 12, fontWeight: "600" },
  resetBtn: { alignItems: "center", paddingVertical: 8, marginTop: 8 },
  resetText: { fontSize: 13, fontWeight: "600" },
  resultCount: { fontSize: 13, marginTop: 16, marginBottom: 12 },
  resultCard: { marginBottom: 8, padding: 12 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  resultLeft: { flex: 1 },
  resultSymbol: { fontSize: 15, fontWeight: "700" },
  resultDate: { fontSize: 11, marginTop: 2 },
  resultCenter: { alignItems: "flex-end" },
  resultPrice: { fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"] as any },
  resultChange: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  resultRight: { alignItems: "flex-end", gap: 4 },
  resultMeta: { fontSize: 11 },
});
