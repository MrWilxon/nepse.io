import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { BorderRadius, Spacing } from "../../constants/spacing";

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  size?: "sm" | "md";
}

export function GaugeChart({ value, min = 0, max = 100, label, size = "md" }: GaugeChartProps) {
  const { colors } = useTheme();
  const dim = size === "sm" ? 64 : 80;
  const strokeWidth = size === "sm" ? 6 : 8;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const strokeDashoffset = circumference * (1 - progress * 0.75);

  const getColor = (val: number): string => {
    if (val <= 30) return colors.semantic.profit;
    if (val <= 70) return colors.semantic.warning;
    return colors.semantic.loss;
  };

  const color = getColor(value);

  return (
    <View style={styles.container}>
      <View style={[styles.gauge, { width: dim, height: dim }]}>
        <View
          style={[
            styles.track,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              borderWidth: strokeWidth,
              borderColor: colors.bg.elevated,
            },
          ]}
        />
        <View
          style={[
            styles.progress,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: "transparent",
              borderRightColor: progress > 0.25 ? color : "transparent",
              transform: [{ rotate: `${-135 + progress * 270}deg` }],
            },
          ]}
        />
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color, fontSize: size === "sm" ? 14 : 18 }]}>
            {value.toFixed(0)}
          </Text>
        </View>
      </View>
      <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 4 },
  gauge: { position: "relative" },
  track: { position: "absolute" },
  progress: { position: "absolute" },
  valueContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  value: { ...Typography.price, fontWeight: "700" },
  label: { ...Typography.caption },
});
