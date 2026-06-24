import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../lib/theme";
import { BorderRadius, Spacing } from "../../constants/spacing";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  const { colors } = useTheme();

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.bg.card,
      borderColor: colors.border.default,
    },
    elevated: {
      backgroundColor: colors.bg.elevated,
      borderColor: colors.border.subtle,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    outlined: {
      backgroundColor: "transparent",
      borderColor: colors.border.default,
    },
  };

  return (
    <View style={[styles.card, variantStyles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
});
