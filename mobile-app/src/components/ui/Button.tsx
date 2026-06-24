import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { BorderRadius, Spacing } from "../../constants/spacing";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();

  const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number }> = {
    sm: { height: 36, paddingHorizontal: Spacing.md },
    md: { height: 44, paddingHorizontal: Spacing.lg },
    lg: { height: 52, paddingHorizontal: Spacing.xl },
  };

  const variantStyles: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
    primary: { bg: colors.accent.gold, border: colors.accent.gold, text: colors.text.inverse },
    secondary: { bg: "transparent", border: colors.accent.gold, text: colors.accent.gold },
    danger: { bg: colors.semantic.loss, border: colors.semantic.loss, text: "#ffffff" },
    ghost: { bg: "transparent", border: "transparent", text: colors.text.secondary },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.bg.elevated : v.bg,
          borderColor: disabled ? colors.border.default : v.border,
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: disabled ? colors.text.tertiary : v.text },
              size === "sm" && styles.textSmall,
              icon ? { marginLeft: Spacing.sm } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  fullWidth: { width: "100%" },
  text: { ...Typography.button },
  textSmall: { ...Typography.buttonSmall },
});
