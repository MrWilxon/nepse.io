import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { Spacing, BorderRadius } from "../../constants/spacing";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ data, color, height = 40, width = 100 }: SparklineProps) {
  const { colors } = useTheme();
  const lineColor = color || (data.length >= 2 && data[data.length - 1] >= data[0]
    ? colors.semantic.profit
    : colors.semantic.loss);

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - 4 - ((val - min) / range) * (height - 8),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.svgContainer}>
        {/* Simple line representation using Views */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          return (
            <View
              key={i}
              style={[
                styles.line,
                {
                  left: prev.x,
                  top: prev.y,
                  width: length,
                  height: 1.5,
                  backgroundColor: lineColor,
                  transform: [{ rotate: `${angle}rad` }],
                  transformOrigin: "0 0",
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", overflow: "hidden" },
  svgContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  line: { position: "absolute" },
});
