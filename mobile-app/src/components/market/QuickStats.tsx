import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { Spacing, BorderRadius } from "../../constants/spacing";
import { Ionicons } from "@expo/vector-icons";

interface QuickStatProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

export function QuickStat({ icon, label, value, color }: QuickStatProps) {
  const { colors } = useTheme();
  const statColor = color || colors.text.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.card, borderColor: colors.border.default }]}>
      <Ionicons name={icon as any} size={16} color={statColor} />
      <Text style={[styles.value, { color: statColor }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
    </View>
  );
}

interface QuickStatsRowProps {
  stats: QuickStatProps[];
}

export function QuickStatsRow({ stats }: QuickStatsRowProps) {
  return (
    <View style={styles.row}>
      {stats.map((stat, i) => (
        <QuickStat key={i} {...stat} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  value: { ...Typography.body, fontWeight: "700" },
  label: { ...Typography.caption },
});
