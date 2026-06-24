import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { usePaperTradingStore } from "../stores/usePaperTradingStore";
import { fetchCompany, CompanySummary } from "../services/api";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { formatPrice, formatPercent } from "../lib/format";
import { hapticLight, hapticSuccess, hapticError } from "../lib/haptics";

export default function PaperTradingScreen() {
  const params = useLocalSearchParams<{ symbol?: string; action?: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { holdings, cash, buy, sell, load } = usePaperTradingStore();

  const [symbol, setSymbol] = useState(params.symbol || "NABIL");
  const [action, setAction] = useState<"buy" | "sell">((params.action as any) || "buy");
  const [quantity, setQuantity] = useState("10");
  const [price, setPrice] = useState("");
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [searchResults, setSearchResults] = useState<CompanySummary[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    load();
    fetchCompany("NABIL").then(() => {}).catch(() => {});
    // Fetch all companies for search
    fetch("http://localhost:4000/api/companies")
      .then(r => r.json())
      .then(setCompanies)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (params.symbol) setSymbol(params.symbol);
    if (params.action) setAction(params.action as any);
  }, [params.symbol, params.action]);

  const searchCompanies = (query: string) => {
    setSymbol(query.toUpperCase());
    if (query.length > 0) {
      const results = companies.filter(c =>
        c.symbol.toLowerCase().includes(query.toLowerCase()) ||
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results.slice(0, 5));
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  };

  const selectCompany = (comp: CompanySummary) => {
    setSymbol(comp.symbol);
    setPrice(String(comp.ltp));
    setShowSearch(false);
  };

  const currentHolding = holdings.find(h => h.symbol === symbol);
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalValue = totalHoldingsValue + cash;
  const qty = parseInt(quantity) || 0;
  const orderPrice = parseFloat(price) || 0;
  const totalCost = qty * orderPrice;

  const executeOrder = () => {
    if (!symbol || qty <= 0 || orderPrice <= 0) {
      hapticError();
      return;
    }

    if (action === "buy") {
      if (totalCost > cash) {
        hapticError();
        return;
      }
      buy(symbol, symbol, qty, orderPrice);
      hapticSuccess();
    } else {
      if (!currentHolding || currentHolding.quantity < qty) {
        hapticError();
        return;
      }
      sell(symbol, qty, orderPrice);
      hapticSuccess();
    }

    setQuantity("10");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg.primary }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader
        title={t("trade.paperTrading")}
        leftIcon="chevron-back"
        onLeftPress={() => router.back()}
      />

      {/* Portfolio Summary */}
      <Card variant="elevated" style={styles.portfolioCard}>
        <Text style={[styles.portfolioLabel, { color: colors.text.secondary }]}>Portfolio Value</Text>
        <Text style={[styles.portfolioValue, { color: colors.text.primary }]}>{formatPrice(totalValue)}</Text>
        <Text style={[styles.cashText, { color: colors.text.tertiary }]}>{t("trade.balance")}: {formatPrice(cash)}</Text>
      </Card>

      {/* Action Toggle */}
      <View style={styles.actionToggle}>
        <TouchableOpacity
          onPress={() => { setAction("buy"); hapticLight(); }}
          style={[styles.actionBtn, {
            backgroundColor: action === "buy" ? colors.semantic.profitBg : colors.bg.elevated,
            borderColor: action === "buy" ? colors.semantic.profit : colors.border.default,
          }]}
        >
          <Text style={[styles.actionText, { color: action === "buy" ? colors.semantic.profit : colors.text.secondary }]}>
            {t("trade.buy")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setAction("sell"); hapticLight(); }}
          style={[styles.actionBtn, {
            backgroundColor: action === "sell" ? colors.semantic.lossBg : colors.bg.elevated,
            borderColor: action === "sell" ? colors.semantic.loss : colors.border.default,
          }]}
        >
          <Text style={[styles.actionText, { color: action === "sell" ? colors.semantic.loss : colors.text.secondary }]}>
            {t("trade.sell")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Symbol Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>{t("backtest.symbol")}</Text>
        <View style={[styles.inputWrapper, { backgroundColor: colors.bg.input, borderColor: colors.border.default }]}>
          <TextInput
            style={[styles.input, { color: colors.text.primary }]}
            value={symbol}
            onChangeText={searchCompanies}
            placeholder="NABIL"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="characters"
          />
        </View>
        {showSearch && searchResults.length > 0 && (
          <View style={[styles.searchDropdown, { backgroundColor: colors.bg.elevated, borderColor: colors.border.default }]}>
            {searchResults.map((comp) => (
              <TouchableOpacity
                key={comp.symbol}
                onPress={() => selectCompany(comp)}
                style={[styles.searchItem, { borderBottomColor: colors.border.subtle }]}
              >
                <Text style={[styles.searchSymbol, { color: colors.text.primary }]}>{comp.symbol}</Text>
                <Text style={[styles.searchName, { color: colors.text.secondary }]} numberOfLines={1}>{comp.name}</Text>
                <Text style={[styles.searchPrice, { color: colors.text.primary }]}>{formatPrice(comp.ltp)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quantity Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Quantity</Text>
        <View style={[styles.inputWrapper, { backgroundColor: colors.bg.input, borderColor: colors.border.default }]}>
          <TouchableOpacity onPress={() => setQuantity(String(Math.max(1, (parseInt(quantity) || 1) - 10)))} style={styles.qtyBtn}>
            <Ionicons name="remove" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.qtyInput, { color: colors.text.primary }]}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor={colors.text.tertiary}
          />
          <TouchableOpacity onPress={() => setQuantity(String((parseInt(quantity) || 0) + 10))} style={styles.qtyBtn}>
            <Ionicons name="add" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Price Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>{t("backtest.symbol")} Price (Rs)</Text>
        <TextInput
          style={[styles.inputFull, { color: colors.text.primary, backgroundColor: colors.bg.input, borderColor: colors.border.default }]}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {/* Order Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>Order Total</Text>
          <Text style={[styles.summaryValue, { color: colors.text.primary }]}>{formatPrice(totalCost)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>Available Cash</Text>
          <Text style={[styles.summaryValue, { color: cash >= totalCost || action === "sell" ? colors.text.primary : colors.semantic.loss }]}>
            {formatPrice(cash)}
          </Text>
        </View>
        {currentHolding && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>Current Holding</Text>
            <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
              {currentHolding.quantity} shares @ {formatPrice(currentHolding.avgPrice)}
            </Text>
          </View>
        )}
      </Card>

      {/* Execute Button */}
      <Button
        title={action === "buy" ? t("trade.buy") : t("trade.sell")}
        onPress={executeOrder}
        variant={action === "buy" ? "primary" : "danger"}
        fullWidth
        disabled={!symbol || qty <= 0 || orderPrice <= 0 || (action === "buy" && totalCost > cash) || (action === "sell" && (!currentHolding || currentHolding.quantity < qty))}
        icon={<Ionicons name={action === "buy" ? "cart" : "cash"} size={18} color={colors.text.inverse} />}
      />

      {/* Holdings */}
      {holdings.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Your Holdings</Text>
          {holdings.map((h) => {
            const pnl = (h.currentPrice - h.avgPrice) * h.quantity;
            const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
            return (
              <TouchableOpacity
                key={h.symbol}
                onPress={() => { setSymbol(h.symbol); setPrice(String(h.currentPrice)); setAction("sell"); }}
                style={[styles.holdingItem, { borderBottomColor: colors.border.subtle }]}
              >
                <View>
                  <Text style={[styles.holdingSymbol, { color: colors.text.primary }]}>{h.symbol}</Text>
                  <Text style={[styles.holdingDetail, { color: colors.text.secondary }]}>{h.quantity} shares</Text>
                </View>
                <View style={styles.holdingRight}>
                  <Text style={[styles.holdingValue, { color: colors.text.primary }]}>{formatPrice(h.quantity * h.currentPrice)}</Text>
                  <Text style={[styles.holdingPnl, { color: pnl >= 0 ? colors.semantic.profit : colors.semantic.loss }]}>
                    {pnl >= 0 ? "+" : ""}{formatPercent(pnlPct)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  portfolioCard: { alignItems: "center", paddingVertical: 20, marginBottom: 16 },
  portfolioLabel: { fontSize: 12, textTransform: "uppercase" as const, letterSpacing: 1 },
  portfolioValue: { fontSize: 28, fontWeight: "700", marginVertical: 6, fontVariant: ["tabular-nums"] as any },
  cashText: { fontSize: 12 },
  actionToggle: { flexDirection: "row", gap: 8, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  actionText: { fontSize: 14, fontWeight: "700" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" as const, marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    overflow: "hidden",
  },
  input: { flex: 1, height: "100%", paddingHorizontal: 14, fontSize: 14 },
  qtyInput: { textAlign: "center", minWidth: 60 },
  qtyBtn: { width: 44, height: "100%", justifyContent: "center", alignItems: "center" },
  inputFull: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  searchDropdown: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchSymbol: { fontSize: 14, fontWeight: "700", width: 60 },
  searchName: { flex: 1, fontSize: 12 },
  searchPrice: { fontSize: 13, fontWeight: "600" },
  summaryCard: { marginBottom: 16 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] as any },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  holdingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  holdingSymbol: { fontSize: 15, fontWeight: "600" },
  holdingDetail: { fontSize: 12, marginTop: 2 },
  holdingRight: { alignItems: "flex-end" },
  holdingValue: { fontSize: 14, fontWeight: "600" },
  holdingPnl: { fontSize: 12, fontWeight: "600", marginTop: 2 },
});
