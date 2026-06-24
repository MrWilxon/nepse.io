import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { usePortfolioStore } from "../stores/usePortfolioStore";
import { useWatchlistStore } from "../stores/useWatchlistStore";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/layout/SectionHeader";
import { StockRow } from "../components/market/StockRow";
import { EmptyState } from "../components/ui/EmptyState";
import { formatPrice, formatPercent } from "../lib/format";
import { hapticLight } from "../lib/haptics";
import { useRouter } from "expo-router";

type Tab = "portfolio" | "watchlist" | "journal";

export default function TradeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const { holdings, cash, transactions, load: loadPortfolio } = usePortfolioStore();
  const { items: watchlistItems, load: loadWatchlist } = useWatchlistStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolio();
    loadWatchlist();
  }, []);

  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.quantity * h.avgPrice, 0);
  const totalPnL = totalHoldingsValue - totalCost;
  const totalValue = totalHoldingsValue + cash;
  const portfolioReturn = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "portfolio", label: t("trade.portfolio"), icon: "pie-chart" },
    { key: "watchlist", label: t("trade.watchlist"), icon: "bookmark" },
    { key: "journal", label: t("trade.tradeJournal"), icon: "book" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <ScreenHeader title={t("trade.title")} />

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => { setActiveTab(tab.key); hapticLight(); }}
            style={[styles.tab, { borderBottomColor: activeTab === tab.key ? colors.accent.gold : "transparent" }]}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? colors.accent.gold : colors.text.secondary} />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.accent.gold : colors.text.secondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "portfolio" ? (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {}} tintColor={colors.accent.gold} />}>
          <Card variant="elevated" style={styles.portfolioCard}>
            <Text style={[styles.portfolioLabel, { color: colors.text.secondary }]}>{t("trade.totalValue")}</Text>
            <Text style={[styles.portfolioValue, { color: colors.text.primary }]}>{formatPrice(totalValue)}</Text>
            <View style={styles.pnlRow}>
              <Ionicons name={totalPnL >= 0 ? "caret-up" : "caret-down"} size={14} color={totalPnL >= 0 ? colors.semantic.profit : colors.semantic.loss} />
              <Text style={[styles.pnlText, { color: totalPnL >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                {totalPnL >= 0 ? "+" : ""}{formatPrice(Math.abs(totalPnL))} ({formatPercent(portfolioReturn)})
              </Text>
            </View>
            <Text style={[styles.cashLabel, { color: colors.text.tertiary }]}>{t("trade.balance")}: {formatPrice(cash)}</Text>
          </Card>

          <SectionHeader title={t("trade.holdings")} />
          {holdings.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="pie-chart-outline" size={32} color={colors.text.tertiary} />}
              title="No Holdings"
              description="Start trading to build your portfolio"
            />
          ) : (
            holdings.map((h) => {
              const pnl = (h.currentPrice - h.avgPrice) * h.quantity;
              const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
              return (
                <Card key={h.symbol} style={styles.holdingCard}>
                  <View style={styles.holdingHeader}>
                    <View>
                      <Text style={[styles.holdingSymbol, { color: colors.text.primary }]}>{h.symbol}</Text>
                      <Text style={[styles.holdingDetail, { color: colors.text.secondary }]}>
                        {h.quantity} shares @ {formatPrice(h.avgPrice)}
                      </Text>
                    </View>
                    <View style={styles.holdingRight}>
                      <Text style={[styles.holdingValue, { color: colors.text.primary }]}>{formatPrice(h.quantity * h.currentPrice)}</Text>
                      <Text style={[styles.holdingPnl, { color: pnl >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                        {pnl >= 0 ? "+" : ""}{formatPercent(pnlPct)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}

          <Button
            title={t("trade.quickTrade")}
            onPress={() => router.push("/paper-trading")}
            variant="primary"
            fullWidth
            style={{ marginTop: 16 }}
          />

          {/* Quick Links */}
          <View style={styles.quickLinks}>
            <TouchableOpacity
              onPress={() => router.push("/watchlist")}
              style={[styles.quickLink, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}
            >
              <Ionicons name="bookmark" size={20} color={colors.accent.gold} />
              <Text style={[styles.quickLinkText, { color: colors.text.primary }]}>{t("trade.watchlist")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/alerts")}
              style={[styles.quickLink, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}
            >
              <Ionicons name="notifications" size={20} color={colors.accent.gold} />
              <Text style={[styles.quickLinkText, { color: colors.text.primary }]}>Alerts</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : activeTab === "watchlist" ? (
        <ScrollView contentContainerStyle={styles.content}>
          {watchlistItems.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="bookmark-outline" size={32} color={colors.text.tertiary} />}
              title={t("watchlist.empty")}
              description={t("watchlist.emptyDesc")}
            />
          ) : (
            watchlistItems.map((item) => (
              <StockRow
                key={item.symbol}
                symbol={item.symbol}
                name={item.name}
                price={0}
                change={0}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {transactions.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="book-outline" size={32} color={colors.text.tertiary} />}
              title="No Trades Yet"
              description="Your trade history will appear here"
            />
          ) : (
            transactions.slice(0, 20).map((tx) => (
              <Card key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={[styles.txTypeBadge, { backgroundColor: tx.type === "buy" ? colors.semantic.profitBg : colors.semantic.lossBg }]}>
                    <Text style={[styles.txType, { color: tx.type === "buy" ? colors.semantic.profit : colors.semantic.loss }]}>
                      {tx.type.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txSymbol, { color: colors.text.primary }]}>{tx.symbol}</Text>
                    <Text style={[styles.txDate, { color: colors.text.tertiary }]}>{tx.date.split("T")[0]}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: colors.text.primary }]}>{formatPrice(tx.quantity * tx.price)}</Text>
                    <Text style={[styles.txQty, { color: colors.text.secondary }]}>{tx.quantity} @ {formatPrice(tx.price)}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
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
  portfolioCard: { alignItems: "center", paddingVertical: 24, marginBottom: 16 },
  portfolioLabel: { fontSize: 12, textTransform: "uppercase" as const, letterSpacing: 1 },
  portfolioValue: { fontSize: 32, fontWeight: "700", marginVertical: 8, fontVariant: ["tabular-nums"] as any },
  pnlRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pnlText: { fontSize: 14, fontWeight: "600" },
  cashLabel: { fontSize: 12, marginTop: 8 },
  holdingCard: { marginBottom: 8 },
  holdingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  holdingSymbol: { fontSize: 16, fontWeight: "600" },
  holdingDetail: { fontSize: 12, marginTop: 2 },
  holdingRight: { alignItems: "flex-end" },
  holdingValue: { fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"] as any },
  holdingPnl: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  txCard: { marginBottom: 8 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  txTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  txType: { fontSize: 11, fontWeight: "700" },
  txInfo: { flex: 1 },
  txSymbol: { fontSize: 14, fontWeight: "600" },
  txDate: { fontSize: 11, marginTop: 2 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "600" },
  txQty: { fontSize: 11, marginTop: 2 },
  quickLinks: { flexDirection: "row", gap: 10, marginTop: 16 },
  quickLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  quickLinkText: { fontSize: 13, fontWeight: "600" },
});
