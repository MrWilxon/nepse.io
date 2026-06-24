import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { Spacing, BorderRadius } from "../../constants/spacing";
import { formatPrice, formatPercent } from "../../lib/format";

interface MarketIndexCardProps {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  status?: "open" | "closed" | "pre_open";
}

export function MarketIndexCard({ name, value, change, changePercent, status }: MarketIndexCardProps) {
  const { colors } = useTheme();
  const isPositive = change >= 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text.secondary }]}>{name}</Text>
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: status === "open" ? colors.semantic.profitBg : colors.semantic.lossBg }]}>
            <View style={[styles.statusDot, { backgroundColor: status === "open" ? colors.semantic.profit : colors.semantic.loss }]} />
            <Text style={[styles.statusText, { color: status === "open" ? colors.semantic.profit : colors.semantic.loss }]}>
              {status === "open" ? "Open" : status === "pre_open" ? "Pre-Open" : "Closed"}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: colors.text.primary }]}>{value.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      <View style={styles.changeRow}>
        <Ionicons name={isPositive ? "caret-up" : "caret-down"} size={14} color={isPositive ? colors.semantic.profit : colors.semantic.loss} />
        <Text style={[styles.change, { color: isPositive ? colors.semantic.profit : colors.semantic.loss }]}>
          {isPositive ? "+" : ""}{change.toFixed(2)} ({formatPercent(changePercent)})
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  name: { ...Typography.label, textTransform: "uppercase" as const },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...Typography.caption },
  value: { ...Typography.priceLarge, marginBottom: Spacing.xs },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  change: { ...Typography.bodySmall, fontWeight: "600" },
});
