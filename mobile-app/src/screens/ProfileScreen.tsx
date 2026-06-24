import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme";
import { useI18n } from "../i18n/translations";
import { useThemeStore } from "../stores/useThemeStore";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { Card } from "../components/ui/Card";
import { Config } from "../constants/config";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, lang, setLang } = useI18n();

  const menuItems = [
    {
      icon: "color-palette",
      label: t("profile.theme"),
      right: (
        <View style={styles.themeToggle}>
          <TouchableOpacity
            onPress={() => !isDark && toggleTheme()}
            style={[styles.themeBtn, { backgroundColor: isDark ? colors.accent.gold : colors.bg.elevated }]}
          >
            <Text style={[styles.themeBtnText, { color: isDark ? colors.text.inverse : colors.text.secondary }]}>
              {t("profile.dark")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => isDark && toggleTheme()}
            style={[styles.themeBtn, { backgroundColor: !isDark ? colors.accent.gold : colors.bg.elevated }]}
          >
            <Text style={[styles.themeBtnText, { color: !isDark ? colors.text.inverse : colors.text.secondary }]}>
              {t("profile.light")}
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      icon: "language",
      label: t("profile.language"),
      right: (
        <View style={styles.themeToggle}>
          <TouchableOpacity
            onPress={() => setLang("en")}
            style={[styles.themeBtn, { backgroundColor: lang === "en" ? colors.accent.gold : colors.bg.elevated }]}
          >
            <Text style={[styles.themeBtnText, { color: lang === "en" ? colors.text.inverse : colors.text.secondary }]}>
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLang("ne")}
            style={[styles.themeBtn, { backgroundColor: lang === "ne" ? colors.accent.gold : colors.bg.elevated }]}
          >
            <Text style={[styles.themeBtnText, { color: lang === "ne" ? colors.text.inverse : colors.text.secondary }]}>
              NE
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    { icon: "download", label: t("profile.export"), chevron: true },
    { icon: "document-text", label: t("profile.taxReport"), chevron: true },
    { icon: "server", label: t("profile.apiStatus"), chevron: true },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg.primary }]} contentContainerStyle={styles.content}>
      <ScreenHeader title={t("profile.title")} />

      <Card variant="elevated" style={styles.appCard}>
        <View style={[styles.appIcon, { backgroundColor: colors.accent.goldBg }]}>
          <Ionicons name="analytics" size={28} color={colors.accent.gold} />
        </View>
        <Text style={[styles.appName, { color: colors.text.primary }]}>{Config.APP_NAME}</Text>
        <Text style={[styles.appVersion, { color: colors.text.tertiary }]}>{t("profile.version")} {Config.VERSION}</Text>
      </Card>

      <Card style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border.subtle }]}
            disabled={!item.chevron}
          >
            <Ionicons name={item.icon as any} size={20} color={colors.text.secondary} />
            <Text style={[styles.menuLabel, { color: colors.text.primary }]}>{item.label}</Text>
            {item.right || (item.chevron && (
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            ))}
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  appCard: { alignItems: "center", paddingVertical: 24, marginBottom: 16 },
  appIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  appName: { fontSize: 18, fontWeight: "700" },
  appVersion: { fontSize: 12, marginTop: 4 },
  menuCard: { padding: 0 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15 },
  themeToggle: { flexDirection: "row", gap: 4 },
  themeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  themeBtnText: { fontSize: 12, fontWeight: "600" },
});
