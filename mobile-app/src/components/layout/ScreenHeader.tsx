import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { Typography } from "../../constants/typography";
import { Spacing, BorderRadius } from "../../constants/spacing";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  onLeftPress?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightComponent?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightComponent,
}: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <StatusBar barStyle={colors.text.primary === "#ffffff" ? "light-content" : "dark-content"} />
      <View style={styles.row}>
        {leftIcon && (
          <TouchableOpacity onPress={onLeftPress} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={leftIcon as any} size={22} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>{subtitle}</Text>
          )}
        </View>
        {rightComponent ? (
          rightComponent
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={rightIcon as any} size={22} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.xl, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconBtn: { width: 36, height: 36, borderRadius: BorderRadius.md, justifyContent: "center", alignItems: "center" },
  titleContainer: { flex: 1 },
  title: { ...Typography.h3 },
  subtitle: { ...Typography.caption, marginTop: 2 },
});
