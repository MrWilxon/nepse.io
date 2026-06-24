import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { Spacing, BorderRadius } from "../../constants/spacing";

interface HeatmapItemProps {
  sector: string;
  change: number;
  onPress?: () => void;
}

export function HeatmapGrid({ data }: { data: HeatmapItemProps[] }) {
  const { colors } = useTheme();

  const getColor = (change: number): string => {
    if (change > 3) return "#16a34a";
    if (change > 1) return "#22c55e";
    if (change > 0) return "#4ade80";
    if (change === 0) return colors.bg.elevated;
    if (change > -1) return "#fca5a5";
    if (change > -3) return "#f87171";
    return "#dc2626";
  };

  return (
    <View style={styles.grid}>
      {data.map((item, i) => (
        <View
          key={i}
          style={[
            styles.cell,
            {
              backgroundColor: getColor(item.change),
            },
          ]}
        >
          <Text style={styles.sectorName} numberOfLines={1}>{item.sector}</Text>
          <Text style={styles.sectorChange}>
            {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  cell: {
    width: "31%",
    aspectRatio: 1.5,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.sm,
  },
  sectorName: {
    ...Typography.caption,
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
  },
  sectorChange: {
    ...Typography.bodySmall,
    color: "#ffffff",
    fontWeight: "600",
    marginTop: 2,
  },
});
