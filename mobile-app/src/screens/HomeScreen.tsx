import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { fetchCompanies, fetchTopMovers, fetchMarketStatus, fetchHeatmap, CompanySummary, TopMover, HeatmapData, MarketStatus } from "../services/api";
import { MarketIndexCard } from "../components/market/MarketIndexCard";
import { StockRow } from "../components/market/StockRow";
import { QuickStatsRow } from "../components/market/QuickStats";
import { HeatmapGrid } from "../components/market/HeatmapGrid";
import { SectionHeader } from "../components/layout/SectionHeader";
import { SkeletonCard } from "../components/ui/Skeleton";
import { formatPercent } from "../lib/format";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [topMovers, setTopMovers] = useState<{ gainers: TopMover[]; losers: TopMover[] }>({ gainers: [], losers: [] });
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [companiesData, moversData, statusData, heatmapData] = await Promise.all([
        fetchCompanies(),
        fetchTopMovers(),
        fetchMarketStatus(),
        fetchHeatmap(),
      ]);
      setCompanies(companiesData);
      setTopMovers(moversData);
      setMarketStatus(statusData);
      setHeatmap(heatmapData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const topGainers = topMovers.gainers.slice(0, 5);
  const topLosers = topMovers.losers.slice(0, 5);

  const advanceCount = companies.filter(c => c.percentChange > 0).length;
  const declineCount = companies.filter(c => c.percentChange < 0).length;
  const unchangedCount = companies.filter(c => c.percentChange === 0).length;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <SkeletonCard />
      </View>
    );
  }

  return (
    <FlatList
      data={topGainers}
      keyExtractor={(item) => item.symbol}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.gold} />}
      contentContainerStyle={[styles.container, { backgroundColor: colors.bg.primary }]}
      ListHeaderComponent={
        <>
          <MarketIndexCard
            name="NEPSE Index"
            value={2145.32}
            change={23.45}
            changePercent={1.10}
            status={marketStatus?.status}
          />

          <QuickStatsRow
            stats={[
              { icon: "trending-up", label: "Advances", value: advanceCount, color: colors.semantic.profit },
              { icon: "trending-down", label: "Declines", value: declineCount, color: colors.semantic.loss },
              { icon: "bar-chart", label: "Volume", value: "1.2M", color: colors.semantic.info },
              { icon: "swap-horizontal", label: "Unchanged", value: unchangedCount, color: colors.text.secondary },
            ]}
          />

          <SectionHeader title={t("dashboard.topGainers")} action={t("dashboard.viewAll")} />
        </>
      }
      renderItem={({ item }) => (
        <StockRow
          symbol={item.symbol}
          name={item.name}
          price={item.ltp}
          change={item.percentChange}
          onPress={() => router.push(`/company/${item.symbol}`)}
        />
      )}
      ListFooterComponent={
        <>
          <SectionHeader title={t("dashboard.topLosers")} />
          {topLosers.map((item) => (
            <StockRow
              key={item.symbol}
              symbol={item.symbol}
              name={item.symbol}
              price={item.close}
              change={item.changePct}
            />
          ))}

          <SectionHeader title={t("dashboard.sectorHeatmap")} />
          <HeatmapGrid data={heatmap.map(h => ({ sector: h.sector, change: h.change }))} />

          <View style={{ height: 100 }} />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
});
