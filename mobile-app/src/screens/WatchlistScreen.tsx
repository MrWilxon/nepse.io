import React, { useState } from "react";
import { View, Text, FlatList, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../i18n/translations";
import { CompanySummary } from "../services/api";

export default function WatchlistScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [watchlist, setWatchlist] = useState<CompanySummary[]>([]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("watchlist.title")}</Text>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#8892a0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("watchlist.addCompany")}
          placeholderTextColor="#8892a0"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {watchlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={48} color="#27272a" />
          <Text style={styles.emptyText}>{t("watchlist.addCompany")}</Text>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.symbol}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#09090b" },
  title: { fontSize: 24, fontWeight: "bold", color: "#D4A017", marginBottom: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a25", borderRadius: 8, borderWidth: 1, borderColor: "#27272a", paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, color: "#fff", fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { color: "#8892a0", fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#27272a" },
  rowRight: { alignItems: "flex-end" },
  symbol: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 12, color: "#8892a0", marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: "monospace" },
  change: { fontSize: 12, fontWeight: "600", fontFamily: "monospace" },
});
