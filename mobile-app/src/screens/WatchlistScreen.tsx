import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { useWatchlistStore } from "../stores/useWatchlistStore";
import { useWs } from "../lib/websocket";
import { fetchCompanies, CompanySummary } from "../services/api";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { formatPrice, formatPercent } from "../lib/format";
import { hapticLight, hapticSuccess } from "../lib/haptics";
import { useRouter } from "expo-router";

export default function WatchlistScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { items, load, add, remove, reorder, has } = useWatchlistStore();
  const { prices, connected } = useWs();
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [searchResults, setSearchResults] = useState<CompanySummary[]>([]);

  useEffect(() => {
    load();
    fetchCompanies().then(setCompanies).catch(() => {});
  }, []);

  const searchCompanies = useCallback(
    (query: string) => {
      setSearch(query);
      if (query.length > 0) {
        const results = companies.filter(
          (c) =>
            c.symbol.toLowerCase().includes(query.toLowerCase()) ||
            c.name.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results.slice(0, 8));
      } else {
        setSearchResults([]);
      }
    },
    [companies]
  );

  const addItem = (comp: CompanySummary) => {
    add(comp.symbol, comp.name);
    setSearch("");
    setSearchResults([]);
    hapticSuccess();
  };

  const removeItem = (symbol: string) => {
    Alert.alert("Remove", `Remove ${symbol} from watchlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          remove(symbol);
          hapticLight();
        },
      },
    ]);
  };

  const renderDragItem = ({ item, drag, isActive }: RenderItemParams<{ symbol: string; name: string; addedAt: number; order: number }>) => {
    const livePrice = prices[item.symbol];
    const price = livePrice?.price || 0;
    const change = livePrice?.changePct || 0;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          onPress={() => router.push(`/company/${item.symbol}`)}
          style={[
            styles.dragItem,
            {
              backgroundColor: isActive ? colors.bg.elevated : colors.bg.card,
              borderColor: isActive ? colors.accent.gold : colors.border.default,
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.dragHandle}>
            <Ionicons name="reorder-three" size={18} color={colors.text.tertiary} />
          </View>
          <View style={styles.itemLeft}>
            <Text style={[styles.itemSymbol, { color: colors.text.primary }]}>{item.symbol}</Text>
            <Text style={[styles.itemName, { color: colors.text.secondary }]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={styles.itemRight}>
            {price > 0 ? (
              <>
                <Text style={[styles.itemPrice, { color: colors.text.primary }]}>{formatPrice(price)}</Text>
                <Text style={[styles.itemChange, { color: change >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                  {formatPercent(change)}
                </Text>
              </>
            ) : (
              <Text style={[styles.itemPrice, { color: colors.text.tertiary }]}>--</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => removeItem(item.symbol)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.removeBtn}
          >
            <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <ScreenHeader
        title={t("trade.watchlist")}
        rightComponent={
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: connected ? colors.semantic.profit : colors.semantic.loss }]} />
            <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
              {connected ? "Live" : "Offline"}
            </Text>
          </View>
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchRow, { backgroundColor: colors.bg.input, borderColor: colors.border.default }]}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder={t("watchlist.addCompany")}
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={searchCompanies}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <Card style={[styles.dropdown, { backgroundColor: colors.bg.elevated }]}>
            {searchResults.map((comp) => (
              <TouchableOpacity
                key={comp.symbol}
                onPress={() => addItem(comp)}
                style={[styles.dropdownItem, { borderBottomColor: colors.border.subtle }]}
              >
                <View style={styles.dropdownLeft}>
                  <Text style={[styles.dropdownSymbol, { color: colors.text.primary }]}>{comp.symbol}</Text>
                  <Text style={[styles.dropdownName, { color: colors.text.secondary }]} numberOfLines={1}>{comp.name}</Text>
                </View>
                <Text style={[styles.dropdownPrice, { color: colors.text.primary }]}>{formatPrice(comp.ltp)}</Text>
                {has(comp.symbol) && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent.gold} />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </View>

      {/* Watchlist */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="bookmark-outline" size={32} color={colors.text.tertiary} />}
          title={t("watchlist.empty")}
          description={t("watchlist.emptyDesc")}
        />
      ) : (
        <View style={styles.listContainer}>
          <Text style={[styles.dragHint, { color: colors.text.tertiary }]}>
            Long press to reorder • Swipe left to remove
          </Text>
          <DraggableFlatList
            data={items}
            keyExtractor={(item) => item.symbol}
            onDragEnd={({ from, to }) => { reorder(from, to); hapticLight(); }}
            renderItem={renderDragItem}
            contentContainerStyle={styles.list}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.3)" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "600" },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8, zIndex: 10 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  dropdown: {
    marginTop: 4,
    borderRadius: 10,
    overflow: "hidden",
    padding: 0,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  dropdownLeft: { flex: 1 },
  dropdownSymbol: { fontSize: 14, fontWeight: "700" },
  dropdownName: { fontSize: 11, marginTop: 1 },
  dropdownPrice: { fontSize: 13, fontWeight: "600" },
  listContainer: { flex: 1 },
  dragHint: { fontSize: 11, textAlign: "center", marginBottom: 4 },
  list: { padding: 16, paddingTop: 4 },
  dragItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  dragHandle: { padding: 4 },
  itemLeft: { flex: 1 },
  itemSymbol: { fontSize: 15, fontWeight: "700" },
  itemName: { fontSize: 11, marginTop: 2 },
  itemRight: { alignItems: "flex-end" },
  itemPrice: { fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"] as any },
  itemChange: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  removeBtn: { padding: 4 },
});
