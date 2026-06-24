import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { Spacing, BorderRadius } from "../../constants/spacing";
import { formatPrice, formatPercent } from "../../lib/format";

interface StockRowProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume?: number;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
}

export function StockRow({ symbol, name, price, change, volume, onPress, rightComponent }: StockRowProps) {
  const { colors } = useTheme();
  const isPositive = change >= 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
      style={[styles.row, { borderBottomColor: colors.border.subtle }]}
    >
      <View style={styles.left}>
        <Text style={[styles.symbol, { color: colors.text.primary }]}>{symbol}</Text>
        <Text style={[styles.name, { color: colors.text.secondary }]} numberOfLines={1}>{name}</Text>
      </View>
      <View style={styles.center}>
        {volume !== undefined && (
          <Text style={[styles.volume, { color: colors.text.tertiary }]}>
            Vol: {volume >= 1_000_000 ? `${(volume / 1_000_000).toFixed(1)}M` : volume >= 1_000 ? `${(volume / 1_000).toFixed(1)}K` : volume}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.text.primary }]}>{formatPrice(price)}</Text>
        <Text style={[styles.change, { color: isPositive ? colors.semantic.profit : colors.semantic.loss }]}>
          {formatPercent(change)}
        </Text>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  left: { flex: 1 },
  symbol: { ...Typography.body, fontWeight: "600" },
  name: { ...Typography.caption, marginTop: 2 },
  center: { alignItems: "center" },
  volume: { ...Typography.caption },
  right: { alignItems: "flex-end" },
  price: { ...Typography.price },
  change: { ...Typography.caption, fontWeight: "600", marginTop: 2 },
});
