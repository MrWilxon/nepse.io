import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../lib/theme";
import { BorderRadius, Spacing } from "../../constants/spacing";
import { Typography } from "../../constants/typography";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent.goldBg : colors.bg.elevated,
          borderColor: selected ? colors.accent.gold : colors.border.default,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: selected ? colors.accent.gold : colors.text.secondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: { ...Typography.bodySmall, fontWeight: "500" },
});
