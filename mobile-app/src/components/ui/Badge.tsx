import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../lib/theme";
import { BorderRadius, Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info" | "gold";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Badge({ label, variant = "default", size = "sm", style }: BadgeProps) {
  const { colors } = useTheme();

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: colors.bg.elevated, text: colors.text.secondary },
    success: { bg: colors.semantic.profitBg, text: colors.semantic.profit },
    danger: { bg: colors.semantic.lossBg, text: colors.semantic.loss },
    warning: { bg: colors.semantic.warningBg, text: colors.semantic.warning },
    info: { bg: colors.semantic.infoBg, text: colors.semantic.info },
    gold: { bg: colors.accent.goldBg, text: colors.accent.gold },
  };

  const v = variantMap[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: v.bg },
        size === "md" && styles.badgeMd,
        style,
      ]}
    >
      <Text style={[styles.text, { color: v.text }, size === "md" && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  text: { ...Typography.caption },
  textMd: { ...Typography.bodySmall },
});
