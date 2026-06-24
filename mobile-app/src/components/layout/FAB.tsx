import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { BorderRadius } from "../../constants/spacing";

interface FABProps {
  icon: string;
  onPress: () => void;
  size?: "md" | "lg";
  style?: ViewStyle;
}

export function FAB({ icon, onPress, size = "md", style }: FABProps) {
  const { colors } = useTheme();
  const dim = size === "lg" ? 60 : 48;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.fab,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: colors.accent.gold,
          shadowColor: colors.accent.gold,
        },
        style,
      ]}
    >
      <Ionicons name={icon as any} size={size === "lg" ? 26 : 22} color={colors.text.inverse} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
