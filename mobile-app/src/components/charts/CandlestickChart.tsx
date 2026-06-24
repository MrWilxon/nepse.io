import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { Spacing, BorderRadius } from "../../constants/spacing";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: Candle[];
  height?: number;
}

export function CandlestickChart({ data, height = 220 }: CandlestickChartProps) {
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height, backgroundColor: colors.bg.card }]}>
        <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>No chart data</Text>
      </View>
    );
  }

  const allPrices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = Dimensions.get("window").width - 64;
  const candleWidth = Math.max(2, Math.min(8, (chartWidth / data.length) - 1));
  const gap = Math.max(1, candleWidth * 0.3);

  const scaleY = (price: number): number => {
    const ratio = (price - minPrice) / priceRange;
    return height - 20 - ratio * (height - 40);
  };

  return (
    <View style={[styles.container, { height, backgroundColor: colors.bg.card }]}>
      {/* Price labels */}
      <View style={styles.priceLabels}>
        <Text style={[styles.priceLabel, { color: colors.text.tertiary }]}>{maxPrice.toFixed(0)}</Text>
        <Text style={[styles.priceLabel, { color: colors.text.tertiary }]}>{((maxPrice + minPrice) / 2).toFixed(0)}</Text>
        <Text style={[styles.priceLabel, { color: colors.text.tertiary }]}>{minPrice.toFixed(0)}</Text>
      </View>

      {/* Candles */}
      <View style={styles.chartArea}>
        {data.map((candle, i) => {
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? colors.semantic.profit : colors.semantic.loss;
          const bodyTop = scaleY(Math.max(candle.open, candle.close));
          const bodyBottom = scaleY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);
          const wickTop = scaleY(candle.high);
          const wickBottom = scaleY(candle.low);
          const x = i * (candleWidth + gap);

          return (
            <View key={i} style={[styles.candle, { left: x, width: candleWidth }]}>
              {/* Wick */}
              <View
                style={[
                  styles.wick,
                  {
                    left: candleWidth / 2 - 0.5,
                    top: wickTop,
                    height: wickBottom - wickTop,
                    backgroundColor: color,
                  },
                ]}
              />
              {/* Body */}
              <View
                style={[
                  styles.body,
                  {
                    top: bodyTop,
                    height: bodyHeight,
                    backgroundColor: color,
                    width: candleWidth,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Volume bar overlay at bottom */}
      <View style={styles.volumeRow}>
        {data.slice(-8).map((candle, i) => {
          const maxVol = Math.max(...data.map((d) => d.volume));
          const volHeight = maxVol > 0 ? (candle.volume / maxVol) * 20 : 0;
          return (
            <View
              key={i}
              style={[
                styles.volumeBar,
                {
                  height: volHeight,
                  backgroundColor: candle.close >= candle.open
                    ? colors.semantic.profitBg
                    : colors.semantic.lossBg,
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
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    overflow: "hidden",
  },
  empty: {
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { ...Typography.bodySmall },
  priceLabels: {
    position: "absolute",
    right: 8,
    top: 8,
    bottom: 30,
    justifyContent: "space-between",
  },
  priceLabel: { ...Typography.caption, fontVariant: ["tabular-nums"] as any },
  chartArea: {
    flex: 1,
    position: "relative",
  },
  candle: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  wick: {
    position: "absolute",
    width: 1,
  },
  body: {
    position: "absolute",
    borderRadius: 1,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginTop: 4,
    height: 20,
  },
  volumeBar: {
    flex: 1,
    borderRadius: 1,
    minWidth: 4,
  },
});
