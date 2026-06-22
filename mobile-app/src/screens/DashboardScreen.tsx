import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../i18n/translations";
import { fetchCompanies, CompanySummary } from "../services/api";

export default function DashboardScreen() {
  const { t } = useI18n();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchCompanies();
      setCompanies(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const topGainers = [...companies].filter(c => c.percentChange > 0).sort((a, b) => b.percentChange - a.percentChange).slice(0, 5);
  const topLosers = [...companies].filter(c => c.percentChange < 0).sort((a, b) => a.percentChange - b.percentChange).slice(0, 5);

  return (
    <FlatList
      data={topGainers}
      keyExtractor={(item) => item.symbol}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>{t("dashboard.title")}</Text>
          <Text style={styles.sectionTitle}>{t("dashboard.topGainers")}</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.price}>Rs {item.ltp.toLocaleString()}</Text>
            <Text style={[styles.change, { color: item.percentChange >= 0 ? "#22c55e" : "#ef4444" }]}>
              {item.percentChange >= 0 ? "+" : ""}{item.percentChange.toFixed(2)}%
            </Text>
          </View>
        </View>
      )}
      ListFooterComponent={
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t("dashboard.topLosers")}</Text>
          {topLosers.map(item => (
            <View key={item.symbol} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.price}>Rs {item.ltp.toLocaleString()}</Text>
                <Text style={[styles.change, { color: "#ef4444" }]}>{item.percentChange.toFixed(2)}%</Text>
              </View>
            </View>
          ))}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#09090b" },
  title: { fontSize: 24, fontWeight: "bold", color: "#D4A017", marginBottom: 20 },
  sectionTitle: { fontSize: 14, color: "#8892a0", marginBottom: 12, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#27272a" },
  rowLeft: { flex: 1, marginRight: 16 },
  rowRight: { alignItems: "flex-end" },
  symbol: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 12, color: "#8892a0", marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: "monospace" },
  change: { fontSize: 12, fontWeight: "600", fontFamily: "monospace" },
});
