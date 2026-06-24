import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../lib/theme";
import { BorderRadius } from "../../constants/spacing";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeleton.base,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonRow({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 12 }, style]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Skeleton width={60} height={14} />
        <Skeleton width={40} height={12} />
      </View>
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ padding: 16, gap: 10 }, style]}>
      <Skeleton width="50%" height={18} />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  );
}
