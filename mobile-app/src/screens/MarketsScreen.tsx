import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { fetchSectors, fetchBrokers, fetchMutualFunds, SectorData, BrokerData, MutualFund } from "../services/api";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { StockRow } from "../components/market/StockRow";
import { SkeletonCard } from "../components/ui/Skeleton";
import { formatPrice, formatVolume } from "../lib/format";

type Tab = "sectors" | "brokers" | "mutualFunds";

export default function MarketsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("sectors");
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [mutualFunds, setMutualFunds] = useState<MutualFund[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [s, b, m] = await Promise.all([fetchSectors(), fetchBrokers(), fetchMutualFunds()]);
      setSectors(s);
      setBrokers(b);
      setMutualFunds(m);
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "sectors", label: t("markets.sectors") },
    { key: "brokers", label: t("markets.topBrokers") },
    { key: "mutualFunds", label: t("markets.mutualFunds") },
  ];

  const filteredSectors = sectors.filter(s =>
    s.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <ScreenHeader title={t("markets.title")} />

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder={t("markets.search")}
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, { borderBottomColor: activeTab === tab.key ? colors.accent.gold : "transparent" }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.accent.gold : colors.text.secondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <SkeletonCard />
      ) : activeTab === "sectors" ? (
        <FlatList
          data={filteredSectors}
          keyExtractor={(item) => item.sector}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.gold} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.sectorCard}>
              <View style={styles.sectorHeader}>
                <Text style={[styles.sectorName, { color: colors.text.primary }]}>{item.sector}</Text>
                <Text style={[styles.sectorChange, { color: item.avgChange >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                  {item.avgChange >= 0 ? "+" : ""}{item.avgChange.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.sectorStats}>
                <Text style={[styles.sectorStat, { color: colors.text.secondary }]}>
                  {item.companyCount} companies
                </Text>
                <Text style={[styles.sectorStat, { color: colors.text.secondary }]}>
                  Vol: {formatVolume(item.totalVolume)}
                </Text>
              </View>
            </Card>
          )}
        />
      ) : activeTab === "brokers" ? (
        <FlatList
          data={brokers.slice(0, 20)}
          keyExtractor={(item) => String(item.brokerNo)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.gold} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.brokerCard}>
              <View style={styles.brokerHeader}>
                <Text style={[styles.brokerNo, { color: colors.text.primary }]}>Broker {item.brokerNo}</Text>
                <Text style={[styles.brokerDir, { color: item.netDirection === "net_buy" ? colors.semantic.profit : item.netDirection === "net_sell" ? colors.semantic.loss : colors.text.secondary }]}>
                  {item.netDirection === "net_buy" ? "Net Buyer" : item.netDirection === "net_sell" ? "Net Seller" : "Neutral"}
                </Text>
              </View>
              <View style={styles.brokerStats}>
                <View>
                  <Text style={[styles.brokerLabel, { color: colors.text.tertiary }]}>Buy</Text>
                  <Text style={[styles.brokerValue, { color: colors.semantic.profit }]}>{formatPrice(item.buyAmt)}</Text>
                </View>
                <View>
                  <Text style={[styles.brokerLabel, { color: colors.text.tertiary }]}>Sell</Text>
                  <Text style={[styles.brokerValue, { color: colors.semantic.loss }]}>{formatPrice(item.sellAmt)}</Text>
                </View>
                <View>
                  <Text style={[styles.brokerLabel, { color: colors.text.tertiary }]}>Net</Text>
                  <Text style={[styles.brokerValue, { color: colors.text.primary }]}>{formatVolume(Math.abs(item.netQty))}</Text>
                </View>
              </View>
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={mutualFunds}
          keyExtractor={(item) => item.symbol}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.gold} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StockRow
              symbol={item.symbol}
              name={item.name}
              price={item.nav}
              change={item.changePct}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#1a1a25",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  list: { padding: 16, paddingTop: 8 },
  sectorCard: { marginBottom: 10 },
  sectorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectorName: { fontSize: 15, fontWeight: "600" },
  sectorChange: { fontSize: 14, fontWeight: "700" },
  sectorStats: { flexDirection: "row", gap: 16, marginTop: 6 },
  sectorStat: { fontSize: 12 },
  brokerCard: { marginBottom: 10 },
  brokerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brokerNo: { fontSize: 15, fontWeight: "600" },
  brokerDir: { fontSize: 12, fontWeight: "600" },
  brokerStats: { flexDirection: "row", gap: 20, marginTop: 8 },
  brokerLabel: { fontSize: 11, textTransform: "uppercase" as const },
  brokerValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },
});
